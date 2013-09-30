# mongovi

Cli for MongoDB with vi key bindings.

## Installation

    $ sudo npm install -g mongovi

## Usage examples

open repl:

    $ mongovi

list databases:

    > dbs();
    foo
    bar
    > 

change to database foo:

    > chdb('foo')
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

drop current database:

    > db.dropDb()
    > 

## License

MIT, see LICENSE
