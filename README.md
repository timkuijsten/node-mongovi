# mongovi

Mongovi is a small REPL for MongoDB with vi key bindings. See the [list of supported methods](http://mongodb.github.io/node-mongodb-native/genindex.html) by [node-mongodb-native](http://mongodb.github.io/node-mongodb-native/). And the [list of supported vi key bindings](https://github.com/thlorenz/readline-vim#vim-bindings) by [readline-vim](https://github.com/thlorenz/readline-vim).

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

list contents of collection baz with a callback:

    > c.baz.find().toArray(function(err, items) { console.log(err, items.length); });
    > null 2

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

### use foo
switch to a database named foo

### show dbs
show the list of databases, comparable with:


    db.admin().listDatabases(function(err, dbs) {
      console.log(dbs);
    });

### c
show the list of collections in the current database, comparable with:


    db.collectionNames(function(err, collections) {
      console.log(collections);
    });

### show collections
alias for `c`

### db
print the name of the database currently selected

### db.foo
* where foo is a method supported by [mongodb.Db](http://mongodb.github.io/node-mongodb-native/api-generated/db.html).
  If no callback is provided on any of these methods the results are automatically printed.

### c.foo.bar
* where foo is the name of a collection in the current database.
* where bar is a method supported by [mongodb.Collection](http://mongodb.github.io/node-mongodb-native/api-generated/collection.html).
  If no callback is provided on any of these methods the results are automatically printed.

### c.foo.find
`c.foo.find()` is a shortcut for:


    c.foo.find().toArray(function(err, items) {
      items.forEach(function(item) {
        console.log(JSON.stringify(item));
      });
    });

### mongodb
the raw [mongodb](http://mongodb.github.io/node-mongodb-native/genindex.html) object

### ObjectID
alias for [mongodb.ObjectID](http://mongodb.github.io/node-mongodb-native/api-bson-generated/objectid.html)

### Timestamp
alias for [mongodb.Timestamp](http://mongodb.github.io/node-mongodb-native/api-bson-generated/timestamp.html)

## License

MIT, see LICENSE
