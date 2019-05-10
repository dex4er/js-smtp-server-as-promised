import {After, And, Feature, Given, Scenario, Then, When} from './lib/steps'

import chai, {expect} from 'chai'

import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)

import {AddressInfo, Socket} from 'net'
import PromiseSocket from 'promise-socket'
import semver from 'semver'

import {
  SMTPServerAsPromised,
  SMTPServerAuthentication,
  SMTPServerAuthenticationResponse,
  SMTPServerSession,
} from '../src/smtp-server-as-promised'

Feature('Test smtp-server-as-promised module', () => {
  const crlf = '\x0d\x0a'

  class MySMTPServer extends SMTPServerAsPromised {
    protected async onAuth(
      auth: SMTPServerAuthentication,
      _session: SMTPServerSession,
    ): Promise<SMTPServerAuthenticationResponse> {
      if (auth.method === 'PLAIN' && auth.username === 'username' && auth.password === 'password') {
        return {user: auth.username}
      } else {
        throw new Error('Invalid username or password')
      }
    }
  }

  // prettier-ignore
  const rfc2822Message =
    '' +
    'From: sender@example.com' + crlf +
    'To: recipient@example.net' + crlf +
    'Subject: test' + crlf + crlf +
    'Test' + crlf +
    '.' + crlf

  const authPlainString = Buffer.from('\0username\0password').toString('base64')

  Scenario('Receive one mail', () => {
    let address: AddressInfo
    let client: PromiseSocket<Socket>
    let lastChunk: Buffer | undefined
    let server: MySMTPServer

    Given('SMTPServerAsPromised object', () => {
      server = new MySMTPServer({
        hideSTARTTLS: true,
      })
    })

    And('Socket object as a promise', () => {
      client = new PromiseSocket()
    })

    When('listen method is used', async () => {
      address = await server.listen({port: 0})
    })

    Then('port number) to be correct', () => {
      expect(address.port)
        .to.be.above(1024)
        .and.below(65535)
    })

    When('I connect to the server', async () => {
      await client.connect(address.port)
    })

    Then('I get SMTP banner', async () => {
      const chunk = await client.read()
      expect(chunk!.toString()).to.match(/^220 .* ESMTP\r\n$/)
    })

    When('I send EHLO command', async () => {
      await client.write('EHLO localhost' + crlf)
    })

    Then('I get EHLO response', async () => {
      const chunk = await client.read()
      expect(chunk!.toString()).to.match(/^250-/)
    })

    When('I send AUTH PLAIN command', async () => {
      await client.write('AUTH PLAIN ' + authPlainString + crlf)
    })

    Then('I get AUTH PLAIN response', async () => {
      const chunk = await client.read()
      expect(chunk!.toString()).to.match(/^235 Authentication successful/)
    })

    When('I send MAIL FROM command', async () => {
      await client.write('MAIL FROM:<sender@example.com>' + crlf)
    })

    Then('I get MAIL FROM response', async () => {
      const chunk = await client.read()
      expect(chunk!.toString()).to.match(/^250 Accepted/)
    })

    When('I send RCPT TO command', async () => {
      await client.write('RCPT TO:<recipient@example.net>' + crlf)
    })

    Then('I get RCPT TO response', async () => {
      const chunk = await client.read()
      expect(chunk!.toString()).to.match(/^250 Accepted/)
    })

    When('I send DATA command', async () => {
      await client.write('DATA' + crlf)
    })

    Then('I get DATA response', async () => {
      const chunk = await client.read()
      expect(chunk!.toString()).to.match(/^354 End data/)
    })

    When('I send an RFC2822 message', async () => {
      await client.write(rfc2822Message)
    })

    And('I send an dot command', async () => {
      await client.write('.' + crlf)
    })

    Then('I get message queued response', async () => {
      const chunk = await client.read()
      expect(chunk!.toString()).to.match(/^250 OK: message queued/)
    })

    if (semver.gte(process.version, 'v10.0.0')) {
      When('I send QUIT command', async () => {
        await client.write('QUIT' + crlf)
      })

      Then('I get QUIT response', async () => {
        const chunk = await client.read()
        expect(chunk!.toString()).to.match(/^221 Bye/)
      })
    } else {
      // Not correct synchronization on Node < 10 because it misses
      // https://github.com/nodejs/node/commit/9b7a6914a7
      When('I send QUIT command', async () => {
        void client.read().then(chunk => {
          lastChunk = chunk as Buffer
        })
        await client.write('QUIT' + crlf)
      })

      Then('I get QUIT response', () => {
        expect(lastChunk!.toString()).to.match(/^221 Bye/)
      })
    }

    And('there is nothing more to read', async () => {
      const chunk = await client.read()
      return expect(chunk).to.be.undefined
    })

    After(async () => {
      await client.end()
    })

    After(async () => {
      await server.destroy()
    })
  })
})
