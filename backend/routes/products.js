// routes/products.js
const express = require('express');
const router = express.Router();
const fetch = global.fetch;
const SearchHistory = require("../models/searchhistory");

const commonEnglishWords = new Set([
  "sugar","salt","oil","milk","butter","cocoa","flour","water","tomatoes",
  "chocolate","honey","egg","lupin","yeast","corn","celery","almond","soy",
  "peach","lemon","orange","apple","banana", "strawberries","strawberry", "rice","wheat","peanuts","hazelnut",
  "cocoa","powder","emulsifier", "sesame", "tree nuts", "soy", "fish", "shellfish", "gluten", "mustard", 
]);

function englishWordRatio(text) {
  const words = text
    .toLowerCase()
    .replace(/[^a-zA-Z\s]/g, ' ') // remove punctuation & accents
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return 0;
  const englishCount = words.filter(w => commonEnglishWords.has(w)).length;
  return englishCount / words.length;
}

function getEnglishProduct(products) {
  let bestProduct = null;
  let bestScore = 0;
  products.forEach(p => {
    const score = englishWordRatio(p.ingredients.join(" "));
    if (score > bestScore) {
      bestScore = score;
      bestProduct = p;
    }
  });
  return bestProduct;
}

// Search products from OpenFoodFacts
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q;
    const email = req.query.email;
    if (!query) return res.status(400).json({ error: "Query required" });
    if (!email) return res.status(400).json({ error: "Email required" });

    // 1. Check cache per-user
    const cached = await SearchHistory.findOne({
      email,
      query: query.toLowerCase(),
    });

    if (cached) {
      console.log("✅ Served from cache for", email);
      return res.json(cached.results);
    }

    // 2. Fetch from OpenFoodFacts API
    const apiUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
      query
    )}&search_simple=1&action=process&json=1&page_size=5`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    // Map the results to a simplified structure
    const products = (data.products || []).map((p) => ({
      productId: p.id || p._id || p.code || "", // fallback for OpenFoodFacts id
      name: p.product_name || "Unknown product",
      brand: p.brands || "Unknown brand",
      ingredients: (p.ingredients_text || "")
        .split(",")
        .map((i) => i.trim())
        .filter((i) => i),
    }));

    // 3. Save results for this user (7d TTL auto-applies)
    const englishProduct = getEnglishProduct(products);

    if (englishProduct) {
      await SearchHistory.create({
        email,
        query: query.toLowerCase(),
        results: [englishProduct], // store only this one
      });
      console.log("🌍 Stored only the English product for", email);
    } else {
      console.log("⚠️ No English product found for", email);
    }


    console.log("🌍 Served from OpenFoodFacts API for", email);
    if (englishProduct) {
      res.json([englishProduct]); // only send the English product
    } else {
      res.json([]); // no English product found
    }

  } catch (err) {
    console.error("❌ Error in /products/search:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;