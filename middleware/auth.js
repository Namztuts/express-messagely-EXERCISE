/** Middleware for handling req authorization for routes. */
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config');
const db = require('../db');

/** Middleware: Authenticate user. */
function authenticateJWT(req, res, next) {
   try {
      const tokenFromBody = req.body.token;
      const payload = jwt.verify(tokenFromBody, SECRET_KEY);
      req.user = payload; // create a current user
      return next();
   } catch (err) {
      return next();
   }
}

/** Middleware: Requires user is authenticated. */
function ensureLoggedIn(req, res, next) {
   if (!req.user) {
      return next({ status: 401, message: 'Unauthorized' });
   } else {
      return next();
   }
}

/** Middleware: Requires correct username. */
function ensureCorrectUser(req, res, next) {
   try {
      if (req.user.username === req.params.username) {
         return next();
      } else {
         return next({ status: 401, message: 'Unauthorized' });
      }
   } catch (err) {
      // errors would happen here if we made a request and req.user is undefined
      return next({ status: 401, message: 'Unauthorized' });
   }
}
// end

// NOTE: this only works in tandem with the ensureLoggedIn
async function ensureIntendedRecipient(request, response, next) {
   try {
      const msgID = request.params.id;
      const result = await db.query(
         `SELECT to_username
        FROM messages
        WHERE id = $1`,
         [msgID]
      );
      if (result.rows.length === 0) {
         return next({ status: 401, message: 'Message not found' });
      }
      const recipient = result.rows[0].to_username;

      if (request.user.username !== recipient) {
         return next({ status: 401, message: 'Not intended recipient' });
      }
      return next();
   } catch (error) {
      return next({ status: 500, message: 'Internal server error' });
   }
}

async function checkMessageRecipients(request, response, next) {
   try {
      const msgID = request.params.id;
      const result = await db.query(
         `SELECT to_username, from_username
        FROM messages
        WHERE id = $1`,
         [msgID]
      );
      if (result.rows.length === 0) {
         return next({ status: 401, message: 'Message not found' });
      }
      console.log('**Logged in USER', request.user.username);
      console.log('**RESULT', result.rows[0]);
      console.log('**TO', result.rows[0].to_username);
      console.log('**FROM', result.rows[0].from_username);
      if (
         request.user.username !== result.rows[0].to_username &&
         request.user.username !== result.rows[0].from_username
      ) {
         return next({
            status: 401,
            message: "You don't have access to this message",
         });
      }
      // if we get here, the user is correct
      return next();
   } catch (error) {
      return next({ status: 500, message: 'Internal server error' });
   }
}

module.exports = {
   authenticateJWT,
   ensureLoggedIn,
   ensureCorrectUser,
   ensureIntendedRecipient,
   checkMessageRecipients,
};
