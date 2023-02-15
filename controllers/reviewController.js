const Review = require('./../models/reviewModel');
const factory = require('./handlerFactory');
//const catchAsync = require('./../utils/catchAsync');
//const AppError = require('./../utils/appError');

//exports.getAllReviews = catchAsync(async (req, res, next) => {
//define filter object
//the two lines below are unique to this getAll handler
//we copy them to our factory getAll handler
// let filter = {};

// if (req.params.tourId) filter = { tour: req.params.tourId };

// const reviews = await Review.find(filter);

//send response
//  res.status(200).json({
//   status: 'success',
//    results: reviews.length,
//   data: {
//     reviews
//    }
//  });
//});

exports.setTourUserIds = (req, res, next) => {
  //Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

//exports.createReview = catchAsync(async (req, res, next) => {
//Allow nested routes
//after implementing factory functions for the handlers
//in controllers, we remove the code below and place it in its own function
// setTourUserIds above (it's middleware).
//this is bc this createReview function is a little bit different
//from the other create handlers
//we also add this middleware to the reviewRoutes.js right before createReview
//if (!req.body.tour) req.body.tour = req.params.tourId;
//if (!req.body.user) req.body.user = req.user.id;

// const newReview = await Review.create(req.body);

// res.status(201).json({
//  status: 'success',
//   data: {
//     review: newReview
//   }
//  });
//});

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
