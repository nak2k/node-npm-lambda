const waterfall = require('run-waterfall');
const path = require('path');
const { createWriteStream } = require('fs');
const concat = require('concat-stream');
const parallel = require('run-parallel');
const AWS = require('aws-sdk');
const readJson = require('read-json');
const { pack } = require('npm-lambda-pack');

function deploy(options, callback) {
  options.package.startsWith('.')
    ? deployLocal(options, callback)
    : deployFromNpm(options, callback);
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

  waterfall([
    /*
     * Read package.json.
     */
    readJson.bind(null, path.join(pkgDir, 'package.json')),

    /*
     * Pack deps
     */
    (pkgJson, callback) =>
      pack({
        pkgJson,
        pkgDir,
        cacheBaseDir,
        exclude,
      }, callback),

    /*
     * Update the lambda function.
     */
    ({ zip }, callback) =>
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

function deployFromNpm(options, callback) {
  callback(new Error('Not supported yet. The package option should be start with ".".'));
}

/*
 * Exports.
 */
exports.deploy = deploy;
