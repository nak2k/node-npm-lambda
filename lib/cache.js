const trash = require('trash');
const path = require('path');
const os = require('os');
const waterfall = require('run-waterfall');
const { access, readFile } = require('fs');
const { depsThumbprint } = require('pack-deps');

function cleanCache(pkgDir, callback) {
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
     * Get paths of the cache.
     */
    (pkgJson, callback) =>
      callback(null, [
        depsThumbprint({
          pkgJson,
          pkgDir,
          production: false,
        }).thumbprint,
        depsThumbprint({
          pkgJson,
          pkgDir,
          production: true,
        }).thumbprint,
      ].map(f => path.join(getCacheBaseDir(), f))),

    /*
     * Trash.
     */
    ([developmentCache, productionCache], callback) =>
      waterfall([
        trashCache.bind(null, developmentCache),
        trashCache.bind(null, productionCache),
      ], callback),
  ], callback);
}

function trashCache(path, callback) {
  access(path, err => {
    if (err) {
      if (err.code === 'ENOENT') {
        return callback(null);
      }

      return callback(err);
    }

    trash(path)
      .then(() => {
        console.error(`Move ${path} to the trash`);
        callback(null);
      }, callback);
  });
}

function cleanAllCaches(callback) {
  const p = getCacheBaseDir();

  trash(p)
    .then(() => {
      console.error(`Move ${p} to the trash`);
      callback(null);
    }, callback);
}

function getCacheBaseDir() {
  return path.join(os.homedir(), '.npm-lambda/cache');
}

/*
 * Exports.
 */
exports.cleanCache = cleanCache;
exports.cleanAllCaches = cleanAllCaches;
exports.getCacheBaseDir = getCacheBaseDir;
