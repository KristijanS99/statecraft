/**
 * @statecraft/core — DSL, AST, validation, CRUS operations.
 */
export const VERSION = "0.0.1";

export type { Board, Column, Task } from "./ast.js";
export { parseBoard, parseBoardFromString, ParseError } from "./parser.js";
export type { ValidationError, ValidationResult } from "./validation.js";
export { validate, validateBoard } from "./validation.js";
export { summarize } from "./summarize.js";
