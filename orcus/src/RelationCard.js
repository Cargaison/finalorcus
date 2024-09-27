// RelationCard.js

import React, { useState, useEffect, useRef, useContext } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import axios from 'axios';
import Modal from './Modal';
import './RelationCard.css';
import { NodeContext } from './NodeContext';

const RelationCard = () => {
    const { nodes } = useContext(NodeContext);
    const [points, setPoints] = useState([]);
    const [connections, setConnections] = useState([]);
    const [notes, setNotes] = useState({
        points: {},
        connections: {},
    });
    const [tags, setTags] = useState([]);

    // États pour le drag and drop
    const [dragging, setDragging] = useState(null);
    const [disablePan, setDisablePan] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // États pour la sélection
    const [selectedPoints, setSelectedPoints] = useState([]);
    const [selectedConnection, setSelectedConnection] = useState(null);

    // États pour les modes
    const [readOnlyMode, setReadOnlyMode] = useState(false);
    const [deleteMode, setDeleteMode] = useState(false);
    const [intelligenceMode, setIntelligenceMode] = useState(false);

    // États pour les modales
    const [showAddPointModal, setShowAddPointModal] = useState(false);
    const [pointTypeToAdd, setPointTypeToAdd] = useState('person');
    const [newPointName, setNewPointName] = useState('');

    const [showCreateTagModal, setShowCreateTagModal] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('#ff0000');

    const [showApplyTagModal, setShowApplyTagModal] = useState(false);
    const [selectedTagId, setSelectedTagId] = useState('');

    // États pour les délais d'animation
    const [pointDelays, setPointDelays] = useState({});
    const [connectionDelays, setConnectionDelays] = useState({});

    // États pour le panneau de notes
    const [showNotesPanel, setShowNotesPanel] = useState(false);
    const [closingNotesPanel, setClosingNotesPanel] = useState(false);

    // État pour les coordonnées du centre (déclaré avant utilisation)
    const [center, setCenter] = useState({ x: 0, y: 0 });

    // Référence pour stocker l'état de transformation
    const transformStateRef = useRef(null);

    // Référence au conteneur principal
    const containerRef = useRef(null);

    // URL du backend
    const apiUrl = 'http://134.209.239.6:5000'; // Remplacez par l'URL de votre backend si nécessaire

    // Liste des couleurs possibles pour les tags
    const defaultColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];

    // Fonction pour mettre à jour les coordonnées du centre
    const updateCenter = (state) => {
        const container = containerRef.current;
        if (!container) return;

        const { clientWidth, clientHeight } = container;
        const { scale, positionX, positionY } = state;

        const centerX = (-positionX + clientWidth / 2) / scale;
        const centerY = (-positionY + clientHeight / 2) / scale;

        setCenter({ x: Math.round(centerX), y: Math.round(centerY) });
    };

    // Charger les données depuis le backend lors du montage du composant
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pointsRes, connectionsRes, notesRes, tagsRes] = await Promise.all([
                    axios.get(`$http://134.209.239.6:5000/points`),
                    axios.get(`$http://134.209.239.6:5000/connections`),
                    axios.get(`$http://134.209.239.6:5000/notes`),
                    axios.get(`$http://134.209.239.6:5000/tags`),
                ]);

                const loadedPoints = pointsRes.data;
                setPoints(loadedPoints);

                // Calculer les délais d'animation pour les points existants
                const delays = {};
                loadedPoints.forEach((point, index) => {
                    delays[point._id] = index * 0.02; // Délai en secondes
                });
                setPointDelays(delays);

                // Filtrer les connexions invalides
                const validConnections = connectionsRes.data.filter(connection => {
                    const fromPointId = connection.from._id || connection.from;
                    const toPointId = connection.to._id || connection.to;

                    const fromPointExists = loadedPoints.some(p => p._id === fromPointId);
                    const toPointExists = loadedPoints.some(p => p._id === toPointId);

                    return fromPointExists && toPointExists;
                });
                setConnections(validConnections);

                // Calculer les délais d'animation pour les connexions existantes
                const connDelays = {};
                validConnections.forEach((connection) => {
                    const fromPointId = connection.from._id || connection.from;
                    const toPointId = connection.to._id || connection.to;
                    const delay = Math.max(delays[fromPointId] || 0, delays[toPointId] || 0) + 0.02;
                    connDelays[connection._id] = delay;
                });
                setConnectionDelays(connDelays);

                // Séparer les notes des points et des connexions
                const pointNotes = {};
                const connectionNotes = {};

                notesRes.data.forEach(note => {
                    if (note.pointId) {
                        pointNotes[note.pointId._id || note.pointId] = note;
                    } else if (note.connectionId) {
                        connectionNotes[note.connectionId._id || note.connectionId] = note;
                    }
                });

                setNotes({ points: pointNotes, connections: connectionNotes });

                setTags(tagsRes.data);

                // Initialiser les coordonnées du centre après le chargement des données
                const initialState = transformStateRef.current;
                if (initialState) {
                    updateCenter(initialState);
                }
            } catch (error) {
                console.error('Erreur lors du chargement des données', error);
            }
        };

        fetchData();
    }, []);

    // Intégrer les nouveaux nœuds depuis le contexte
    useEffect(() => {
        nodes.forEach((node) => {
            // Vérifiez si le nœud existe déjà pour éviter les doublons
            if (!points.some(p => p.name === node.name)) {
                setPoints(prevPoints => [...prevPoints, node]);

                // Optionnel : Envoyer au backend si nécessaire
                axios.post(`$http://134.209.239.6:5000/points`, node)
                    .then(res => {
                        // Mettre à jour le point avec l'ID retourné par le backend
                        setPoints(prevPoints => prevPoints.map(p => p.name === node.name ? res.data : p));
                    })
                    .catch(error => {
                        console.error('Erreur lors de la création du point:', error);
                    });
            }
        });
    }, [nodes, points, 'http://134.209.239.6:5000']);

    // Fonction pour créer un nouveau tag
    const createTag = async () => {
        if (newTagName) {
            try {
                const res = await axios.post(`$http://134.209.239.6:5000/tags`, {
                    name: newTagName,
                    color: newTagColor,
                });
                setTags(prevTags => [...prevTags, res.data]);
                setShowCreateTagModal(false);
                setNewTagName('');
                setNewTagColor('#ff0000');
            } catch (error) {
                console.error('Erreur lors de la création du tag', error);
            }
        }
    };

    // Fonction pour appliquer un tag aux points sélectionnés
    const applyTagToSelectedPoints = async () => {
        if (selectedPoints.length > 0 && selectedTagId) {
            try {
                const updatedPoints = [];
                for (const point of selectedPoints) {
                    const updatedPoint = {
                        ...point,
                        tags: [...(point.tags || []), selectedTagId],
                    };
                    await axios.put(`$http://134.209.239.6:5000/points/${point._id}`, updatedPoint);
                    updatedPoints.push(updatedPoint);
                }
                setPoints(prevPoints =>
                    prevPoints.map(p => updatedPoints.find(up => up._id === p._id) || p)
                );
                setShowApplyTagModal(false);
                setSelectedTagId('');
            } catch (error) {
                console.error('Erreur lors de l\'application du tag', error);
            }
        }
    };

    // Ouvrir la modale pour ajouter un point
    const openAddPointModal = (type) => {
        setPointTypeToAdd(type);
        setNewPointName('');
        setShowAddPointModal(true);
    };

    // Ajouter un point via la modale
    const addPoint = async () => {
        if (newPointName) {
            // Utiliser les coordonnées du centre depuis l'état 'center'
            const { x: centerX, y: centerY } = center;

            const newPoint = {
                type: pointTypeToAdd,
                x: centerX,
                y: centerY,
                name: newPointName
            };

            try {
                const res = await axios.post(`$http://134.209.239.6:5000/points`, newPoint);
                setPoints(prevPoints => [...prevPoints, res.data]);

                // Attribuer un délai fixe pour l'animation du nouveau point
                setPointDelays(prevDelays => ({
                    ...prevDelays,
                    [res.data._id]: 0
                }));

                setShowAddPointModal(false);
            } catch (error) {
                console.error("Erreur lors de l'ajout du point", error);
            }
        }
    };

    // Commence à déplacer un point
    const onDragStart = (id) => {
        setDragging(id);
        setIsDragging(false); // Initialiser isDragging à false
        setDisablePan(true); // Désactiver le pan/zoom pendant le drag
    };

    // Déplacement du point
    const onDrag = async (e) => {
        if (dragging !== null) {
            // Si le déplacement est supérieur à un certain seuil, on considère qu'un drag a commencé
            if (!isDragging) {
                setIsDragging(true);
            }

            // Obtenir les coordonnées du curseur
            const svgElement = e.currentTarget.querySelector('svg');
            const CTM = svgElement.getScreenCTM();
            if (CTM == null) return;
            const x = (e.clientX - CTM.e) / CTM.a;
            const y = (e.clientY - CTM.f) / CTM.d;

            const newPoints = points.map((point) => {
                if (point._id === dragging) {
                    return { ...point, x: x, y: y };
                }
                return point;
            });
            setPoints(newPoints);

            // Mettre à jour la position du point dans la base de données
            const updatedPoint = newPoints.find(p => p._id === dragging);
            try {
                await axios.put(`$http://134.209.239.6:5000/points/${dragging}`, {
                    x: updatedPoint.x,
                    y: updatedPoint.y,
                });
            } catch (error) {
                console.error("Erreur lors de la mise à jour du point", error);
            }

            // Mettre à jour le centre après déplacement
            updateCenter(transformStateRef.current);
        }
    };

    // Fin du drag
    const onDragEnd = () => {
        setDragging(null);
        setIsDragging(false); // Réinitialiser isDragging
        setDisablePan(false); // Réactiver le pan/zoom
    };

    // Sélectionne des points pour créer une connexion, gérer les notes ou supprimer des points
    const selectPoint = async (e, point) => {
        if (isDragging) {
            // Empêcher l'action par défaut si un drag est en cours
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        if (deleteMode) {
            // Supprimer le point
            try {
                await axios.delete(`$http://134.209.239.6:5000/points/${point._id}`);
                setPoints(points.filter(p => p._id !== point._id));

                // Supprimer les connexions associées
                const updatedConnections = connections.filter(
                    c => c.from._id !== point._id && c.to._id !== point._id
                );
                setConnections(updatedConnections);

                // Supprimer les notes associées
                if (notes.points[point._id]) {
                    await axios.delete(`$http://134.209.239.6:5000/notes/${notes.points[point._id]._id}`);
                    const { [point._id]: _, ...updatedPointNotes } = notes.points;
                    setNotes(prevNotes => ({ ...prevNotes, points: updatedPointNotes }));
                }

                // Mettre à jour les délais d'animation des points
                const delays = {};
                const remainingPoints = points.filter(p => p._id !== point._id);
                remainingPoints.forEach((p, index) => {
                    delays[p._id] = index * 0.02;
                });
                setPointDelays(delays);

            } catch (error) {
                console.error("Erreur lors de la suppression du point", error);
            }

            // Si le point supprimé était sélectionné, le désélectionner et fermer le panneau de notes
            if (selectedPoints.some(p => p._id === point._id)) {
                setSelectedPoints([]);
                setShowNotesPanel(false);
            }
        } else {
            if (intelligenceMode) {
                setSelectedPoints([point]);
                setSelectedConnection(null); // Désélectionne les connexions
                setShowNotesPanel(true);
            } else if (selectedPoints.length === 0) {
                setSelectedPoints([point]);
            } else {
                if (selectedPoints[0]._id !== point._id) {
                    // Vérifier si la connexion existe déjà
                    const existingConnection = connections.find(c =>
                        (c.from._id === selectedPoints[0]._id && c.to._id === point._id) ||
                        (c.from._id === point._id && c.to._id === selectedPoints[0]._id)
                    );

                    if (existingConnection) {
                        // Supprimer la connexion
                        try {
                            await axios.delete(`$http://134.209.239.6:5000/connections/${existingConnection._id}`);
                            setConnections(connections.filter(c => c._id !== existingConnection._id));
                        } catch (error) {
                            console.error("Erreur lors de la suppression de la connexion", error);
                        }
                    } else {
                        // Ajouter une nouvelle connexion
                        try {
                            const res = await axios.post(`$http://134.209.239.6:5000/connections`, {
                                from: selectedPoints[0]._id,
                                to: point._id
                            });
                            setConnections(prevConnections => [...prevConnections, res.data]);

                            // Attribuer un délai fixe pour l'animation de la nouvelle connexion
                            setConnectionDelays(prevDelays => ({
                                ...prevDelays,
                                [res.data._id]: 0
                            }));
                        } catch (error) {
                            console.error("Erreur lors de l'ajout de la connexion", error);
                        }
                    }
                }
                setSelectedPoints([]);
            }
        }
    };

    // Sélectionne une connexion pour y ajouter une note
    const selectConnection = (connection) => {
        if (deleteMode) {
            // Supprimer la connexion
            try {
                axios.delete(`$http://134.209.239.6:5000/connections/${connection._id}`);
                setConnections(connections.filter(c => c._id !== connection._id));

                // Supprimer les notes associées
                if (notes.connections[connection._id]) {
                    axios.delete(`$http://134.209.239.6:5000/notes/${notes.connections[connection._id]._id}`);
                    const { [connection._id]: _, ...updatedConnectionNotes } = notes.connections;
                    setNotes(prevNotes => ({ ...prevNotes, connections: updatedConnectionNotes }));
                }
            } catch (error) {
                console.error("Erreur lors de la suppression de la connexion", error);
            }
        } else if (intelligenceMode) {
            setSelectedConnection(connection);
            setSelectedPoints([]); // Désélectionne les points
            setShowNotesPanel(true);
        }
    };

    // Gère la note d'un point
    const handleNoteChange = async (e) => {
        if (selectedPoints.length === 0) return;
        const { _id } = selectedPoints[0];
        const updatedNote = { ...notes.points[_id], text: e.target.value };

        try {
            if (notes.points[_id]) {
                // Mettre à jour la note existante
                await axios.put(`$http://134.209.239.6:5000/notes/${notes.points[_id]._id}`, updatedNote);
            } else {
                // Créer une nouvelle note
                const res = await axios.post(`$http://134.209.239.6:5000/notes`, {
                    pointId: _id,
                    text: e.target.value,
                    image: '',
                    tags: []
                });
                updatedNote._id = res.data._id;
            }
            setNotes(prevNotes => ({
                ...prevNotes,
                points: { ...prevNotes.points, [_id]: updatedNote }
            }));
        } catch (error) {
            console.error("Erreur lors de la mise à jour de la note", error);
        }
    };

    // Gère la note d'une connexion
    const handleConnectionNoteChange = async (e) => {
        if (!selectedConnection) return;
        const connectionId = selectedConnection._id;
        const updatedNote = { ...notes.connections[connectionId], text: e.target.value };

        try {
            if (notes.connections[connectionId]) {
                // Mettre à jour la note existante
                await axios.put(`$http://134.209.239.6:5000/notes/${notes.connections[connectionId]._id}`, updatedNote);
            } else {
                // Créer une nouvelle note
                const res = await axios.post(`$http://134.209.239.6:5000/notes`, {
                    connectionId: connectionId,
                    text: e.target.value,
                    image: '',
                    tags: []
                });
                updatedNote._id = res.data._id;
            }
            setNotes(prevNotes => ({
                ...prevNotes,
                connections: { ...prevNotes.connections, [connectionId]: updatedNote }
            }));
        } catch (error) {
            console.error("Erreur lors de la mise à jour de la note de la connexion", error);
        }
    };

    // Fermer le panneau de notes
    const closeNotesPanel = () => {
        setShowNotesPanel(false);
        setSelectedPoints([]);
        setSelectedConnection(null);
    };

    // Fonction pour afficher une connexion
    const connectPoints = (connection) => {
        const fromPointId = connection.from._id || connection.from;
        const toPointId = connection.to._id || connection.to;

        const fromPoint = points.find(p => p._id === fromPointId);
        const toPoint = points.find(p => p._id === toPointId);

        if (!fromPoint || !toPoint) {
            // Si l'un des points n'existe pas, ne pas rendre la connexion
            return null;
        }

        // Obtenir le délai d'animation de la connexion
        const delay = connectionDelays[connection._id] || 0;

        return (
            <g
                key={connection._id}
                onClick={(e) => {
                    e.stopPropagation();
                    selectConnection(connection);
                }}
                className="line"
                style={{ animationDelay: `${delay}s` }}
            >
                <line
                    x1={fromPoint.x}
                    y1={fromPoint.y}
                    x2={toPoint.x}
                    y2={toPoint.y}
                    stroke={selectedConnection && selectedConnection._id === connection._id ? 'yellow' : 'white'}
                    strokeWidth="0.5"
                />
            </g>
        );
    };

    return (
        <div
            className="relation-card-container"
            onMouseMove={onDrag}
            onMouseUp={onDragEnd}
            ref={containerRef}
        >
            {/* Affichage des coordonnées du centre en haut à gauche */}
            <div className="center-coordinates">
                <span>Centre X: {center.x}</span>
                <span>Centre Y: {center.y}</span>
            </div>

            <TransformWrapper
                panning={{ disabled: disablePan }}
                zooming={{ disabled: false }}
                minScale={0.01}
                maxScale={20}
                initialScale={7}
                initialPositionX={-3000}
                initialPositionY={-2500}
                onInit={(utils) => {
                    transformStateRef.current = utils.state;
                    updateCenter(utils.state); // Initialiser le centre
                }}
                onTransformed={(utils) => {
                    transformStateRef.current = utils.state;
                    updateCenter(utils.state);
                }}
            >
                <TransformComponent>
                    {/* Votre SVG */}
                    <svg
                        width="1000px"
                        height="800px"
                        viewBox="0 0 5000 5000"
                        preserveAspectRatio="xMidYMid meet"
                    >
                        <rect
                            x="0"
                            y="0"
                            width="5000"
                            height="5000"
                            fill="#1d1d1d"
                        />
                        {connections.map((connection) => connectPoints(connection))}
                        {points.map((point) => (
                            <g
                                key={point._id}
                                onMouseDown={() => onDragStart(point._id)}
                                onClick={(e) => selectPoint(e, point)}
                                className="point"
                                style={{ animationDelay: `${pointDelays[point._id]}s` }}
                            >
                                <circle
                                    cx={point.x}
                                    cy={point.y}
                                    r={point.type === 'group' ? 8 : 5} // Taille ajustée en fonction du type
                                    fill="transparent"
                                    stroke={selectedPoints.includes(point) ? 'yellow' : 'white'}
                                    strokeWidth="0.5"
                                />
                                <text
                                    x={point.x + 10}
                                    y={point.y}
                                    fill="white"
                                    fontSize="5px"
                                >
                                    {point.name}
                                </text>
                                {point.tags && point.tags.length > 0 && (
                                    <g>
                                        {point.tags.map((tagId, index) => {
                                            const tag = tags.find(t => t._id === tagId);
                                            if (tag) {
                                                return (
                                                    <circle
                                                        key={index}
                                                        cx={point.x}
                                                        cy={point.y - (index + 1) * 6}
                                                        r={2}
                                                        fill={tag.color}
                                                    />
                                                );
                                            }
                                            return null;
                                        })}
                                    </g>
                                )}
                            </g>
                        ))}
                    </svg>
                </TransformComponent>
            </TransformWrapper>

            {/* Barre d'outils */}
            <div className="controls">
                <button onClick={() => openAddPointModal('person')}>Ajouter une personne</button>
                <button onClick={() => openAddPointModal('group')}>Ajouter un groupe</button>
                <button onClick={() => setShowCreateTagModal(true)}>Créer un tag</button>
                <button
                    onClick={() => {
                        if (selectedPoints.length > 0) {
                            setShowApplyTagModal(true);
                        } else {
                            alert('Veuillez sélectionner au moins un point pour appliquer un tag.');
                        }
                    }}
                >
                    Appliquer un tag
                </button>
                <label>
                    <input
                        type="checkbox"
                        checked={deleteMode}
                        onChange={() => setDeleteMode(!deleteMode)}
                    />
                    Mode suppression
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={intelligenceMode}
                        onChange={() => setIntelligenceMode(!intelligenceMode)}
                    />
                    Mode intelligence
                </label>
                {/* Boutons de contrôle du zoom */}
            </div>

            {/* Panneau de notes */}
            {showNotesPanel && (
                <div className={`notes-panel ${closingNotesPanel ? 'closing' : ''}`}>
                    <button onClick={closeNotesPanel}>Fermer</button>
                    {selectedPoints.length > 0 && (
                        <div>
                            <h3>Note pour {selectedPoints[0].name}</h3>
                            <textarea
                                value={notes.points[selectedPoints[0]._id]?.text || ''}
                                onChange={handleNoteChange}
                                placeholder="Entrez votre note ici..."
                            />
                        </div>
                    )}
                    {selectedConnection && (
                        <div>
                            <h3>Note pour la connexion</h3>
                            <textarea
                                value={notes.connections[selectedConnection._id]?.text || ''}
                                onChange={handleConnectionNoteChange}
                                placeholder="Entrez votre note ici..."
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Modale pour ajouter un point */}
            {showAddPointModal && (
                <Modal
                    show={showAddPointModal}
                    onClose={() => setShowAddPointModal(false)}
                    title={`Ajouter ${pointTypeToAdd === 'group' ? 'un groupe' : 'une personne'}`}
                >
                    <div className="modal-content">
                        <label>
                            Nom :
                            <input
                                type="text"
                                value={newPointName}
                                onChange={(e) => setNewPointName(e.target.value)}
                                placeholder="Entrez le nom"
                            />
                        </label>
                        <button onClick={addPoint}>Ajouter</button>
                    </div>
                </Modal>
            )}

            {/* Modale pour créer un tag */}
            {showCreateTagModal && (
                <Modal
                    show={showCreateTagModal}
                    onClose={() => setShowCreateTagModal(false)}
                    title="Créer un nouveau tag"
                >
                    <div className="modal-content">
                        <label>
                            Nom du tag :
                            <input
                                type="text"
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                placeholder="Entrez le nom du tag"
                            />
                        </label>
                        <label>
                            Couleur du tag :
                            <select
                                value={newTagColor}
                                onChange={(e) => setNewTagColor(e.target.value)}
                            >
                                {defaultColors.map((color, index) => (
                                    <option key={index} value={color} style={{ color }}>
                                        {color}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <button onClick={createTag}>Créer</button>
                    </div>
                </Modal>
            )}

            {/* Modale pour appliquer un tag */}
            {showApplyTagModal && (
                <Modal
                    show={showApplyTagModal}
                    onClose={() => setShowApplyTagModal(false)}
                    title="Appliquer un tag"
                >
                    <div className="modal-content">
                        <label>
                            Sélectionnez un tag :
                            <select
                                value={selectedTagId}
                                onChange={(e) => setSelectedTagId(e.target.value)}
                            >
                                <option value="">-- Choisissez un tag --</option>
                                {tags.map(tag => (
                                    <option key={tag._id} value={tag._id}>
                                        {tag.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <button onClick={applyTagToSelectedPoints}>Appliquer</button>
                    </div>
                </Modal>
            )}
        </div>
    );

};

export default RelationCard;
