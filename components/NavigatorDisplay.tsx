
import React, { useState, useEffect } from 'react';
import { NavigatorDisplayProps, GameLocationNode } from '../types';

// Component to parse and render the Oracle's response with interactive links
const FormattedOracleResponse: React.FC<{
  responseText: string;
  gameLocations: GameLocationNode[];
  onPokemonNameClick: (pokemonName: string) => void;
  onLocationNameClick: (location: GameLocationNode) => void;
}> = ({ responseText, gameLocations, onPokemonNameClick, onLocationNameClick }) => {
  
  const processLine = (line: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let remainingLine = line;
    let keyCounter = 0;

    while (remainingLine.length > 0) {
      const pkmMatch = remainingLine.match(/{{([^{}]+?)}}/);
      const locMatch = remainingLine.match(/\[\[([^\][]+?)\]\]/);
      const boldMatch = remainingLine.match(/\*\*(.+?)\*\*/s); // Added 's' flag for multiline bold

      let firstMatch: { type: 'pkm' | 'loc' | 'bold'; index: number; length: number; content: string; } | null = null;

      if (pkmMatch && (firstMatch === null || pkmMatch.index! < firstMatch.index)) {
        firstMatch = { type: 'pkm', index: pkmMatch.index!, length: pkmMatch[0].length, content: pkmMatch[1] };
      }
      if (locMatch && (firstMatch === null || locMatch.index! < firstMatch.index)) {
        firstMatch = { type: 'loc', index: locMatch.index!, length: locMatch[0].length, content: locMatch[1] };
      }
      if (boldMatch && (firstMatch === null || boldMatch.index! < firstMatch.index)) {
        firstMatch = { type: 'bold', index: boldMatch.index!, length: boldMatch[0].length, content: boldMatch[1] };
      }

      if (firstMatch) {
        // Add text before the match
        if (firstMatch.index > 0) {
          parts.push(remainingLine.substring(0, firstMatch.index));
        }

        // Add the matched, formatted element
        const uniqueKey = `${firstMatch.type}-${keyCounter++}`;
        if (firstMatch.type === 'pkm') {
          parts.push(
            <button 
              key={uniqueKey} 
              onClick={() => onPokemonNameClick(firstMatch.content)} 
              className="text-sky-400 hover:text-sky-300 underline font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500 rounded px-0.5 py-0 inline"
              aria-label={`View details for ${firstMatch.content}`}
            >
              {firstMatch.content}
            </button>
          );
        } else if (firstMatch.type === 'loc') {
          const foundLocation = gameLocations.find(l => l.name.toLowerCase() === firstMatch.content.toLowerCase());
          if (foundLocation) {
            parts.push(
              <button 
                key={uniqueKey} 
                onClick={() => onLocationNameClick(foundLocation)} 
                className="text-emerald-400 hover:text-emerald-300 underline font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded px-0.5 py-0 inline"
                aria-label={`View details for ${firstMatch.content}`}
              >
                {firstMatch.content}
              </button>
            );
          } else {
            parts.push(firstMatch.content); // Location not found, render as text
          }
        } else if (firstMatch.type === 'bold') {
          parts.push(<strong key={uniqueKey}>{firstMatch.content}</strong>);
        }
        remainingLine = remainingLine.substring(firstMatch.index + firstMatch.length);
      } else {
        // No more special patterns, add the rest of the line
        parts.push(remainingLine);
        remainingLine = "";
      }
    }
    return parts;
  };

  const lines = responseText.split('\n');
  const contentBlocks: JSX.Element[] = [];
  let currentListItems: JSX.Element[] = [];

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
      const listItemContent = processLine(trimmedLine.substring(2));
      currentListItems.push(<li key={`li-${index}-${contentBlocks.length}`}>{listItemContent}</li>);
    } else {
      if (currentListItems.length > 0) {
        contentBlocks.push(<ul key={`ul-${contentBlocks.length}`} className="list-disc list-inside my-2 pl-4 space-y-1">{currentListItems}</ul>);
        currentListItems = [];
      }
      if (trimmedLine) {
        contentBlocks.push(<p key={`p-${index}-${contentBlocks.length}`} className="my-2 leading-relaxed">{processLine(line)}</p>);
      } else if (index > 0 && lines[index-1].trim() !== "" && contentBlocks.length > 0) {
        if (contentBlocks[contentBlocks.length-1].type === 'p') {
             contentBlocks.push(<div key={`spacer-${index}-${contentBlocks.length}`} className="h-2"></div>);
        }
      }
    }
  });

  if (currentListItems.length > 0) {
    contentBlocks.push(<ul key={`ul-${contentBlocks.length}`} className="list-disc list-inside my-2 pl-4 space-y-1">{currentListItems}</ul>);
  }

  return <>{contentBlocks}</>;
};


export const NavigatorDisplay: React.FC<NavigatorDisplayProps> = ({
  initialPromptValue,
  onPromptSubmit,
  isLoading,
  apiResponse,
  apiError,
  onReset,
  apiKeyMissing,
  onPokemonNameClick,
  onLocationNameClick,
  gameLocations,
}) => {
  const [currentPrompt, setCurrentPrompt] = useState(initialPromptValue);

  useEffect(() => {
    setCurrentPrompt(initialPromptValue);
  }, [initialPromptValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPrompt.trim() && !isLoading) {
      onPromptSubmit(currentPrompt.trim());
    }
  };

  const handleResetAndClear = () => {
    setCurrentPrompt(""); 
    onReset();
  };

  if (apiKeyMissing) {
    return (
        <div className="bg-red-800/30 border border-red-700 text-red-300 p-6 rounded-lg shadow-xl text-center animate-fadeIn">
            <h1 className="text-2xl font-bold text-red-400 mb-3">Navigator Unavailable</h1>
            <p className="text-slate-200">The Nuzlocke Navigator feature requires a valid API Key.</p>
            <p className="text-slate-300 mt-2 text-sm">Please ensure the <code className="bg-slate-700 px-1 rounded text-xs">API_KEY</code> environment variable is correctly set up.</p>
        </div>
    );
  }


  return (
    <div className="p-2 md:p-4 space-y-6 animate-fadeIn">
      <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
        Nuzlocke Navigator
      </h1>
      
      <p className="text-slate-300 text-sm md:text-base">
        Ask any question related to your Pokémon Ultra Sun/Ultra Moon Nuzlocke! 
        For example: "What are good counters for Totem Lurantis?", "Where can I find a Fire Stone early?", or "Tips for the first rival battle?".
      </p>

      {!apiResponse && !apiError && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="navigatorPrompt" className="block text-sm font-medium text-sky-300 mb-1">
              Your Question:
            </label>
            <textarea
              id="navigatorPrompt"
              value={currentPrompt}
              onChange={(e) => setCurrentPrompt(e.target.value)}
              placeholder="Enter your Nuzlocke question here..."
              rows={4}
              className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-md text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors"
              disabled={isLoading}
              aria-label="Nuzlocke question input"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !currentPrompt.trim()}
            className="w-full md:w-auto px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-md shadow-md transition-all duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            {isLoading ? 'Consulting...' : 'Ask the Oracle'}
          </button>
        </form>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center h-40 bg-slate-800/50 p-6 rounded-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-500"></div>
          <p className="ml-3 mt-3 text-lg text-slate-300">The Oracle is pondering your query...</p>
        </div>
      )}

      {apiError && !isLoading && (
        <div className="bg-red-800/40 border border-red-600 text-red-200 p-4 rounded-lg shadow-lg animate-fadeIn">
          <h3 className="font-semibold text-lg mb-2">An Error Occurred:</h3>
          <p className="text-sm">{apiError}</p>
          <button
            onClick={handleResetAndClear}
            className="mt-3 px-4 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-black text-sm font-medium rounded-md transition-colors"
          >
            Try a New Question
          </button>
        </div>
      )}

      {apiResponse && !isLoading && !apiError && (
        <div className="bg-slate-700/70 p-4 md:p-6 rounded-lg shadow-xl animate-fadeIn backdrop-blur-sm border border-slate-600">
          <h3 className="text-xl font-semibold text-sky-300 mb-3">The Oracle Responds:</h3>
          <div className="text-slate-200 text-sm md:text-base leading-relaxed">
            <FormattedOracleResponse 
              responseText={apiResponse}
              gameLocations={gameLocations}
              onPokemonNameClick={onPokemonNameClick}
              onLocationNameClick={onLocationNameClick}
            />
          </div>
          <button
            onClick={handleResetAndClear}
            className="mt-4 px-5 py-2 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-md transition-colors shadow"
          >
            Ask Another Question
          </button>
        </div>
      )}
    </div>
  );
};
