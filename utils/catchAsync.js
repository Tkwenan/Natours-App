module.exports = fn => {
  //this is the anonymopus function that Express is going to call
  return (req, res, next) => {
    //can also be written as
    // fn(req, res, next).catch(next);

    fn(req, res, next).catch(err => next(err));
  };
};
