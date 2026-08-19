const fs = require('fs');
const fd = fs.openSync('DATASET/DATASET_1/Places.csv', 'r');
const buf = Buffer.alloc(100);
fs.readSync(fd, buf, 0, 100, 0);
console.log('Places.csv header hex:', buf.toString('hex'));
console.log('Places.csv header UTF-8:', buf.toString('utf8'));
console.log('Places.csv header UTF-16LE:', buf.toString('utf16le'));
