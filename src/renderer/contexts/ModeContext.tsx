import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModeContextType {
    isKidsMode: boolean;
    toggleMode: () => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export const ModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isKidsMode, setIsKidsMode] = useState(true);

    const toggleMode = () => {
        setIsKidsMode(prev => !prev);
    };

    return (
        <ModeContext.Provider value={{ isKidsMode, toggleMode }}>
            {children}
        </ModeContext.Provider>
    );
};

export const useMode = () => {
    const context = useContext(ModeContext);
    if (context === undefined) {
        throw new Error('useMode must be used within a ModeProvider');
    }
    return context;
};
