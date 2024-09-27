import React from 'react';
import './Modal.css';

const Modal = ({ show, onClose, title, children }) => {
    if (!show) return null;

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h3>{title}</h3>
                {children}
                <button className="close-button" onClick={onClose}>Fermer</button>
            </div>
        </div>
    );
};

export default Modal;
