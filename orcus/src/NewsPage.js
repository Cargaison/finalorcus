// NewsPage.js

import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import './NewsPage.css';
import Modal from './Modal';
import { NodeContext } from './NodeContext';
import nlp from 'compromise';

const NewsPage = () => {
    const { addNode } = useContext(NodeContext);
    const [articles, setArticles] = useState([]);
    const [selectedText, setSelectedText] = useState('');
    const [showCreateNodeModal, setShowCreateNodeModal] = useState(false);
    const [newNodeName, setNewNodeName] = useState('');
    const [currentArticleIndex, setCurrentArticleIndex] = useState(null);
    const [error, setError] = useState(null);
    const [entities, setEntities] = useState({}); // Stocker les entités par article
    const [currentPage, setCurrentPage] = useState(1); // Page actuelle
    const [totalPages, setTotalPages] = useState(1); // Nombre total de pages
    const [loading, setLoading] = useState(false); // Indicateur de chargement

    // Clé API (Assurez-vous de ne pas exposer cette clé publiquement)
    const API_KEY = "de5f9a61-a022-4986-b092-28ad120c7518";
    const KEYWORD = 'France'; // Mot-clé pour les actualités
    const ARTICLES_PER_PAGE = 10; // Nombre d'articles par page

    useEffect(() => {
        const fetchNews = async () => {
            setLoading(true);
            try {
                const requestBody = {
                    "action": "getArticles",
                    "keyword": KEYWORD,
                    "sourceLocationUri": [
                        "http://en.wikipedia.org/wiki/United_States",
                        "http://en.wikipedia.org/wiki/Canada",
                        "http://en.wikipedia.org/wiki/United_Kingdom"
                    ],
                    "ignoreSourceGroupUri": "paywall/paywalled_sources",
                    "articlesPage": currentPage,
                    "articlesCount": ARTICLES_PER_PAGE,
                    "articlesSortBy": "date",
                    "articlesSortByAsc": false,
                    "dataType": [
                        "news",
                        "pr"
                    ],
                    "forceMaxDataTimeWindow": 31,
                    "resultType": "articles",
                    "apiKey": API_KEY
                };

                const response = await axios.post(
                    'https://eventregistry.org/api/v1/article/getArticles',
                    requestBody
                );

                // Vérifier si les articles sont présents dans la réponse
                if (response.data.articles && response.data.articles.results) {
                    const articlesData = response.data.articles.results;
                    setArticles(articlesData);

                    // Calculer le nombre total de pages si l'API le fournit
                    const totalArticles = response.data.articles.totalArticles || 100; // Remplacez par le champ approprié
                    setTotalPages(Math.ceil(totalArticles / ARTICLES_PER_PAGE));

                    // Détecter les entités dans chaque article
                    const detectedEntities = {};
                    articlesData.forEach((article, index) => {
                        const content = `${article.title} ${article.body}`;
                        const doc = nlp(content);
                        const people = doc.people().out('array');
                        const places = doc.places().out('array');
                        const organizations = doc.organizations().out('array');
                        detectedEntities[index] = {
                            people: [...new Set(people)],
                            places: [...new Set(places)],
                            organizations: [...new Set(organizations)],
                        };
                    });
                    setEntities(detectedEntities);
                    setError(null); // Réinitialiser l'erreur en cas de succès
                } else {
                    setArticles([]);
                    setError('Aucun article trouvé.');
                }
            } catch (err) {
                console.error('Erreur lors de la récupération des actualités:', err);
                setError('Impossible de récupérer les actualités.');
                setArticles([]);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();

        // Rafraîchissement toutes les 15 minutes
        const interval = setInterval(fetchNews, 15 * 60 * 1000);
        return () => clearInterval(interval);
    }, [API_KEY, KEYWORD, currentPage]);

    // Fonction pour gérer la sélection de texte
    const handleTextSelection = (e, articleIndex) => {
        const selection = window.getSelection();
        const selected = selection.toString().trim();

        // Vérifiez si du texte est sélectionné
        if (selected.length > 0) {
            // Vérifiez si le texte sélectionné est une entité reconnue
            const { people, places, organizations } = entities[articleIndex] || {};
            const isEntity =
                (people && people.includes(selected)) ||
                (places && places.includes(selected)) ||
                (organizations && organizations.includes(selected));

            if (isEntity) {
                setSelectedText(selected);
                setCurrentArticleIndex(articleIndex);
                setShowCreateNodeModal(true);
            } else {
                alert('Veuillez sélectionner un nom reconnu (personne, lieu, organisation).');
            }
        }
    };

    // Fonction pour créer un nouveau nœud
    const handleCreateNode = () => {
        if (newNodeName.trim() === '') {
            alert('Le nom du nœud ne peut pas être vide.');
            return;
        }

        const newPoint = {
            type: 'person', // Vous pouvez déterminer dynamiquement le type
            x: 2500, // Coordonnée X par défaut
            y: 2500, // Coordonnée Y par défaut
            name: newNodeName
        };

        addNode(newPoint);

        // Réinitialiser les états
        setNewNodeName('');
        setShowCreateNodeModal(false);
    };

    // Fonctions de pagination
    const goToPreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(prevPage => prevPage - 1);
        }
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(prevPage => prevPage + 1);
        }
    };

    const goToPage = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    return (
        <div className="news-page-container">
            <h1>Actualités sur la France</h1>
            {error && <p className="error-message">{error}</p>}
            {loading ? (
                <p style={{ color: '#fff', textAlign: 'center' }}>Chargement des articles...</p>
            ) : (
                <div className="articles-list">
                    {Array.isArray(articles) && articles.length > 0 ? (
                        articles.map((article, index) => (
                            <div
                                key={index}
                                className="article"
                                onMouseUp={(e) => handleTextSelection(e, index)}
                            >
                                <h2>{article.title}</h2>
                                {article.image && (
                                    <img src={article.image} alt={article.title} />
                                )}
                                <p>{article.body}</p>
                                <a href={article.url} target="_blank" rel="noopener noreferrer">
                                    Lire l'article complet
                                </a>
                                {/* Afficher les entités détectées */}
                                <div className="entities">
                                    {entities[index] && (
                                        <>
                                            {entities[index].people.length > 0 && (
                                                <p><strong>Personnes :</strong> {entities[index].people.join(', ')}</p>
                                            )}
                                            {entities[index].places.length > 0 && (
                                                <p><strong>Lieux :</strong> {entities[index].places.join(', ')}</p>
                                            )}
                                            {entities[index].organizations.length > 0 && (
                                                <p><strong>Organisations :</strong> {entities[index].organizations.join(', ')}</p>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p style={{ color: '#fff', textAlign: 'center' }}>Aucun article disponible.</p>
                    )}
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button onClick={goToPreviousPage} disabled={currentPage === 1}>
                        Précédent
                    </button>
                    {/* Afficher les numéros de page */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={page === currentPage ? 'active' : ''}
                        >
                            {page}
                        </button>
                    ))}
                    <button onClick={goToNextPage} disabled={currentPage === totalPages}>
                        Suivant
                    </button>
                </div>
            )}

            {/* Modal pour créer un nœud */}
            {showCreateNodeModal && (
                <Modal
                    show={showCreateNodeModal}
                    onClose={() => setShowCreateNodeModal(false)}
                    title="Créer un nouveau nœud"
                >
                    <div className="modal-content">
                        <p>Texte sélectionné: <strong>{selectedText}</strong></p>
                        <label>
                            Nom du nœud :
                            <input
                                type="text"
                                value={newNodeName}
                                onChange={(e) => setNewNodeName(e.target.value)}
                                placeholder="Entrez le nom du nœud"
                            />
                        </label>
                        <button onClick={handleCreateNode}>Créer</button>
                    </div>
                </Modal>
            )}
        </div>
    );

};

export default NewsPage;
