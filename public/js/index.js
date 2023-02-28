/* eslint-disable */
import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';
import { showAlert } from './alerts';

// DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data'); //.form-user-data is a class in a template
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour'); //book-tour is the ID that we declared in tour.js

// DELEGATION
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm)
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });

if (logOutBtn) logOutBtn.addEventListener('click', logout);

if (userDataForm)
  userDataForm.addEventListener('submit', e => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);


    //what we had initially but had to do as above bc of image uploads
    //const name = document.getElementById('name').value;
    //const email = document.getElementById('email').value;
    updateSettings(form, 'data');
  });

if (userPasswordForm)
  userPasswordForm.addEventListener('submit', async e => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Updating...';

    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );

    //save new password and then clear the fields where the user entered new password
    //by settng their values to ''
    document.querySelector('.btn--save-password').textContent = 'Save password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });

  //e is the event that we're waiting for, a button click in this case
  //event.target is the element that was clicked, the one that triggered the event listener to be fired
  //tour-id on line 91 in index.js is converted to tourId. This happens anytime there is a -
  if(bookBtn)
    bookBtn.addEventListener('click', e => {

      e.target.textContent = 'Processing...'; //change the text on the element
      //const tourId = e.target.dataset.tourId; //get the tourId from the data attribute that's on the button
      const { tourId } = e.target.dataset; //this is destructured
      bookTour(tourId); //call bookTour function in stripe.js with the Id
  });

const alertMessage = document.querySelector('body').dataset.alert;
if (alertMessage) showAlert('success', alertMessage, 20);