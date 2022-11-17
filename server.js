//this file -> connecting to the database
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const app = require('./app');



//DATABASE and Pasword are defined in config.env
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

//deal with deprecation warnings
//connect() returns a promise which we handle using then
mongoose.connect(DB, {
  useNewUrlParser: true,
  userCreateIndex: true,
  useFindAndModify: false
}).then(con => {
  console.log(con.connections);
  console.log('DB connection successful');
} );


//save the tour document to the database
//testTour.save().then(doc => {
  //console.log(doc);
//}).catch(err => {
  //console.log('ERROR:', err);
//});


const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
