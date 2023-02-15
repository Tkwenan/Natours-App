// review / rating / createdAt / ref to tour / ref to user
const mongoose = require('mongoose');
const Tour = require('./tourModel');

//schema for our tours
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    //time stamp added automatically
    //Date built in JS type
    createdAt: {
      type: Date,
      default: Date.now()
    },

    //where the id of the tour is stored
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user']
    }
  },
  {
    //specify that you want the virtual properties in the output every time the data is output as JSON
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });
reviewSchema.pre(/^find/, function(next) {
  //call populate on the current query
  //this.populate({
  //specifying that the 'tour' field above
  //is the one that will be populated based on the tour model
  //as specified on lines 22 - 24 above
  //The reference is to a model named 'Tour', so it's in
  //this collection that Mongoose will look for documents with the
  //ID that was specified
  // path: 'tour',
  // select: 'name'
  //}).populate({
  //path: 'user',
  //select: 'name photo'
  //});

  this.populate({
    path: 'user',
    select: 'name photo'
  });

  next();
});

//the tourID is the ID of the tour to which the current review belongs to
reviewSchema.statics.calcAverageRatings = async function(tourId) {
  //to do the calculations, we use the aggregation pipeline/aggregate method
  //similar to how we use it in tourController.js
  //in a static method, 'this' refers to the current model
  //aggregate is always called on a model. We pass in an array of all the
  //steps that we want in aggregate
  //returns a promise so we need to await
  const stats = await this.aggregate([
    {
      //first step - select all the reviews that actually belong to the current tour that was passed in as an arg
      $match: { tour: tourId }
    },
    {
      //calculate the statistics using all the reviews
      $group: {
        _id: '$tour', //the field that all the documents have in common/that we want to group by
        //e.g. in tourController, we group by difficulty i.e. we calculate statistics for easy, medium, hard
        nRating: { $sum: 1 }, //add 1 for each review doc that we have
        avgRating: { $avg: '$rating' } //each review has a field called 'rating'
      }
    }
  ]);

  //to test
  //
  console.log(stats);

  //we await becaue it returns a promise, but we don't save to
  //a variable because we don't really need the tour. All we need to do is
  //update it
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};

//call after a new review has been created
reviewSchema.post('save', function() {
  //this points to current document/current review
  //this implementation would not work bc we define the Review variable below
  //moving the definition above this middleware would not work bc then this middleware will be excluded
  //from reviewSchema

  //Review.calcAverageRatings(this.tour);

  //we implement it this way instead
  //'this' still refers to the current document
  //cosntructor is the model that created the document
  //the whole 'this.constructor' still stands for the Review model
  this.constructor.calcAverageRatings(this.tour);

  //post middleware does not get access to next
  //next();
});

//findByIdAndUpdate
//findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function(next) {
  //previously had it as review =  await this.findOne();
  //but we need a way to pass data from the pre middleware to the post middleware
  this.review = await this.findOne();
  next();
});

//get the tour id
reviewSchema.post(/^findOneAnd/, async function() {
  //await this.findOne(); does not work bc the query has already executed
  await this.review.constructor.calcAverageRatings(this.review.tour);
});

//create the model and export it
const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
