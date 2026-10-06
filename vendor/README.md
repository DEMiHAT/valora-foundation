# Offline QR dependency

The network in the development environment was unavailable. The MIT-licensed QR encoder and SVG renderer from `qrcode` 1.5.1 are vendored here, along with its `dijkstrajs` and `encode-utf8` dependencies. Two import paths point at the vendored dependencies. This generates real QR codes on the server without sending identifiers to an external QR service.

Source: https://github.com/soldair/node-qrcode

Nodemailer 8.0.4 (MIT-0) and its TypeScript definitions are also vendored from existing installed dependencies because the registry is unreachable. `package.json` uses local package dependencies, so clean deployments install reproducibly without relying on this machine's node_modules.
