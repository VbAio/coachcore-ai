import type { ParsedReplay } from '@coachcore/shared';

/**
 * Pluggable replay parser interface.
 * Implement this to swap in a more advanced Deadlock .dem parser.
 */
export interface ReplayParser {
  readonly name: string;
  readonly supportedExtensions: string[];

  /** Returns true if this parser can handle the given file buffer/header */
  canParse(buffer: Buffer): boolean;

  /** Parse a .dem file into structured replay data */
  parse(buffer: Buffer, subjectPlayerName?: string): Promise<ParsedReplay>;

  /** Validate file without full parse */
  validate(buffer: Buffer): Promise<{ valid: boolean; errors: string[] }>;
}

export interface ParserProgressCallback {
  (stage: string, progress: number, message: string): void;
}
