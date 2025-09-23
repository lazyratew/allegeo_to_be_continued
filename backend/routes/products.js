// routes/products.js
const express = require('express');
const router = express.Router();
const fetch = global.fetch;
const SearchHistory = require("../models/searchhistory");

// Search products from OpenFoodFacts
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q;
    const email = req.query.email;
    if (!query) return res.status(400).json({ error: "Query required" });
    if (!email) return res.status(400).json({ error: "Email required" });

    // 1. Fetch from OpenFoodFacts API
    const apiUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
      query
    )}&search_simple=1&action=process&json=1&page_size=5`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    // 2. Map the result
    const products = (data.products || []).map((p) => ({
      productId: p.id || p._id || p.code || "", // fallback for OpenFoodFacts id
      name: p.product_name || "Unknown product",
      brand: p.brands || "Unknown brand",
      ingredients: (p.ingredients_text || "")
        .split(",")
        .map((i) => i.trim())
        .filter((i) => i),
    }));


    res.json(products); // send all results, no filtering
  } catch (err) {
    console.error("❌ Error in /products/search:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Store selected product in MongoDB
router.post('/storeSelected', async (req, res) => {
  try {
    const { email, product } = req.body;
    if (!email || !product) return res.status(400).json({ error: "Missing data" });

    await SearchHistory.create({
      email,
      query: product.name.toLowerCase(),
      results: [product], // store only selected product
    });

    res.json({ message: "Product stored successfully" });
  } catch (err) {
    console.error("❌ Error in /products/storeSelected:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;