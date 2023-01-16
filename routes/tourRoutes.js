const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router();

//router.param('id', tourController.checkID);

// POST /tour/2345hbm/reviews
// GET  /tour/2345hbm/reviews
// GET  /tour/2345hbm/reviews/864rghbh

//router
//.route('/:tourId/reviews')
//.post(
//authController.protect,
//authController.restrictTo('user'),
//reviewController.createReview
//);

//router
//.route('/:id')
// .get(tourController.getTour)
// .patch(tourController.updateTour);

//a router is just middleware, so we can use the 'use' method on it
//and say for this specific route, use the reviewRouter
//this is mounting a router (similar to app.js)
//Need to allow the reviewRouter to get access to the tourId parameter
//we do this in reviewRouter
router.use('/:tourId/reviews', reviewRouter);

//aliasing
//we use a middleware
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);

router
  .route('/monthly-plan:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

//this is cleaner than using query strings i.e.
//tours-distance?distance=233&center=-40,45
router
  .route('/tours-within/:distances/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

router.route('/distance/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  //.get(authController.protect, tourController.getAllTours)
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),

    //the delete route handler/controller is protected
    //by the protect and restrictTo middleware above
    //which ensure that only authrorized users get access to it
    tourController.deleteTour
  );

module.exports = router;
