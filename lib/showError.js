const { red } = require('chalk');

function showError(err) {
  if (!err) {
    return;
  }

  console.error(`[${red('Error')}] ${err.message}`);
};

/*
 * Exports.
 */
exports.showError = showError;
