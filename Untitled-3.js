const Review = require('./../models/reviewModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.createReview = catchAsync(async (req, res, next) => {
  //Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;

  const newReview = await Review.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      review: newReview
    }
  });
});

exports.getAllReviews = catchAsync(async (req, res, next) => {
  //define filter object
  let filter = {};

  if (req.params.tourId) filter = { tour: req.params.tourId };

  const reviews = await Review.find(filter);

  //send response
  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews
    }
  });
});

//get the ID parametr from the request
//':id' is the name that we gave the URL variable in the tourRoutes
//file -> router.getTour
//
exports.getTour = catchAsync(async (req, res, next) => {
  // try{
  const tour = await Tour.findById(req.params.id);

  //we use the '-' sign in the select clause to exclude
  //some fields
  //we need to populate at different points in our app
  //so we use middleware instead of implementing it as below
  //the middleware is in tourModel.js
  //const tour = await Tour.findById(req.params.id).populate({
  // path: 'guides',
  // select: '-__v -passwordChangedAt'
  //});

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  //findById function works the same way as
  // Tour.findOne({ _id: req.params.id})
  //named _id in the DB -> see Postman
  res.status(200).json({
    status: 'success',
    data: {
      tour
    }
  });

  //} catch (err) {
  //  res.status(404).json({
  //   status: 'fail',
  //   message: err
  // });
  // }
});

// console.log(req.body);

//const newId = tours[tours.length - 1].id + 1;
//const newTour = Object.assign({ id: newId }, req.body);

//tours.push(newTour);

//fs.writeFile(
//`${__dirname}/dev-data/data/tours-simple.json`,
//JSON.stringify(tours),
//err => {

//query for the document that we want to update and then update it
exports.updateTour = catchAsync(async (req, res, next) => {
  //try{
  //pass in the id so that we can first find the document that needs to be updated
  //and the data that we want to us to update
  //third optional argument.
  //Return the new, updated document to the client
  //findByIdAndUpdate - returns a query - see Mnongoose documentation
  //for methods available on a model

  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }
  //findById function works the same way as
  // Tour.findOne({ _id: req.params.id})
  //named _id in the DB -> see Postman
  res.status(200).json({
    status: 'success',
    data: {
      tour
      // tour: tour -> long form of above
    }
  });

  //} catch (err) {
  //  res.status(404).json({
  //    status: 'fail',
  //    message: err
  //  });
  // }
});

//RESTful API -> common not to send data to a client when there is a deletion
exports.deleteTour = catchAsync(async (req, res, next) => {
  // try{
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: null
  });

  // } catch (err) {
  //   res.status(404).json({
  //     status: 'fail',
  //     message: err
  //  });
  // }
});

exports.getTourStats = catchAsync(async (req, res, next) => {
  //try{
  const stats = await Tour.aggregate([
    //filter
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },

    //group documents using accumulators
    //e.g. if we have five tours and each of them has a rating,
    //we can calculate the rating using group
    {
      $group: {
        //specify what you want to group by
        //null -> if you want to have everything in one group
        //could possibly specify a field to group by e.g. difficulty
        //'ratingsAverage' is the name of the field
        //$avg is a built-in Mongo math operator that calculates the avg
        //of the specified field
        _id: { $toUpper: 'difficulty' },

        //for each document that passes through this pipeline,
        //1 is added to the numTours counter
        numTours: { $sum: 1 },
        numRatings: { $sum: 'ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },

    //field name as specified above in pipeline
    //1 for ascending
    {
      $sort: { avgPrice: 1 }
    }

    //exclude 'easy' tours
    // {
    //  $match: {_id: { $ne: 'EASY'}}
    //},
  ]);

  res.status(200).json({
    status: 'success',
    data: { stats }
  });

  //} catch (err) {
  //  res.status(404).json({
  //    status: 'fail',
  //     message: err
  //  });
  // }
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  //try {
  //the year is a url param, so we retrieve it from the request
  //transform it into a number by multiplying by 1
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    //unwind deconstructs an array field from the input document and
    //then outputs one document for each element of the array
    {
      //startDates is the field with the array
      //that we want to unwind
      $unwind: '$startDates'
    },

    //select the documents for the year that was passed in into the URL
    //want the date to be > Jan 1st of the current year e.g. 2020, and less than Jan 1st of e.g.2021
    //so dates within a year, basically
    {
      $match: {
        $startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        //month is an operator that extracts the month from the dates
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    {
      $addFields: { month: '$_id' }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: { numTours: -1 }
    },
    {
      $limit: 12
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });
  // } catch (err) {
  //   res.status(404).json({
  //    status: 'fail',
  //    message: err
  // });
  //}
});
