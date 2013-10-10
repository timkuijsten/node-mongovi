# mongovi

Cli for MongoDB with vi key bindings.

## Installation

    $ sudo npm install -g mongovi

## Usage examples

open repl:

    $ mongovi

list databases:

    > dbs
    foo
    bar
    > 

change to database foo:

    > use foo
    foo
    > 

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

### mongodb
* the raw [mongodb](http://mongodb.github.io/node-mongodb-native) object

### ObjectID
* the raw [mongodb.ObjectID](http://mongodb.github.io/node-mongodb-native/api-bson-generated/objectid.html) object

## License

MIT, see LICENSE
