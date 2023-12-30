const express = require("express");
const { query } = require("./db/index");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const app = express();
const PORT = 3000;
const saltRounds = 10;

app.use(bodyParser.json());

app.get("/products", async (req, res) => {
  try {
    const result = await query("SELECT * FROM products ORDER BY id");
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

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
