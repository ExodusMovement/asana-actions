'use strict'

// This file is structured this way to allow webpack to optimize out
// the require calls based on hardcoded process.type per bundle.
// Do not refactor or deduplicate.

// Try to use global browser APIs (e.g. if in Electron), otherwise require impls
if (typeof process !== 'undefined' && process) {
  // Node.js or Electron with Node.js integration
  if (process.type === 'renderer' || process.type === 'worker') {
    // Electron renderer with Node.js integration
    module.exports = { fetch, WebSocket }
  } else {
    // Node.js or Electron browser process
    module.exports = {
      fetch: require('node-fetch'),
      WebSocket: require('ws'),
    }
  }
} else {
  // Browser or Electron without Node.js integration
  module.exports = { fetch, WebSocket }
}
