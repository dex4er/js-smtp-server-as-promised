'use strict'

const SMTPServer = require('smtp-server').SMTPServer

const Promise = require('any-promise')
const PromiseReadable = require('promise-readable')

module.exports.SMTPServerAsPromised = class SMTPServerAsPromised {
  constructor (options) {
    options = options || {}
    this.options = options

    if (options.onConnect) {
      const promise = options.onConnect
      options.onConnect = (session, callback) => promise(session).then(callback).catch(e => callback(e))
    }
    if (options.onAuth) {
      const promise = options.onAuth
      options.onAuth = (auth, session, callback) => promise(auth, session)
        .then(response => callback(null, response))
        .catch(e => callback(e))
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
        return promise(options.usePromiseReadable ? new PromiseReadable(stream) : stream, session).then(callback).catch(e => callback(e))
      }
    }
    if (options.onClose) {
      const promise = options.onClose
      options.onClose = (session) => promise(session)
    }

    this.server = new SMTPServer(options)

    if (options.onError) {
      this.server.on('error', options.onError)
    }
  }

  listen (port, host, backlog) {
    port = port || this.options.port
    host = host || this.options.host
    backlog = backlog || this.options.backlog

    return new Promise((resolve, reject) => {
      const onceListening = () => {
        this.server.server.removeListener('error', onceError)
        resolve(this.server.server.address())
      }

      const onceError = (err) => {
        this.server.server.removeListener('listening', onceListening)
        reject(err)
      }

      this.server.server.once('listening', onceListening)
      this.server.server.once('error', onceError)

      // node < 7 doesn't accept undefined as port number
      this.server.listen(port || this.port || 0, this.host, this.backlog)
    })
  }

  close () {
    return new Promise((resolve, reject) => {
      this.server.close(() => {
        resolve()
      })
    })
  }
}
