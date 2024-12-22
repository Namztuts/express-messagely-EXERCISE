const Router = require('express').Router;
const router = new Router();
const ExpressError = require('../expressError');
const User = require('../models/user');
const { ensureLoggedIn, ensureCorrectUser } = require('../middleware/auth');

/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/
router.get('/', ensureLoggedIn, async (request, response, next) => {
   try {
      // NOTE: sending token with this request.body | with the authenticateJWT that runs before every route, this is takes the token and verifies it
      // the verified token returns the payload in request.user, which includes 'username' from logging in through the /login route
      const users = await User.all();
      return response.json({ users });
   } catch (error) {
      next(error);
   }
});

/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/
router.get(
   '/:username',
   ensureCorrectUser,
   async function (request, response, next) {
      try {
         // NOTE: looking for username in request.params
         const user = await User.get(request.params.username);
         return response.json({ user });
      } catch (error) {
         return next(error);
      }
   }
);

/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get(
   '/:username/to',
   ensureCorrectUser,
   async function (request, response, next) {
      try {
         const messages = await User.messagesTo(request.params.username);
         return response.json({ messages });
      } catch (error) {
         return next(error);
      }
   }
);

/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get(
   '/:username/from',
   ensureCorrectUser,
   async function (request, response, next) {
      try {
         const messages = await User.messagesFrom(request.params.username);
         return response.json({ messages });
      } catch (error) {
         return next(error);
      }
   }
);

module.exports = router;
