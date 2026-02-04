import { describe, expect, it } from "vitest";
import { parseBoardFromString } from "../src/parser.js";
import { summarize } from "../src/summarize.js";

describe("summarize", () => {
  it("includes board name, column counts, and task lines", () => {
    const yaml = `
board: "Summary Test"
columns: [To Do, Done]
tasks:
  T1:
    title: "First task"
    status: To Do
  T2:
    title: "Second task"
    status: Done
`;
    const board = parseBoardFromString(yaml);
    const out = summarize(board);
    expect(out).toContain("Board: Summary Test");
    expect(out).toContain("Columns:");
    expect(out).toContain("To Do");
    expect(out).toContain("Done");
    expect(out).toContain("Tasks:");
    expect(out).toContain("T1");
    expect(out).toContain("T2");
    expect(out).toContain("First task");
    expect(out).toContain("Second task");
  });

  it("ends with a single newline", () => {
    const yaml = `
board: "X"
columns: [A]
tasks: {}
`;
    const board = parseBoardFromString(yaml);
    const out = summarize(board);
    expect(out).toMatch(/\n$/);
    expect(out).not.toMatch(/\n\n$/);
  });

  it("includes WIP limit line when column is at limit", () => {
    const yaml = `
board: "WIP"
columns:
  - name: In Progress
    limit: 2
  - Done
tasks:
  t1: { title: "A", status: In Progress }
  t2: { title: "B", status: In Progress }
`;
    const board = parseBoardFromString(yaml);
    const out = summarize(board);
    expect(out).toContain("at WIP limit");
    expect(out).toContain("2/2");
  });

  it("includes Blocked section when a task depends on non-done task", () => {
    const yaml = `
board: "Blocked"
columns: [Backlog, Done]
tasks:
  t1: { title: "First", status: Backlog }
  t2: { title: "Second", status: Backlog, depends_on: [t1] }
`;
    const board = parseBoardFromString(yaml);
    const out = summarize(board);
    expect(out).toContain("Blocked:");
    expect(out).toContain("t2");
    expect(out).toContain("depends on");
    expect(out).toContain("t1");
  });

  it("omits Blocked section when all dependencies are in last column", () => {
    const yaml = `
board: "Unblocked"
columns: [To Do, Done]
tasks:
  t1: { title: "First", status: Done }
  t2: { title: "Second", status: To Do, depends_on: [t1] }
`;
    const board = parseBoardFromString(yaml);
    const out = summarize(board);
    expect(out).not.toContain("Blocked:");
  });

  it("shows (none) for empty tasks", () => {
    const yaml = `
board: "Empty"
columns: [A, B]
tasks: {}
`;
    const board = parseBoardFromString(yaml);
    const out = summarize(board);
    expect(out).toContain("Board: Empty");
    expect(out).toContain("Tasks:");
    expect(out).toContain("(none)");
  });
});
