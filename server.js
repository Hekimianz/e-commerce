const express = require("express");
const session = require("express-session");
const passport = require("./passport-config");

const { query } = require("./db/index");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const app = express();
const PORT = 3000;
const saltRounds = 10;

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "ad2f78a90e049a5f59b3d7f06211d9c8a0d721ec5ac6a5939f8e2b1e496309d7",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get("/products", async (req, res) => {
  try {
    const category = req.query.category;
    let queryText;
    if (category) {
      queryText = {
        text: "SELECT * FROM products WHERE category = $1 ORDER BY id",
        values: [category],
      };
    } else {
      queryText = "SELECT * FROM products ORDER BY id";
    }
    const result = await query(queryText);
    if (result.rows.length === 0) {
      throw new Error(`No products found`);
    }
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(404).json({ error: error.message });
  }
});

app.get("/products/:id", async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM products WHERE id = ${req.params.id}`
    );
    if (result.rows.length <= 0) {
      throw new Error(`Product with id of ${req.params.id} was not found.`);
    } else {
      res.json(result.rows);
    }
  } catch (error) {
    console.log(error);
    res.status(404).json({ error: error.message });
  }
});

// check if user exists
const checkForUser = async (username, email) => {
  try {
    const queryForName = {
      text: `SELECT * FROM users WHERE username = $1 OR email = $2`,
      values: [username, email],
    };

    const result = await query(queryForName);
    return result.rows.length > 0;
  } catch (error) {
    console.error(error);
    res.status(409).json({ error: error.message });
  }
};

app.post("/register", async (req, res) => {
  try {
    const { name, email, username, password } = req.body;
    const userExists = await checkForUser(username, email);
    if (userExists) {
      res.status(409).send("User already exists with that email/username");
    } else {
      const salt = await bcrypt.genSalt(saltRounds);
      const hash = await bcrypt.hash(password, salt);

      const result = await query(
        `INSERT INTO users (name, email, username, password) VALUES($1, $2, $3, $4) RETURNING id`,
        [name, email, username, hash]
      );
      res.status(201).send("User registered successfully");
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      // Send a response with the message from Passport strategy
      return res.status(401).json({ message: info.message });
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      // Send a success response
      res.redirect("/profile");
    });
  })(req, res, next);
});

app.get("/profile", isAuthenticated, (req, res) => {
  res.send(`Welcome, ${req.user.name}!`);
});

app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated) {
    return next();
  }
  res.redirect("/login");
}

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
