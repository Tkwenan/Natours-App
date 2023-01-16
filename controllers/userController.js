const multer = require('multer');
const sharp = require('sharp');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

//WITHOUT IMAGE-PROCESSING
//const multerStorage = multer.diskStorage({
//cb -> callback
//this callbcak function is similar to the next() fnction in express
//
// destination: (req, file, cb) => {
//first arg -> an error if there is one
//sec arg -> the actual destination
// cb(null, 'public/img/users');
//  },
// filename: (req, file, cb) => {
//format: username-userid-currenttime.fileextension
//user-76557679988-7979080.jpeg
//to get the
//this object is req.file so you can view the properties
//e.g. the mimetype is 'image/jpeg' -> we want to get the second part
//  const ext = file.mimetype.split('/')[1];
//  cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
// }
//});

const multerStorage = multer.memoryStorage();

//test if the uploaded file is an image
//and if it is, pass true to the callback function
//if not, pass false along with an error
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

//we only have one single field to which we want to upload a photo
//the 'photo' field
//we implement it differently for tours bc we need to upload images to more than one file
exports.uploadUserPhoto = upload.single('photo');

//WITH IMAGE-PROCESSING
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')({ quality: 90 })
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...allowedFields) => {
  //loop through the object. 'keys' returns an array containing all the
  //field names of the object
  const newObj = {};
  Object.keys(obj).forEach(el => {
    //for each element (an element is a field name in this case)
    //if the allowedFields array contains the current field name
    //then add the new object to our return object
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  //send response
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users
    }
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  //1)Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for password updates.', 400));
  }
  //2)Update user document
  //since we're not dealing with sensitive data like passwords
  //we can now use findByIdAndUpdate instead of just findById
  //we also pass in the data that we want to be updated, x
  //we use filteredBody for this instead of req.body bc we want to restrict the user from
  //updating info like role, resetToken
  //and some options. We want to filter the body so that it only contains the name and email address
  //'new' option makes sure it returns the new object instead of the old objects
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;

  //update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined! Please use /signup instead'
  });
};

//exports.updateUser = (req, res) => {
// res.status(500).json({
//  status: 'error',
//  message: 'This route is not yet defined!'
// });
//};

//exports.deleteUser = (req, res) => {
// res.status(500).json({
//  status: 'error',
// message: 'This route is not yet defined!'
//});
//};
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
