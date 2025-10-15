require('dotenv').config();
const { createServer } = require('http');
const app = require('./src/app');
const { connectMongo } = require('./src/config/db');

(async () => {
  await connectMongo();
  const port = process.env.PORT || 3000;
  createServer(app).listen(port, () => {
    console.log(`API listening on :${port}`);
  });
})();
