#!/usr/bin/env node

var rlv = require('readline-vim')
  , repl = require('repl')
  , fs = require('fs')
  , vm = require('vm')
  , mongodb = require('mongodb')
  , nestNamespaces = require('./lib/nest_namespaces');


var prompt = '> ';

function writer(obj) {
  if (obj && typeof obj.toString === 'function') {
    return obj.toString();
  } else {
    return require('util').inspect.apply(null, arguments);
  }
}

function eval(cmd, ctx, file, cb) {
  var err, result;

  var use = cmd.match(/^\s*use (.+)/m);
  if (use && use[1]) { return ctx.chdb(use[1]); }

  var showDbs = cmd.match(/^\s*show dbs/m);
  if (showDbs) { return ctx.listDbs(); }

  showDbs = cmd.match(/^\s*\(dbs/m);
  if (showDbs) { return ctx.listDbs(); }

  var showCollections = cmd.match(/^\s*show collections/m);
  if (showCollections) { return ctx.c.ls(); }

  showCollections = cmd.match(/^\s*\(c\n\)/m);
  if (showCollections) { return ctx.c.ls(); }

  var newCollection = cmd.match(/^\s*\(c\.(.+)\.([^.]+)\(/m);
  if (newCollection && newCollection[1]) {
    if (!ctx.c[newCollection[1]]) {
      ctx.c.add(newCollection[1], ctx.db);
      console.log(newCollection[1], newCollection[2]);
      ctx.c[newCollection[1]][newCollection[2]]();
    }
  }

  try {
    result = vm.runInContext(cmd, ctx, file);
  } catch (e) {
    err = e;
  }
  if (err && process.domain && !isSyntaxError(err)) {
    process.domain.emit('error', err);
    process.domain.exit();
  } else {
    cb(err, result);
  }
}

var r = repl.start({
  prompt: prompt,
  ignoreUndefined: true,
  writer: writer,
  eval: eval
});

// pass the readline component of the repl in order to add vim bindings to it
var vim = rlv(r.rli);

// get config path from environment
var config = {};
var configPath = process.env.HOME + '/.mongovi.json';
if (fs.existsSync(configPath)) {
  config = require(configPath);
}

function logErr(str) {
  console.error(str);
}

function CollectionList(collections) {
  var that = this;
  var nested = nestNamespaces(collections);
  Object.keys(collections).forEach(function(collectionName) {
    that[collectionName] = collections[collectionName];
  });

  // merge nested
  Object.keys(nested).forEach(function(collectionName) {
    if (that[collectionName]) {
      Object.keys(nested[collectionName]).forEach(function(key) {
        that[collectionName][key] = nested[collectionName][key];
      });
    } else {
      that[collectionName] = nested[collectionName];
    }
  });
}

CollectionList.prototype.add = function(name, db) {
  var obj = {};
  obj[name] =  new Collection(db._db.collection(name));
  this[name] = obj[name];

  var that = this;
  var nested = nestNamespaces(obj);
  // merge nested
  Object.keys(nested).forEach(function(collectionName) {
    if (that[collectionName]) {
      Object.keys(nested[collectionName]).forEach(function(key) {
        that[collectionName][key] = nested[collectionName][key];
      });
    } else {
      that[collectionName] = nested[collectionName];
    }
  });
};

CollectionList.prototype.ls = function() {
  var prev;
  Object.keys(this).forEach(function(key) {
    if (prev) { console.log(prev); }
    prev = key;
  });
  if (prev) { console.log(prev); }
  process.stdout.write(prompt);
  return;
};

function Database(config) {
  this._config = config;
  this._config.db = process.argv[2] || 'admin';
  this._config.host = config.host || '127.0.0.1';
  this._config.port = config.port || 27017;

  this._db = new mongodb.Db(this._config.db, new mongodb.Server(this._config.host, this._config.port), { w: 0 });
}

Database.prototype.toString = function() {
  return this._db.databaseName;
};

/**
 * Open up a database connection.
 */
Database.prototype.init = function init(cb) {
  var that = this;
  var config = this._config;
  this._db.open(function(err) {
    if (err) { throw err; }

    if (config.user || config.pass) {
      var authDb = that._db.db(config.authDb || config.db);
      authDb.authenticate(config.user, config.pass, function(err) {
        if (err) { throw err; }
        that.lsCollections(function(err, list) {
          if (err) { return cb(err); }
          cb(null, new CollectionList(list));
        });
      });
    } else {
      that.lsCollections(function(err, list) {
        if (err) { return cb(err); }
        cb(null, new CollectionList(list));
      });
    }
  });
};

Database.prototype.drop = function() {
  this._db.dropDatabase(function(err) {
    if (err) { console.error(err); }
  });
};

Database.prototype.chdb = function chdb(dbName) {
  this.db._db = this.db._db.db(dbName);

  var that = this;
  this.db.lsCollections(function(err, list) {
    if (err) { return console.error(err); }
    var cl = new CollectionList(list);
    that = cl;
  });

  this.db;
  process.stdout.write(prompt);
  return;
};

Database.prototype.ls = function() {
  this._db.admin().listDatabases(function(err, dbs) {
    if (err) { return logErr(err); }
    if (dbs.databases.length) {
      dbs.databases.forEach(function(database) {
        console.log(database.name);
      });
      process.stdout.write(prompt);
    }
  });
};

function Collection(collection) {
  this.collection = collection;
}

Collection.prototype.count = function(selector) {
  this.collection.count(selector, function(err, count) {
    console.log(count);
    process.stdout.write(prompt);
  });
};

Collection.prototype.find = function() {
  function handler(err, items) {
    items.forEach(function(item) {
      console.log(JSON.stringify(item));
    });
    process.stdout.write(prompt);
  }
  this.collection.find.apply(this.collection, arguments).toArray(handler);
};

Collection.prototype.insert = function() {
  var args = Array.prototype.slice.call(arguments);
  if (typeof args[args.length-1] === 'function') {
    var origFn = args[args.length-1];
    args[args.length-1] = function(err, result) {
      if (err) { console.error(err); }
      console.log(result);
      origFn(err, result);
      process.stdout.write(prompt);
    };
  } else {
    args.push(function(err, result) {
      if (err) { console.error(err); }
      console.log(result);
      process.stdout.write(prompt);
    });
  }
  this.collection.insert.apply(this.collection, args);
};

Collection.prototype.update = function() {
  if (typeof arguments[arguments.length-1] === 'function') {
    var origFn = arguments[arguments.length-1];
    arguments[arguments.length-1] = function(err, result) {
      if (err) { console.error(err); }
      console.log(result);
      origFn(err, result);
      process.stdout.write(prompt);
    };
  } else {
    arguments[arguments.length] = function(err, result) {
      if (err) { console.error(err); }
      console.log(result);
      process.stdout.write(prompt);
    };
  }
  this.collection.update.apply(this.collection, arguments);
};

Collection.prototype.drop = function() {
  this.collection.drop(function(err, result) {
    if (err) { console.error(err); }
    console.log(result);
    process.stdout.write(prompt);
  });
};

/**
 * Return a list of collections by collection name.
 *
 * @param {Function} cb  first parameter is an error object. second parameter is
 *   an object containing all collections of the current database by name.
 */
Database.prototype.lsCollections = function lsCollections(cb) {
  var result = {};
  this._db.collections(function(err, collections) {
    if (err) { return cb(err); }
    collections.forEach(function(collection) {
      result[collection.collectionName] = new Collection(collection);
    });
    cb(null, result);
  });
};

var db = new Database(config);

db.init(function(err, cl) {
  if (err) { throw err; }

  var ctx = r.context;

  ctx.db = db;
  ctx.mongdb = mongodb;
  ctx.ObjectID = mongodb.ObjectID;
  ctx.listDbs = db.ls.bind(db);
  ctx.chdb = db.chdb.bind(ctx);
  ctx.c = cl;
});

r.on('exit', function () {
  console.log();
  process.exit();
});
