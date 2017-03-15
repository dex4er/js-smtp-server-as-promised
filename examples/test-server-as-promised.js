'use strict'

const {SMTPServerAsPromised} = require('../lib/smtp-server-as-promised')

// Usage: node server.js opt1=value1 opt2=value2...
const options = Object.assign({}, ...process.argv.slice(2).map(a => a.split('=')).map(([k, v]) => ({[k]: v})))
Object.assign(options, {
  disabledCommands: ['AUTH'],
  usePromiseReadable: true,
  onConnect,
  onMailFrom,
  onRcptTo,
  onData,
  onClose,
  onError
})

async function onConnect (session) {
  console.log(`[${session.id}] onConnect`)
}

async function onMailFrom (from, session) {
  console.log(`[${session.id}] onMailFrom ${from.address}`)
  if (from.address.split('@')[1] === 'spammer.com') {
    // code 421 disconnects SMTP session immediately
    throw Object.assign(new Error('we do not like spam!'), {responseCode: 421})
  }
}

async function onRcptTo (to, session) {
  console.log(`[${session.id}] onRcptTo ${to.address}`)
}

async function onData (stream, session) {
  console.log(`[${session.id}] onData started`)
  session.messageLength = 0

  for (let chunk; (chunk = await stream.read()) !== null;) {
    console.log(`[${session.id}] onData got data chunk ${chunk.length} bytes`)
    session.messageLength += chunk.length
  }

  console.log(`[${session.id}] onData finished after reading ${session.messageLength} bytes`)
}

async function onClose (session) {
  console.log(`[${session.id}] onClose`)
}

async function onError (e) {
  console.log('Server error:', e)
}

async function main () {
  const server = new SMTPServerAsPromised(options)
  const address = await server.listen()
  console.log(`Listening on [${address.address}]:${address.port}`)
}

main()