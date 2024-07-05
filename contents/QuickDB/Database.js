const { Database } = require('quick-db');
const { MongoDatabase } = require('quick-mongo');
const config = require('../../config');

let db = null;
let mongoDB = null;
let session = null;

async function QuickDatabase() {
    try {
     const mongo = config.MONGODB_URL; 
        if (!mongo) {
            console.log('MongoDB URL is required');
        }

        mongoDB = new MongoDatabase(mongo);
         await mongoDB.connect();
         console.log('Connected to Database');
        session = mongoDB.session();
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
  
