import type { Board, Column, Task } from "@stcrft/statecraft-core";

const COLUMN_ACCENT = [
  "var(--color-primary)",
  "var(--color-secondary)",
  "var(--color-tertiary)",
] as const;

export function getColumnAccent(index: number): string {
  return COLUMN_ACCENT[index % COLUMN_ACCENT.length];
}

interface BoardViewProps {
  board: Board;
  movedTaskIds?: Set<string>;
  onTaskClick?: (id: string, task: Task) => void;
}

function TaskCard({
  id,
  task,
  isMoving,
  onTaskClick,
}: {
  id: string;
  task: Task;
  isMoving: boolean;
  onTaskClick?: (id: string, task: Task) => void;
}) {
  const handleClick = () => onTaskClick?.(id, task);
  return (
    <article
      className={`card ${isMoving ? "card--moving" : ""} ${onTaskClick ? "card--clickable" : ""}`}
      data-task-id={id}
      role={onTaskClick ? "button" : undefined}
      tabIndex={onTaskClick ? 0 : undefined}
      onClick={onTaskClick ? handleClick : undefined}
      onKeyDown={
        onTaskClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClick();
              }
            }
          : undefined
      }
    >
      <div className="card__id">{id}</div>
      <h3 className="card__title">{task.title}</h3>
      {task.description != null && task.description !== "" && (
        <p className="card__description">{task.description}</p>
      )}
      {(task.owner != null || task.priority != null) && (
        <div className="card__meta">
          {task.owner != null && <span className="card__owner">{task.owner}</span>}
          {task.priority != null && (
            <span className="card__priority">{task.priority}</span>
          )}
        </div>
      )}
      {task.depends_on != null && task.depends_on.length > 0 && (
        <div className="card__deps">
          Depends on: {task.depends_on.join(", ")}
        </div>
      )}
    </article>
  );
}

export function BoardView({ board, movedTaskIds = new Set(), onTaskClick }: BoardViewProps) {
  const tasksByStatus = new Map<string, { id: string; task: Task }[]>();
  for (const [id, task] of Object.entries(board.tasks) as [string, Task][]) {
    const list = tasksByStatus.get(task.status) ?? [];
    list.push({ id, task });
    tasksByStatus.set(task.status, list);
  }

  return (
    <div className="board">
      <h2 className="board__name">{board.board}</h2>
      <div className="board__lanes">
        {board.columns.map((col: Column, colIndex: number) => {
          const tasks = tasksByStatus.get(col.name) ?? [];
          const count = tasks.length;
          const atLimit =
            col.limit != null && col.limit >= 1 && count >= col.limit;
          return (
            <section
              key={col.name}
              className="lane"
              style={
                {
                  "--lane-accent": getColumnAccent(colIndex),
                } as React.CSSProperties
              }
            >
              <header className="lane__header">
                <span className="lane__name">{col.name}</span>
                {col.limit != null ? (
                  <span
                    className={`lane__count ${atLimit ? "lane__count--at-limit" : ""}`}
                  >
                    {count}/{col.limit}
                  </span>
                ) : (
                  <span className="lane__count">{count}</span>
                )}
              </header>
              <div className="lane__cards">
                {tasks.map(({ id, task }) => (
                  <TaskCard
                    key={id}
                    id={id}
                    task={task}
                    isMoving={movedTaskIds.has(id)}
                    onTaskClick={onTaskClick}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
