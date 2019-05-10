#!/usr/bin/env node

const fs = require('fs')
const {PromiseReadable} = require('promise-readable')

const {SMTPServerAsPromised} = require('../lib/smtp-server-as-promised')

class MySMTPServer extends SMTPServerAsPromised {
  constructor(options) {
    super(options)
    this.password = options.password
  }

  async onConnect(session) {
    console.info(`[${session.id}] onConnect`)
  }

  async onAuth(auth, session) {
    console.info(`[${session.id} onAuth ${auth.method} ${auth.username} ${auth.password}`)
    if (auth.method === 'PLAIN' && auth.username === 'username' && auth.password === this.password) {
      return {user: auth.username}
    } else {
      throw new Error('Invalid username or password')
    }
  }

  async onMailFrom(from, session) {
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

  async onRcptTo(to, session) {
    console.info(`[${session.id}] onRcptTo ${to.address}`)
  }

  async onData(stream, session) {
    console.info(`[${session.id}] onData started`)
    const promiseStream = new PromiseReadable(stream)
    const message = await promiseStream.readAll()
    console.info(`[${session.id}] onData read\n${message}`)

    session.messageLength = message ? message.length : 0
    console.info(`[${session.id}] onData finished after reading ${session.messageLength} bytes`)
  }

  async onClose(session) {
    console.info(`[${session.id}] onClose`)
  }

  async onError(err) {
    console.info('Server error:', err)
  }
}

async function main() {
  // Usage: node server.js opt1=value1 opt2=value2...
  const defaultOptions = {
    hideSTARTTLS: true,
    port: 2525,
  }

  const userOptions = Object.assign(
    {},
    ...process.argv
      .slice(2)
      .map(a => a.split('='))
      .map(([k, v]) => ({[k]: v})),
  )

  const options = {...defaultOptions, ...userOptions}

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

main().catch(console.error)
