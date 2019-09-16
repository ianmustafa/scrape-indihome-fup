const format = require('date-fns/format');
const chalk = require('chalk');

module.exports = {
  timeout: (min) => min * 60 * 1000,
  log: (message, color = 'cyan') => {
    console.log(
      chalk.gray(`[${format(Date.now(), 'YYYY-MM-DD HH:mm:ss')}] `) +
      chalk[color](message)
    );
  },
  fail: (message, color = 'redBright') => {
    log(`${chalk.bold('[FAIL]')} ${message}`, color);
  }
}
