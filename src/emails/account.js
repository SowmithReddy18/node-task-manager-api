const sgMail = require('@sendgrid/mail');

const apiKey = process.env.SENDGRID_API_KEY;

sgMail.setApiKey(apiKey);


const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'sowmithreddy18@gmail.com',
        subject: 'Hi From Task Manager App',
        text: `Hey ${name},
        Welcome to The Task Managment App.
        We are looking forward to provide you with the best of our service.
        Thank You for Chosing Us :)`
    })
}

const sendGoodbyeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'sowmithreddy18@gmail.com',
        subject: 'Test Mail',
        text: `Hey ${name},
        Sorry to see you leave :(
        Let us know if there was anything you did not like or would want us to improve to win your heart back.`
    })
}

module.exports = { sendWelcomeEmail, sendGoodbyeEmail }