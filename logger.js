const winston = require('winston')

module.exports = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({name: 'error-log', filename: 'error.log', level: 'error' }),
      new (winston.transports.File)({name: 'info-log', filename: 'info.log', level: 'info' }),
    ]
  });