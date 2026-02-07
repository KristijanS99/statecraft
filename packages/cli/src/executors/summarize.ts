import { parseBoard, summarize } from "@statecraft/core";

export function runSummarize(path: string): void {
  try {
    const board = parseBoard(path);
    const summary = summarize(board);
    process.stdout.write(summary);
    process.exitCode = 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(message + "\n");
    process.exitCode = 1;
  }
}
