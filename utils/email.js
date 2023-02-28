const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

//new Email(user, url).sendWelcome();
module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;

    //we define the email address as a configuration/environment variable
    //that can be changed in the config.env file
    //this.from = 'Tracy Kwena <hello@gmail.com>'
    this.from = `Tracy Kwena <${process.env.EMAIL_FROM}>`;
  }

  //want to send real emails when we're in prod
  //and use nodemailer when we're in dev
  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD
        }
      });
    }

    //1)create a transporter i.e. the service that will create the email
    //e.g. gmail
    return nodemailer.createTransport({
      //service: 'Gmail',
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        //saved in config.env
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  //send the actual mail
  async send(template, subject) {
    //Send the actual email
    // 1) Render the HTML based on a pug template
    //up until this point we've been building the HTML using the Pug templates
    //and then we pass in the pug file into the render function on the response
    //and what render does behind the scenes is it creates the HTML based on the pug template
    //and then send it to the client res.render()
    //but in this case we don't want to render. We only want to create the HTML out of the template
    //so that we can then send that HTML as the email
    //__dirname is the name of location of the currently running script
    const html = pug.renderFile(
      `${__dirname}/../views/email/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject
      }
    );

    //2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html)
      //convert email text to html
      //html:
    };

    // 3) Create a transport and send email
    //this.newTransport();
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)'
    );
  }
};

//const sendEmail = async options => {
//2) Define the email options
// const mailOptions = {
// from: 'Tracy Kwena <hello@gmail.com>',
// to: options.email,
// subject: options.subject,
// text: options.message
//convert email text to html
//html:
//};

//3)Actually send the email
//an async function so it returns a promise
// transporter.sendMail(mailOptions);

//module.exports = sendEmail;
