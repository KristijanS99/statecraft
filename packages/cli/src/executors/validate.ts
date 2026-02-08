import { parseBoard, validate } from "@stcrft/statecraft-core";

function formatValidationError(err: { message: string; path?: string }): string {
  const prefix = err.path != null && err.path !== "" ? `${err.path}: ` : "";
  return `${prefix}${err.message}`;
}

export function runValidate(path: string): void {
  try {
    const board = parseBoard(path);
    const result = validate(board);
    if (!result.valid) {
      for (const err of result.errors) {
        process.stderr.write(formatValidationError(err) + "\n");
      }
      process.exitCode = 1;
      return;
    }
    process.exitCode = 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(message + "\n");
    process.exitCode = 1;
  }
}
