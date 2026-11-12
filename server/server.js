const app = require('../server');
const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => console.log(`Chronicle server running at http://localhost:${PORT}`));
}

module.exports = app;
