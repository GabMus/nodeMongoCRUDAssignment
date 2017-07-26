#!/usr/bin/env node

// parse(['-c', '-C', '-g', '-r', '-R'???, '-f', '-d', '-D', '-u'])
const argv = require('yargs').argv['_'];
const calledCommand = require('yargs').argv['$0'];
const MongoClient = require('mongodb').MongoClient,
    assert = require('assert');

const usage = () => {
    console.log(
        `
Usage: ${calledCommand} <mongodb_address|"local"> <command> [arguments]

Use "local" instead of the mongodb address to access a localhost server on port 27017

Commands:
  {create, c} <collection_name> "<entry_JSON>"\n\tCreate a new entry in a collection from a JSON string\n
  {getcollections, g}\n\tGet all available collections\n
  {read, r} <collection_name>\n\tRead all the entries for a collection\n
  {find, f} <collection_name> "<find_params_JSON>"\n\tGet an entry from a collection matching the find parameters\n
  {update, u} <collection_name> "<find_params_JSON>" "<new_data_JSON>"\n\tUpdate an entry from a collection matching the find parameters with new data\n
  {delete, d} <collection_name> "<find_params_JSON>"\n\tDelete an entry from a collection matching the find parameters\n
        `
    );
}

class MongoManager {
    constructor(mongoaddress) {
        this.mongoaddress = mongoaddress;
    }

    _doOperation(operation, ...args) {
        MongoClient.connect(this.mongoaddress, (err, db) => {
            assert.equal(null, err);
            console.log(
                "Connected successfully to server\n"
            );

            operation(db, () => {
                console.log("\nOperation completed");
                db.close();
                console.log("Database connection closed");
            }, ...args);
        });
    }

    createEntry(collectionName, entryJson) {
        this._doOperation(
            (db, cb) => {
                let newEntry = JSON.parse(entryJson);
                db.collection(collectionName)
                    .insertOne(
                        newEntry,
                        (err, r) => {
                            console.log(`Entry ${JSON.stringify(entryJson)} created in collection ${collectionName}`);
                            cb();
                        }
                    );
            },
            collectionName,
            entryJson
        );
    }

    getCollections() {
        this._doOperation(
            (db, cb) => {
                db.collections((err, collections) => {
                    assert.equal(null, err);
                    console.log('Collections:');
                    collections.map((item) => {
                        console.log(`  ${item.s.name}`);
                    });
                    cb()
                });
            }
        )
    }

    readEntries(collectionName) {
        return this.findEntry(collectionName, '{}');
    }

    findEntry(collectionName, findArgs, print=true) {
        findArgs = JSON.parse(findArgs);
        this._doOperation(
            (db, cb) => {
                let col = db.collection(collectionName);
                col.find(findArgs).toArray((err, entries) => {
                    assert.equal(null, err);
                    if (entries.length == 0) {
                        console.log(`No results in ${collectionName}`);
                        cb();
                        return [];
                    }
                    else {
                        if (print) {
                            console.log(`${collectionName} found entries:`);
                            console.log(entries);
                        }
                        cb();
                        return entries;
                    }
                });
            }
        );
    }

    deleteEntry(collectionName, findArgs) {
        findArgs = JSON.parse(findArgs);
        this._doOperation(
            (db, cb) => {
                let col = db.collection(collectionName);
                col.deleteOne(findArgs, (err, r) => {
                    assert.equal(null, err);
                    assert.equal(1, r.deletedCount);
                    console.log(`Entry matching ${JSON.stringify(findArgs)} deleted in ${JSON.stringify(collectionName)}`);
                    cb();
                });
            }
        );
    }

    updateEntry(collectionName, findArgs, newData) {
        findArgs = JSON.parse(findArgs);
        newData = JSON.parse(newData);
        this._doOperation(
            (db, cb) => {
                let col = db.collection(collectionName);
                col.updateOne(findArgs, {$set: newData}, (err, r) => {
                    assert.equal(null, err);
                    assert.equal(1, r.matchedCount);
                    assert.equal(1, r.modifiedCount);
                    console.log(`Updated entry matching ${JSON.stringify(findArgs)} as ${JSON.stringify(newData)} in ${collectionName}`);
                    cb();
                });
            }
        );
    }

}

if (argv.length < 2) {
    usage();
}
else {
    if (argv[0] == 'local') {
        argv[0] = 'mongodb://127.0.0.1:27017';
    }
    let m = new MongoManager(argv[0]);
    switch (argv[1]) {
        case 'create':
        case 'c':
            if (!(argv[2] && argv[3])) {
                usage();
            }
            else {
                m.createEntry(argv[2], argv[3]);
            }
            break;
        case 'getcollections':
        case 'g':
            m.getCollections();
            break;
        case 'read':
        case 'r':
            if (!argv[2]) {
                usage();
            }
            else {
                m.readEntries(argv[2]);
            }
            break;
        case 'find':
        case 'f':
            if (!(argv[2] && argv[3])) {
                usage();
            }
            else {
                m.findEntry(argv[2], argv[3]);
            }
            break;
        case 'update':
        case 'u':
            if (!(argv[2] && argv[3] && argv[4])) {
                usage();
            }
            else {
                m.updateEntry(argv[2], argv[3], argv[4]);
            }
            break;
        case 'd':
        case 'delete':
            if (!(argv[2] && argv[3])) {
                usage();
            }
            else {
                m.deleteEntry(argv[2], argv[3]);
            }
            break;
        default:
            usage();
    }
}
