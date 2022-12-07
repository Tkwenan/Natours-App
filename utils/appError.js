class AppError extends Error{

    //the constructor method is called each time that 
    //we create an object out of this class
    constructor(message, statusCode){
        //call the superclass' constructor
        //this call is almost equivalent to setting
        //this.message = message
        super(message);

        this.statusCode = statusCode;

        //convert the status code to a string 
        //and use the startsWith method 
        //if the status code as a string starts with a 4, then the 
        //status is 'fail'; 
        //and an error otherwise
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        
        //all the errors we create will be operational
        //all errors that we create from this class will have this 
        //property set to true
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
