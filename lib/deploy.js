const { packDeps } = require('pack-deps');
const packlist = require('npm-packlist');
const waterfall = require('run-waterfall');
const path = require('path');
const { readFile, stat, createWriteStream } = require('fs');
const concat = require('concat-stream');
const parallel = require('run-parallel');
const AWS = require('aws-sdk');
const awsConfigLoader = require('aws-sdk-config-loader');

function deploy(options, callback) {
  options.package.startsWith('.')
    ? deployLocal(options, callback)
    : deployNpm(options, callback);
}

function deployLocal(options, callback) {
  const {
    package: pkgDir,
    functionName,
    cacheBaseDir,
    profile,
    exclude,
    verbose,
    dryRun,
  } = options;

  const verboseTask = verbose
    ? fn => (v, callback) => (fn(v), callback(null, v))
      : fn => (v, callback) => callback(null, v);

  waterfall([
    /*
     * Read package.json.
     */
    callback => readFile(path.join(pkgDir, 'package.json'), 'utf8', callback),

    (data, callback) => {
      try {
        callback(null, JSON.parse(data));
      } catch (err) {
        callback(err);
      }
    },

    /*
     * Pack deps
     */
    (pkgJson, callback) =>
      packDeps({
        pkgJson,
        pkgDir,
        production: true,
        cacheBaseDir,
        compression: 'DEFLATE',
        compressionOptions: {
          level: 9,
        },
        exclude,
      }, callback),

    verboseTask(({ cacheFile, zip }) => {
      console.error(`Cache file: ${cacheFile}`);
    }),

    /*
     * Find files to add into the zip. 
     */
    ({ zip }, callback) =>
      packlist({ path: pkgDir })
        .then(files => callback(null, { zip, files }))
        .catch(err => callback(err)),

    /*
     * Add the files into the zip. 
     */
    ({ zip, files }, callback) =>
      parallel(
        files.map(f => addFileIntoZip.bind(null, zip, f)),
        (err, result) => callback(err, zip)),

    /*
     * Update the lambda function.
     */
    (zip, callback) =>
      zip.generateAsync({
        type: 'nodebuffer',
        platform: process.platform,
        compression: 'DEFLATE',
        compressionOptions: {
          level: 9,
        },
      }).then(data => {
        if (verbose) {
          console.error(`Update function '${functionName}'`);
        }

        awsConfigLoader(AWS, { profile });

        const lambda = new AWS.Lambda();

        const params = {
          FunctionName: functionName,
          ZipFile: data,
          DryRun: dryRun,
        };

        lambda.updateFunctionCode(params, (err, data) => {
          if (err) {
            return callback(err);
          }

          callback(null, zip);
        });
      }).catch(err => callback(err)),

    /*
     * Write the zip.
     */
    (zip, callback) =>
      zip.generateNodeStream({
        streamFiles: true,
        compression: 'DEFLATE',
        compressionOptions: {
          level: 9,
        },
      })
        .pipe(createWriteStream(path.join(pkgDir, 'lambda.zip')))
        .on('close', () => callback(null))
        .on('error', callback),
  ], callback);
}

function addFileIntoZip(zip, file, callback) {
  stat(file, (err, stats) => {
    if (err) {
      return callback(err);
    }

    readFile(file, (err, data) => {
      if (err) {
        return callback(err);
      }

      zip.file(file, data, {
        mode: stats.mode,
        date: new Date(stats.mtime),
        compression: 'DEFLATE',
        compressionOptions: {
          level: 9,
        },
      });

      callback(null);
    });
  });
}

function deployFromNpm(options, callback) {
  callback(new Error('Not supported yet. The package option should be start with ".".'));
}

/*
 * Exports.
 */
exports.deploy = deploy;
