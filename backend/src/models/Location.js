const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
  locationId:   { type: String, unique: true, index: true, required: true },
  name:         { type: String, required: true, index: true },
  city:         { type: String, index: true },
  province:     { type: String, index: true },
  lat:          { type: Number, index: true },
  lng:          { type: Number, index: true },
  type:         { type: String },
  avg_rating:   { type: Number },
  rating_count: { type: Number },
  tags:         [String],
  source:       { type: String, enum: ['ml', 'user', 'seed'], default: 'ml' },
  raw:          { type: Object }
}, { timestamps: true });

module.exports = mongoose.model('Location', LocationSchema);
