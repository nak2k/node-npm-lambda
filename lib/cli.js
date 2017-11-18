const yargs = require('yargs');

function main() {
  const parser = yargs
    .commandDir('cmds')
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
    .completion()
    .version()
    .help();

  parser.argv;
}

main();
