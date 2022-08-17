const coreFixture = require('./fixtures/core.json')
module.exports = {
  getInput: (value) => coreFixture[value],
  info: (p) => {
    console.log(p)
  },
  error: () => {},
}
