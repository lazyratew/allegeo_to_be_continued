// routes/products.js
const express = require('express');
const router = express.Router();
const fetch = require("node-fetch");
const axios = require('axios');
const SearchHistory = require("../models/searchhistory");


// Search products from OpenFoodFacts
router.get('/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.status(400).json({ error: 'Query required' });

        // 1. Check cache
        const cached = await SearchHistory.findOne({ query: query.toLowerCase() });
        if (cached) {
            console.log("✅ Served from cache");
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
            name: p.product_name || "Unknown product",
            brand: p.brands || "Unknown brand",
            ingredients: (p.ingredients_text || "")
                .split(",")
                .map((i) => i.trim())
                .filter((i) => i),
        }));

        // 3. Save results to DB (cache)
        await SearchHistory.create({
            query: query.toLowerCase(),
            results: products,
        });

        console.log("🌍 Served from OpenFoodFacts API");
        res.json(products);

    } catch (err) {
        console.error("❌ Error in /products/search:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;