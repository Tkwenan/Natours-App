//we need the promisify method from the util module
//one approach: const util = require('util');
//util.promisify ...
//another approach: destructuring (below and on line )
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

const signToken = id => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

//it's an async function bc we're perfomimg sonme db operations
exports.signup = catchAsync(async (req, res, next) => {
  //creating a new user
  //we create a new document as modelname.create()
  //pass in an object with the data from which a user should be created
  // previously had it as const newUser = await User.create(req.body);
  //but better to select specific items from req body
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });

  //first argument is the payload. this is an object for all
  //the data that we want to store inside of the token
  //in this case, the id of the new user who was just created
  //in MongoDB, the id is called _id
  //second argument - secret. We include this in our config file
  const token = signToken(newUser._id);

  //send the token and new user to the client
  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser
    }
  });
});

exports.login = catchAsync(async (req, res, next) => {
  //we use object destructuring
  //const email = await req.body.email;
  //since the variable name is the same as the property name
  //we can use the shorthand below
  const { email, password } = req.body;

  //Check if email and password exist,
  //if not, error message
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  //check if user exists && password is correct
  //the output of  const user = User.findOne({email: email})
  //will not contain a password, but we still need to check if the password is correct
  const user = await User.findOne({ email: email }).select('+password');

  //correctPassword is an instance method defined in userModel
  //it's available on all User documents and the variable 'user' above
  //is a document
  const correct = user.correctPassword(password, user.password);

  if (!user || !correct) {
    return next(new AppError('Incorrect email or password', 401));
  }

  //if there's no error at all, we get to this block of code
  const token = signToken(user._id);

  res.status(200).json({
    status: 'success',
    token
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  //1: getting token from the request header and check if it's there
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    //split the string using a space and retrieve the second element
    //from that array
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('Your are not logged in. Please log in to get access.', 401)
    );
  }

  //2: verification token - check if data is manipulated/if token is expired
  //pass in token so that algorithm is able to read the payload
  //pass in secret to create the test signature
  //pass in a callback function that runs as soon as the verification is completed
  //verify is an async function; will do the verification then call the callback when
  //it's done.
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3: check if the user still exists
  //at this point we can be sure that the id is valid because for us
  //to get here, we've done verification in step 2 above
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError('The user belonging to the token no longer exists', 401)
    );
  }

  //check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again', 401)
    );
  }

  //Grant access to protected route
  //next() leads us to the next middleware which leads
  //in this case is the hanlder for the route that's protected
  req.user = currentUser;
  next();
});
