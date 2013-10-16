# mongovi

Cli for MongoDB with vi key bindings.

## Installation

    $ sudo npm install -g mongovi

## Usage examples

open repl:

    $ mongovi -d <database>

print name of current database:

    > db
    foo
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

    > db.drop()
    > 

## API

### db
*  db is a wrapper around [mongodb.Db](http://mongodb.github.io/node-mongodb-native/api-generated/db.html)
  callbacks that show the result are automatically bound if no callback is provided in the shell

### c.collection
*  c.collection is a wrapper around [mongodb.Collection](http://mongodb.github.io/node-mongodb-native/api-generated/collection.html)
  callbacks that show the result are automatically bound if no callback is provided in the shell

### mongodb
* the raw [mongodb](http://mongodb.github.io/node-mongodb-native) object

### ObjectID
* the raw [mongodb.ObjectID](http://mongodb.github.io/node-mongodb-native/api-bson-generated/objectid.html) object

### ~/.mongovi.json
Database access information is read from .mongovi.json in the users home dir if it exists.

    {
      "user":   "joe",
      "pass":   "foo",
      "db":     "baz",
      "authDb": "admin",
      "host":   "127.0.0.1",
      "port":   27017
    }

## License

MIT, see LICENSE
