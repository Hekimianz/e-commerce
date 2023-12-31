const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const { query } = require("./db/index");

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      // Check if the user with the given username exists
      const userQuery = {
        text: `SELECT * FROM users WHERE username = $1`,
        values: [username],
      };
      const results = await query(userQuery);

      if (results.rows.length === 0)
        return done(null, false, { message: "User not found" });

      const user = results.rows[0];

      // Verify the password
      const passwordsMatch = await bcrypt.compare(password, user.password);
      if (!passwordsMatch)
        return done(null, false, { message: "Incorrect password" });
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    // Retrieve the user from the database by ID
    const userQuery = {
      text: "SELECT * FROM users WHERE id = $1",
      values: [id],
    };

    const result = await query(userQuery);

    if (result.rows.length === 0) {
      return done(null, false);
    }

    const user = result.rows[0];
    return done(null, user);
  } catch (error) {
    return done(error);
  }
});

module.exports = passport;
