// models/Point.js

const mongoose = require('mongoose'); // Importation de mongoose

const PointSchema = new mongoose.Schema({
    type: String,
    x: Number,
    y: Number,
    name: String,
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }], // Si vous avez ajouté les tags
});

module.exports = mongoose.model('Point', PointSchema);
