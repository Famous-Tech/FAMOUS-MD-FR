const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DB_Schema = new Schema({
  name: { type: String, required: true },
  path: { type: String, required: true },
  installedAt: { type: Date, default: Date.now }
});

const Plugin = mongoose.model('Plugin', DB_Schema);

module.exports = Plugin;
