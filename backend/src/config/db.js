const mongoose = require('mongoose');

async function connectMongo() {
  const uri = process.env.DB_URI;
  if (!uri) throw new Error('DB_URI is not set');
  await mongoose.connect(uri, { autoIndex: true });
  console.log('Mongo connected');
}

module.exports = { connectMongo };
