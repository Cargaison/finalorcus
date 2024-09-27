// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import des modèles
const Point = require('./models/Point');
const Connection = require('./models/Connection');
const Note = require('./models/Note');
const Tag = require('./models/Tag');

const app = express();
const port = 5000; // Vous pouvez changer le port si nécessaire

app.use(cors());
app.use(express.json());

// Connexion à la base de données MongoDB
mongoose.connect('mongodb://mongo:27017/relation-card', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Connecté à MongoDB'))
    .catch((err) => console.error('Erreur de connexion à MongoDB', err));

// Routes pour les points
app.get('/points', async (req, res) => {
    try {
        const points = await Point.find();
        res.json(points);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des points', error });
    }
});

app.post('/points', async (req, res) => {
    try {
        const point = new Point(req.body);
        await point.save();
        res.json(point);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la création du point', error });
    }
});

app.put('/points/:id', async (req, res) => {
    try {
        const point = await Point.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(point);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la mise à jour du point', error });
    }
});

app.delete('/points/:id', async (req, res) => {
    try {
        const pointId = req.params.id;

        // Supprimer le point
        await Point.findByIdAndDelete(pointId);

        // Supprimer les connexions associées
        await Connection.deleteMany({
            $or: [{ from: pointId }, { to: pointId }]
        });

        // Supprimer les notes associées
        await Note.deleteMany({ pointId: pointId });

        res.json({ message: 'Point et données associées supprimés' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la suppression du point', error });
    }
});

// Routes pour les connexions
app.get('/connections', async (req, res) => {
    try {
        const connections = await Connection.find().populate('from to');
        res.json(connections);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des connexions', error });
    }
});

app.post('/connections', async (req, res) => {
    try {
        let connection = new Connection({
            from: req.body.from,
            to: req.body.to,
        });
        await connection.save();

        // Recharger la connexion depuis la base de données avec les champs peuplés
        connection = await Connection.findById(connection._id).populate('from to');
        res.json(connection);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la création de la connexion', error });
    }
});

app.delete('/connections/:id', async (req, res) => {
    try {
        await Connection.findByIdAndDelete(req.params.id);
        res.json({ message: 'Connexion supprimée' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la suppression de la connexion', error });
    }
});

// Routes pour les notes
app.get('/notes', async (req, res) => {
    try {
        const notes = await Note.find().populate('pointId connectionId tags');
        res.json(notes);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des notes', error });
    }
});


app.post('/notes', async (req, res) => {
    try {
        const note = new Note({
            pointId: req.body.pointId,
            connectionId: req.body.connectionId,
            text: req.body.text,
            image: req.body.image,
            tags: req.body.tags,
        });
        await note.save();
        await note.populate('pointId connectionId tags');
        res.json(note);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la création de la note', error });
    }
});

// server.js

app.put('/notes/:id', async (req, res) => {
    try {
        const note = await Note.findByIdAndUpdate(req.params.id, req.body, { new: true });

        // Si la note est associée à un point et que des tags ont été ajoutés
        if (note.pointId && req.body.tags) {
            // Mettre à jour le point pour inclure les tags
            await Point.findByIdAndUpdate(note.pointId, {
                $addToSet: { tags: { $each: req.body.tags } },
            });
        }

        res.json(note);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la mise à jour de la note', error });
    }
});


app.delete('/notes/:id', async (req, res) => {
    try {
        await Note.findByIdAndDelete(req.params.id);
        res.json({ message: 'Note supprimée' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la suppression de la note', error });
    }
});

// Routes pour les étiquettes
app.get('/tags', async (req, res) => {
    try {
        const tags = await Tag.find();
        res.json(tags);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des étiquettes', error });
    }
});

app.post('/tags', async (req, res) => {
    try {
        const tag = new Tag(req.body);
        await tag.save();
        res.json(tag);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la création de l\'étiquette', error });
    }
});

// Démarrage du serveur
app.listen(port, () => {
    console.log(`Serveur backend démarré sur le port ${port}`);
});
