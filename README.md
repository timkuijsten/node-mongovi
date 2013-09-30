# mongovi

Cli for MongoDB with vi key bindings.

## Installation

    $ npm install -g mongovi

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

drop current database:

    > db.dropDb()
    > 

## License

MIT, see LICENSE
