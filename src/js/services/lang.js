import { getTranslationFromLegacyKey } from "./translations";

/* Mediaflow main JS */
export default function lang(currentLanguage) {

  if (!currentLanguage || currentLanguage.length !== 5)
    currentLanguage = 'sv_SE';

  if (currentLanguage === 'en_GB') {
    currentLanguage = 'en_US';
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
      var dd = new Date(d);
      var s = '';

      if (currentLanguage === 'sv_SE') {
        s = dd.getDate() + ' ';
        switch (dd.getMonth()) {
          case 0:
            s += 'januari';
            break;
          case 1:
            s += 'februari';
            break;
          case 2:
            s += 'mars';
            break;
          case 3:
            s += 'april';
            break;
          case 4:
            s += 'maj';
            break;
          case 5:
            s += 'juni';
            break;
          case 6:
            s += 'juli';
            break;
          case 7:
            s += 'augusti';
            break;
          case 8:
            s += 'september';
            break;
          case 9:
            s += 'oktober';
            break;
          case 10:
            s += 'november';
            break;
          case 11:
            s += 'december';
            break;
        }
        s += ' ' + dd.getFullYear() + ' ';
        if (dd.getHours() < 10)
          s += '0' + dd.getHours();
        else
          s += dd.getHours();
        if (dd.getMinutes() < 10)
          s += ':0' + dd.getMinutes();
        else
          s += ':' + dd.getMinutes();
      } else if (currentLanguage === 'nb_NO') {
        s = dd.getDate() + ' ';
        switch (dd.getMonth()) {
          case 0:
            s += 'januar';
            break;
          case 1:
            s += 'februar';
            break;
          case 2:
            s += 'mars';
            break;
          case 3:
            s += 'april';
            break;
          case 4:
            s += 'mai';
            break;
          case 5:
            s += 'juni';
            break;
          case 6:
            s += 'juli';
            break;
          case 7:
            s += 'august';
            break;
          case 8:
            s += 'september';
            break;
          case 9:
            s += 'oktober';
            break;
          case 10:
            s += 'november';
            break;
          case 11:
            s += 'desember';
            break;
        }
        s += ' ' + dd.getFullYear() + ' ';
        if (dd.getHours() < 10)
          s += '0' + dd.getHours();
        else
          s += dd.getHours();
        if (dd.getMinutes() < 10)
          s += ':0' + dd.getMinutes();
        else
          s += ':' + dd.getMinutes();
      } else if (currentLanguage === 'fi_FI') {
        s = dd.getDate() + ' ';
        switch (dd.getMonth()) {
          case 0:
            s += 'tammikuuta';
            break;
          case 1:
            s += 'helmikuuta';
            break;
          case 2:
            s += 'maaliskuuta';
            break;
          case 3:
            s += 'huhtikuuta';
            break;
          case 4:
            s += 'toukokuuta';
            break;
          case 5:
            s += 'kesäkuuta';
            break;
          case 6:
            s += 'heinäkuuta';
            break;
          case 7:
            s += 'elokuuta';
            break;
          case 8:
            s += 'syyskuuta';
            break;
          case 9:
            s += 'lokakuuta';
            break;
          case 10:
            s += 'marraskuuta';
            break;
          case 11:
            s += 'joulukuuta';
            break;
        }
        s += ' ' + dd.getFullYear() + ' ';
        if (dd.getHours() < 10)
          s += '0' + dd.getHours();
        else
          s += dd.getHours();
        if (dd.getMinutes() < 10)
          s += ':0' + dd.getMinutes();
        else
          s += ':' + dd.getMinutes();
      } else {
        s = '';
        switch (dd.getMonth()) {
          case 0:
            s += 'January';
            break;
          case 1:
            s += 'February';
            break;
          case 2:
            s += 'March';
            break;
          case 3:
            s += 'April';
            break;
          case 4:
            s += 'May';
            break;
          case 5:
            s += 'June';
            break;
          case 6:
            s += 'July';
            break;
          case 7:
            s += 'August';
            break;
          case 8:
            s += 'September';
            break;
          case 9:
            s += 'October';
            break;
          case 10:
            s += 'November';
            break;
          case 11:
            s += 'December';
            break;
        }
        s += ' ' + dd.getDate() + ', ' + dd.getFullYear() + ', ';
        if (dd.getHours() == 0 || dd.getHours() == 12)
          s += '12';
        else
          s += (dd.getHours() % 12);
        if (dd.getMinutes() < 10)
          s += ':0' + dd.getMinutes();
        else
          s += ':' + dd.getMinutes();
        if (dd.getHours() < 12)
          s += ' a.m.';
        else
          s += ' p.m.';
      }

      return s;
    },
    formatShortDate: function (d) {
      var dd = new Date(d);
      var s = '';

      if (currentLanguage === 'sv_SE') {
        s = dd.getDate() + ' ';
        switch (dd.getMonth()) {
          case 0:
            s += 'januari';
            break;
          case 1:
            s += 'februari';
            break;
          case 2:
            s += 'mars';
            break;
          case 3:
            s += 'april';
            break;
          case 4:
            s += 'maj';
            break;
          case 5:
            s += 'juni';
            break;
          case 6:
            s += 'juli';
            break;
          case 7:
            s += 'augusti';
            break;
          case 8:
            s += 'september';
            break;
          case 9:
            s += 'oktober';
            break;
          case 10:
            s += 'november';
            break;
          case 11:
            s += 'december';
            break;
        }
        s += ' ' + dd.getFullYear() + ' ';
        if (dd.getHours() < 10)
          s += '0' + dd.getHours();
        else
          s += dd.getHours();
        if (dd.getMinutes() < 10)
          s += ':0' + dd.getMinutes();
        else
          s += ':' + dd.getMinutes();
      } else {
        s = '';
        switch (dd.getMonth()) {
          case 0:
            s += 'January';
            break;
          case 1:
            s += 'February';
            break;
          case 2:
            s += 'March';
            break;
          case 3:
            s += 'April';
            break;
          case 4:
            s += 'May';
            break;
          case 5:
            s += 'June';
            break;
          case 6:
            s += 'July';
            break;
          case 7:
            s += 'August';
            break;
          case 8:
            s += 'September';
            break;
          case 9:
            s += 'October';
            break;
          case 10:
            s += 'November';
            break;
          case 11:
            s += 'December';
            break;
        }
        s += ' ' + dd.getDate() + ', ' + dd.getFullYear();

      }

      return s;
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

      if (currentLanguage === 'sv_SE')
        return bytes.toFixed(1).replace('.', ',') + ' ' + units[u];
      else
        return bytes.toFixed(1) + ' ' + units[u];
    }
  };
}
