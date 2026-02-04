import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { parseBoard, parseBoardFromString, ParseError } from "../src/parser.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const validBoardYaml = `
board: "Auth Service"
columns:
  - Backlog
  - name: In Progress
    limit: 3
  - Review
  - Done
tasks:
  AUTH-7:
    title: "Audit existing JWT usage"
    status: Done
    owner: kristijan
    priority: high
    description: "List all endpoints and call sites using JWT."
  AUTH-12:
    title: "Replace JWT with PASETO"
    status: In Progress
    owner: kristijan
    priority: high
    depends_on: AUTH-7
    spec: tasks/AUTH-12.md
  AUTH-13:
    title: "Add rate limiting to auth endpoints"
    status: Backlog
    priority: medium
    description: "Per-IP and per-user limits; configurable thresholds."
`;

describe("parseBoardFromString", () => {
  it("parses valid YAML and returns typed Board", () => {
    const board = parseBoardFromString(validBoardYaml);

    expect(board.board).toBe("Auth Service");
    expect(board.columns).toHaveLength(4);
    expect(board.columns[0]).toEqual({ name: "Backlog" });
    expect(board.columns[1]).toEqual({ name: "In Progress", limit: 3 });
    expect(board.columns[2]).toEqual({ name: "Review" });
    expect(board.columns[3]).toEqual({ name: "Done" });

    expect(Object.keys(board.tasks)).toEqual(["AUTH-7", "AUTH-12", "AUTH-13"]);
    expect(board.tasks["AUTH-7"].title).toBe("Audit existing JWT usage");
    expect(board.tasks["AUTH-7"].status).toBe("Done");
    expect(board.tasks["AUTH-7"].description).toBe("List all endpoints and call sites using JWT.");

    expect(board.tasks["AUTH-12"].title).toBe("Replace JWT with PASETO");
    expect(board.tasks["AUTH-12"].status).toBe("In Progress");
    expect(board.tasks["AUTH-12"].depends_on).toEqual(["AUTH-7"]);
    expect(board.tasks["AUTH-12"].spec).toBe("tasks/AUTH-12.md");

    expect(board.tasks["AUTH-13"].title).toBe("Add rate limiting to auth endpoints");
    expect(board.tasks["AUTH-13"].status).toBe("Backlog");
    expect(board.tasks["AUTH-13"].priority).toBe("medium");
  });

  it("normalizes depends_on single string to array", () => {
    const yaml = `
board: "Test"
columns: [A, B]
tasks:
  t1:
    title: "One"
    status: A
  t2:
    title: "Two"
    status: B
    depends_on: t1
`;
    const board = parseBoardFromString(yaml);
    expect(board.tasks["t2"].depends_on).toEqual(["t1"]);
  });

  it("normalizes depends_on array as-is", () => {
    const yaml = `
board: "Test"
columns: [A, B, C]
tasks:
  t1: { title: "One", status: A }
  t2: { title: "Two", status: B }
  t3:
    title: "Three"
    status: C
    depends_on: [t1, t2]
`;
    const board = parseBoardFromString(yaml);
    expect(board.tasks["t3"].depends_on).toEqual(["t1", "t2"]);
  });

  it("parses minimal board (empty tasks)", () => {
    const yaml = `
board: "Minimal"
columns: [To Do, Done]
tasks: {}
`;
    const board = parseBoardFromString(yaml);
    expect(board.board).toBe("Minimal");
    expect(board.columns).toHaveLength(2);
    expect(board.tasks).toEqual({});
  });

  it("throws ParseError on invalid YAML", () => {
    expect(() => parseBoardFromString("not: valid: yaml:")).toThrow(ParseError);
    expect(() => parseBoardFromString("not: valid: yaml:")).toThrow(/Invalid YAML/);

    expect(() => parseBoardFromString("[")).toThrow(ParseError);
    expect(() => parseBoardFromString("[")).toThrow(/Invalid YAML/);
  });

  it("throws ParseError when board is missing", () => {
    const yaml = `
columns: [A]
tasks: {}
`;
    expect(() => parseBoardFromString(yaml)).toThrow(ParseError);
    expect(() => parseBoardFromString(yaml)).toThrow(/Missing required field: board/);
  });

  it("throws ParseError when columns is missing", () => {
    const yaml = `
board: "Test"
tasks: {}
`;
    expect(() => parseBoardFromString(yaml)).toThrow(ParseError);
    expect(() => parseBoardFromString(yaml)).toThrow(/Missing required field: columns/);
  });

  it("throws ParseError when tasks is missing", () => {
    const yaml = `
board: "Test"
columns: [A]
`;
    expect(() => parseBoardFromString(yaml)).toThrow(ParseError);
    expect(() => parseBoardFromString(yaml)).toThrow(/Missing required field: tasks/);
  });

  it("throws ParseError when board is empty string", () => {
    const yaml = `
board: ""
columns: [A]
tasks: {}
`;
    expect(() => parseBoardFromString(yaml)).toThrow(ParseError);
    expect(() => parseBoardFromString(yaml)).toThrow(/non-empty/);
  });

  it("throws ParseError when columns is not an array", () => {
    const yaml = `
board: "Test"
columns: "not an array"
tasks: {}
`;
    expect(() => parseBoardFromString(yaml)).toThrow(ParseError);
    expect(() => parseBoardFromString(yaml)).toThrow(/expected an array/);
  });

  it("throws ParseError when columns is empty", () => {
    const yaml = `
board: "Test"
columns: []
tasks: {}
`;
    expect(() => parseBoardFromString(yaml)).toThrow(ParseError);
    expect(() => parseBoardFromString(yaml)).toThrow(/non-empty array/);
  });

  it("throws ParseError when task is missing title", () => {
    const yaml = `
board: "Test"
columns: [A]
tasks:
  t1:
    status: A
`;
    expect(() => parseBoardFromString(yaml)).toThrow(ParseError);
    expect(() => parseBoardFromString(yaml)).toThrow(/title/);
  });

  it("throws ParseError when task is missing status", () => {
    const yaml = `
board: "Test"
columns: [A]
tasks:
  t1:
    title: "Task"
`;
    expect(() => parseBoardFromString(yaml)).toThrow(ParseError);
    expect(() => parseBoardFromString(yaml)).toThrow(/status/);
  });

  it("throws ParseError when column limit is not a positive integer", () => {
    const yaml = `
board: "Test"
columns:
  - name: In Progress
    limit: "three"
tasks: {}
`;
    expect(() => parseBoardFromString(yaml)).toThrow(ParseError);
    expect(() => parseBoardFromString(yaml)).toThrow(/limit/);
  });

  it("throws ParseError when tasks is not an object", () => {
    const yaml = `
board: "Test"
columns: [A]
tasks: []
`;
    expect(() => parseBoardFromString(yaml)).toThrow(ParseError);
    expect(() => parseBoardFromString(yaml)).toThrow(/tasks must be an object/);
  });
});

describe("parseBoard (path or content)", () => {
  it("parses raw YAML content when input contains newline", () => {
    const yaml = `
board: "From Content"
columns: [A]
tasks: {}
`;
    const board = parseBoard(yaml);
    expect(board.board).toBe("From Content");
  });

  it("parses from file path when input looks like path", () => {
    const fixturePath = path.join(__dirname, "fixtures", "board.yaml");
    const board = parseBoard(fixturePath);
    expect(board.board).toBe("Fixture Board");
    expect(board.columns).toHaveLength(2);
    expect(board.tasks["f1"].title).toBe("Fixture task");
  });

  it("throws ParseError when path does not exist", () => {
    expect(() => parseBoard("/nonexistent/board.yaml")).toThrow(ParseError);
    expect(() => parseBoard("/nonexistent/board.yaml")).toThrow(/Cannot read file/);
  });
});
