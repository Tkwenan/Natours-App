const crypto = require('crypto');
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
  photo: { 
    type: String, 
    default: 'default.jpg' 
  }, //optional
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
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
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
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

//we want to set the passwordChangedAt property only if the password
//has actually changed
userSchema.pre('save', function(next) {
  //if password has been modified, update
  //we also don't need to set the passwordChangedAt property if we've created
  //a new document
  if (!this.isModified('password') || this.isNew) return next();

  //if above verification has passed, set the property
  this.passwordChangedAt = Date.now() - 1000;
  next();

  //sometimes saving to the database is slower than issuing the jwt
  //making it so that the chnagedPassword timestamp is sometimes set a bit after
  //the jwt ahs been created. This will make is so that the user can't log in
  //with the new token
  //The whole reason that the passwordChangedAt timestamp exists is so that
  //it can be compared with the password on the jwt
  //we deal with this by subtracting 1 second so that the passwordChangedAt is one sec in the past
});

userSchema.pre(/^find/, function(next) {
  //this points to the current query
  //this.find({active: true}); //this does not work
  this.find({ active: { $ne: false } });
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

    //console.log(changedTimestamp, JWTTimestamp);
    return JWTTimeStamp < changedTimestamp;
  }

  //false means not changed i.e.
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  //generate the token
  //32 is the number of bytes
  //convert to a hexadecimal string
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  //console.log({ resetToken }, this.passwordResetToken);

  //we want it to expire after 10 minutes
  //10 * 60 sec * 1000 ms
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  //return the plain text token because that's what we send to the user via email
  return resetToken;
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
