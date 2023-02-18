//this file -> connecting to the database
const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

//DATABASE and Pasword are defined in config.env
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

//deal with deprecation warnings
//connect() returns a promise which we handle using then
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    userCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => console.log('DB connection successful'));

//save the tour document to the database
//testTour.save().then(doc => {
//console.log(doc);
//}).catch(err => {
//console.log('ERROR:', err);
//});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM RECEIVED. Shutting down gracefully...');

  //graceful shutdown -> basically close the server
  //handles pending requests before closing the server
  server.close(() => {
    console.log('Process terminated!');

    //no need for shutting it down manually using process.exit() because the
    //sigterm does it itself
    //process.exit(1);
  });
});
