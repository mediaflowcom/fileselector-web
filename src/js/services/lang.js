import { getTranslationFromLegacyKey, getDateTimeTranslation } from "./translations";

const MONTH_KEYS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Locales using day-month-year ordering with a space separator (de-DE also uses DMY but with a dot, handled separately).
const DMY_LOCALES = new Set(['sv-SE', 'nb-NO', 'fi-FI', 'fr-FR', 'it-IT']);

function padTwo(value) {
  return value < 10 ? '0' + value : '' + value;
}

function monthName(monthIndex) {
  return getDateTimeTranslation(MONTH_KEYS[monthIndex]);
}

/* Mediaflow main JS */
export default function lang(currentLanguage) {

  if (!currentLanguage || currentLanguage.length !== 5)
    currentLanguage = 'sv-SE';

  currentLanguage = currentLanguage.replace(/_/g, '-');

  if (currentLanguage === 'en-GB') {
    currentLanguage = 'en-US';
  }

  function formatDmyDate(dd, withTime) {
    const daySep = currentLanguage === 'de-DE' ? '. ' : ' ';
    let s = dd.getDate() + daySep + monthName(dd.getMonth()) + ' ' + dd.getFullYear();
    if (withTime)
      s += ' ' + padTwo(dd.getHours()) + ':' + padTwo(dd.getMinutes());
    return s;
  }

  function formatUsDate(dd, withTime) {
    let s = monthName(dd.getMonth()) + ' ' + dd.getDate() + ', ' + dd.getFullYear();
    if (withTime) {
      const hours = dd.getHours();
      const hourDisplay = (hours === 0 || hours === 12) ? 12 : (hours % 12);
      const suffix = hours < 12 ? ' a.m.' : ' p.m.';
      s += ', ' + hourDisplay + ':' + padTwo(dd.getMinutes()) + suffix;
    }
    return s;
  }

  function isDmyLocale() {
    return DMY_LOCALES.has(currentLanguage) || currentLanguage === 'de-DE';
  }

  function formatDate(d, withTime) {
    const dd = new Date(d);
    return isDmyLocale() ? formatDmyDate(dd, withTime) : formatUsDate(dd, withTime);
  }


  return {
    locale: function () {
      return currentLanguage;
    },

    translate: function (key) {
      return getTranslationFromLegacyKey(key);
    },

    translateWithParams: function (key, params) {
      return getTranslationFromLegacyKey(key, params);
    },

    formatLongDate: function (d) {
      return formatDate(d, true);
    },

    formatShortDate: function (d) {
      return formatDate(d, false);
    },

    humanFileSize: function (bytes) {
      const thresh = 1024; /* i Mediaflow är det alltid 1024 */
      const units = ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

      if (Math.abs(bytes) < thresh) {
        return bytes + ' B';
      }

      var u = -1;
      var r = Math.pow(10, 1);

      do {
        bytes /= thresh;
        ++u;
      } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);

      const formatted = isDmyLocale() ? bytes.toFixed(1).replace('.', ',') : bytes.toFixed(1);
      return formatted + ' ' + units[u];
    }
  };
}
