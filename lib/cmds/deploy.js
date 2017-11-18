const { deploy } = require('../deploy');
const { showError } = require('../showError');

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

exports.handler = argv => deploy({
  ...argv,
  functionName: argv['function-name'],
  cacheBaseDir: getCacheBaseDir(),
}, showError);
