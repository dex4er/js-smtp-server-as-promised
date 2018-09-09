#!/usr/bin/env node

'use strict'

const fs = require('fs')
const SMTPServer = require('smtp-server').SMTPServer

// Usage: node server.js opt1=value1 opt2=value2...
const defaultOptions = {
  disabledCommands: ['AUTH'],
  hideSTARTTLS: true,
  // onAuth,
  onClose,
  onConnect,
  onData,
  onMailFrom,
  onRcptTo,
  port: 2525
}

const userOptions = Object.assign({}, ...process.argv.slice(2).map((a) => a.split('=')).map(([k, v]) => ({ [k]: v })))

const options = { ...defaultOptions, ...userOptions }

options.ca = typeof options.ca === 'string' ? fs.readFileSync(options.ca) : undefined
options.cert = typeof options.cert === 'string' ? fs.readFileSync(options.cert) : undefined
options.key = typeof options.key === 'string' ? fs.readFileSync(options.key) : undefined

function onConnect (session, callback) {
  console.log(`[${session.id}] onConnect`)
  callback()
}

function onMailFrom (from, session, callback) {
  console.log(`[${session.id}] onMailFrom ${from.address}`)
  if (from.address.split('@')[1] === 'spammer.com') {
    // code 421 disconnects SMTP session immediately
    return callback(Object.assign(new Error('we do not like spam!'), { responseCode: 421 }))
  }
  callback()
}

function onRcptTo (to, session, callback) {
  console.log(`[${session.id}] onRcptTo ${to.address}`)
  callback()
}

function onData (stream, session, callback) {
  console.log(`[${session.id}] onData started`)
  session.messageLength = 0

  stream.on('data', (chunk) => {
    console.log(`[${session.id}] onData got data chunk ${chunk.length} bytes`)
    session.messageLength += chunk.length
  })

  stream.once('end', () => {
    console.log(`[${session.id}] onData finished after reading ${session.messageLength} bytes`)
    callback()
  })
}

function onClose (session) {
  console.log(`[${session.id}] onClose`)
}

function main () {
  const server = new SMTPServer(options)

  server.on('error', (e) => {
    console.log(`Server got error:`, e)
  })

  server.listen(options, () => {
    const address = server.server.address()
    console.log(`Listening on [${address.address}]:${address.port}`)
  })
}

main()
