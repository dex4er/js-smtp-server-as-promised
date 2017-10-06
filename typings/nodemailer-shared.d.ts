declare module 'nodemailer/lib/shared' {
  export type LoggerLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'

  export interface Logger {
    level (level: LoggerLevel): void
    trace (...params: any[]): void
    debug (...params: any[]): void
    info (...params: any[]): void
    warn (...params: any[]): void
    error (...params: any[]): void
    fatal (...params: any[]): void
  }

  export function parseConnectionUrl (url: string): object
  export function getLogger (options?: { [key: string]: string }, defaults?: { [key: string]: string }): Logger
  export function callbackPromise (resolve: (...args: any[]) => void, reject: (err: Error) => void): () => void
  export function resolveContent (data: object | any[], key: string | number, callback: (err: Error | null, value: any) => any): Promise<any>
  export function assign (target: object, ...sources: object[]): object
  export function encodeXText (str: string): string
  export function resolveStream (stream: NodeJS.ReadableStream, callback: (err: Error | null, value: any) => any): void
  export function createDefaultLogger (levels: LoggerLevel[]): Logger
}
