/*eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe('pk_test_51MTTa2BwfnUhayYNge20ZvdLOj50qtnkVGirQWYNRCDVE8TVg8XHqTOs5dKKk7EsB8WeWhkQcrq3wwfCMVqad6y200k7CXC2JM'); //Stripe object. pass in the public key from stripe

//we get the tourId from the user interface in tour.pug (see bottom of file)
//in index.js, we connect the green 'checkout' button with this function
export const bookTour = async tourId => {
    try{
    // 1) Get checkout session from API/server(?)
    //this is where we use the checkout-session route in bookingRoute
    //we await a https request using axios
    //when all we want to do is a simple get request, we just pass in the URL
    //as opposed to the method, the url and the data
    const session = await axios(`http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`);

    // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
        sessionId: session.data.session.id
    });
} catch (err) {
        //show an alert if there is an error so that the user can see that something went wrong
        showAlert('error', err);

    }
};