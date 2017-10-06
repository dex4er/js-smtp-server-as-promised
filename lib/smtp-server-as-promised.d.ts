import * as net from 'net'
import { PromiseReadable } from 'promise-readable'

import { SMTPServer, SMTPServerAddress, SMTPServerAuthentication, SMTPServerAuthenticationResponse, SMTPServerOptions, SMTPServerSession } from 'smtp-server'

export { Logger, LoggerLevel } from 'nodemailer/lib/shared'

export * from 'smtp-server'

export interface SMTPServerAsPromisedServerAddress {
  address: string
  family: string
  port: number
}

export interface SMTPServerAsPromisedOptions extends SMTPServerOptions {
  port?: number
  usePromiseReadable?: boolean

  onAuth?: (auth: SMTPServerAuthentication, session: SMTPServerSession) => Promise<SMTPServerAuthenticationResponse>
  onClose?: (session: SMTPServerSession) => Promise<void>
  onConnect?: (session: SMTPServerSession) => Promise<void>
  onData?: (stream: NodeJS.ReadableStream | PromiseReadable<NodeJS.ReadableStream>, session: SMTPServerSession) => Promise<void>
  onMailFrom?: (address: SMTPServerAddress, session: SMTPServerSession) => Promise<void>
  onRcptTo?: (address: SMTPServerAddress, session: SMTPServerSession) => Promise<void>
  onError?: (error: Error) => Promise<void>
}

export class SMTPServerAsPromised {
  server: SMTPServer

  constructor (options: SMTPServerAsPromisedOptions)

  close (): Promise<void>

  listen (port?: number, hostname?: string, backlog?: number): Promise<SMTPServerAsPromisedServerAddress>
  listen (port?: number, hostname?: string): Promise<SMTPServerAsPromisedServerAddress>
  listen (port?: number, backlog?: number): Promise<SMTPServerAsPromisedServerAddress>
  listen (port?: number): Promise<SMTPServerAsPromisedServerAddress>
  listen (path: string, backlog?: number): Promise<SMTPServerAsPromisedServerAddress>
  listen (path: string): Promise<SMTPServerAsPromisedServerAddress>
  listen (options: net.ListenOptions): Promise<SMTPServerAsPromisedServerAddress>
  listen (handle: any, backlog?: number): Promise<SMTPServerAsPromisedServerAddress>
  listen (handle: any): Promise<SMTPServerAsPromisedServerAddress>
}

export default SMTPServerAsPromised
