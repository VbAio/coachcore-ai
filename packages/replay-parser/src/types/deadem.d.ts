declare module 'deadem' {
  export class ParserConfiguration {
    constructor(options?: Record<string, unknown>);
  }

  export class Parser {
    constructor(configuration?: ParserConfiguration, logger?: unknown);
    parse(readable: unknown): Promise<void>;
    dispose(): Promise<void>;
    getDemo(): unknown;
    registerPreInterceptor(stage: unknown, cb: (...args: unknown[]) => unknown): void;
    registerPostInterceptor(stage: unknown, cb: (...args: unknown[]) => unknown): void;
    unregisterPreInterceptor(stage: unknown, cb: (...args: unknown[]) => unknown): void;
    unregisterPostInterceptor(stage: unknown, cb: (...args: unknown[]) => unknown): void;
  }

  export class Player {
    constructor(configuration?: ParserConfiguration, logger?: unknown);
    load(readable: unknown): Promise<void>;
    seekToTick(tick: number): Promise<void>;
    getLastTick(): number;
    getDemo(): unknown;
    dispose(): Promise<void>;
    registerPreInterceptor(stage: unknown, cb: (...args: unknown[]) => unknown): void;
    registerPostInterceptor(stage: unknown, cb: (...args: unknown[]) => unknown): void;
  }

  export const InterceptorStage: {
    DEMO_PACKET: unknown;
    MESSAGE_PACKET: unknown;
    ENTITY_PACKET: unknown;
  };

  export const MessagePacketType: Record<string, unknown>;
  export const StringTableType: Record<string, unknown>;
  export const StringTableEvent: Record<string, unknown>;
  export const Printer: unknown;
  export const Logger: unknown;
}
