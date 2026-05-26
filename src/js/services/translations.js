let translations = {};
let dateTimeTranslations = {};
const defaultLangCode = 'sv-SE';
const cacheTime = 1000 * 60 * 60 * 3; // 3 hours
const translationBase = 'fileSelector';
const dateTimeTranslationBase = 'app.dateTime';
const translationSectionsMappings = {CROPPER_: 'cropper', FILE_INFO_: 'fileInfo', FILE_VIEW_: 'fileView'};
const validLanguageCodes = ['en-GB', 'en-US', 'sv-SE', 'de-DE', 'nb-NO', 'fi-FI', 'fr-FR', 'it-IT'];
const localStorageName = 'fsTranslations';
const dateTimeLocalStorageName = 'fsDateTimeTranslations';
let currentLangCode = defaultLangCode;

export async function initTranslations(locale) {
  const _languageCode = locale.replace(/_/g, '-'); // Replace underscores with hyphens to match the format used in the API, i.e. 'en_GB' to 'en-GB'
  const _langCode = validLanguageCodes.find((code) => code === _languageCode) ?? defaultLangCode;
  currentLangCode = _langCode;

  let _translations = getWithExpiry(localStorageName);
  let _dateTimeTranslations = getWithExpiry(dateTimeLocalStorageName);

  const loadPromises = [];

  if (_translations === null || _translations[currentLangCode] === undefined) {
    loadPromises.push(
      loadDictionary(currentLangCode, translationBase, localStorageName).then((result) => {
        _translations = result;
      })
    );
  }

  if (_dateTimeTranslations === null || _dateTimeTranslations[currentLangCode] === undefined) {
    loadPromises.push(
      loadDictionary(currentLangCode, dateTimeTranslationBase, dateTimeLocalStorageName).then((result) => {
        _dateTimeTranslations = result;
      })
    );
  }

  await Promise.all(loadPromises);

  translations = _translations;
  dateTimeTranslations = _dateTimeTranslations;
}

/** Get the current language code
 * @param {string} section - The translation section (e.g., 'general', 'cropper', etc.)
 * @param {string} key - The translation key (e.g. 'fileSize', 'licenseHasExpired', etc.)
 * @returns {string} The translation for the current language.
 */
export function getTranslation(section, key){
  return _getTranslation(section, key);
}

export function getTranslationFromLegacyKey(key, params = null) {
  var mappedResponse = mapToSectionAndKey(key);
  const translationSection = mappedResponse.translationSection;
  const translationKey = mappedResponse.translationKey;

  return _getTranslation(translationSection, translationKey, params);
}

/** Get a translation from the flat app.dateTime dictionary.
 * @param {string} key - dateTime key (e.g. 'January', 'Monday', 'today').
 * @returns {string} Translation for the current language, falling back to the default language, then the key itself.
 */
export function getDateTimeTranslation(key) {
  return dateTimeTranslations[currentLangCode]?.[key]
    ?? dateTimeTranslations[defaultLangCode]?.[key]
    ?? key;
}

function _getTranslation(section, key, params) {
  const currentTranslation = translations[currentLangCode]?.[section]?.[key];
  if (currentTranslation !== undefined) {
    return params ? currentTranslation.replace(/\{(\d+)\}/g, (_, index) => params[index]) : currentTranslation;
  }

  console.warn(`Could not find translation for key: '${section}.${key}' and language: '${currentLangCode}'`);

  const defaultTranslation = translations[defaultLangCode]?.[section]?.[key];
  if (currentLangCode === defaultLangCode || defaultTranslation === undefined) {
    console.warn(`Could not find translation for key: '${section}.${key}' and language: '${defaultLangCode}'`);
    return `[${translationBase}.${section}.${key}]`;
  }

  return params ? defaultTranslation.replace(/\{(\d+)\}/g, (_, index) => params[index]) : defaultTranslation;
}


async function loadDictionary(languageCode, dictionaryBase, storageKey) {
  const languageCodes = new Set([languageCode, defaultLangCode]); // always load default language as well
  let _translations = {};

  try {
    for (const langCode of languageCodes) {
      const response = await fetch(`https://api.mediaflow.com/1/dictionary/${dictionaryBase}/${langCode}`);
      if (!response.ok) {
        console.error(`Error fetching translations for ${dictionaryBase} language code: ${langCode}`);
        continue;
      }
      const dic = await response.json();
      _translations[langCode] = dic;
    }
    setWithExpiry(storageKey, _translations, cacheTime);
  } catch (error) {
    console.error(`Error fetching ${dictionaryBase} translations:`, error);
  }

  return _translations;
}

// Function to set an item in localStorage with an expiration time
function setWithExpiry(key, translations, ttl) {
  const now = new Date();

  // Create an object with the value and the expiration timestamp
  const item = {
    translations: translations,
    expiry: now.getTime() + ttl,
  };

  localStorage.setItem(key, JSON.stringify(item));
}

// Function to get an item from localStorage and check if it's expired
function getWithExpiry(key) {
  const itemStr = localStorage.getItem(key);

  // If the item doesn't exist, return null
  if (!itemStr) {
    return null;
  }

  const item = JSON.parse(itemStr);
  const now = new Date();

  // Compare the current time with the expiry time
  if (now.getTime() > item.expiry) {
    // Item has expired, remove it from localStorage and return null
    localStorage.removeItem(key);
    return null;
  }

  return item.translations;
}

function mapToSectionAndKey(keyToMap) {
  let translationSection = "";
  let translationKey = "";
  for (const key in translationSectionsMappings) {
    if (keyToMap.startsWith(key)) {
        translationSection = translationSectionsMappings[key]; // Return the corresponding value
        translationKey = toCamelCase(keyToMap.replace(key, "")); // Transform the remaining "key" to camelCase to match the dictionary keys
        break; // Exit the loop once we find the match
    }
  }
  if(translationSection === "") {
    translationSection = "general";
    translationKey = toCamelCase(keyToMap); // If no section found, use the original key in camelCase
  }

  return {translationSection, translationKey}; // Return the section and the key

  // To get it to work with existing key strings
  function toCamelCase(input) {
    // Check if the input contains underscores
    if (!input.includes("_")) {
      return input.toLowerCase(); // If no underscores, just return lowercase
    }
  
    // Convert to camelCase for strings with underscores
    return input
      .toLowerCase()
      .replace(/_([a-z0-9])/g, (match, letter) => letter.toUpperCase());
  }
}
