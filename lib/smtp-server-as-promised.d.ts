/// <reference types="node" />
/// <reference types="nodemailer" />
/// <reference types="smtp-server" />

import * as net from 'net'
export { Logger, LoggerLevel } from 'nodemailer/lib/shared'
import { PromiseReadable } from 'promise-readable'
import { Readable } from 'stream'
import * as tls from 'tls'

import { SMTPServer, SMTPServerAddress, SMTPServerAuthentication, SMTPServerAuthenticationResponse, SMTPServerOptions, SMTPServerSession } from 'smtp-server'

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
  onData?: (stream: Readable | PromiseReadable<Readable>, session: SMTPServerSession) => Promise<void>
  onMailFrom?: (address: SMTPServerAddress, session: SMTPServerSession) => Promise<void>
  onRcptTo?: (address: SMTPServerAddress, session: SMTPServerSession) => Promise<void>
  onError?: (error: Error) => Promise<void>
}

export class SMTPServerAsPromised {
  server: SMTPServer

  constructor (options: SMTPServerAsPromisedOptions)

  listen (port?: number, hostname?: string, backlog?: number): Promise<SMTPServerAsPromisedServerAddress>
  listen (port?: number, hostname?: string): Promise<SMTPServerAsPromisedServerAddress>
  listen (port?: number, backlog?: number): Promise<SMTPServerAsPromisedServerAddress>
  listen (port?: number): Promise<SMTPServerAsPromisedServerAddress>
  listen (path: string, backlog?: number): Promise<SMTPServerAsPromisedServerAddress>
  listen (path: string): Promise<SMTPServerAsPromisedServerAddress>
  listen (options: net.ListenOptions): Promise<SMTPServerAsPromisedServerAddress>
  listen (handle: any, backlog?: number): Promise<SMTPServerAsPromisedServerAddress>
  listen (handle: any): Promise<SMTPServerAsPromisedServerAddress>

  close (): Promise<void>

  updateSecureContext (options: tls.TlsOptions): void
}

export default SMTPServerAsPromised
