const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage, price';
  req.query.fields = 'name, price, ratingsAverage, summary, difficulty';
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

exports.createTour = async (req, res) => {
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
  try {
  const newTour = await Tour.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour
    }
  });
}
  catch (err) {
    //think about when an error can happen
    //e.g. when we create a document without a required field
    res.status(400).json({
      status: 'fail',
      message: err
    });
  }
};
  

exports.getAllTours = async (req, res) => {
  //get all tours
  //query for all the documents in the Tours collection
  //await the result and send it as a response
  //find returns an array of the documents and converts them into JS objects
 
try {
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
  const features = new APIFeatures(Tour.find(), req.query).filter().sort().limitFields().paginate();
  const tours = await features.query;

  //send response
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: tours.length,
    data: {
      tours
    }
  });
} catch (err) {
  res.status(404).json({
    status: 'fail',
    message: err
  });
}
};

//get the ID parametr from the request
//':id' is the name that we gave the URL variable in the tourRoutes
//file -> router.getTour
//
exports.getTour = async (req, res) => {
  try{
    const tour = await Tour.findById(req.params.id);
    //findById function works the same way as
    // Tour.findOne({ _id: req.params.id})
    //named _id in the DB -> see Postman 
    res.status(200).json({
    status: 'success',
    data: {
      tour
    }
  });

  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    });
  }
};


  // console.log(req.body);

  //const newId = tours[tours.length - 1].id + 1;
  //const newTour = Object.assign({ id: newId }, req.body);

  //tours.push(newTour);

  //fs.writeFile(
    //`${__dirname}/dev-data/data/tours-simple.json`,
    //JSON.stringify(tours),
    //err => {

    //query for the document that we want to update and then update it
  exports.updateTour = async (req, res) => {
    try{
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
      
        } catch (err) {
          res.status(404).json({
            status: 'fail',
            message: err
          });
        }
      };

    //RESTful API -> common not to send data to a client when there is a deletion
      exports.deleteTour = async (req, res) => {
        try{
          await Tour.findByIdAndDelete(req.params.id) 
          
          res.status(200).json({
          status: 'success',
          data: 
            null
          });
      
        } catch (err) {
          res.status(404).json({
            status: 'fail',
            message: err
          });
        }
      };


exports.getTourStats = async (req, res) => {
    try{
      const stats = await Tour.aggregate([
          //filter
          {
          $match: { ratingsAverage: {$gte: 4.5}}
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
              _id: {$toUpper: 'difficulty' },

              //for each document that passes through this pipeline,
              //1 is added to the numTours counter
              numTours: { $sum: 1},
              numRatings: {$sum: 'ratingsQuantity'},
              avgRating: {$avg: '$ratingsAverage'},
              avgPrice: {$avg: '$price'},
              minPrice: {$min: '$price'},
              maxPrice: {$max: '$price'},

            }
          },

          //field name as specified above in pipeline
          //1 for ascending
          {
            $sort: {avgPrice: 1},

          },

          //exclude 'easy' tours
         // {
           //  $match: {_id: { $ne: 'EASY'}}
          //},
      ]);

      res.status(200).json({
        status: 'success',
        data: 
          {stats}
        });

      } catch (err) {
        res.status(404).json({
          status: 'fail',
          message: err
        });
      }
    };

exports.getMonthlyPlan = async (req, res) => {
  try {
    //the year is a url param, so we retrieve it from the request
    //transform it into a number by multiplying by 1
    const year = req.params.year * 1;

    const plan = await Tour.aggregate([
      //unwind deconstructs an array field from the input document and 
      //then outputs one document for each element of the array
      {
        //startDates is the field with the array
        //that we want to unwind
        $unwind: '$startDates',
      },

      //select the documents for the year that was passed in into the URL
      //want the date to be > Jan 1st of the current year e.g. 2020, and less than Jan 1st of e.g.2021
      //so dates within a year, basically
      {
        $match: {
          $startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          }
        }
      },
      {
        $group: {
          //month is an operator that extracts the month from the dates
           _id: {$month: '$startDates'},
           numTourStarts: { $sum: 1},
           tours: {$push: '$name'}
        }
      },
      {
        $addFields: { month: '$_id'},
      },
      {
        $project: { 
          _id: 0,
        },
      },
      {
        $sort: {numTours: -1}
      },
      {
        $limit: 6
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: 
        {
          plan
        }
      });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    });
  }

}