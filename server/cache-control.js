'use-strict'

module.exports = () => {
  return function cacheControl(req, res, next) {
    if (req.method == 'GET') {
      let maxAge;
      maxAge = 90;
      res.set('Cache-Control', 'public, max-age=' + maxAge);
      next();
    } else {
      next();
    }
  };
};