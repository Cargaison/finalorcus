// NodeContext.js

import React, { createContext, useState } from 'react';

export const NodeContext = createContext();

export const NodeProvider = ({ children }) => {
    const [nodes, setNodes] = useState([]);

    const addNode = (node) => {
        setNodes(prevNodes => [...prevNodes, node]);
    };

    return (
        <NodeContext.Provider value={{ nodes, addNode }}>
            {children}
        </NodeContext.Provider>
    );
};
