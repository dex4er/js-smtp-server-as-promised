/// <reference types="node" />
/// <reference types="nodemailer" />

import net from 'net'
export { Logger, LoggerLevel } from 'nodemailer/lib/shared'
import { Readable } from 'stream'
import tls from 'tls'

import { SMTPServer, SMTPServerAddress, SMTPServerAuthentication, SMTPServerAuthenticationResponse, SMTPServerOptions, SMTPServerSession } from 'smtp-server'

export * from 'smtp-server'

export interface SMTPServerAsPromisedServerAddress {
  address: string
  family: string
  port: number
}

export interface SMTPServerAsPromisedOptions extends SMTPServerOptions {
  onAuth?: (auth: SMTPServerAuthentication, session: SMTPServerSession) => Promise<SMTPServerAuthenticationResponse>
  onClose?: (session: SMTPServerSession) => Promise<void>
  onConnect?: (session: SMTPServerSession) => Promise<void>
  onData?: (stream: Readable, session: SMTPServerSession) => Promise<void>
  onMailFrom?: (address: SMTPServerAddress, session: SMTPServerSession) => Promise<void>
  onRcptTo?: (address: SMTPServerAddress, session: SMTPServerSession) => Promise<void>
  onError?: (error: Error) => Promise<void>
}

export class SMTPServerAsPromised {
  server: SMTPServer

  protected closed?: boolean = false
  protected errorHandler?: (error: Error) => Promise<void>

  constructor (options: SMTPServerAsPromisedOptions = {}) {
    const smtpSeverOptions: SMTPServerOptions = Object.assign({}, options)

    if (options.onConnect) {
      const handlerWithPromise = options.onConnect
      const handlerWithCallback = (session: SMTPServerSession, callback: (err?: Error) => void) => handlerWithPromise(session)
        .then(() => callback())
        .catch((err) => callback(err))
      smtpSeverOptions.onConnect = handlerWithCallback
    }
    if (options.onAuth) {
      const handlerWithPromise = options.onAuth
      const handlerWithCallback = (auth: SMTPServerAuthentication, session: SMTPServerSession, callback: (err: Error | null, response?: SMTPServerAuthenticationResponse) => void) => handlerWithPromise(auth, session)
        .then((response) => callback(null, response))
        .catch((err) => callback(err))
      smtpSeverOptions.onAuth = handlerWithCallback as any
    }
    if (options.onMailFrom) {
      const handlerWithPromise = options.onMailFrom
      const handlerWithCallback = (address: SMTPServerAddress, session: SMTPServerSession, callback: (err?: Error | null) => void) => handlerWithPromise(address, session)
        .then(() => callback())
        .catch((err) => callback(err))
      smtpSeverOptions.onMailFrom = handlerWithCallback
    }
    if (options.onRcptTo) {
      const handlerWithPromise = options.onRcptTo
      const handlerWithCallback = (address: SMTPServerAddress, session: SMTPServerSession, callback: (err?: Error | null) => void) => handlerWithPromise(address, session)
        .then(() => callback())
        .catch((err) => callback(err))
      smtpSeverOptions.onRcptTo = handlerWithCallback
    }
    if (options.onData) {
      const handlerWithPromise = options.onData
      const handlerWithCallback = (stream: Readable, session: SMTPServerSession, callback: (err?: Error | null) => void) => handlerWithPromise(stream, session)
        .then(() => callback())
        .catch((err) => callback(err))
      smtpSeverOptions.onData = handlerWithCallback
    }
    if (options.onClose) {
      const handlerWithPromise = options.onClose
      const handlerWithCallback = (session: SMTPServerSession) => handlerWithPromise(session)
      smtpSeverOptions.onClose = handlerWithCallback
    }

    this.server = new SMTPServer(smtpSeverOptions)

    if (options.onError) {
      this.errorHandler = options.onError
      this.server.on('error', this.errorHandler)
    }
  }

  listen (options: net.ListenOptions = {}): Promise<SMTPServerAsPromisedServerAddress> {
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

  close (): Promise<void> {
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

  updateSecureContext (options: tls.TlsOptions): void {
    this.server.updateSecureContext(options)
  }

  destroy (): Promise<void> {
    if (!this.closed) {
      return this.close()
    } else {
      return Promise.resolve()
    }
  }
}

export default SMTPServerAsPromised
