const yargs = require('yargs');
const { deploy } = require('./deploy');
const { red } = require('chalk');
const {
  cleanCache,
  cleanAllCaches,
  getCacheBaseDir,
} = require('./cache');

function main(callback) {
  const parser = yargs
    .command({
      command: 'deploy <package>',
      desc: 'Deploy lambda',
      builder: yargs => {
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
      },
      handler: argv => deploy({
        ...argv,
        functionName: argv['function-name'],
        cacheBaseDir: getCacheBaseDir(),
      }, callback),
    })
    .command({
      command: 'cache',
      desc: '',
      builder: yargs => {
        yargs
          .command({
            command: 'clean [path]',
            desc: 'Clean a cache',
            builder: yargs => {
              yargs
                .positional('path', {
                  describe: 'Path of a package to remove cache',
                  default: '.',
                });
            },
            handler: argv => cleanCache(argv.path, callback),
          })
          .command({
            command: 'all-clean',
            desc: 'Clean all caches',
            builder: yargs => {
            },
            handler: argv => cleanAllCaches(callback),
          })
          .demandCommand();
      },
    })
    .demandCommand()
    .options({
      'dry-run': {
        alias: 'n',
        describe: 'Dry-run mode',
        type: 'boolean',
      },
      verbose: {
        alias: 'v',
        describe: 'Verbose mode',
        type: 'boolean',
      },
    })
    .version()
    .help();

  parser.argv;
}

main(err => {
  if (!err) {
    return;
  }

  console.error(`[${red('Error')}] ${err.message}`);
});
