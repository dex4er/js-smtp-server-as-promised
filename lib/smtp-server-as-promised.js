'use strict'

const Promise = require('any-promise')
const PromiseOnceEvents = require('promise-once-events')
const SMTPServer = require('smtp-server-mit').SMTPServer

module.exports.SMTPServer = class SMTPServerAsPromised extends SMTPServer {
  constructor (options = {}) {
    if (options.onConnect) {
      const promise = options.onConnect
      options.onConnect = (session, callback) => promise(session).then(callback).catch(e => callback(e))
    }
    if (options.onAuth) {
      const promise = options.onAuth
      options.onAuth = (auth, session, callback) => promise(auth, session).then(callback).catch(e => callback(e))
    }
    if (options.onMailFrom) {
      const promise = options.onMailFrom
      options.onMailFrom = (from, session, callback) => promise(from, session).then(callback).catch(e => callback(e))
    }
    if (options.onRcptTo) {
      const promise = options.onRcptTo
      options.onRcptTo = (to, session, callback) => promise(to, session).then(callback).catch(e => callback(e))
    }
    if (options.onData) {
      const promise = options.onData
      options.onData = (stream, session, callback) => {
        stream.once = PromiseOnceEvents.prototype.once
        return promise(stream, session).then(callback).catch(e => callback(e))
      }
    }
    if (options.onClose) {
      const promise = options.onClose
      options.onClose = (session) => promise(session)
    }
    super(options)
  }

  listen (port = this.options.port, host = this.options.host, backlog = this.options.backlog) {
    return new Promise((resolve, reject) => {
      const rejector = (err) => reject(err)
      this.once('error', rejector)
      // node < 7 doesn't accept undefined as port number
      super.listen(port || this.port || 0, this.host, this.backlog, () => {
        this.removeListener('error', rejector)
        resolve(this.server.address())
      })
    })
  }

  close () {
    return new Promise((resolve, reject) => {
      super.close(() => {
        resolve()
      })
    })
  }
}
