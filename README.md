## smtp-server-as-promised

[![Build Status](https://secure.travis-ci.org/dex4er/js-smtp-server-as-promised.svg)](http://travis-ci.org/dex4er/js-smtp-server-as-promised) [![Coverage Status](https://coveralls.io/repos/github/dex4er/js-smtp-server-as-promised/badge.svg)](https://coveralls.io/github/dex4er/js-smtp-server-as-promised) [![npm](https://img.shields.io/npm/v/smtp-server-as-promised.svg)](https://www.npmjs.com/package/smtp-server-as-promised)

This module provides promisified version of [`smtp-server-mit`](https://www.npmjs.com/package/smtp-server-mit) module. The
API is the same as for `smtp-server-mit`, except `listen` method which return
[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
object and callback options which are `Promise` objects.

Additionally, `stream` argument for `onData` promise is changed to
[`PromiseReadable`](https://www.npmjs.com/package/promise-readable) object if
`options.usePromiseReadable` is `true`.

### Requirements

This module requires Node >= 6.

### Installation

```shell
npm install smtp-server-as-promised
```

### Usage

`smtp-server-as-promised` can be used like standard `smtp-server-mit` module:

```js
const {SMTPServerAsPromised} = require('smtp-server-as-promised')
```

#### constructor

```js
const server = new SMTPServerAsPromised(options)
```

Create new SMTPServer instance.

```js
const server = new SMTPServerAsPromised({
  port: 2525,
  usePromiseReadable: true,
  onConnect, onMailFrom, onData, onError
})
```

##### options

The same as for original `smtp-server-mit` constructor, except that callback
options are `Promise` objects or `async` functions:

```js
async function onConnect (session) {
  console.log(`[${session.id}] onConnect`)
}
```

An errors can be thrown and then are handled by server in response message:

```js
async function onMailFrom (from, session) {
  console.log(`[${session.id}] onMailFrom ${from.address}`)
  if (from.address.split('@')[1] === 'spammer.com') {
    throw new Error('we do not like spam!')
  }
}

async function onRcptTo (to, session) {
  console.log(`[${session.id}] onRcptTo ${to.address}`)
  if (from.address.split('@')[1] === 'spammer.com') {
    throw new Error('we do not like spam!')
  }
}
```

Callback option `onData` provides `stream` object as an instance of
[`PromiseReadable`](https://www.npmjs.com/package/promise-readable) class if
`options.usePromiseReadable` options is `true`:

```js
const server = new SMTPServerAsPromised({usePromiseReadable: true, onData})

async function onData (stream, session) {
  console.log(`[${session.id}] onData started`)
  session.messageLength = 0

  for (let chunk; (chunk = await stream.read()) !== null;) {
    console.log(`[${session.id}] onData got data chunk ${chunk.length} bytes`)
    session.messageLength += chunk.length
  }

  console.log(`[${session.id}] onData finished after reading ${session.messageLength} bytes`)
}
```

`stream` object is a standard
[`stream.Readable`](https://nodejs.org/api/stream.html#stream_class_stream_readable)
object if `options.usePromiseReadable` is `false`.

Error can be handled with `onError` callback options:

```js
async function onError (e) {
  console.log('Server error:', e)
}
```

#### listen

```js
const promise = server.listen(port[,host][,backlog])
```

Start the server instance. This method returns promise which returns `address`
as its value.

_Example_

```js
async function main () {
  const address = await server.listen(2525)
  console.log(`Listening on [${address.address}]:${address.port}`)
}
```

#### close

```js
const promise = server.close()
```

Stop the server from accepting new connections.

_Example_

```js
async function main () {
  // ...
  await server.close()
  console.log(`Server was stopped`)
}
```

### Promise

This module uses [any-promise](https://www.npmjs.com/package/any-promise) and
any ES6 Promise library or polyfill is supported.

Ie. [bluebird](https://www.npmjs.com/package/bluebird) can be used as Promise
library for this module, if it is registered before.

```js
require('any-promise/register/bluebird')
const {SMTPServerAsPromised} = require('smtp-server-as-promised')
```

### License

Copyright (c) 2016-2017 Piotr Roszatycki <piotr.roszatycki@gmail.com>

[MIT](https://opensource.org/licenses/MIT)
