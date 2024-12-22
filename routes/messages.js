const Router = require('express').Router;
const router = new Router();
const ExpressError = require('../expressError');
const User = require('../models/user');
const Message = require('../models/message');
const {
   ensureLoggedIn,
   ensureCorrectUser,
   ensureIntendedRecipient,
   checkMessageRecipients,
} = require('../middleware/auth');
const { request, response } = require('../app');

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
// NOTE: need to send token with request
router.get(
   '/:id',
   ensureLoggedIn,
   checkMessageRecipients,
   async (request, response, next) => {
      try {
         const message = await Message.get(request.params.id);
         return response.json({ message });
      } catch (error) {
         next(error);
      }
   }
);

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post('/', ensureLoggedIn, async (request, response, next) => {
   try {
      const messageData = request.body;
      const { from_username, to_username, body } = messageData;
      if (!from_username || !to_username || !body) {
         throw new ExpressError('Missing a required field', 400);
      }
      // NOTE: must send the variables wrapped in curly braces
      const newMessage = await Message.create({
         from_username,
         to_username,
         body,
      });

      return response.json({ newMessage });
   } catch (error) {
      next(error);
   }
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post(
   '/:id/read',
   ensureLoggedIn,
   ensureIntendedRecipient,
   async (request, response, next) => {
      // NOTE: need to send token to access this route
      try {
         const readMessage = await Message.markRead(request.params.id);
         return response.json({ readMessage });
      } catch (error) {
         next(error);
      }
   }
);
module.exports = router;
