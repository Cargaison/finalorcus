import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Directory.css';

const Directory = () => {
    const [points, setPoints] = useState([]);
    const [tags, setTags] = useState([]);
    const [notes, setNotes] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pointsPerPage] = useState(20);

    const [showAddPersonModal, setShowAddPersonModal] = useState(false);
    const [newPersonName, setNewPersonName] = useState('');
    const [selectedConnections, setSelectedConnections] = useState([]);

    const API_URL = 'http://134.209.239.6:5000'; // URL de votre backend

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pointsRes, tagsRes, notesRes] = await Promise.all([
                    axios.get(`${API_URL}/points`),
                    axios.get(`${API_URL}/tags`),
                    axios.get(`${API_URL}/notes`),
                ]);
                setPoints(pointsRes.data);
                setTags(tagsRes.data);

                // Organiser les notes par pointId
                const pointNotes = {};
                notesRes.data.forEach(note => {
                    if (note.pointId) {
                        pointNotes[note.pointId] = note.text;
                    }
                });
                setNotes(pointNotes);
            } catch (error) {
                console.error('Erreur lors du chargement des données', error);
            }
        };

        fetchData();
    }, []);

    // Filtrer les points en fonction de la recherche et du tag sélectionné
    const filteredPoints = points.filter(point => {
        const matchesSearch = point.name.toLowerCase().includes(searchQuery.toLowerCase());
        let matchesTag = true;

        if (selectedTag) {
            const pointTags = point.tags || []; // Supposons que les points ont une propriété 'tags'
            matchesTag = pointTags.includes(selectedTag);
        }

        return matchesSearch && matchesTag;
    });

    // Calculer les points à afficher sur la page actuelle
    const indexOfLastPoint = currentPage * pointsPerPage;
    const indexOfFirstPoint = indexOfLastPoint - pointsPerPage;
    const currentPoints = filteredPoints.slice(indexOfFirstPoint, indexOfLastPoint);

    // Changer de page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Gérer l'ajout d'une nouvelle personne
    const handleAddPerson = async (e) => {
        e.preventDefault();

        try {
            // Créer le nouveau point
            const newPointRes = await axios.post(`${API_URL}/points`, {
                type: 'person',
                x: 100, // Vous pouvez définir des coordonnées par défaut ou aléatoires
                y: 100,
                name: newPersonName,
            });
            const newPoint = newPointRes.data;

            // Mettre à jour l'état des points
            setPoints([...points, newPoint]);

            // Créer les connexions avec les points sélectionnés
            for (const pointId of selectedConnections) {
                await axios.post(`${API_URL}/connections`, {
                    from: newPoint._id,
                    to: pointId,
                });
            }

            // Mettre à jour les connexions locales si nécessaire

            // Réinitialiser les états et fermer la modale
            setNewPersonName('');
            setSelectedConnections([]);
            setShowAddPersonModal(false);
        } catch (error) {
            console.error('Erreur lors de l\'ajout de la personne', error);
        }
    };

    return (
        <div className="directory-container">
            <h2>Répertoire</h2>

            <div className="controldir">
                <button onClick={() => setShowAddPersonModal(true)}>Ajouter une personne</button>
            </div>

            <div className="filters">
                <input
                    type="text"
                    placeholder="Rechercher par nom..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                >
                    <option value="">Tous les tags</option>
                    {tags.map(tag => (
                        <option key={tag._id} value={tag._id}>
                            {tag.name}
                        </option>
                    ))}
                </select>
            </div>

            <table className="directory-table">
                <thead>
                <tr>
                    <th>Nom</th>
                    <th>Type</th>
                    <th>Tags</th>
                    <th>Notes</th> {/* Nouvelle colonne pour les notes */}
                </tr>
                </thead>
                <tbody>
                {currentPoints.map((point, index) => (
                    <tr
                        key={point._id}
                        style={{
                            opacity: 0,
                            animation: 'fadeInRow 0.5s forwards',
                            animationDelay: `${index * 0.1}s`,
                        }}
                    >
                        <td>{point.name}</td>
                        <td>{point.type}</td>
                        <td>
                            {/* Afficher les tags associés au point */}
                            {point.tags && point.tags.map((tagId, index) => {
                                const tag = tags.find(t => t._id === tagId);
                                return tag ? (
                                    <span key={index} className="tag" style={{ backgroundColor: tag.color }}>
                                            {tag.name}
                                        </span>
                                ) : null;
                            })}
                        </td>
                        <td>
                            {/* Afficher le début de la note associée au point */}
                            {notes[point._id] ? notes[point._id].substring(0, 50) + '...' : 'Aucune note'}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            {/* Pagination */}
            <div className="pagination">
                {Array.from({ length: Math.ceil(filteredPoints.length / pointsPerPage) }, (_, index) => (
                    <button
                        key={index + 1}
                        onClick={() => paginate(index + 1)}
                        className={currentPage === index + 1 ? 'active' : ''}
                    >
                        {index + 1}
                    </button>
                ))}
            </div>

            {/* Modale pour ajouter une personne */}
            {showAddPersonModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Ajouter une personne</h3>
                        <form onSubmit={handleAddPerson}>
                            <label>
                                Nom :
                                <input
                                    type="text"
                                    value={newPersonName}
                                    onChange={(e) => setNewPersonName(e.target.value)}
                                    required
                                />
                            </label>
                            <label>
                                Relier à :
                                <select
                                    multiple
                                    value={selectedConnections}
                                    onChange={(e) => setSelectedConnections([...e.target.selectedOptions].map(o => o.value))}
                                >
                                    {points.map(point => (
                                        <option key={point._id} value={point._id}>
                                            {point.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <button type="submit">Ajouter</button>
                            <button type="button " onClick={() => setShowAddPersonModal(false)}>Annuler</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Directory;
