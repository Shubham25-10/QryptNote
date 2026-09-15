const fs = require('fs');
const i18next = require('i18next');

const en = JSON.parse(fs.readFileSync('./src/locales/en.json', 'utf8'));
i18next.init({
  lng: 'en',
  resources: { en: { translation: en } }
}).then(() => {
  console.log("pricing: ", i18next.t("pricing"));
  console.log("pricing.headline: ", i18next.t("pricing.headline"));
});
