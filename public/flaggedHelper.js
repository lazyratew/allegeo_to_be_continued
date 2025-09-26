// Helper for managing flagged allergy results in localStorage
/*Provides:
- pushFlaggedAllergyResult(entry)
-migrateLegacyFlaggedKeys() */
(function () {
  const KEY = 'flaggedAllergyResults';
  const FOUR_DAYS_MS = 4 * 24 * 60 * 60 * 1000;
  const DEFAULT_DEDUPE_MS = 5 * 60 * 1000; // 5 minutes

  function safeParse(raw) {
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  function prune(results) {
    const now = Date.now();
    return (results || []).filter(r => r && r.timestamp && (now - r.timestamp) <= FOUR_DAYS_MS);
  }

  // entry: { productName, allergies: [{allergen,severity,source,productName,matchedIngredient}], inputText?, source? }
  function pushFlaggedAllergyResult(entry = {}, opts = {}) {
    try {
      if (!entry || !Array.isArray(entry.allergies) || entry.allergies.length === 0) return;
      const now = Date.now();
      const raw = localStorage.getItem(KEY);
      let arr = safeParse(raw) || [];

      // prune old first
      arr = prune(arr);

      const dedupeWindow = (opts.dedupeWindowMs != null) ? opts.dedupeWindowMs : DEFAULT_DEDUPE_MS;
      const newEntry = {
        timestamp: now,
        productName: entry.productName || '',
        allergies: entry.allergies.map(a => Object.assign({}, a)),
        inputText: entry.inputText || null,
        source: entry.source || null
      };

      // newest-first array: check newest entry for duplicate
      const newest = arr[0];
      const isSame = newest && newest.productName === newEntry.productName && JSON.stringify(newest.allergies) === JSON.stringify(newEntry.allergies);
      const withinWindow = newest && ((now - newest.timestamp) < dedupeWindow);

      if (isSame && withinWindow) {
        // refresh timestamp and merge optional fields
        newest.timestamp = now;
        if (newEntry.inputText) newest.inputText = newEntry.inputText;
        if (newEntry.source) newest.source = newEntry.source;
        arr[0] = newest;
      } else {
        arr.unshift(newEntry);
      }

      // final prune (safety) then persist
      arr = prune(arr);
      localStorage.setItem(KEY, JSON.stringify(arr));
    } catch (e) {
      console.error('pushFlaggedAllergyResult error', e);
    }
  }

  // Migrate old keys: flaggedAllergies (array), flaggedProductName, flaggedScanText
  function migrateLegacyFlaggedKeys() {
    try {
      const legacyRaw = localStorage.getItem('flaggedAllergies');
      const legacy = safeParse(legacyRaw);
      const legacyProduct = localStorage.getItem('flaggedProductName');
      const legacyText = localStorage.getItem('flaggedScanText');
      if (legacy && Array.isArray(legacy) && legacy.length) {
        const allergies = legacy.map(f => ({
          allergen: f.allergen || f.name || '',
          severity: f.severity || f.level || 'Unknown',
          source: f.source || 'Scan',
          productName: f.productName || legacyProduct || '',
          matchedIngredient: f.matchedIngredient || ''
        }));
        pushFlaggedAllergyResult({ productName: legacyProduct || '', allergies, inputText: legacyText || '', source: 'legacy' });
        // remove legacy keys so migration is one-time
        localStorage.removeItem('flaggedAllergies');
        localStorage.removeItem('flaggedProductName');
        localStorage.removeItem('flaggedScanText');
      }
    } catch (e) {
      console.warn('migrateLegacyFlaggedKeys failed', e);
    }
  }

  // Expose to global
  window.pushFlaggedAllergyResult = pushFlaggedAllergyResult;
  window.migrateLegacyFlaggedKeys = migrateLegacyFlaggedKeys;
})();
