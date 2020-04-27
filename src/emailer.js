const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const sender = 'katukalp@gmail.com';

const sendWelcomeMail = (email, name) => {
    return sgMail.send({
        to: email,
        from: sender,
        subject: 'Welcome to the Task App',
        text: `Welcome to the Task App, ${name}. You have successfully registered.`
    });
};

const sendRemovalMail = (email, name) => {
    return sgMail.send({
        to: email,
        from: sender,
        subject: 'Goodbye',
        text: `Sad to see you go ${name}.`
    });
};

module.exports = { sendWelcomeMail, sendRemovalMail };
