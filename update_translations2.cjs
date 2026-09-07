const fs = require('fs');
let data = fs.readFileSync('src/locales/en.json', 'utf8');

data = data.replace(/"helmet_desc": "Simple, transparent pricing for QryptNote's secure message features."/, '"helmet_desc": "Simple, transparent pricing for QryptNote\'s secure note features."');
data = data.replace(/"helmet_title": "Create Secure Message \| QryptNote"/, '"helmet_title": "Create Secure Note | QryptNote"');
data = data.replace(/"msg_destroyed": "Message Self-Destructed"/, '"msg_destroyed": "Note Self-Destructed"');
data = data.replace(/"msg_saved": "Message Encrypted & Saved"/, '"msg_saved": "Note Encrypted & Saved"');
data = data.replace(/"headline": "Create Private Message"/, '"headline": "Create Private Note"');
data = data.replace(/"limit_err": "You've reached the daily limit for creating private messages to prevent abuse. Please try again later or upgrade to Pro."/, '"limit_err": "You\'ve reached the daily limit for creating private notes to prevent abuse. Please try again later or upgrade to Pro."');
data = data.replace(/"your_msg": "Your Message"/, '"your_msg": "Your Note"');
data = data.replace(/"type_here": "Type your secret message here..."/, '"type_here": "Type your secret note here..."');

data = data.replace(/"helmet_title": "View Secure Message \| QryptNote"/, '"helmet_title": "View Secure Note | QryptNote"');
data = data.replace(/"unlock": "Unlock Message"/, '"unlock": "Unlock Note"');
data = data.replace(/"destroyed_title": "Message Destroyed"/, '"destroyed_title": "Note Destroyed"');
data = data.replace(/"secret_msg": "Secret Message"/, '"secret_msg": "Secret Note"');
data = data.replace(/"copy": "Copy Message"/, '"copy": "Copy Note"');

// Error messages
data = data.replace(/"msg_too_long": "Message is too long. Max \{\{max\}\} characters."/, '"msg_too_long": "Note is too long. Max {{max}} characters."');
data = data.replace(/"msg_not_found": "Message not found or expired."/, '"msg_not_found": "Note not found or expired."');
data = data.replace(/"msg_view_limit": "Message has reached its view limit."/, '"msg_view_limit": "Note has reached its view limit."');
data = data.replace(/"decrypt_failed": "Failed to decrypt message."/, '"decrypt_failed": "Failed to decrypt note."');

fs.writeFileSync('src/locales/en.json', data);
console.log("Translations updated round 2!");
