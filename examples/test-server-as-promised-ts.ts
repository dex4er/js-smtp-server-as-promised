#!/usr/bin/env ts-node

import fs from 'fs'
import NullWritable from 'null-writable'
import PromiseReadable from 'promise-readable'
import { Readable } from 'stream'

import { SMTPServerAddress, SMTPServerAsPromised, SMTPServerAsPromisedOptions, SMTPServerSession } from '../lib/smtp-server-as-promised'

interface ArgvOptions {
  [key: string]: string
}

interface Session extends SMTPServerSession {
  messageLength?: number
}

async function onConnect (session: Session) {
  console.info(`[${session.id}] onConnect`)
}

// async function onAuth (auth: SMTPServerAsPromised.Authentication, session: Session): Promise<SMTPServerAsPromised.AuthenticationResponse> {
//   if (auth.method === 'PLAIN' && auth.username === 'username' && auth.password === 'password') {
//     return { user: auth.username }
//   } else {
//     throw new Error('Invalid username or password')
//   }
// }

async function onMailFrom (from: SMTPServerAddress, session: Session): Promise<void> {
  const tlsDebug = session.tlsOptions ? JSON.stringify(session.tlsOptions) : ''
  console.info(`[${session.id}] onMailFrom ${from.address} ${session.openingCommand} ${session.transmissionType} ${tlsDebug}`)
  if (from.address.split('@')[1] === 'spammer.com') {
    // code 421 disconnects SMTP session immediately
    throw Object.assign(new Error('we do not like spam!'), { responseCode: 421 })
  } else if (from.address.split('@')[0] === 'bounce') {
    throw Object.assign(new Error('fatal'), { responseCode: 500 })
  }
}

async function onRcptTo (to: SMTPServerAddress, session: Session): Promise<void> {
  console.info(`[${session.id}] onRcptTo ${to.address}`)
}

async function onData (stream: Readable, session: Session): Promise<void> {
  console.info(`[${session.id}] onData started`)

  try {
    const promiseStream = new PromiseReadable(stream)
    const message = await promiseStream.readAll()
    console.info(`[${session.id}] onData read\n${message}`)

    session.messageLength = message ? message.length : 0
    console.info(`[${session.id}] onData finished after reading ${session.messageLength} bytes`)
  } catch (e) {
    // read it to the end
    stream.pipe(new NullWritable())
    // rethrow original error
    throw e
  }
}

async function onClose (session: Session): Promise<void> {
  console.info(`[${session.id}] onClose`)
}

async function onError (err: Error): Promise<void> {
  console.info('Server error:', err)
}

async function main (): Promise<void> {
  // Usage: node server.js opt1=value1 opt2=value2...
  const defaultOptions: SMTPServerAsPromisedOptions = {
    disabledCommands: ['AUTH'],
    hideSTARTTLS: true,
    // onAuth,
    onClose,
    onConnect,
    onData,
    onError,
    onMailFrom,
    onRcptTo,
    port: 2525
  }

  const userOptions: ArgvOptions = Object.assign({}, ...process.argv.slice(2).map((a) => a.split('=')).map(([k, v]) => ({ [k]: v })))

  const options: SMTPServerAsPromisedOptions = { ...defaultOptions, ...userOptions }

  options.ca = typeof options.ca === 'string' ? fs.readFileSync(options.ca) : undefined
  options.cert = typeof options.cert === 'string' ? fs.readFileSync(options.cert) : undefined
  options.key = typeof options.key === 'string' ? fs.readFileSync(options.key) : undefined

  const server = new SMTPServerAsPromised(options)
  const address = await server.listen()
  console.info(`Listening on [${address.address}]:${address.port}`)
}

void main().catch(console.error)
