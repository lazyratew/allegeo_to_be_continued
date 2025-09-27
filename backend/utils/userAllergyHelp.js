const User = require('../models/user');

/**
 * Fetches and formats user allergies from the database.
 * @param {string} userId The user's MongoDB ObjectId.
 * @returns {Promise<Object>} A promise that resolves to an object of allergies, or an empty object if not found.
 */
async function getUserAllergiesById(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found.');
      return {};
    }

    let allergiesObj = {};
    if (user.allergies instanceof Map) {
      allergiesObj = Object.fromEntries(user.allergies);
    } else if (typeof user.allergies === 'object') {
      allergiesObj = user.allergies;
    }
    
    return allergiesObj;
  } catch (err) {
    console.error('❌ Error fetching user allergies:', err);
    return {};
  }
}

module.exports = { getUserAllergiesById };