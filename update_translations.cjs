const fs = require('fs');

const data = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));

// App
data.app.subtitle = "Secure, self-destructing encrypted messages and files";
data.app.create = "Create Note";

// Landing
data.landing.helmet_desc = "Turn any private message or file into a self-destructing QR code.";
data.landing.subheadline = "Turn any private message or file into a self-destructing QR code. Scan to read or download, then it vanishes forever. Secure, fast, and simple.";
data.landing.create_button = "Create Private Note";
data.landing.step1_desc = "Write your message and attach a secure file. We encrypt everything with AES-256 before it ever hits our servers.";
data.landing.step3_desc = "The recipient scans the code. After viewing or downloading, the note is permanently deleted.";
data.landing.use_case_2 = "Gift messages & secure files";

// Pricing
data.pricing.f_char = "Up to 500 characters & 10MB file per note";
data.pricing.p_char = "Up to 5,000 characters & 500MB file per note";
data.pricing.one_time_desc = "Don't want another subscription? You can also pay $1 per secure note with all Pro features unlocked.";

// Create
data.create.helmet_desc = "Encrypt a message and file and generate a self-destructing QR code.";
data.create.dest_desc = "The recipient has viewed the note, and it has been permanently erased from our servers.";
data.create.ready_desc = "Your private note is ready to share. ";
data.create.create_another = "Create another note";
data.create.subheadline = "Encrypt a message and file, and generate a self-destructing QR code.";

// View
data.view.helmet_desc = "Decrypt and view a secure note.";
data.view.scanning = "Scanning note...";
data.view.pass_desc = "This note is protected by a password.";
data.view.destroyed_desc = "This note has been viewed or expired and no longer exists.";
data.view.burn_desc = "This note will self-destruct. Do not reload the page.";
data.view.blur_msg = "Hover or tap to reveal note";
data.view.security_notice = "This note will be destroyed immediately if you switch apps, switch tabs, or leave this screen. It will remain visible as long as you stay on this page. Note: screenshots and screen recording cannot be detected by any website — this protection only applies to switching away from this screen.";
data.view.destroyed_navigated = "This note was closed because you navigated away, and can no longer be viewed";

// Write it back
fs.writeFileSync('src/locales/en.json', JSON.stringify(data, null, 2));
console.log("Translations updated!");
