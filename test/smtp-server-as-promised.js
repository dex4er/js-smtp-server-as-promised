'use strict'

/* global Feature, Scenario, Given, When, Then, After */
const t = require('tap')
require('tap-given')(t)

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
chai.should()

Feature('Test smtp-server-as-promised module', () => {
  const {SMTPServerAsPromised} = require('../lib/smtp-server-as-promised')
  const PromiseSocket = require('promise-socket')

  const crlf = '\x0d\x0a'

  Scenario('Receive one mail', function () {
    Given('SMTPServerAsPromised object', () => {
      this.server = new SMTPServerAsPromised()
    })

    Given('Socket object as a promise', () => {
      this.client = new PromiseSocket()
    })

    When('listen method is used', () => {
      this.promise = this.server.listen(0)
    })

    When('promise returns address object', () => {
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

    Then('I get SMTP banner', () => {
      return this.client.read().then(chunk => {
        chunk.toString().should.match(/^250-/)
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
