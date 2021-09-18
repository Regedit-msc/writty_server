var MongoClient = require('mongodb').MongoClient;
class MongoDB {
    async connection(connection, options = {}) {
        try {
            const client = await MongoClient.connect(connection.URI, options);
            const db = client.db(connection.DB);
            MongoDB.db = db;
            MongoDB.client = client;
            console.log("Connected to search db");
        } catch (ex) {
            console.log(ex.message);
        }
    }
}

class MongoModel extends MongoDB {
    constructor(collectionName) {
        super();
        this.collectionName = collectionName;
    }

    get collection() {
        return MongoModel.db.collection(this.collectionName)
    }
    set close() {
        MongoModel.db.close();
    }
}


const mongodb = new MongoDB();




module.exports = { MongoModel, mongodb }


// const somethingModel = new MongoModel('something');
// // an example another collection
// const anotherModel = new MongoModel('anotherCollection');

// // model find
// async function findSomething() {
//     try {
//         const result = await somethingModel.collection.find({}).toArray();

//         return result;
//     } catch (ex) {
//         console.log(ex.message);
//     }
// }

// // model create
// async function createSomething(payload) {
//     try {
//         const result = await somethingModel.collection.insert(payload);
//         return result.ops[0];
//     } catch (ex) {
//         console.log(ex.message);
//     }
// }