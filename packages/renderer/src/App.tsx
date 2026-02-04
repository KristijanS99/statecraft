import { useCallback, useEffect, useRef, useState } from "react";
import {
  type Board,
  type Task,
  type ValidationError,
  parseBoardFromString,
  validate,
  ParseError,
} from "@statecraft/core";
import { BoardView } from "./BoardView";
import "./App.css";

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

export default function App() {
  const [board, setBoard] = useState<Board | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [movedTaskIds, setMovedTaskIds] = useState<Set<string>>(new Set());
  const prevStatusMapRef = useRef<Map<string, string> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const moveClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  return (
    <div className="app">
      <header className="header">
        <img src="/logo.png" alt="Statecraft" className="header__logo" />
        <h1 className="header__title">Statecraft</h1>
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
          <BoardView board={board} movedTaskIds={movedTaskIds} />
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
