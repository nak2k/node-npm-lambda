const {
  cleanCache,
  cleanAllCaches,
  getCacheBaseDir,
} = require('../cache');
const { showError } = require('../showError');

exports.command = 'cache';

exports.desc =  '';

exports.builder = yargs => {
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
      handler: argv => cleanCache(argv.path, showError),
    })
    .command({
      command: 'all-clean',
      desc: 'Clean all caches',
      builder: yargs => {
      },
      handler: argv => cleanAllCaches(showError),
    })
    .demandCommand();
};
