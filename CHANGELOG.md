# Changelog

## v5.2.5 2019-10-08

- Use `mocha-steps` for testing.

## v5.2.4 2019-19-07

- Updated dependencies.

## v5.2.3 2019-07-15

- Updated dependencies.

## v5.2.2 2019-06-04

- Minor tweaks in README.
- Added source map to the package.
- Uses dirty-chai for tests.

## v5.2.1 2019-05-10

- Updated dependencies.

## v5.2.0 2019-01-28

- `onData` method's first argument is an `SMTPServerDataStream` interface.

## v5.1.2 2019-01-08

- Use null-writable as productional dependency.

## v5.1.1 2019-01-08

- Uses smtp-server@3.5.0

## v5.1.0 2018-09-19

- `onData` method is resolved when `stream` is finished. It is rejected if the
  `stream` is already finished.

## v5.0.0 2018-09-17

- Callback handler are replaced with protected methods that should be overriden
  in own subclass.
- `onData` handler consumes the stream after error.

## v4.1.0 2018-09-10

- New method `destroy`.

## v4.0.0 2018-09-09

- Rewritten in Typescript.
- Requires Node >= 6
- Changed syntax for import.

## v3.3.2 2018-03-09

- Typescript: use @types/nodemailer@4.6.0.

## v3.3.1 2018-02-13

- Typescript: back to `TlsOptions` type.

## v3.3.0 2018-02-13

- Accept `0` as a port number.

## v3.2.0 2018-02-13

- Typescript: `host`, `port` and `backlog` are part of
  `SMTPServerAsPromisedOptions`.

## v3.1.1 2018-02-13

- Typescript: `updateSecureOption` with `TlsServerOptions` type as an
  argument.

## v3.1.0 2018-02-09

- Clean up listeners after `close`.
- Typescript: support `import foo from 'foo'` syntax.

## v3.0.0 2018-01-25

- Removed `usePromiseReadable` option. `onData` handler gives `Readable`
  stream always.

## v2.0.4 2017-10-24

- Typescript: typings from DefinitelyTyped.

## v2.0.3 2017-10-20

- Typescript: onData stream is Readable.
- Typescript: use @types/nodemailer@4.1.0.

## v2.0.2 2017-10-09

- Do not publish typings for `nodemailer`.

## v2.0.1 2017-10-06

- Do not use UMD import internally.

## v2.0.0 2017-10-06

- Use native `Promise` rather than `any-event`.

## v1.1.1 2017-10-06

- Typescript: reference additional modules in our typings file.

## v1.1.0 2017-10-06

- smtp-server@3.3.0: new `updateSecureContext` method.
- Typescript: reexport symbols from `smtp-server` and `shared`.

## v1.0.1 2017-10-03

- Correct exports.

## v1.0.0 2017-10-03

- Exports also as a class and namespace and the default.
- Typings for Typescript.
- Based on promise-socket@1.x.x

## v0.1.2 2017-06-22

- Upgraded chai-as-promised@7.0.0, promise-readable@0.4.3, tap@10.5.1,
  tap-given@0.4.1

## v0.1.1 2017-04-10

- Node >= 5 is required

## v0.1.0 2017-04-10

- Use the lastest `smtp-server` module on MIT license
- `new Buffer()` is obsoleted.

## v0.0.1 2017-03-16

- Initial release
