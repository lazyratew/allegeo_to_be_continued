// routes/products.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const fetch = global.fetch;
const SearchHistory = require('../models/searchhistory');
const User = require('../models/user');
const DetectionResult = require('../models/detectionresult');

const SYNONYMS = {
  "tomatoes": ["tomato", "tomato paste", "tomato sauce"],
  "peanuts": ["peanut", "groundnut", "arachis"],
  "milk": ["milk", "milk powder", "milk solids", "casein", "lactose"],
  "egg": ["egg", "egg yolk", "egg white", "albumen"],
  "wheat": ["wheat", "gluten", "spelt", "semolina"],
  "soy": ["soy", "soya", "soybean", "soya protein"],
  "fish": ["fish", "salmon", "cod", "tuna"],
  "shellfish": ["shrimp", "prawn", "crab", "lobster", "shellfish"],
  "strawberries": ["strawberry", "strawberries"],
};

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function detectAllergensInText(text, allergiesObj = {}) {
  const flagged = [];
  if (!text) return flagged;
  const normalized = text.toLowerCase();

  for (const [allergen, severity] of Object.entries(allergiesObj)) {
    const key = String(allergen).toLowerCase();
    // gather terms to test: the allergen name + synonyms if present
    const terms = new Set([key]);
    if (SYNONYMS[key]) {
      SYNONYMS[key].forEach(syn => terms.add(syn.toLowerCase()));
    }

    // test each term; stop on first match for this allergen
    for (const term of terms) {
      const rx = new RegExp('\\b' + escapeRegExp(term) + '\\b', 'i');
      if (rx.test(normalized) || normalized.includes(term)) {
        flagged.push({ allergen, severity, matchedIngredient: term });
        break; // avoid duplicate flags for same allergen
      }
    }
  }

  return flagged;
}


router.get('/search', async (req, res) => {
  try {
    const query = req.query.q;
    const email = req.query.email && req.query.email.toLowerCase();

    if (!query) return res.status(400).json({ error: 'Query required' });
    if (!email) return res.status(400).json({ error: 'Email required' });

    const qLower = query.toLowerCase();

    // 1. Check per-user cache
    const cached = await SearchHistory.findOne({ email, query: qLower });
    if (cached) {
      console.log('✅ Served products from cache for', email);
      return res.json(cached.results);
    }

    // 2. Fetch from OpenFoodFacts via axios
    const apiUrl = `https://world.openfoodfacts.org/cgi/search.pl`;
    const response = await axios.get(apiUrl, {
      params: {
        search_terms: query,
        search_simple: 1,
        action: 'process',
        json: 1,
        page_size: 5
      },
      timeout: 10000
    });
    const data = response.data || {};

    // Load user's allergies
    let allergiesObj = {};
    const user = await User.findOne({ email });
    if (user) {
      if (user.allergies instanceof Map) allergiesObj = Object.fromEntries(user.allergies);
      else if (typeof user.allergies === 'object') allergiesObj = user.allergies;
    }

    // Map API response and detect allergens per product
    const products = (data.products || []).map(p => {
      const ingredientsArr = (p.ingredients_text || "").split(",").map(i => i.trim()).filter(Boolean);
      const productId = p.id || p._id || p.code || p.code || "";
      // detect allergens across the ingredients string
      const ingredientText = (p.ingredients_text || "");
      const flagged = detectAllergensInText(ingredientText, allergiesObj);

      return {
        productId,
        name: p.product_name || "Unknown product",
        brand: p.brands || "Unknown brand",
        ingredients: ingredientsArr,
        flaggedAllergens: flagged
      };
    });

    // 4. Save detection summary (for UI + later retrieval)
    // Build a flattened flaggedSummary across all products
    const flaggedSummary = [];
    products.forEach(prod => {
      prod.flaggedAllergens.forEach(f => {
        flaggedSummary.push(Object.assign({}, f, { productId: prod.productId }));
      });
    });

    await DetectionResult.create({
      email,
      source: 'compare',
      query: qLower,
      inputText: null,
      products,
      flaggedSummary
    });
    console.log('🌍 Served from OpenFoodFacts API for', email);
    res.json(products);

  } catch (err) {
    console.error('❌ Error in /products/search:', err?.message || err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/storeSelected', async (req, res) => {
  try {
    const { email, product } = req.body;
    if (!email || !product) return res.status(400).json({ error: "Email and product required" });

    await SearchHistory.create({
      query: product.name.toLowerCase(),
      results: [product], // only this one
      email: email,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error in /products/storeSelected:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


module.exports = router;
