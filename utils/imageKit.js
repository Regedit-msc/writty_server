var ImageKit = require("imagekit");
var imagekit = new ImageKit({
    publicKey: `${process.env.PUBLIC_KEY}`,
    privateKey: `${process.env.PRIVATE_KEY}`,
    urlEndpoint: `${process.env.PUBLIC_URL}`
});
module.exports = { imagekit };