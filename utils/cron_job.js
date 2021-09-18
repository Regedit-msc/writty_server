const nodeCron = require("node-cron");
const User = require("../models/User");
const { MongoModel, mongodb } = require("../mongo");
const userModel = new MongoModel('users');

async function todo() {

    mongodb.connection({ URI: process.env.SEARCH_DB, DB: 'search' }, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }).then(() => {
        userModel.collection.createIndex({ username: 1 })
        User.find({}).then(async (users) => {
            for (const user of users) {
                await userModel.collection.replaceOne({ _id: user._id }, { _id: user._id, email: user.email, profileImageUrl: user.profileImageUrl, username: user.username }, { upsert: true });
            }
        })
            .then(() => {
                userModel.close;
                console.log("Done updating users");
            })
            .catch((e) => {
            console.log(e);
        });

    });


}
const job = nodeCron.schedule("0 */3 * * *", todo);

module.exports = { job, todo, userModel }