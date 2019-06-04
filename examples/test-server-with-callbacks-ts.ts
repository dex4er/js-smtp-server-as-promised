#!/usr/bin/env ts-node

import fs from "fs"
import net from "net"

import {SMTPServer, SMTPServerAddress, SMTPServerDataStream, SMTPServerOptions, SMTPServerSession} from "smtp-server"

interface ArgvOptions {
  [key: string]: string
}

interface MySMTPServerOptions extends SMTPServerOptions {
  password?: string
}

interface MySession extends SMTPServerSession {
  messageLength?: number
}

// Usage: node server.js opt1=value1 opt2=value2...
const defaultOptions: MySMTPServerOptions & net.ListenOptions = {
  disabledCommands: ["AUTH"],
  hideSTARTTLS: true,
  // onAuth,
  onClose,
  onConnect,
  onData,
  onMailFrom,
  onRcptTo,
  port: 2525,
}

const userOptions: ArgvOptions = Object.assign(
  {},
  ...process.argv
    .slice(2)
    .map(a => a.split("="))
    .map(([k, v]) => ({[k]: v})),
)

const options = {...defaultOptions, ...userOptions}

options.ca = typeof options.ca === "string" ? fs.readFileSync(options.ca) : undefined
options.cert = typeof options.cert === "string" ? fs.readFileSync(options.cert) : undefined
options.key = typeof options.key === "string" ? fs.readFileSync(options.key) : undefined

function onConnect(session: MySession, callback: (err?: Error | null) => void): void {
  console.info(`[${session.id}] onConnect`)
  callback()
}

function onMailFrom(from: SMTPServerAddress, session: MySession, callback: (err?: Error | null) => void): void {
  console.info(`[${session.id}] onMailFrom ${from.address}`)
  if (from.address.split("@")[1] === "spammer.com") {
    // code 421 disconnects SMTP session immediately
    return callback(Object.assign(new Error("we do not like spam!"), {responseCode: 421}))
  }
  callback()
}

function onRcptTo(to: SMTPServerAddress, session: MySession, callback: (err?: Error | null) => void): void {
  console.info(`[${session.id}] onRcptTo ${to.address}`)
  callback()
}

function onData(stream: SMTPServerDataStream, session: MySession, callback: (err?: Error | null) => void): void {
  console.info(`[${session.id}] onData started`)
  session.messageLength = 0

  stream.on("data", chunk => {
    console.info(`[${session.id}] onData got data chunk ${chunk.length} bytes`)
    session.messageLength += chunk.length
  })

  stream.once("end", () => {
    console.info(`[${session.id}] onData finished after reading ${session.messageLength} bytes`)
    callback()
  })
}

function onClose(session: MySession): void {
  console.info(`[${session.id}] onClose`)
}

function main(): void {
  const server = new SMTPServer(options)

  server.on("error", e => {
    console.info(`Server got error:`, e)
  })

  server.listen(options, () => {
    const address = server.server.address() as net.AddressInfo
    console.info(`Listening on [${address.address}]:${address.port}`)
  })
}

main()
