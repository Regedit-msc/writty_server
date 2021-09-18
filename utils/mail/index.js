const nodemailer = require("nodemailer");
const NAMES = require("../names");

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT),
    auth: {
        user: process.env.MAIL_ADDRESS,
        pass: process.env.MAIL_PASSWORD
    }
})


function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min);
}

module.exports = {
    sendRegistrationMail: (userName, emailAddress, otp) => {
        transporter.sendMail({
            from: `${NAMES[getRandomIntInclusive(0, NAMES.length - 1)]} <${process.env.MAIL_ADDRESS}>`,
            to: emailAddress,
            subject: "VERIFY YOUR ACCOUNT",
            html: `<code> Hi there ${userName}😁. This is your otp ${otp} . It expires in (2) minutes.</code>`
        }).then(console.info).catch(console.error);
    }
}