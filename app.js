const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// 1) GLOBAL MIDDLEWARES
//Set security HTTP headers
//always best to use this early
app.use(helmet());

//Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//Limit requests rom same IP address
const limiter = rateLimit({
  //how many requests we want to allow in within a given time frame
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour'
});

app.use('/api', limiter);

//Body parser -> reading data from the body into req.body
app.use(express.json({ limit: '10kb' }));

//Data sanitization against NoSQL query injection
app.use(mongoSanitize());

//Data sanitization against XSS
app.use(xss());

//prevent parameter pollution
//whitelist -> an array of properties for which we allow duplicates
//in the query string
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

//serving static files
app.use(express.static(`${__dirname}/public`));

//just used this to demo the concept of middleware
//app.use((req, res, next) => {
// console.log('Hello from the middleware 👋');
// next();
//});

//Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.headers);
  next();
});

// 3) ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

//app.all
//we specify the route in the (). The * stands for all routes
app.all('*', (req, res, next) => {
  //res.status(404).json({
  //  status: 'fail',
  //  message: `Can't find ${req.originalUrl} on this server!`
  //});

  //const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  //err.status = 'fail';
  //err.statusCode = 404;

  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
