// routes/products.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const fetch = global.fetch; //I dont think this is needed 
const SearchHistory = require('../models/searchhistory');
const User = require('../models/user');
const DetectionResult = require('../models/detectionresult');
const { detectAllergensInText } = require('../utils/detectionLogic');
const { getUserAllergiesById } = require('../utils/userAllergyHelp');

router.get('/search', async (req, res) => {
  try {
    const email = req.session?.email;
    const userId = req.session?.userId;
    if (!email) return res.status(401).json({ error: 'Unauthorized: no session found' });

    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Query required' });

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

    //loading the user's allergies using the helper file
    const allergiesObj = await getUserAllergiesById(userId);

    // Map API response and detect allergens per product
    const products = (data.products || []).map(p => {
      const ingredientsArr = (p.ingredients_text || "").split(",").map(i => i.trim()).filter(Boolean);
      const productId = p.id || p._id || p.code || p.code || "";
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


    // 3. Save new search results to the database for caching
    await SearchHistory.create({
      email,
      query: qLower,
      results: products.map(p => ({
        productId: p.productId,
        name: p.name,
        brand: p.brand,
        ingredients: p.ingredients,
      }))
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
    const { product } = req.body;
    const email = req.session?.email;
    if (!email) return res.status(401).json({ error: "Unauthorized: no session found" });
    if (!product) return res.status(400).json({ error: "Product required" });

    const allergiesObj = await getUserAllergiesById(userId);
    const ingredientText = (product.ingredients || []).join(", ");
    const flagged = detectAllergensInText(ingredientText, allergiesObj);

    await DetectionResult.create({
      email,
      source: 'compare',
      query: product.name.toLowerCase(),
      inputText: null,
      products: [{
        productId: product.productId || product._id || product.code || "",
        name: product.name,
        brand: product.brand,
        ingredients: product.ingredients,
        flaggedAllergens: flagged
      }],
      flaggedSummary: flagged.map(f => ({ ...f, productId: product.productId || product._id || product.code || "" }))
    });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error in /products/storeSelected:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


//receive the detection results from results.html
router.post('/saveDetection', async (req, res) => {
  try {
    const { product, flaggedAllergens } = req.body;
    const email = req.session?.email;
    if (!email) return res.status(401).json({ error: "Unauthorized: no session found" });
    if (!product || !flaggedAllergens) return res.status(400).json({ error: "Product and flagged allergens required" });

    // Save the final detection results to the DetectionResult collection
    await DetectionResult.create({
      email,
      source: 'compare', // or whatever source you want
      query: product.name.toLowerCase(),
      inputText: null,
      products: [{
        productId: product.productId || product._id || product.code || "",
        name: product.name,
        brand: product.brand,
        ingredients: product.ingredients,
        flaggedAllergens: flaggedAllergens
      }],
      flaggedSummary: flaggedAllergens.map(f => ({
        ...f,
        productId: product.productId || product._id || product.code || ""
      }))
    });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error in /products/saveDetection:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
