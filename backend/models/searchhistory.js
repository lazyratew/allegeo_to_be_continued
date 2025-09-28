const mongoose = require("mongoose");

const searchHistorySchema = new mongoose.Schema({
  email: {
    type: String,
    required: true, 
  },
  query: {
    type: String,
    required: true, // the search term typed by the user
  },
  Search_results: [
    {
      productId: String,  //OpenFoodFacts product id 
      name: String,       // product name
      brand: String,     
      ingredients: [String], // ingredient list returned
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
    expires: "5d", //auto-delete after 5 days
  },
});

module.exports = mongoose.model("SearchHistory", searchHistorySchema);
