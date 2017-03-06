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

  Scenario('Start the SMTP server', function () {
    Given('SMTPServerAsPromised object', () => {
      this.server = new SMTPServerAsPromised()
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
