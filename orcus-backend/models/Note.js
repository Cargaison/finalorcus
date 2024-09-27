// models/Note.js
const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
    pointId: { type: mongoose.Schema.Types.ObjectId, ref: 'Point' },
    connectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Connection' },
    text: String,
    image: String,
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
});

module.exports = mongoose.model('Note', NoteSchema);
