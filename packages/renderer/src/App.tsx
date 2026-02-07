import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  type Board,
  type Task,
  type ValidationError,
  parseBoardFromString,
  validate,
  ParseError,
} from "@statecraft/core";
import { BoardView, getColumnAccent } from "./BoardView";
import "./App.css";

const THEME_STORAGE_KEY = "statecraft-theme";
type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

function getTaskStatusMap(board: Board): Map<string, string> {
  const m = new Map<string, string>();
  for (const [id, task] of Object.entries(board.tasks) as [string, Task][]) {
    m.set(id, task.status);
  }
  return m;
}

function computeMovedTaskIds(
  prev: Map<string, string> | null,
  next: Board
): Set<string> {
  if (prev === null) return new Set();
  const moved = new Set<string>();
  for (const [id, task] of Object.entries(next.tasks) as [string, Task][]) {
    const oldStatus = prev.get(id);
    if (oldStatus !== undefined && oldStatus !== task.status) {
      moved.add(id);
    }
  }
  return moved;
}

type SelectedTask = { id: string; task: Task };

export default function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [board, setBoard] = useState<Board | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [movedTaskIds, setMovedTaskIds] = useState<Set<string>>(new Set());
  const [selectedTask, setSelectedTask] = useState<SelectedTask | null>(null);
  const [specContent, setSpecContent] = useState<string | null>(null);
  const [specLoading, setSpecLoading] = useState<boolean>(false);
  const [specError, setSpecError] = useState<string | null>(null);
  const prevStatusMapRef = useRef<Map<string, string> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const moveClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const processContent = useCallback((content: string) => {
    setErrors([]);
    let parsed: Board;
    try {
      parsed = parseBoardFromString(content);
    } catch (e) {
      const msg = e instanceof ParseError ? e.message : String(e);
      setErrors([`Parse error: ${msg}`]);
      setBoard(null);
      return;
    }
    const result = validate(parsed);
    const allErrors: string[] = result.errors.map((e: ValidationError) => e.message);
    if (result.warnings?.length) {
      allErrors.push(...result.warnings.map((w: ValidationError) => `Warning: ${w.message}`));
    }
    setErrors(allErrors);

    setBoard((prevBoard: Board | null) => {
      const prevMap = prevBoard ? getTaskStatusMap(prevBoard) : null;
      prevStatusMapRef.current = getTaskStatusMap(parsed);
      const moved = computeMovedTaskIds(prevMap, parsed);
      if (moved.size > 0) {
        setMovedTaskIds(moved);
        if (moveClearTimerRef.current) clearTimeout(moveClearTimerRef.current);
        moveClearTimerRef.current = setTimeout(() => {
          setMovedTaskIds(new Set());
          moveClearTimerRef.current = null;
        }, 500);
      }
      return parsed;
    });
  }, []);

  const fetchFromApi = useCallback(async () => {
    setLoading(true);
    setErrors([]);
    try {
      const res = await fetch("/api/board");
      if (!res.ok) {
        const text = await res.text();
        setErrors([`API error ${res.status}: ${text || res.statusText}`]);
        setBoard(null);
        return;
      }
      const content = await res.text();
      processContent(content);
    } catch (e) {
      setErrors([`Network error: ${e instanceof Error ? e.message : String(e)}`]);
      setBoard(null);
    } finally {
      setLoading(false);
    }
  }, [processContent]);

  useEffect(() => {
    fetchFromApi();
  }, [fetchFromApi]);

  useEffect(() => {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${proto}//${window.location.host}/api/board/watch`;
    const ws = new WebSocket(url);
    wsRef.current = ws;
    ws.onmessage = (event) => {
      const content = typeof event.data === "string" ? event.data : "";
      processContent(content);
    };
    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [processContent]);

  useEffect(() => {
    return () => {
      if (moveClearTimerRef.current) clearTimeout(moveClearTimerRef.current);
    };
  }, []);

  const handlePaste = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      processContent(e.target.value);
    },
    [processContent]
  );

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const content = typeof reader.result === "string" ? reader.result : "";
        processContent(content);
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [processContent]
  );

  const handleTaskClick = useCallback((id: string, task: Task) => {
    setSelectedTask({ id, task });
    setSpecContent(null);
    setSpecError(null);
    if (task.spec) {
      setSpecLoading(true);
      fetch(`/api/spec?path=${encodeURIComponent(task.spec)}`)
        .then((res) => {
          const contentType = res.headers.get("content-type") ?? "";
          if (!res.ok) {
            throw new Error(res.status === 404 ? "Spec file not found" : res.statusText);
          }
          return res.text().then((text) => {
            if (
              contentType.includes("text/html") ||
              text.trimStart().startsWith("<!") ||
              text.trimStart().toLowerCase().startsWith("<html")
            ) {
              throw new Error("Spec not available (unexpected response)");
            }
            return text;
          });
        })
        .then((text) => {
          setSpecContent(text);
          setSpecError(null);
        })
        .catch((e) => setSpecError(e instanceof Error ? e.message : "Failed to load spec"))
        .finally(() => setSpecLoading(false));
    }
  }, []);

  const closeModal = useCallback(() => {
    setSelectedTask(null);
    setSpecContent(null);
    setSpecError(null);
    setSpecLoading(false);
  }, []);

  return (
    <div className="app">
      <header className="header">
        <img src="/logo.png" alt="Statecraft" className="header__logo" />
        <h1 className="header__title">Statecraft</h1>
        <button
          type="button"
          className="header__theme-toggle"
          onClick={toggleTheme}
          title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          {theme === "light" ? (
            <svg className="header__theme-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg className="header__theme-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          )}
        </button>
      </header>
      <main className="main">
        {errors.length > 0 && (
          <section className="errors" aria-label="Errors and warnings">
            <h2 className="errors__title">Errors / Warnings</h2>
            <ul className="errors__list">
              {errors.map((msg, i) => (
                <li key={i} className="errors__item">
                  {msg}
                </li>
              ))}
            </ul>
          </section>
        )}

        {board ? (
          <>
            <BoardView
              board={board}
              movedTaskIds={movedTaskIds}
              onTaskClick={handleTaskClick}
            />
            {selectedTask && (() => {
              const statusIndex = board.columns.findIndex(
                (c) => c.name === selectedTask.task.status
              );
              const statusAccent = getColumnAccent(statusIndex >= 0 ? statusIndex : 0);
              const hasBodyContent =
                (selectedTask.task.description != null &&
                  selectedTask.task.description !== "") ||
                selectedTask.task.owner != null ||
                selectedTask.task.priority != null ||
                (selectedTask.task.depends_on != null &&
                  selectedTask.task.depends_on.length > 0);
              return (
              <div
                className="modal-overlay"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                onClick={(e) => e.target === e.currentTarget && closeModal()}
              >
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                  <header
                    className="modal__header"
                    style={{ borderTopColor: statusAccent } as React.CSSProperties}
                  >
                    <div className="modal__header-inner">
                      <h2 id="modal-title" className="modal__title">
                        <span className="modal__id">{selectedTask.id}</span>
                        {selectedTask.task.title}
                      </h2>
                      <span
                        className="modal__status"
                        style={{ background: statusAccent } as React.CSSProperties}
                        title={`Column: ${selectedTask.task.status}`}
                      >
                        {selectedTask.task.status}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="modal__close"
                      onClick={closeModal}
                      aria-label="Close"
                    >
                      ×
                    </button>
                  </header>
                  <div className="modal__body">
                    {(selectedTask.task.description != null &&
                      selectedTask.task.description !== "") ||
                    selectedTask.task.owner != null ||
                    selectedTask.task.priority != null ||
                    (selectedTask.task.depends_on != null &&
                      selectedTask.task.depends_on.length > 0) ? (
                      <section className="modal__description-section">
                        <h3 className="modal__section-title">Description</h3>
                        {selectedTask.task.description != null &&
                          selectedTask.task.description !== "" && (
                            <p className="modal__description">
                              {selectedTask.task.description}
                            </p>
                          )}
                        {(selectedTask.task.owner != null ||
                          selectedTask.task.priority != null) && (
                          <div className="modal__meta">
                            {selectedTask.task.owner != null && (
                              <span className="modal__owner">
                                {selectedTask.task.owner}
                              </span>
                            )}
                            {selectedTask.task.priority != null && (
                              <span className="modal__priority">
                                {selectedTask.task.priority}
                              </span>
                            )}
                          </div>
                        )}
                        {selectedTask.task.depends_on != null &&
                          selectedTask.task.depends_on.length > 0 && (
                            <p className="modal__deps">
                              Depends on:{" "}
                              {selectedTask.task.depends_on.join(", ")}
                            </p>
                          )}
                      </section>
                    ) : null}
                    {selectedTask.task.spec && (
                      <div
                        className={`modal__spec ${hasBodyContent ? "modal__spec--with-separator" : ""}`}
                      >
                        <h3 className="modal__spec-title">Spec</h3>
                        {specLoading && (
                          <p className="modal__spec-loading">Loading…</p>
                        )}
                        {specError && (
                          <p className="modal__spec-error">{specError}</p>
                        )}
                        {specContent != null && !specLoading && (
                          <div className="modal__spec-content">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {specContent}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              );
            })()}
          </>
        ) : (
          <section className="load-board" aria-label="Load board">
            <h2 className="load-board__title">Load board</h2>
            {loading ? (
              <p className="load-board__hint">Loading from API…</p>
            ) : (
              <>
                <p className="load-board__hint">
                  Board not found or not loaded. Fetch from API (when served by{" "}
                  <code>statecraft render</code>), or use paste/file below.
                </p>
                <div className="load-board__actions">
                  <button
                    type="button"
                    className="load-board__btn"
                    onClick={fetchFromApi}
                    disabled={loading}
                  >
                    Fetch from API
                  </button>
                  <label className="load-board__file-label">
                    <span className="load-board__file-text">Choose file</span>
                    <input
                      type="file"
                      accept=".yaml,.yml,text/yaml,text/plain"
                      className="load-board__file-input"
                      onChange={handleFile}
                    />
                  </label>
                </div>
                <label className="load-board__paste-label">
                  <span className="load-board__paste-caption">Or paste YAML</span>
                  <textarea
                    className="load-board__paste-input"
                    placeholder="Paste board YAML here…"
                    rows={8}
                    onChange={handlePaste}
                  />
                </label>
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
