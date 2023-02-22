const multer = require('multer');
const sharp = require('sharp');
const AppError = require('../utils/appError');
const Tour = require('./../models/tourModel');
//const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

//store the images in memory
const multerStorage = multer.memoryStorage();

//test if the uploaded file is an image
//and if it is, pass true to the callback function
//if not, pass false along with an error
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);

// upload.single('image') req.file
// upload.array('images', 5) req.files
exports.resizeTourImages = catchAsync(async (req, res, next) => {
  //if there are no images uploaded or if there is no image cover
  if (!req.files.imageCover || !req.files.images) return next();

  // 1) Cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  //imageCover is an array of one element
  await sharp(req.files.imageCover[0].buffer)
    //we resize to a 3:2 ratio which is always good for images
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.body.imageCover}`);

  // 2) Images
  // i for index. zero-based
  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      // await sharp(file.buffer[0].buffer)
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );

  next();
});

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

//filter(){
//we use ellipses to destructure i.e. take all the fields out
//of the req.query object and create a new object
// BUILD QUERY
// Filtering
//const queryObj = {...req.query};
//const excludedFields = ['page', 'sort', 'limit', 'filds'];
//excludedFields .forEach(el => delete queryObj[el]);

//find() retirns a query, so it's not a good idea to chain
//mongoose methdods onto the call to find()
//so as soon as we await, the query will execute and come back with the
//documents that match the query
//so if we implement it as  const tours = await Tour.find();
//it will be hard to then implement pagination features etc. later
//so we can await once we've chained all the methods that we need to

//Advanced Filtering
//let queryStr = JSON.stringify(queryObj);

//regular expression in the paretheses
//queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
//console.log(JSON.parse(queryStr));

//let query = Tour.find(JSON.parse(queryStr));

//import the data as a JSON file
//const tours = JSON.parse(
//fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
//);

//exports.createTour = catchAsync(async (req, res, next) => {
//const newTour = await Tour.create(req.body);

//res.status(201).json({
//status: 'success',
//data: {
// tour: newTour
//}
//});

//one way to create a document
//calling the method on the document
//const newTour = new Tour({})
//newTour.save()

//an easier way
//calling the method directly on the tour model
//save the result value of the promise in the newTour  variable
//pass in the data that yu want to store in the database as a new tour - req.body
//create returns a promise which we await
// and store the result into the newTour variable
//which will be the newly created document already
//with the ID
//try {
//res.status(201).json({
//status: 'success',
//data: {
// tour: newTour
//}
//});
//}
//catch (err) {
//think about when an error can happen
//e.g. when we create a document without a required field
// res.status(400).json({
// status: 'fail',
// message: err
//});
//}
//});

//exports.getAllTours = catchAsync(async (req, res, next) => {
//get all tours
//query for all the documents in the Tours collection
//await the result and send it as a response
//find returns an array of the documents and converts them into JS objects

//try {
//we use ellipses to destructure i.e. take all the fields out
//of the req.query object and create a new object
// BUILD QUERY
// Filtering
//const queryObj = {...req.query};
//const excludedFields = ['page', 'sort', 'limit', 'filds'];
//excludedFields .forEach(el => delete queryObj[el]);

//find() retirns a query, so it's not a good idea to chain
//mongoose methdods onto the call to find()
//so as soon as we await, the query will execute and come back with the
//documents that match the query
//so if we implement it as  const tours = await Tour.find();
//it will be hard to then implement pagination features etc. later
//so we can await once we've chained all the methods that we need to

//Advanced Filtering
//let queryStr = JSON.stringify(queryObj);

//regular expression in the paretheses
//queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
//console.log(JSON.parse(queryStr));

// let query = Tour.find(JSON.parse(queryStr));

//SORTING
//if(req.query.sort) {
//const sortBy = req.query.sort.split(',').join(' ');
//query = query.sort(sortBy);
//sort('')
//} else{
//query = query.sort('-createdAt');
//}

//if(req.query.fields){
//const fields = req.query.fields.split(',').join(' ');
//query = query.select(fields);
//} else {
//query = query.select('-__v');
//}

//Pagination
//page=2&limit=50
//1-10 -> page 1
// 11-20 - page 2
//so if we want page 2, need to skip
//const page = req.query.page * 1 || 1;
//const limit = req.query.limit * 1 || 100;
//const skip = (page - 1) * limit;

//query = query.skip(skip).limit(limit);

//if (req.query.page){
//const numTours = await Tour.countDocuments();

//if(skip >= numTours) throw new Error('This page does not exist');
//}

//EXECUTE QUERY
//chain the methods from the API class above
//we create a new object of the features class
//in there, we pass a query object and the query string coming from
//Express. In each of the methods, we keep manipulating the query by adding
//more methods to it
//we await the results of the query so that it can come back with all the documents
//that were selected -> features.query
// const features = new APIFeatures(Tour.find(), req.query)
//   .filter()
//    .sort()
//   .limitFields()
//    .paginate();

//  const tours = await features.query;

//send response
//  res.status(200).json({
//    status: 'success',
//   requestedAt: req.requestTime,
//    results: tours.length,
//    data: {
//      tours
//   }
//  });
//} catch (err) {
// res.status(404).json({
//  status: 'fail',
//   message: err
// });
//}
//});

//get the ID parametr from the request
//':id' is the name that we gave the URL variable in the tourRoutes
//file -> router.getTour
//
//exports.getTour = catchAsync(async (req, res, next) => {
// try{
//const tour = await Tour.findById(req.params.id).populate('reviews');

//we use the '-' sign in the select clause to exclude
//some fields
//we need to populate at different points in our app
//so we use middleware instead of implementing it as below
//the middleware is in tourModel.js
//const tour = await Tour.findById(req.params.id).populate({
// path: 'guides',
// select: '-__v -passwordChangedAt'
//});

//if (!tour) {
// return next(new AppError('No tour found with that ID', 404));
//}

//findById function works the same way as
// Tour.findOne({ _id: req.params.id})
//named _id in the DB -> see Postman
//res.status(200).json({
// status: 'success',
//data: {
//tour
//}
//});

//} catch (err) {
//  res.status(404).json({
//   status: 'fail',
//   message: err
// });
// }
//});

// console.log(req.body);

//const newId = tours[tours.length - 1].id + 1;
//const newTour = Object.assign({ id: newId }, req.body);

//tours.push(newTour);

//fs.writeFile(
//`${__dirname}/dev-data/data/tours-simple.json`,
//JSON.stringify(tours),
//err => {

//query for the document that we want to update and then update it
//exports.updateTour = catchAsync(async (req, res, next) => {
//try{
//pass in the id so that we can first find the document that needs to be updated
//and the data that we want to us to update
//third optional argument.
//Return the new, updated document to the client
//findByIdAndUpdate - returns a query - see Mnongoose documentation
//for methods available on a model

// const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
// new: true,
//   runValidators: true
//});

// if (!tour) {
//  return next(new AppError('No tour found with that ID', 404));
//}
//findById function works the same way as
// Tour.findOne({ _id: req.params.id})
//named _id in the DB -> see Postman
//  res.status(200).json({
//   status: 'success',
//   data: {
//    tour
// tour: tour -> long form of above
//  }
// });

//} catch (err) {
//  res.status(404).json({
//    status: 'fail',
//    message: err
//  });
// }
//});

exports.getAllTours = factory.getAll(Tour);
exports.createTour = factory.createOne(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

//RESTful API -> common not to send data to a client when there is a deletion
//exports.deleteTour = catchAsync(async (req, res, next) => {
// try{
// const tour = await Tour.findByIdAndDelete(req.params.id);

// if (!tour) {
//    return next(new AppError('No tour found with that ID', 404));
// }

//  res.status(200).json({
//    status: 'success',
//   data: null
// });

// } catch (err) {
//   res.status(404).json({
//     status: 'fail',
//     message: err
//  });
// }
//});

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
        _id: { $toUpper: '$difficulty' },

        //for each document that passes through this pipeline,
        //1 is added to the numTours counter
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
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
      $sort: { numTourStarts: -1 }
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

// /tours-within/:distance/center/:latlng/unit/:unit'
// /tours-within/233/center/-40, 45/unit/midistance=233&center=-40,45
exports.getToursWithin = catchAsync(async (req, res, next) => {
  //use destructuring to get variables from the url
  const { distance, latlng, unit } = req.params;

  //get coordinates from the latlng variable
  const [lat, lng] = latlng.split(',');

  //mongo expects the radius of a sphere to be in radians
  //we get radians by dividing the distance by the radius of the earth
  //miles otherwise we assume it's kilometers
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat, lng',
        400
      )
    );
  }

  //we want to query for start location bc the start location field holds the geospatial point where each tour starts
  //geoWithin is a geospatial opeartor like gte
  //finds documents within a given geometry which we specify
  //in our case, we want to find documents inside of a sphere that starts at latlng
  //and has a radius of the distance that we defined
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  //use destructuring to get variables from the url
  const { latlng, unit } = req.params;

  //get coordinates from the latlng variable
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat, lng',
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        //point from which to calculate the distances
        //all distances to tours will be calculated between this point and the start location of a tour
        //it's the latlng parameter
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1] //multiply by 1 to convert to a number
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier //divide by 1000 to convert to km
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  });
});
