# mongovi

Mongovi is a small REPL for MongoDB that relies on [node-mongodb-native](http://mongodb.github.io/node-mongodb-native/) for MongoDB support and [readline-vim](https://github.com/thlorenz/readline-vim#vim-bindings) for it's vi key bindings. That means that most [mongodb.Db](http://mongodb.github.io/node-mongodb-native/api-generated/db.html) and [mongodb.Collection](http://mongodb.github.io/node-mongodb-native/api-generated/collection.html) methods are supported.

## Installation

    $ sudo npm install -g mongovi

## Usage examples

open shell for database `bar`:

    $ mongovi -d bar

print names of all databases:

    > show dbs
    foo
    bar
    > 

print name of current database:

    > db
    bar
    > 

switch to another database:

    > use foo
    foo 2 collections
    > 

list collections in current database:

    > c
    bar
    baz
    > 

list contents of collection baz:

    > c.baz.find();
    {"_id":"52378623870dd40000000001", "foo": "bar" }
    {"_id":"52378623870dd40000000002", "foo": "baz" }
    > 

update item in collection baz:

    > c.baz.update({ _id: new ObjectID('52378623870dd40000000001') }, { foo: 'quux' });
    > 

insert item into collection baz:

    > c.baz.insert({ foo: 'qux' });
    > 

drop collection baz:

    > c.baz.drop()
    > 

drop current database:

    > db.dropDatabase()
    > 

## Configuration file
Database access information is read from .mongovi.json in the users home directory if it exists.

    {
      "user":   "joe",
      "pass":   "foo",
      "db":     "bar",
      "authDb": "admin",
      "host":   "127.0.0.1",
      "port":   27017
    }

## Command-line options
Show all command-line options with `mongovi --help`. These options override any config file setting.

    Usage: mongovi [options]

    Options:

      -h, --help            output usage information
      -V, --version         output the version number
      -d, --db <database>   database, default admin
      -u, --user <user>     username
      -h, --host <address>  hostname, default 127.0.0.1
      -p, --port <number>   port, default 27017
      -v, --verbose         show debugging information

## API

### db
*  db is a wrapper around [mongodb.Db](http://mongodb.github.io/node-mongodb-native/api-generated/db.html).
  If no callback is provided the results are automatically printed.

### c.collection
*  c.collection is a wrapper around [mongodb.Collection](http://mongodb.github.io/node-mongodb-native/api-generated/collection.html)
  If no callback is provided the results are automatically printed.

### ObjectID
* the raw [mongodb.ObjectID](http://mongodb.github.io/node-mongodb-native/api-bson-generated/objectid.html) object

## License

MIT, see LICENSE
