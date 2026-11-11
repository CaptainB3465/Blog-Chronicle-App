const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const FILES = {
  users: path.join(DATA_DIR, 'users.json'),
  blogs: path.join(DATA_DIR, 'blogs.json')
};

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
Object.values(FILES).forEach((f) => {
  if (!fs.existsSync(f)) fs.writeFileSync(f, '[]');
});

function read(name) {
  try {
    return JSON.parse(fs.readFileSync(FILES[name], 'utf8'));
  } catch (e) {
    return [];
  }
}

function write(name, data) {
  fs.writeFileSync(FILES[name], JSON.stringify(data, null, 2));
}

module.exports = { read, write };
