//const stripe = require('stripe') - this alone exposes a function.
//we pass the secret key and get a stripe object that we can work with
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const User = require('../models/userModel');
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
    //success_url: `${req.protocol}://${req.get('host')}/my-tours/?tour=${
    //req.params.tourId
    //}&user=${req.user.id}&price=${tour.price}`, //home page
    success_url: `${req.protocol}://${req.get('host')}/my-tours`,

    //url the user is directed to if the payment is cancelled
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,

    //these custom fields allow us to pass in data about the session
    //that we're currently. This is importaant because later on, if the purchase is successful
    //we'll get access to the session object again and by then, we want to create a new booking in the db
    //to create a new bookinhg, we need the userId (can recreate from user email bc emails addresses have to be unique), the tourId and the price
    customer_email: req.user.email, //since it's a protected route, the user is already on the request
    client_reference_id: req.params.tourId,

    //
    line_items: [
      //array of objects
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
        amount: tour.price * 100, //multiply by 100 to get cents
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

//exports.createBookingCheckout = catchAsync(async (req, res, next) => {
// This is only TEMPORARY, because it's UNSECURE: everyone can make bookings without paying
// const { tour, user, price } = req.query;

//only want to create a booking if all three are provided
//if not, move on to the next middleware
// if (!tour && !user && !price) return next();

//actually create the document in the database
//we're not saving it in a variable because we don't really need it
//we won't be sending it back as an API response
// await Booking.create({ tour, user, price });

//at this point we could go to the next middleware by calling next()
//but this wouldn't be secure because of all the data in the url
//so we redirect the application to the url that's created by removing the query string from the original url
//original url - success_url: `${req.protocol}://${req.get('host')}/my-tours/?tour=${
//   req.params.tourId
// }&user=${req.user.id}&price=${tour.price}`,
//split it by the question mark and only take the first element
//redirect creates a new request to this new url which is our root/home route
//but the 3 query parameters aren't defined, so the next middleware (getOverview) is called

// res.redirect(req.originalUrl.split('?')[0]);
//});

//regular function, not a middleware
//takes in the session data -> the session that we created in getCheckoutSession above
const createBookingCheckout = async session => {
  //we need tour, user and price data and that's stored in the session
  //we use the client_reference_id field which contains the tourId that we need (see line 35 above)
  const tour = session.client_reference_id;

  //the information that we have in our session about the user is their email
  //we get the user id by querying by the email which is also unique
  //the first part returns the entire document, but we only want the id
  const user = (await User.findOne({ email: session.customer_email })).id;

  //stored in line-items which is an array with one element
  //divide by 100 to get dollars
  const price = session.line_items[0].amount / 100;
  await Booking.create({ tour, user, price });
};

//all this code will run whenever a payment was successful
//stripe will call our webhook which is the url that will call this function
//this function receives a body from the request, and then together with the signature
//and our webhook secret creates an event which will contain a session and then using that
//session data, we can create our new booking in the database
exports.webhookCheckout = (req, res, next) => {
  //Read Stripe signature from our headers
  //when Stripe calls our webhook, it will add a header to that request
  //containing a special signature for our webhook
  const signature = req.headers['stripe-signature'];

  //create a stripe event
  let event;

  //during the creation of this event, there might be an error -> wrap in try-catch block
  try {
    //final parameter is our webhook secret from stripe
    //we add it to our config file as well as our heroku configuration
    //purpose of the signature and the secret -> to make the process secure
    //we need the signature and the secret to validate the data that comes in the body
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    //if there is an error, send it back to stripe
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  //this is the event type that we specify in our stripe dashboard
  //if the event is the correct event, we create a new booking in our database
  //we do this using the createBookingCheckout function above
  if (event.type === 'checkout.session.complete')
    createBookingCheckout(event.data.object);

  //send some response to stripe
  res.status(200).json({ received: true });
};

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
