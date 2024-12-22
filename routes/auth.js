const Router = require('express').Router;
const router = new Router();
const ExpressError = require('../expressError');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { SECRET_KEY } = require('../config');

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post('/login', async (request, response, next) => {
   try {
      const { username, password } = request.body; //grabbing username and password from body
      if (await User.authenticate(username, password)) {
         // if the user is authenticated, then create and respond with token
         const token = jwt.sign({ username }, SECRET_KEY);
         User.updateLoginTimestamp(username);

         return response.json({ token });
      } else {
         throw new ExpressError('Invalid username or password', 400);
      }
   } catch (error) {
      next(error);
   }
});

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
router.post('/register', async (request, response, next) => {
   try {
      // let { username } = await User.register(req.body); | NOTE: this is the below 3 lines in one line
      const userData = request.body; //grabbing all the user data from the body
      const user = await User.register(userData); //registering a user to the DB with our register() static method
      const { username } = user; //destructuring to grab the username

      let token = jwt.sign({ username }, SECRET_KEY); //creating token | results in {username:username}
      User.updateLoginTimestamp(username); //adding login stamp

      return response.json({ token });
   } catch (error) {
      return next(error);
   }
});

module.exports = router;
