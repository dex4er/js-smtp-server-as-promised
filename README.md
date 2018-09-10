# smtp-server-as-promised

<!-- markdownlint-disable MD013 -->
[![Build Status](https://secure.travis-ci.org/dex4er/js-smtp-server-as-promised.svg)](http://travis-ci.org/dex4er/js-smtp-server-as-promised) [![Coverage Status](https://coveralls.io/repos/github/dex4er/js-smtp-server-as-promised/badge.svg)](https://coveralls.io/github/dex4er/js-smtp-server-as-promised) [![npm](https://img.shields.io/npm/v/smtp-server-as-promised.svg)](https://www.npmjs.com/package/smtp-server-as-promised)
<!-- markdownlint-enable MD013 -->

This module provides promisified version of
[`smtp-server`](https://www.npmjs.com/package/smtp-server) module. The API is
the same as for `smtp-server`, except `listen` method which return
[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
object and callback options which are `Promise` objects.

## Requirements

This module requires Node >= 6.

## Installation

```shell
npm install smtp-server-as-promised
```

_Additionally for Typescript:_

```shell
npm install -D @types/node @types/nodemailer
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
```

_Typescript:_

```ts
import SMTPServerAsPromised from 'smtp-server-as-promised'
```

### constructor

```js
const server = new SMTPServerAsPromised(options)
```

Create new SMTPServer instance.

_Example:_

```js
const server = new SMTPServerAsPromised({
  onConnect, onMailFrom, onData, onError
})
```

Options are the same as for original `smtp-server` constructor. Callback
handlers are `Promise` objects or `async` functions:

### onConnect

```js
async function onConnect (session) {
  console.log(`[${session.id}] onConnect`)
}
```

### onAuth

<!-- markdownlint-disable MD013 -->

```js
async function onAuth (auth, session) {
  if (auth.method === 'PLAIN' && auth.username === 'username' && auth.password === 'password') {
    return {user: auth.username}
  } else {
    throw new Error('Invalid username or password')
  }
}
```

<!-- markdownlint-enable MD013 -->

This method must return the object with `user` property.

### onMailFrom

```js
async function onMailFrom (from, session) {
  console.log(`[${session.id}] onMailFrom ${from.address}`)
  if (from.address.split('@')[1] === 'spammer.com') {
    throw new Error('we do not like spam!')
  }
}
```

An errors can be thrown and then are handled by server in response message.

### onRcptTo

```js
async function onRcptTo (to, session) {
  console.log(`[${session.id}] onRcptTo ${to.address}`)
  if (from.address.split('@')[1] === 'spammer.com') {
    throw new Error('we do not like spam!')
  }
}
```

### onData

<!-- markdownlint-disable MD013 -->

```js
async function onData (stream, session) {
  console.log(`[${session.id}] onData started`)
  session.messageLength = 0

  for (let chunk; (chunk = await stream.read());) {
    console.log(`[${session.id}] onData got data chunk ${chunk.length} bytes`)
    session.messageLength += chunk.length
  }

  console.log(`[${session.id}] onData finished after reading ${session.messageLength} bytes`)
}
```

<!-- markdownlint-enable MD013 -->

`stream` object is a standard
[`stream.Readable`](https://nodejs.org/api/stream.html#stream_class_stream_readable)
object.

Warning: if an error occures in `onData` handler, stream have to be consumed
before return from function.

_Example_:

```js
const { NullWritable } = require('null-writable')

async function onData (stream, session) {
  try {
    throw new Error('Something bad happened')
  } catch (e) {
    stream.pipe(new NullWritable())  // read it to the end
    throw e  // rethrow original error
  }
}
```

### onError

```js
async function onError (e) {
  console.log('Server error:', e)
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

Copyright (c) 2016-2018 Piotr Roszatycki <piotr.roszatycki@gmail.com>

[MIT](https://opensource.org/licenses/MIT)
