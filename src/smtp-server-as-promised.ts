/// <reference types="node" />
/// <reference types="nodemailer" />

import isStreamEnded from 'is-stream-ended'
import net from 'net'
export {Logger, LoggerLevel} from 'nodemailer/lib/shared'
import NullWritable from 'null-writable'
import finished from 'stream.finished'
import tls from 'tls'

import {
  SMTPServer,
  SMTPServerAddress,
  SMTPServerAuthentication,
  SMTPServerAuthenticationResponse,
  SMTPServerDataStream,
  SMTPServerOptions,
  SMTPServerSession,
} from 'smtp-server'

export * from 'smtp-server'

export interface SMTPServerAsPromisedServerAddress {
  address: string
  family: string
  port: number
}

export interface SMTPServerAsPromisedOptions extends SMTPServerOptions {
  onConnect?: never
  onAuth?: never
  onMailFrom?: never
  onRcptTo?: never
  onData?: never
  onClose?: never
  onError?: never
}

export class SMTPServerAsPromised {
  server: SMTPServer

  protected closed?: boolean = false
  protected errorHandler?: (error: Error) => Promise<void>

  constructor(options: SMTPServerAsPromisedOptions = {}) {
    const newOptions: SMTPServerOptions = {}

    newOptions.onConnect = (session: SMTPServerSession, callback: (err?: Error) => void) =>
      this.onConnect(session)
        .then(() => callback())
        .catch((err: Error) => callback(err))

    newOptions.onAuth = (
      auth: SMTPServerAuthentication,
      session: SMTPServerSession,
      callback: (err: Error | null, response?: SMTPServerAuthenticationResponse) => void,
    ) =>
      this.onAuth(auth, session)
        .then((response: SMTPServerAuthenticationResponse) => callback(null, response))
        .catch((err: Error) => callback(err))

    newOptions.onMailFrom = (
      address: SMTPServerAddress,
      session: SMTPServerSession,
      callback: (err?: Error | null) => void,
    ) =>
      this.onMailFrom(address, session)
        .then(() => callback())
        .catch((err: Error) => callback(err))

    newOptions.onRcptTo = (
      address: SMTPServerAddress,
      session: SMTPServerSession,
      callback: (err?: Error | null) => void,
    ) =>
      this.onRcptTo(address, session)
        .then(() => callback())
        .catch((err: Error) => callback(err))

    newOptions.onData = (
      stream: SMTPServerDataStream,
      session: SMTPServerSession,
      callback: (err?: Error | null) => void,
    ) => {
      const promiseStream = new Promise((resolve, reject) => {
        if (isStreamEnded(stream)) {
          return resolve()
        }
        finished(stream, err => {
          if (err) reject(err)
          else resolve()
        })
      })

      if (isStreamEnded(stream)) {
        return callback(new Error('SMTP data stream is already ended'))
      }

      return this.onData(stream, session)
        .then(() => promiseStream)
        .then(() => callback())
        .catch((err: Error) => {
          stream.pipe(new NullWritable())
          callback(err)
        })
    }

    newOptions.onClose = (session: SMTPServerSession) => this.onClose(session)

    this.server = new SMTPServer({...(options as SMTPServerOptions), ...newOptions})

    this.server.on('error', (err: Error) => this.onError(err))
  }

  listen(options: net.ListenOptions = {}): Promise<SMTPServerAsPromisedServerAddress> {
    return new Promise((resolve, reject) => {
      const netServer = this.server.server

      const listeningHandler = () => {
        netServer.removeListener('error', errorHandler)
        const address = netServer.address() as SMTPServerAsPromisedServerAddress
        resolve(address)
      }

      const errorHandler = (err: Error) => {
        netServer.removeListener('listening', listeningHandler)
        reject(err)
      }

      netServer.once('listening', listeningHandler)
      netServer.once('error', errorHandler)

      this.server.listen(options)
    })
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.close((err?: Error | null) => {
        this.closed = true
        if (this.errorHandler) {
          this.server.removeListener('error', this.errorHandler)
          this.errorHandler = undefined
        }
        if (err) {
          return reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  updateSecureContext(options: tls.TlsOptions): void {
    this.server.updateSecureContext(options)
  }

  destroy(): Promise<void> {
    if (!this.closed) {
      return this.close()
    } else {
      return Promise.resolve()
    }
  }

  /** This method can be overriden in subclass */
  // prettier-ignore
  // @ts-ignore
  protected onAuth(auth: SMTPServerAuthentication, session: SMTPServerSession): Promise<SMTPServerAuthenticationResponse> {
    return Promise.reject(new Error('onAuth method not overriden in subclass'))
  }

  /** This method can be overriden in subclass */
  // @ts-ignore
  protected onClose(session: SMTPServerSession): Promise<void> {
    return Promise.resolve()
  }

  /** This method can be overriden in subclass */
  // @ts-ignore
  protected onConnect(session: SMTPServerSession): Promise<void> {
    return Promise.resolve()
  }

  /** This method can be overriden in subclass */
  // @ts-ignore
  protected onData(stream: SMTPServerDataStream, session: SMTPServerSession): Promise<void> {
    stream.pipe(new NullWritable())
    return Promise.resolve()
  }

  /** This method can be overriden in subclass */
  // @ts-ignore
  protected onMailFrom(address: SMTPServerAddress, session: SMTPServerSession): Promise<void> {
    return Promise.resolve()
  }

  /** This method can be overriden in subclass */
  // @ts-ignore
  protected onRcptTo(address: SMTPServerAddress, session: SMTPServerSession): Promise<void> {
    return Promise.resolve()
  }

  /** This method can be overriden in subclass */
  // @ts-ignore
  protected onError(error: Error): Promise<void> {
    return Promise.resolve()
  }
}

export default SMTPServerAsPromised
