# @exodus/fetch

A small wrapper around global fetch and `node-fetch`:

1. In React Native, global `fetch` is used without importing `node-fetch`

2. In Browser, global `fetch` is used without importing `node-fetch`

3. Otherwise `node-fetch` is imported, but when `window.fetch` is present (e.g. in Electron
   `renderer` process), it is used.

4. Otherwise (e.g. in Electron `browser` process and Node.js), `node-fetch` is used.
