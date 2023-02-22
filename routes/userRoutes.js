const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

//we use this variable to create a middleware that we use in the updateMe route below.
//upload.single
//const upload = multer ({ dest: 'public/img/users'}); //folder to save images that users upload

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

//protect all the routes that come after this point
//i.e. user has to be logged in in order to access these routes
//we do this instead of adding authController.protect to each route
router.use(authController.protect);

router.patch(
  '/updateMyPassword',
  //authController.protect,
  authController.updatePassword
);

router.get(
  '/me',
  //authController.protect,
  userController.getMe,
  userController.getUser
);

//authController.protect - this is a protected route - so only the currently logged in user
//can update the data. The ID of the user that will be updated comes from req.user
//which is set by the authController.protect middleware which in turn got the ID from the jwt
//no one can change the ID in the jwt without knowing the secret,we know that the id is safe
router.patch(
  '/updateMe',
  //authController.protect,

  //single bc we only have one single file
  //photo is the name of the field in the form that holds this file
  //this middleware takes the file and copies it to the destination that we specify
  //and then calls the next middleware in the stack (updateMe)
  //This middleware also puts information about the file on the request object
  //try viewing what the file and body look like right after the middlewre is done
  //by using console.log(req.file) & console.log(req.body) at the start of updateMe method
  //upload.single('photo')
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);

router.delete(
  '/deleteMe',
  //authController.protect,
  userController.deleteMe
);

//restrict routes beyond this point to admins
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
