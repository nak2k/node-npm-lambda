const { deploy } = require('../deploy');
const { showError } = require('../showError');
const readJson = require('read-json');
const {
  getCacheBaseDir,
} = require('../cache');
const { resolve } = require('path');

exports.command = 'deploy <package>';

exports.desc = 'Deploy lambda';

exports.builder = yargs => {
  yargs
    .option('function-name', {
      describe: 'Name of Lambda function',
    })
    .option('profile', {
      describe: 'Profile of AWS CLI',
      default: process.env.AWS_PROFILE || 'default',
    })
    .option('exclude', {
      describe: 'Pattern to exclude files',
    })
    .positional('package', {
      describe: 'Name of deployed package',
    });
};

exports.handler = argv => {
  const configPath = resolve('.npm-lambda-json');

  readJson(configPath, (err, json) => {
    if (err) {
      if (err.code !== 'ENOENT') {
        return showError(err);
      }

      json = {};
    }

    const params = {
      package: argv.package,
      functionName: argv['function-name'] || json['function-name'],
      cacheBaseDir: getCacheBaseDir(),
      profile: argv.profile || json.profile,
      exclude: [].concat(argv.exclude || [], json.exclude || []),
      verbose: argv.verbose,
      dryRun: argv['dry-run'],
    };

    deploy(params, showError);
  });
};
