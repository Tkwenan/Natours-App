const mongoose = require('mongoose');
//schema for our tours
const tourSchema = new mongoose.Schema({
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true
    },
  
    rating: {
      type: Number,
      default: 4.5
    },
  
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
  });
  
  //create model out of schema
  const Tour = mongoose.model('Tour', tourSchema);

  module.exports = Tour;
  //creating a document out of a model
//document is an instance of the model
//so it has acces to methods
//const testTour = new Tour({
  //  name: 'The Forest Hiker',
    //rating: 4.7,
    //price: 497
  //});