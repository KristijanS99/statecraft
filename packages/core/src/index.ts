/**
 * @statecraft/core — DSL, AST, validation, CRUS operations.
 * VERSION is injected at build time from package.json (tsup define) so it stays in sync and works in Node and browser bundles.
 */
declare const __STATECRAFT_CORE_VERSION__: string;
export const VERSION = __STATECRAFT_CORE_VERSION__;

export type { Board, Column, Task } from "./ast.js";
export { parseBoard, parseBoardFromString, ParseError } from "./parser.js";
export type { ValidationError, ValidationResult } from "./validation.js";
export { validate, validateBoard } from "./validation.js";
export { summarize } from "./summarize.js";
