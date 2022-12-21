const mongoose = require('mongoose');
const slugify = require('slugify');
//const User = require('./userModel');
//const validator = require('validator');

//schema for our tours
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal then 40 characters'],
      minlength: [10, 'A tour name must have more or equal then 10 characters']
      //validator is an object with methods
      // validate: [validator.isAlpha, 'Tour name must only contain characters']
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    //how many people can partake in a tour at the same time
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },

    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult'
      }
    },

    //we'll have a resource called ratings
    //not giving them a required value because it's
    //not the user who creates the tours that specifies the values
    //these are calculated
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0']
    },

    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    //custom validator
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          // this only points to current doc on NEW document creation
          //val is the discount provided by the user
          return val < this.price;
        },

        //message also has access to the value provided by the user
        //this is a feature of mongoose and not JS
        //its the same as val above
        message: 'Discount price ({VALUE}) should be below the regular price'
      }
    },

    summary: {
      type: String,
      trim: true, //remove whitespace
      required: [true, 'A tour must have a summary']
    },

    description: {
      type: String,
      trim: true //remove whitespace
    },

    //images on the overview
    //the type is String bc we just store the name of the
    //image which we'll then be able to read from the file system
    //common practice to store just the name of the image i.e. a reference
    //as opposed to the actual image
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },

    //the rest of the images
    //array of strings
    images: [String],

    //time stamp added automatically
    //Date built in JS type
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },

    //array of dates
    //different dates at which tours start
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      //we expect an array of numbers with the coordinates of the Point
      //longitude, latitude
      coordinates: [Number],
      address: String,
      description: String
    },

    //always need to use an array to create embedded documents
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number //day when people will be going to this location for the tour
      }
    ],
    guides: [
      {
        //we expect the types of each of elements in the guides array
        //to be a MongoDB ID
        type: mongoose.Schema.ObjectId,
        ref: 'User' //this is how we establish references
      }
    ]
  },
  {
    //specify that you want the virtual properties in the output every time the data is output as JSON
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

//we use a regular function as opposed to an arrow funcyion because
//arrow functions don't get their own 'this' keyword
//this here points to the current document
//so usually in mongoose we use the regular functions
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

//virtual populate
//pass in 'reviews' and an array of objects
tourSchema.virtual('reviews', {
  //name of model that we want to reference
  ref: 'Review',

  //name of the field in the other model (Review) where
  //the reference to the current model is stored
  foreignField: 'tour',

  //where the reference (id) is stored in the current model
  localField: '_id'
});

//Document middleware
//'save' middleware - This one is triggered by the .save() .and create() commands
//.insertMany() doesn't trigger this middleware
//in the save middleware, 'this' point to the currently processed document
//We create a new tour using our API in order to trigger the function
//we create a slug for each of these
//a slug is basically a string that can be put in the URL, usually based on a string like the name of a product
tourSchema.pre('save', function(next) {
  //this.name -
  //lower - turn to lower case
  this.slug = slugify(this.name, { lower: true });
  next();
});

//tourSchema.pre('save', async function(next) {
//map assigns the results of iteration to a new element in the guidedPromises array
//the asynchronous function returns a Promise, so guidesPromises is an array full of promises
//we need to run all the promises at the same time
//const guidesPromises = this.guides.map(async id => await User.findById(id));
//this.guides = await Promise.all(guidesPromises);
//next();
//});

//can have multiple pre and post middlewares for the same hook
//a hook is a middleware function
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

//post middleware are executed after all the pre have been executed
tourSchema.post(/^find/, function(docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);
  next();
});

tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });

  next();
});

//Aggregation Middleware
//'this' here points to the aggregation object. it's an array
//the aggregation pipeline is the array that we passed to aggragte()
//in the controller
tourSchema.pre('aggregate', function(next) {
  //remove from the output all the tours that have secretTours set to true
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

//all the required data is on the overview page
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
