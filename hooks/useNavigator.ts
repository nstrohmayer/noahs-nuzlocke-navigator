
import { useState, useCallback } from 'react';
import { fetchNavigatorGuidanceFromGemini } from '../services/geminiService';

export const useNavigator = (apiKeyMissing: boolean) => {
  const [activeMainPanel, setActiveMainPanel] = useState<'location' | 'navigator'>('location');
  const [navigatorUserPrompt, setNavigatorUserPrompt] = useState<string>("");
  const [navigatorGeminiResponse, setNavigatorGeminiResponse] = useState<string | null>(null);
  const [isLoadingNavigatorQuery, setIsLoadingNavigatorQuery] = useState<boolean>(false);
  const [navigatorError, setNavigatorError] = useState<string | null>(null);

  const switchToNavigatorPanel = useCallback(() => {
    setActiveMainPanel('navigator');
  }, []);

  const handleNavigatorSubmit = useCallback(async (prompt: string) => {
    if (apiKeyMissing) {
      setNavigatorError("API Key is missing. Navigator cannot function.");
      setIsLoadingNavigatorQuery(false);
      return;
    }
    setIsLoadingNavigatorQuery(true);
    setNavigatorError(null);
    setNavigatorGeminiResponse(null);
    setNavigatorUserPrompt(prompt); // Store the current prompt
    try {
      const response = await fetchNavigatorGuidanceFromGemini(prompt);
      setNavigatorGeminiResponse(response);
    } catch (err) {
      console.error("Error fetching navigator guidance:", err);
      setNavigatorError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoadingNavigatorQuery(false);
    }
  }, [apiKeyMissing]);

  const handleNavigatorReset = useCallback(() => {
    setNavigatorUserPrompt("");
    setNavigatorGeminiResponse(null);
    setNavigatorError(null);
    setIsLoadingNavigatorQuery(false);
  }, []);

  return {
    activeMainPanel,
    setActiveMainPanel, // Expose this for useGameProgression and App
    navigatorUserPrompt,
    navigatorGeminiResponse,
    isLoadingNavigatorQuery,
    navigatorError,
    switchToNavigatorPanel,
    handleNavigatorSubmit,
    handleNavigatorReset,
  };
};