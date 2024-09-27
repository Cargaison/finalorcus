const mongoose = require('mongoose');

const ConnectionSchema = new mongoose.Schema({
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'Point' },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'Point' },
});

module.exports = mongoose.model('Connection', ConnectionSchema);
