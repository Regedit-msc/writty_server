const mongoose = require("mongoose");
const redis = require("redis");
const util = require("util");
const client = redis
    .createClient(process.env.REDIS_PORT, process.env.REDIS_HOST)
    .on('error', err => console.error('FUCK', err));
client.auth(process.env.REDIS_PASS);
client.hget = util.promisify(client.hget);
const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function (options = {}) {
    this.useCache = true;
    this.hashKey = JSON.stringify(options.key || 'default');

    return this;
}

mongoose.Query.prototype.exec = async function () {
    if (!this.useCache) {
        return exec.apply(this, arguments);
    }
    const key = JSON.stringify(Object.assign({}, this.getQuery(), {
        collection: this.mongooseCollection.name
    }));
    const cacheValue = await client.hget(this.hashKey, key);
    if (cacheValue) {
        console.log("User from cache", this.hashKey);
        const doc = JSON.parse(cacheValue);
        return Array.isArray(doc) ? doc.map(d => new this.model(d)) : new this.model(doc);
    }

    const result = await exec.apply(this, arguments);
    console.log("Set cache,data from mongo");
    client.hset(this.hashKey, key, JSON.stringify(result));
    return result;
}

module.exports = {
    clearHash(hashKey) {
        console.log("Cleared cache for hash key", hashKey)
        client.del(JSON.stringify(hashKey))
    }
}