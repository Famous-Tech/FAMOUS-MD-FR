const { MongoClient } = require('mongodb');
const { Database } = require('quick.db');
const config = require('../../config');

let db = null;
let mongoDB = null;
let session = null;

async function QuickDatabase() {
    try {
        const mongo = config.MONGODB_URL;
        if (!mongo) {
            console.log('MongoDB URL is required');
            return;
        }

        mongoDB = new MongoClient(mongo, { useNewUrlParser: true, useUnifiedTopology: true });
        await mongoDB.connect();
        console.log('Connected to Database');
        session = mongoDB.startSession();
        db = new Database(mongoDB, { session });

        return db;
    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    QuickDatabase,
    db: () => db,
    mongoDB: () => mongoDB,
    session: () => session
};
