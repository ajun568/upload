const env = process.env.NODE_ENV
let BASE_CONF

if (env === 'dev') {
  BASE_CONF = {
    host: 'http://localhost',
    port: '3000',
  }
}

module.exports = BASE_CONF
