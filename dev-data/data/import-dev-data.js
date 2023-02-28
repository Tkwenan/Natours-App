const fs = require('fs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Tour = require('./../../models/tourModel');
const User = require('./../../models/userModel');
const Review = require('./../../models/reviewModel');

//need the dotenv package bc we need our environment variables
//to be able to connect to the database again
dotenv.config({ path: './config.env' });

//DATABASE and Pasword are defined in config.env
//connect to the DB again (in addition to server.js) bc it runs
//completely independent of the Express application
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

//READ JSON file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

//Function to actually Import Data Into DB
const importData = async () => {
  try {
    await Tour.create(tours);

    //when we run node ./dev-data/data/import-dev-data.js --import
    //we get a validation error (Please confirm your password) because we're creating a new
    //user without specifying the password confirm property. We solve this by turning off this
    //validation so that all the validation we do in the model is skipped
    //we also remove the password encryption in the model because the users we create already have encrypted
    //passwords
    //we do this by commenting out the password middleware in userModel
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('Data successfully loaded!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

//Delete all the data from DB/Tours collection
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data successfully deleted');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
