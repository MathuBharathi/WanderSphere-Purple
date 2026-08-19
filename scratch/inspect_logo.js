const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../public/logo.png');
const buffer = fs.readFileSync(file);
console.log('File size:', buffer.length);
console.log('First 16 bytes:', buffer.subarray(0, 16));
console.log('UTF8 preview:', buffer.toString('utf8', 0, 100));
