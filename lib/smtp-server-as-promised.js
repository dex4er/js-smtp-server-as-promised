'use strict'

const SMTPServer = require('smtp-server').SMTPServer

class SMTPServerAsPromised {
  constructor (options) {
    options = options || {}
    this.options = options

    if (options.onConnect) {
      const handler = options.onConnect
      options.onConnect = (session, callback) => handler(session)
        .then(() => callback())
        .catch((err) => callback(err))
    }
    if (options.onAuth) {
      const handler = options.onAuth
      options.onAuth = (auth, session, callback) => handler(auth, session)
        .then((response) => callback(null, response))
        .catch((err) => callback(err))
    }
    if (options.onMailFrom) {
      const handler = options.onMailFrom
      options.onMailFrom = (from, session, callback) => handler(from, session)
        .then(() => callback())
        .catch((err) => callback(err))
    }
    if (options.onRcptTo) {
      const handler = options.onRcptTo
      options.onRcptTo = (to, session, callback) => handler(to, session)
        .then(() => callback())
        .catch((err) => callback(err))
    }
    if (options.onData) {
      const handler = options.onData
      options.onData = (stream, session, callback) => handler(stream, session)
        .then(() => callback())
        .catch((err) => callback(err))
    }
    if (options.onClose) {
      const handler = options.onClose
      options.onClose = (session) => handler(session)
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
        const options = this.options
        if (options.onError) {
          this.server.removeListener('error', options.onError)
        }
        resolve()
      })
    })
  }

  updateSecureContext (options) {
    this.server.updateSecureContext(options)
  }
}

SMTPServerAsPromised.SMTPServerAsPromised = SMTPServerAsPromised

module.exports = SMTPServerAsPromised
