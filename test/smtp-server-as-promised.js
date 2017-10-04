'use strict'

const t = require('tap')
require('tap-given')(t)

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
chai.should()

Feature('Test smtp-server-as-promised module', () => {
  const SMTPServerAsPromised = require('../lib/smtp-server-as-promised').SMTPServerAsPromised
  const PromiseSocket = require('promise-socket').PromiseSocket

  const crlf = '\x0d\x0a'

  function onAuth (auth, session) {
    return new Promise((resolve, reject) => {
      if (auth.method === 'PLAIN' && auth.username === 'username' && auth.password === 'password') {
        resolve({user: auth.username})
      } else {
        reject(new Error('Invalid username or password'))
      }
    })
  }

  const rfc2822Message = '' +
    'From: sender@example.com' + crlf +
    'To: recipient@example.net' + crlf +
    'Subject: test' + crlf +
    crlf +
    'Test' + crlf +
    '.' + crlf

  const authPlainString = Buffer.from('\0username\0password').toString('base64')

  Scenario('Receive one mail', function () {
    Given('SMTPServerAsPromised object', () => {
      this.server = new SMTPServerAsPromised({
        hideSTARTTLS: true,
        onAuth
      })
    })

    And('Socket object as a promise', () => {
      this.client = new PromiseSocket()
    })

    When('listen method is used', () => {
      this.promise = this.server.listen(0)
    })

    And('promise returns address object', () => {
      return this.promise.then(address => {
        this.address = address
      })
    })

    Then('port number should be correct', () => {
      this.address.port.should.be.above(1024).and.below(65535)
    })

    When('I connect to the server', done => {
      return this.client.connect(this.address.port)
    })

    Then('I get SMTP banner', () => {
      return this.client.read().then(chunk => {
        chunk.toString().should.match(/^220 .* ESMTP\r\n$/)
      })
    })

    When('I send EHLO command', () => {
      return this.client.write('EHLO localhost' + crlf)
    })

    Then('I get EHLO response', () => {
      return this.client.read().then(chunk => {
        chunk.toString().should.match(/^250-/)
      })
    })

    When('I send AUTH PLAIN command', () => {
      return this.client.write('AUTH PLAIN ' + authPlainString + crlf)
    })

    Then('I get AUTH PLAIN response', () => {
      return this.client.read().then(chunk => {
        chunk.toString().should.match(/^235 Authentication successful/)
      })
    })

    When('I send MAIL FROM command', () => {
      return this.client.write('MAIL FROM:<sender@example.com>' + crlf)
    })

    Then('I get MAIL FROM response', () => {
      return this.client.read().then(chunk => {
        chunk.toString().should.match(/^250 Accepted/)
      })
    })

    When('I send RCPT TO command', () => {
      return this.client.write('RCPT TO:<recipient@example.net>' + crlf)
    })

    Then('I get RCPT TO response', () => {
      return this.client.read().then(chunk => {
        chunk.toString().should.match(/^250 Accepted/)
      })
    })

    When('I send DATA command', () => {
      return this.client.write('DATA' + crlf)
    })

    Then('I get DATA response', () => {
      return this.client.read().then(chunk => {
        chunk.toString().should.match(/^354 End data/)
      })
    })

    When('I send an RFC2822 message', () => {
      return this.client.write(rfc2822Message)
    })

    And('I send an dot command', () => {
      return this.client.write('.' + crlf)
    })

    Then('I get message queued response', () => {
      return this.client.read().then(chunk => {
        chunk.toString().should.match(/^250 OK: message queued/)
      })
    })

    When('I send QUIT command', () => {
      return this.client.write('QUIT' + crlf)
    })

    Then('I get QUIT response', () => {
      return this.client.read().then(chunk => {
        chunk.toString().should.match(/^221 Bye/)
      })
    })

    After('close the client', () => {
      this.client.end()
    })

    After('close the server', () => {
      return this.server.close()
    })
  })
})
