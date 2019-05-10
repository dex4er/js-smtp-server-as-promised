#!/usr/bin/env ts-node

import fs from 'fs'
import net from 'net'
import PromiseReadable from 'promise-readable'
import {Readable} from 'stream'

import {
  SMTPServerAddress,
  SMTPServerAsPromised,
  SMTPServerAsPromisedOptions,
  SMTPServerAuthentication,
  SMTPServerAuthenticationResponse,
  SMTPServerSession,
} from '../src/smtp-server-as-promised'

interface ArgvOptions {
  [key: string]: string
}

interface Session extends SMTPServerSession {
  messageLength?: number
}

interface MySMTPServerOptions extends SMTPServerAsPromisedOptions {
  password?: string
}

class MySMTPServer extends SMTPServerAsPromised {
  password?: string

  constructor(options: MySMTPServerOptions) {
    super(options)
    this.password = options.password
  }

  protected async onConnect(session: Session): Promise<void> {
    console.info(`[${session.id}] onConnect`)
  }

  protected async onAuth(auth: SMTPServerAuthentication, session: Session): Promise<SMTPServerAuthenticationResponse> {
    console.info(`[${session.id} onAuth ${auth.method} ${auth.username} ${auth.password}`)
    if (auth.method === 'PLAIN' && auth.username === 'username' && auth.password === this.password) {
      return {user: auth.username}
    } else {
      throw new Error('Invalid username or password')
    }
  }

  protected async onMailFrom(from: SMTPServerAddress, session: Session): Promise<void> {
    const tlsDebug = session.tlsOptions ? JSON.stringify(session.tlsOptions) : ''
    console.info(
      `[${session.id}] onMailFrom ${from.address} ${session.openingCommand} ${session.transmissionType} ${tlsDebug}`,
    )
    if (from.address.split('@')[1] === 'spammer.com') {
      // code 421 disconnects SMTP session immediately
      throw Object.assign(new Error('we do not like spam!'), {responseCode: 421})
    } else if (from.address.split('@')[0] === 'bounce') {
      throw Object.assign(new Error('fatal'), {responseCode: 500})
    }
  }

  protected async onRcptTo(to: SMTPServerAddress, session: Session): Promise<void> {
    console.info(`[${session.id}] onRcptTo ${to.address}`)
  }

  protected async onData(stream: Readable, session: Session): Promise<void> {
    console.info(`[${session.id}] onData started`)
    const promiseStream = new PromiseReadable(stream)
    const message = await promiseStream.readAll()
    console.info(`[${session.id}] onData read\n${message}`)

    session.messageLength = message ? message.length : 0
    console.info(`[${session.id}] onData finished after reading ${session.messageLength} bytes`)
  }

  protected async onClose(session: Session): Promise<void> {
    console.info(`[${session.id}] onClose`)
  }

  protected async onError(err: Error): Promise<void> {
    console.info('Server error:', err)
  }
}

async function main(): Promise<void> {
  // Usage: node server.js opt1=value1 opt2=value2...
  const defaultOptions: MySMTPServerOptions & net.ListenOptions = {
    hideSTARTTLS: true,
    port: 2525,
  }

  const userOptions: ArgvOptions = Object.assign(
    {},
    ...process.argv
      .slice(2)
      .map(a => a.split('='))
      .map(([k, v]) => ({[k]: v})),
  )

  const options = {...defaultOptions, ...userOptions} as SMTPServerAsPromisedOptions & net.ListenOptions

  if (!userOptions.password) {
    options.disabledCommands = ['AUTH']
  }

  options.ca = typeof options.ca === 'string' ? fs.readFileSync(options.ca) : undefined
  options.cert = typeof options.cert === 'string' ? fs.readFileSync(options.cert) : undefined
  options.key = typeof options.key === 'string' ? fs.readFileSync(options.key) : undefined

  const server = new MySMTPServer(options)
  const address = await server.listen(options)
  console.info(`Listening on [${address.address}]:${address.port}`)
}

void main().catch(console.error)
