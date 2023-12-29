const express = require("express");
const app = express();
const PORT = 3000;
const { query } = require("./db/index");

app.get("/products", async (req, res) => {
  try {
    const result = await query("SELECT * FROM products");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
