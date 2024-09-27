// NavigationBar.js

import React from 'react';
import { NavLink } from 'react-router-dom';
import './NavigationBar.css';

const NavigationBar = () => {
    return (
        <nav className="navigation-bar">
            <ul>
                <li>
                    <NavLink exact to="/" activeClassName="active">
                        Relation Card
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/directory" activeClassName="active">
                        Répertoire
                    </NavLink>
                </li>
            </ul>
        </nav>
    );
};

export default NavigationBar;
