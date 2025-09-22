'use strict';

const fs = require('fs');
const path = require('path');

const file = process.env.SQLITE_FILE || './local.sqlite';
const dir = path.dirname(file);

fs.mkdirSync(dir, { recursive: true });
if (!fs.existsSync(file)) {
  fs.writeFileSync(file, '');
  console.log(`[drizzle] Created local SQLite file at: ${file}`);
} else {
  console.log(`[drizzle] SQLite file already exists at: ${file}`);
}
