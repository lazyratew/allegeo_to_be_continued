// utils/detectionLogic.js

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

/**
 * Detects allergens from user allergies in a given text.
 * @param {string} text The text to scan for allergens.
 * @param {object} allergiesObj An object with allergen names as keys and severity as values.
 * @returns {Array<object>} An array of flagged allergens with their severity and matched ingredient.
 */
function detectAllergensInText(text, allergiesObj = {}) {
  const flagged = [];
  if (!text) return flagged;
  const normalized = text.toLowerCase();

  for (const [allergen, severity] of Object.entries(allergiesObj)) {
    const key = String(allergen).toLowerCase();
    const terms = new Set([key]);
    if (SYNONYMS[key]) {
      SYNONYMS[key].forEach(syn => terms.add(syn.toLowerCase()));
    }

    for (const term of terms) {
      const rx = new RegExp('\\b' + escapeRegExp(term) + '\\b', 'i');
      if (rx.test(normalized) || normalized.includes(term)) {
        flagged.push({ allergen, severity, matchedIngredient: term });
        break;
      }
    }
  }
  return flagged;
}

module.exports = {
  detectAllergensInText,
  SYNONYMS
};