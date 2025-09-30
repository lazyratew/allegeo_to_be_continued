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
  "tree_nuts": ["almond", "pecan", "walnut", "cashew", "pistachio", "hazelnut", "brazil nut", "macadamia nut", "nut", "marzipan", "nougat", "nut oil", "prunus dulcis", "carya illinoinensis", "juglans regia", "anacardium occidentale", "pistacia vera", "corylus"],
  "sesame": ["sesame", "sesame seed", "sesame oil", "sesamum indicum", "tahini", "benne", "til", "gingelly"],
  "mustard": ["mustard", "mustard seed", "mustard oil", "mustard powder", "mustard flour", "brassica"],
  "celery": ["celery", "celeriac", "celery seed", "celery salt", "celery stalk", "apium graveolens"],
  "lupin": ["lupin", "lupine", "lupin flour", "lupin seed", "lupinus"],
  "sulphites": ["sulphite", "sulfite", "sulfiting agents", "sulfur dioxide", "E220", "E221", "E222", "E223", "E224", "E225", "E226", "E227", "E228", "potassium metabisulfite", "sodium sulfite", "sodium bisulfite"],
  "corn": ["corn", "maize", "corn starch", "corn syrup", "high-fructose corn syrup", "HFCS", "dextrose", "maltodextrin", "polenta", "corn flour", "hominy", "zea mays"],
  "oats": ["oat", "oats", "oat flour", "oatmeal", "avena sativa", "rolled oats"],
  "barley": ["barley", "barley malt", "malt extract", "malt flavor", "barley flour", "hordeum vulgare"],
  "yeast": ["yeast", "yeast extract", "autolyzed yeast", "brewer's yeast", "nutritional yeast", "saccharomyces cerevisiae"],
  "nightshades": ["potato", "tomato", "bell pepper", "chilli", "paprika", "aubergine", "eggplant", "solanaceae", "capsicum"], 
  "kiwi": ["kiwi", "kiwifruit", "actinidia deliciosa"],
  "latex_fruits": ["avocado", "banana", "kiwi", "chestnut", "actinidia deliciosa", "persea americana", "musa"], 
  "legumes": ["chickpea", "lentil", "bean", "black bean", "kidney bean", "pinto bean", "fava bean", "mung bean", "vigna", "phaseolus", "cicer arietinum", "lens culinaris"],
  "garlic": ["garlic", "garlic powder", "garlic oil", "allium sativum"],
  "onion": ["onion", "onion powder", "onion extract", "allium cepa", "shallot", "scallion"],
  "MSG": ["monosodium glutamate", "MSG", "E621", "glutamate", "glutamic acid"],
  "cinnamon": ["cinnamon", "cinnamon bark", "cinnamomum"],
  "ginger": ["ginger", "ginger root", "zingiber officinale"],
  "cocoa": ["cocoa", "cacao", "chocolate", "theobroma cacao", "cacao butter", "cocoa solids"],
  "gelatin": ["gelatin", "gelatine", "collagen", "hydrolyzed collagen", "gelatin (bovine)", "gelatin (porcine)"], 
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