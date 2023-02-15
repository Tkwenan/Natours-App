//const stripe = require('stripe') - this alone exposes a function.
//we pass the secret key and get a stripe object that we can work with
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //1) find the tour in the DB
  const tour = await Tour.findById(req.params.tourId);

  //2) Create checkout session - need to npm i stripe first
  //'create' returns a promise because setting all the options below involves making an
  //api call to stripe
  const session = await stripe.checkout.sessions.create({
    //object of options
    //can set a ton of options but only 3 of them are required
    payment_method_types: ['card'],

    //url the user is directed to once the payment is sucessful
    success_url: `${req.protocol}://${req.get('host')}/my-tours/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`, //home page

    //url the user is directed to if the payment is cancelled
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email, //since it's a protected route, the user is already on the request

    //this custom field allows us to pass in data about the session
    //that we're currently. This is importaant because later in, if the purchase is successful
    //we'll get access to the session object again and by then, we want to create a new booking in the db
    //to create a new bookinhg, we need the userId (can recreate from user email bc emails addresses have to be unique), the tourId and the price
    client_reference_id: req.params.tourId,

    //
    line_items: [
      //array of objects
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
        amount: tour.price * 100,
        currency: 'usd',
        quantity: 1
      }
    ]
  });

  // 3) Create session as response
  res.status(200).json({
    status: 'success',
    session
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // This is only TEMPORARY, because it's UNSECURE: everyone can make bookings without paying
  const { tour, user, price } = req.query;

  //only want to create a booking if all three are provided
  //if not, move on to the next middleware
  if (!tour && !user && !price) return next();

  //actually create the document in the database
  //we're not saving it in a variable because we don't really need it
  //we won't be sending it back as an API response
  await Booking.create({ tour, user, price });

  //at this point we could go to the next middleware by calling next()
  //but this wouldn't be secure because of all the data in the url
  //so we redirect the application to the url that's created by removing the query string from the original url
  //original url - success_url: `${req.protocol}://${req.get('host')}/my-tours/?tour=${
  //   req.params.tourId
  // }&user=${req.user.id}&price=${tour.price}`,
  //split it by the question mark and only take the first element
  //redirect creates a new request to this new url which is our root/home route
  //but the 3 query parameters aren't defined, so the next middleware (getOverview) is called

  res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
