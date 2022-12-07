const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

//schema for our users
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  photo: String, //optional
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minLength: 8,
    select: false //so that it never shows up in any output
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      //specify a callback function which will be called
      //when a new document is created
      //can't use an arrow function because we need to use 'this'
      //from the validator, we return either true or false
      //false means we'll get a validation error
      //current element (el) i.e. the current value in the passwordConfirm field
      //is equivalent to this.password
      validator: function(el) {
        //this only works on CREATE and SAVE, so whenever we want to update a user, for example,
        //we'll have to use 'save' and not 'findOneAndUpdate' like we did with tours
        return el === this.password;
      },
      message: 'Passwords are not the same!'
    }
  },
  passwordChangedAt: Date
});

//if the password has not been modified,
//return from the function and call the next middleware
//else, run the code
userSchema.pre('save', async function(next) {
  //only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  //the second parameter is a cost parameyter -> a measure of how cpu intensive this process
  //will be
  this.password = await bcrypt.hash(this.password, 12);

  //delete passwordconfirm field
  this.passwordConfirm = undefined;
  next();
});

//instance method
//inside the instance methods 'this' refers to the current document.
//but since we have the 'password' field set to false, the password is not available
//so that's why we have to pass in userPassword instead of just making a reference to this.password
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimeStamp) {
  //in an instance method, 'this' is always referring to the current document
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    console.log(changedTimestamp, JWTTimestamp);
    return JWTTimestamp < changedTimestamp;
  }

  //false means not changed i.e.
  return false;
};
const User = mongoose.model('User', userSchema);

module.exports = User;
//creating a document out of a model
//document is an instance of the model
//so it has acces to methods
//const testTour = new Tour({
//  name: 'The Forest Hiker',
//rating: 4.7,
//price: 497
//});
