'use strict'

const { fetch, WebSocket } = require('./core')

const fetchival = require('fetchival')
if (!fetchival.fetch) fetchival.fetch = fetch

module.exports = { fetch, WebSocket, fetchival }
