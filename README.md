# smtp-server-as-promised

<!-- markdownlint-disable MD013 -->
[![Build Status](https://secure.travis-ci.org/dex4er/js-smtp-server-as-promised.svg)](http://travis-ci.org/dex4er/js-smtp-server-as-promised) [![Coverage Status](https://coveralls.io/repos/github/dex4er/js-smtp-server-as-promised/badge.svg)](https://coveralls.io/github/dex4er/js-smtp-server-as-promised) [![npm](https://img.shields.io/npm/v/smtp-server-as-promised.svg)](https://www.npmjs.com/package/smtp-server-as-promised)
<!-- markdownlint-enable MD013 -->

This module provides promisified version of
[`smtp-server`](https://www.npmjs.com/package/smtp-server) module. The API is
the same as for `smtp-server`, except `listen` method which return
[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
object and callback options which should be replaced with overriden method in
own subclass.

## Requirements

This module requires Node >= 6.

## Installation

```shell
npm install smtp-server-as-promised
```

_Additionally for Typescript:_

```shell
npm install -D @types/node @types/nodemailer @types/smtp-server
```

Transpiling this module with own settings in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "smtp-server-as-promised": ["node_modules/smtp-server-as-promised/src/smtp-server-as-promised"]
    }
  }
}
```

## Usage

`smtp-server-as-promised` can be used like standard `smtp-server` module:

```js
const { SMTPServerAsPromised } = require('smtp-server-as-promised')

class MySMTPServer extends SMTPServerAsPromised {}
```

_Typescript:_

```ts
import SMTPServerAsPromised from 'smtp-server-as-promised'

class MySMTPServer extends SMTPServerAsPromised {}
```

### constructor

```js
const server = new MySMTPServer(options)
```

Create new `SMTPServerAsPromised` instance.

_Example:_

```js
const server = new MySMTPServer({
  disabledCommands: ['AUTH']
})
```

Options are the same as for original `smtp-server` constructor except callback
handlers that methods of this class should be used instead.

### onConnect

This method can be overriden in subclass.

_Example:_

```js
class MySMTPServer extends SMTPServerAsPromised {
  async onConnect (session) {
    console.log(`[${session.id}] onConnect`)
  }
}
```

### onAuth

This method can be overriden in subclass.

_Example:_

<!-- markdownlint-disable MD013 -->

```js
class MySMTPServer extends SMTPServerAsPromised {
  async onAuth (auth, session) {
    if (auth.method === 'PLAIN' && auth.username === 'username' && auth.password === 'password') {
      return { user: auth.username }
    } else {
      throw new Error('Invalid username or password')
    }
  }
}
```

<!-- markdownlint-enable MD013 -->

This method must return the object with `user` property.

### onMailFrom

This method can be overriden in subclass.

_Example:_

```js
class MySMTPServer extends SMTPServerAsPromised {
  async onMailFrom (from, session) {
    console.log(`[${session.id}] onMailFrom ${from.address}`)
    if (from.address.split('@')[1] === 'spammer.com') {
      throw new Error('we do not like spam!')
    }
  }
}
```

An errors can be thrown and then are handled by server in response message.

### onRcptTo

This method can be overriden in subclass.

_Example:_

```js
class MySMTPServer extends SMTPServerAsPromised {
  async onRcptTo (to, session) {
    console.log(`[${session.id}] onRcptTo ${to.address}`)
    if (from.address.split('@')[1] === 'spammer.com') {
      throw new Error('we do not like spam!')
    }
  }
}
```

### onData

This method can be overriden in subclass.

_Example:_

<!-- markdownlint-disable MD013 -->

```js
class MySMTPServer extends SMTPServerAsPromised {
  async onData (stream, session) {
    console.log(`[${session.id}] onData started`)
    if (stream.sizeExceeded) throw new Error('Message too big');
    stream.pipe(process.stdout)
  }
}
```

<!-- markdownlint-enable MD013 -->

`stream` object is a
[`stream.Duplex`](https://nodejs.org/api/stream.html#stream_class_stream_duplex)
object with additional properties: `byteLength` and `sizeExceeded`.

The method blocks SMTP session until `stream` is finished. It breaks session if
`stream` is already finished.

If the method throws an error then the `stream` is silently consumed to
prevent SMTP stream to be blocked.

### onError

This method can be overriden in subclass.

_Example:_

```js
class MySMTPServer extends SMTPServerAsPromised {
  async onError (error) {
    console.log('Server error:', error)
  }
}
```

### listen

```js
const promise = server.listen(options)
```

Start the server instance. Argument is the same as for
[`net.listen`](https://nodejs.org/api/net.html#net_server_listen_options_callback)
method. This method returns promise which resolves to `address` value.

_Example:_

```js
async function main () {
  const address = await server.listen({ port: 2525 })
  console.log(`Listening on [${address.address}]:${address.port}`)
}
```

### close

```js
const promise = server.close()
```

Stop the server from accepting new connections.

_Example:_

```js
async function main () {
  // ...
  await server.close()
  console.log(`Server was stopped`)
}
```

### updateSecureContext

```js
server.updateSecureContext(options)
```

Update TLS secure context.

_Example:_

```js
server.updateSecureContext({ key: tlsKeyPem })
```

### destroy

```js
await connection.destroy()
```

Manually free resources taken by server.

## License

Copyright (c) 2016-2019 Piotr Roszatycki <piotr.roszatycki@gmail.com>

[MIT](https://opensource.org/licenses/MIT)
