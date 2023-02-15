const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'Booking must belong to a Tour!']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Booking must belong to a User!']
  },
  price: {
    type: Number,
    require: [true, 'Booking must have a price.']
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },

  //this property is for if an admin wants to create a booking outside of stripe
  //e.g. if a customer doesn't have a credit card and wants to pay directly
  //so an admin might use our bookingsApi to manually create a tour, so that might be paid or not yet paid
  paid: {
    type: Boolean,
    default: true
  }
});

//populate the tour and the user automatically whenever there is a query
bookingSchema.pre(/^find/, function(next) {
  this.populate('user').populate({
    path: 'tour',
    select: 'name'
  });
  next();
});

//create model
const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
