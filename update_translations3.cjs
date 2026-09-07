const fs = require('fs');
let data = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));

if (data.view) {
  data.view.downloading = "Downloading...";
  data.view.downloaded = "Downloaded";
  fs.writeFileSync('src/locales/en.json', JSON.stringify(data, null, 2));
  console.log("Translations updated!");
}
