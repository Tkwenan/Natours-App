const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.patch(
  '/updateMyPassword',
  authController.protect,
  authController.updatePassword
);

//authController.protect - this is a protected route - so only the currently logged in user
//can update the data. The ID of the user that will be updated comes from req.user
//which is set by the authController.protect middleware which in turn got the ID from the jwt
//no one can change the ID in the jwt without knowing the secret,we know that the id is safe
router.patch('/updateMe', authController.protect, userController.updateMe);

router.delete('/deleteMe', authController.protect, userController.deleteMe);

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
