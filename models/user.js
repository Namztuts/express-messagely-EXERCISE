/** User class for message.ly */
const db = require('../db');
const ExpressError = require('../expressError');
const bcrypt = require('bcrypt');
const { BCRYPT_WORK_FACTOR, SECRET_KEY } = require('../config');

/** User of the site. */
class User {
   /** register new user -- returns
    * {username, password, first_name, last_name, phone} */
   static async register({ username, password, first_name, last_name, phone }) {
      const hashedPass = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
      // NOTE: current_timestamp is built in to PSQL and returns current date/time (including timezone)
      const result = await db.query(
         `INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
          VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
          RETURNING username, password, first_name, last_name, phone`,
         [username, hashedPass, first_name, last_name, phone]
      );
      return result.rows[0];
   }

   /** Authenticate: is this username/password valid? Returns boolean. */
   static async authenticate(username, password) {
      //authenticate(req.body.user, req.body.pass)
      if (!username || !password) {
         throw new ExpressError('Username and Password required', 400);
      }
      const results = await db.query(
         `SELECT password
          FROM users
          WHERE username=$1`,
         [username]
      );
      const user = results.rows[0]; //should give us a user object from the DB
      if (!user) {
         throw new ExpressError('Invalid username or password', 400);
      }
      return await bcrypt.compare(password, user.password); // .compare returns a boolean
   }

   /** Update last_login_at for user */
   static async updateLoginTimestamp(username) {
      // NOTE: returning only really needs to be used on UPDATEs
      const result = await db.query(
         `UPDATE users
          SET last_login_at = current_timestamp
          WHERE username=$1
          RETURNING username`,
         [username]
      );
      if (!result.rows[0]) {
         throw new ExpressError(`Username of '${username}' not found`, 404);
      }
   }

   /** All: basic info on all users:
    * [{username, first_name, last_name, phone}, ...] */
   static async all() {
      const results = await db.query(
         `SELECT username, first_name, last_name, phone
          FROM users`
      );
      return results.rows;
   }

   /** Get: get user by username
    *
    * returns {username,
    *          first_name,
    *          last_name,
    *          phone,
    *          join_at,
    *          last_login_at } */
   static async get(username) {
      const result = await db.query(
         `SELECT username, first_name, last_name, phone, join_at, last_login_at 
          FROM users
          WHERE username = $1`,
         [username]
      );
      return result.rows[0];
   }

   /** Return messages from this user.
    *
    * [{id, to_user, body, sent_at, read_at}]
    *
    * where to_user is
    *   {username, first_name, last_name, phone}
    */
   static async messagesFrom(username) {
      const result = await db.query(
         `SELECT m.id, m.to_username, u.first_name, u.last_name, u.phone, m.body, m.sent_at, m.read_at
          FROM messages AS m
            JOIN users AS u ON m.to_username = u.username
          WHERE from_username = $1`,
         [username]
      );
      // creating an array of messages
      const fromMessages = result.rows.map((msg) => ({
         id: msg.id,
         to_user: {
            username: msg.to_username,
            first_name: msg.first_name,
            last_name: msg.last_name,
            phone: msg.phone,
         },
         body: msg.body,
         sent_at: msg.sent_at,
         read_at: msg.read_at,
      }));
      return fromMessages;
   }

   /** Return messages to this user.
    *
    * [{id, from_user, body, sent_at, read_at}]
    *
    * where from_user is
    *   {username, first_name, last_name, phone}
    */
   static async messagesTo(username) {
      const result = await db.query(
         `SELECT m.id, m.from_username, u.first_name, u.last_name, u.phone, m.body, m.sent_at, m.read_at
          FROM messages AS m
            JOIN users AS u ON m.from_username = u.username
          WHERE to_username = $1`,
         [username]
      );
      // creating an array of messages
      const fromMessages = result.rows.map((msg) => ({
         id: msg.id,
         from_user: {
            username: msg.from_username,
            first_name: msg.first_name,
            last_name: msg.last_name,
            phone: msg.phone,
         },
         body: msg.body,
         sent_at: msg.sent_at,
         read_at: msg.read_at,
      }));
      return fromMessages;
   }
}

module.exports = User;
