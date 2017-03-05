'use strict'

/* global Feature, Scenario, Given, When, Then, After */
const t = require('tap')
require('tap-given')(t)

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
chai.should()

Feature('Test smtp-server-as-promised module', () => {
  const SMTPServer = require('../lib/smtp-server-as-promised').SMTPServer

  Scenario('Start the SMTP server', function () {
    Given('SMTPServer object', () => {
      this.server = new SMTPServer()
    })

    When('listen method is used', () => {
      this.promise = this.server.listen()
    })

    Then('promise returns address object', () => {
      return this.promise.should.eventually.have.property('port')
    })

    After('this scenario, close the server', () => {
      return this.server.close()
    })
  })
})
