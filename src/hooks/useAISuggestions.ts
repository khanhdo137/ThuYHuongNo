import { useState, useCallback } from 'react';

interface Suggestion {
    id: string;
    message: string;
    actionType: string;
    priority?: 'low' | 'medium' | 'high';
}

export const useAISuggestions = () => {
    const [currentSuggestion, setCurrentSuggestion] = useState<Suggestion | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    const showSuggestion = useCallback((suggestion: Suggestion) => {
        setCurrentSuggestion(suggestion);
        setIsVisible(true);
    }, []);

    const hideSuggestion = useCallback(() => {
        setIsVisible(false);
    }, []);

    const clearSuggestion = useCallback(() => {
        setCurrentSuggestion(null);
        setIsVisible(false);
    }, []);

    return {
        suggestion: currentSuggestion,
        isVisible,
        showSuggestion,
        hideSuggestion,
        clearSuggestion
    };
};