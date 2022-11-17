const fs = require('fs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Tour = require('./../../models/tourModel');

//need the dotenv package bc we need our environment variables
//to be able to connect to the database again
dotenv.config({ path: './config.env' });

//DATABASE and Pasword are defined in config.env
//connect to the DB again (in addition to server.js) bc it runs 
//completely independent of the Express application
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


//READ JSON file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours-simple.json`, `utf-8`));

//Function to actually Import Data Into DB
const importData = async() => {
    try {
        await Tour.create(tours);
        console.log('Data successfully loaded!');
        
    } catch (err) {
        console.log(err);
    }
    process.exit();
};

//Delete all the data from DB/Tours collection
const deleteData = async() => {
    try {
        await Tour.deleteMany();
        console.log('Data successfully deleted');
        
    } catch (err) {
        console.log(err);
    }
    process.exit();
};

if(process.argv[2] === '--import'){
    importData()
} else if (process.argv[2] === '--delete'){
    deleteData()
}


console.log(process.argv);