import { describe, it, expect } from "vitest";
import { parseBoardFromString } from "../src/parser.js";
import { validate } from "../src/validation.js";

const validBoardYaml = `
board: "Valid"
columns: [Backlog, Ready, In Progress, Done]
tasks:
  t1: { title: "One", status: Backlog }
  t2: { title: "Two", status: Ready }
  t3: { title: "Three", status: In Progress }
  t4: { title: "Four", status: Done }
`;

describe("validate", () => {
  it("returns valid and empty errors for a board with canonical columns", () => {
    const board = parseBoardFromString(validBoardYaml);
    const result = validate(board);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toEqual([]);
  });

  it("returns error when columns do not match canonical set", () => {
    const yaml = `
board: "Test"
columns: [To Do, Done]
tasks:
  t1: { title: "Task", status: "To Do" }
`;
    const board = parseBoardFromString(yaml);
    const result = validate(board);
    expect(result.valid).toBe(false);
    const canonicalError = result.errors.find((e) => e.code === "COLUMNS_NOT_CANONICAL");
    expect(canonicalError).toBeDefined();
    expect(canonicalError!.message).toMatch(/Backlog.*Ready.*In Progress.*Done/);
  });

  it("returns error when task status does not match any column", () => {
    const yaml = `
board: "Test"
columns: [Backlog, Ready, In Progress, Done]
tasks:
  t1:
    title: "Task"
    status: Unknown Column
`;
    const board = parseBoardFromString(yaml);
    const result = validate(board);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(1);
    const statusError = result.errors.find((e) => e.code === "STATUS_INVALID");
    expect(statusError).toBeDefined();
    expect(statusError!.message).toMatch(/Unknown Column/);
    expect(statusError!.path).toBe("tasks.t1.status");
  });

  it("returns error when depends_on references non-existent task", () => {
    const yaml = `
board: "Test"
columns: [Backlog, Ready, In Progress, Done]
tasks:
  t1: { title: "One", status: Backlog }
  t2:
    title: "Two"
    status: Done
    depends_on: [NONEXISTENT]
`;
    const board = parseBoardFromString(yaml);
    const result = validate(board);
    expect(result.valid).toBe(false);
    const refError = result.errors.find((e) => e.code === "DEPENDS_ON_INVALID");
    expect(refError).toBeDefined();
    expect(refError!.message).toMatch(/NONEXISTENT/);
    expect(refError!.path).toBe("tasks.t2.depends_on");
  });

  it("returns error when WIP limit exceeded", () => {
    const yaml = `
board: "Test"
columns:
  - Backlog
  - Ready
  - name: In Progress
    limit: 1
  - Done
tasks:
  t1: { title: "One", status: In Progress }
  t2: { title: "Two", status: In Progress }
`;
    const board = parseBoardFromString(yaml);
    const result = validate(board);
    expect(result.valid).toBe(false);
    const wipError = result.errors.find((e) => e.code === "WIP_LIMIT_EXCEEDED");
    expect(wipError).toBeDefined();
    expect(wipError!.message).toMatch(/limit 1.*2 task/);
    expect(wipError!.path).toMatch(/columns/);
  });

  it("returns error when column names are duplicated", () => {
    const yaml = `
board: "Test"
columns: [Backlog, Backlog, In Progress, Done]
tasks: {}
`;
    const board = parseBoardFromString(yaml);
    const result = validate(board);
    expect(result.valid).toBe(false);
    const dupError = result.errors.find((e) => e.code === "DUPLICATE_COLUMN");
    const canonicalError = result.errors.find((e) => e.code === "COLUMNS_NOT_CANONICAL");
    expect(dupError ?? canonicalError).toBeDefined();
    if (dupError) {
      expect(dupError.message).toMatch(/Duplicate column name.*"Backlog"/);
      expect(dupError.path).toBe("columns[1]");
    }
  });

  it("each error has message and optional path/code", () => {
    const yaml = `
board: "Test"
columns: [Backlog, Ready, In Progress, Done]
tasks:
  t1: { title: "One", status: Bad }
`;
    const board = parseBoardFromString(yaml);
    const result = validate(board);
    expect(result.errors.length).toBeGreaterThanOrEqual(1);
    for (const err of result.errors) {
      expect(err).toHaveProperty("message");
      expect(typeof err.message).toBe("string");
      expect(err.message.length).toBeGreaterThan(0);
      if (err.path !== undefined) expect(typeof err.path).toBe("string");
      if (err.code !== undefined) expect(typeof err.code).toBe("string");
    }
  });

  it("multiple violations produce multiple errors", () => {
    const yaml = `
board: "Test"
columns: [Backlog, Ready, In Progress, Done]
tasks:
  t1: { title: "One", status: Unknown }
  t2: { title: "Two", status: Backlog, depends_on: [MISSING] }
`;
    const board = parseBoardFromString(yaml);
    const result = validate(board);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
    const codes = result.errors.map((e) => e.code);
    expect(codes).toContain("STATUS_INVALID");
    expect(codes).toContain("DEPENDS_ON_INVALID");
  });
});
