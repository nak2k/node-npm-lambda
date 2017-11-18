const readJson = require('read-json');
const writeJson = require('write-json');
const { showError } = require('../showError');
const { resolve } = require('path');

exports.command = 'config';

exports.desc = 'Configuration';

exports.builder = yargs =>
  yargs
    .option('function-name', {
      describe: 'Name of Lambda function',
    })
    .option('profile', {
      describe: 'Profile of AWS CLI',
    })
    .option('exclude', {
      describe: 'Pattern to exclude files',
    });

exports.handler = argv => {
  const configPath = resolve('.npm-lambda-json');

  readJson(configPath, (err, json) => {
    if (err) {
      if (err.code !== 'ENOENT') {
        return showError(err);
      }

      json = {};
    }

    const {
      'function-name': functionName,
      profile,
      exclude,
    } = argv;

    /*
     * Show configurations if no options.
     */
    if (functionName === undefined
      && profile === undefined
      && exclude === undefined) {
      if (err) {
        console.error(`Configuration ${configPath} not found.`);

        return;
      }

      console.error(`Configuration ${configPath}:`);
      console.error('');

      console.error(JSON.stringify(json, null, 2));

      return;
    }

    /*
     * Set the function name.
     */
    if (functionName) {
      json['function-name'] = functionName;
    }

    /*
     * Set the profile.
     */
    if (profile) {
      json.profile = profile;
    }

    /*
     * Merge exclude patterns.
     */
    if (exclude) {
      json.exclude = [].concat(json.exclude || [], exclude);
    }

    /*
     * Write to the config file.
     */
    writeJson(configPath, json, null, 2, err => {
      if (err) {
        return showError(err);
      }

      console.error(`Write to ${configPath}:`);
      console.error('');

      console.error(JSON.stringify(json, null, 2));
    });
  });
};
