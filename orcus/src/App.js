// App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { NodeProvider } from './NodeContext';
import NewsPage from './NewsPage';
import RelationCard from './RelationCard';
import Directory from "./Directory";
import './App.css'; // Styles globaux

const App = () => {
    return (
        <NodeProvider>
            <Router>
                <div className="app-container">
                    {/* Barre de navigation */}
                    <nav className="navbar">
                        <ul>
                            <li>
                                <Link to="/">Actualités</Link>
                            </li>
                            <li>
                                <Link to="/directory">Directory</Link>
                            </li>
                            <li>
                                <Link to="/relations">Graphique des Relations</Link>
                            </li>
                        </ul>
                    </nav>

                    {/* Définition des Routes */}
                    <Routes>
                        <Route path="/" element={<NewsPage />} />
                        <Route path="/directory" element={<Directory />} />
                        <Route path="/relations" element={<RelationCard />} />
                    </Routes>
                </div>
            </Router>
        </NodeProvider>
    );
};

export default App;
