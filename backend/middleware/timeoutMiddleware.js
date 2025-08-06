// File: middlewares/timeoutMiddleware.js (Buat file baru)
const timeout = require('connect-timeout');

module.exports = (time = '15s') => {
  return [timeout(time), (req, res, next) => {
    if (!req.timedout) next();
  }];
};