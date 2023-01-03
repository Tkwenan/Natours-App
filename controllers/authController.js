//we need the promisify method from the util module
//one approach: const util = require('util');
//util.promisify ...
//another approach: destructuring (below and on line )
const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

const signToken = id => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    //we convert the 90d to milliseconds
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),

    //only send the cookie on an encrypted connection e.g. https
    //this is only activated in prod, so we can rewite it as below
    //on line 33
    //secure: true,

    //cookie can't be modified in any way by the browser
    //even deleted
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  //send the token and new user to the client
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
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

  createSendToken(newUser, 201, res);
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
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  //if there's no error at all, we get to this block of code
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'Logged Out', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};

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
  } else if (req.cookies.jwt) {
    //if this property exists on the cookie
    token = req.cookies.jwt;
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
  res.locals.user = currentUser;
  next();
});

// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      // Make them accessible to our Pug templates
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

//this is the synatx we use when we want to pass in an arbitrary number
//of arguments
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles is an array e.g. ['admin, 'lead-guide']
    //if the role of the current user is not contaoned in the roles array
    //restrict access
    //the role of the current user is stored in req.user on line 131 above
    //inside the protect middleware which always runs before this middleware
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1)Get user based on POSTed email
  //can't use findById bc email is the only piece of information we know
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with that email address.', 404));
  }

  //2)Generate the random reset token
  const resetToken = user.createPasswordResetToken();

  //turn off all the validators that we ssaved in our schema
  await user.save({ validateBeforeSave: false });

  //3)Send it to user's email
  //protocol - http or https
  //host - preparing this to work in both dev and prod
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Please reset your email on ${resetURL}.\n If you did not forget your password, please ignore this email.`;
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on the token
  //token is a url parameter bc we set it in userRoutes.js
  const hashedToken = crypto
    .createdHash('sha256')
    .update(req.params.token)
    .digest('hex');

  //we query the database for this token to find the user associated with this token
  //at this pointbwe don't know anything else about the user other than the token
  //need to check if the passwordResetExpires is greater than what time it currently is
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  //2) If token has not expired, and there is user, set the new password
  //if token has expired, no user will be returned
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //3) Update changedPasswordAt property for the user
  //we implement this in the user model as a pre save middleware

  //4) Log user in, send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1)Get user from collection
  //This functionality is only for authenticated users
  //so at this point, we have our currenty user on our request object
  //from the protect middleware
  //we explicitly ask for the password using 'select' because it's not automatically
  //included in the output (as specified in the schema)
  const user = await User.findById(req.user.id).select('password');

  //why we don't do User.findByIdAndUpdate() - some middleware won't work
  //and validation won't be done

  //2)Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }
  //3)If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  //4)Log user in with new password, send jwt
  createSendToken(user, 200, res);
});
