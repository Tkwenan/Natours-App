const Tour = require('./../models/tourModel');

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
  const tours = await Tour.find();
try {
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