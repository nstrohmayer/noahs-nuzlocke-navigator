import React, { useEffect } from 'react'; // Added useEffect import
import { DetailDisplayControllerProps } from '../types';
import { PokemonDetailBar } from './PokemonDetailBar';
import { AbilityDetailDisplay } from './AbilityDetailDisplay';
import { MoveDetailDisplay } from './MoveDetailDisplay';

export const DetailDisplayController: React.FC<DetailDisplayControllerProps> = ({
  activeView,
  pokemonData,
  abilityData,
  moveData,
  isLoading,
  error,
  onClose,
  onBackToPokemon,
  pokemonContextForDetailViewName,
  // PokemonDetailBar specific props
  isCaught,
  onToggleCaught,
  onAddToTeam,
  onStageMove,
  stagedMoveNameForThisPokemon,
  // Callbacks for navigation
  onPokemonNameClickForEvolution, // This is the main pokemon click handler from App.tsx
  onAbilityNameClick,
  onMoveNameClick,
}) => {
  useEffect(() => {
    // Add pixelated sprite style globally if not already present
    const styleId = "pokemon-detail-bar-custom-styles"; // Use same ID as PokemonDetailBar
    if (document.getElementById(styleId)) return;
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = `
      .pixelated-sprite { image-rendering: pixelated; image-rendering: -moz-crisp-edges; image-rendering: crisp-edges; }
      .text-xxs { font-size: 0.65rem; }
      .shadow-2xl_top { box-shadow: 0 -20px 25px -5px rgb(0 0 0 / 0.1), 0 -8px 10px -6px rgb(0 0 0 / 0.1); }
    `;
    document.head.appendChild(styleElement);
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-sky-400"></div>
          <p className="ml-4 text-lg text-slate-300">Loading Details...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
          <p className="text-lg text-red-400">Error: {error}</p>
          <p className="text-sm text-slate-400 mt-1">Could not load details. Please try again later.</p>
        </div>
      );
    }

    switch (activeView) {
      case 'pokemon':
        if (pokemonData && onToggleCaught && onAddToTeam && onPokemonNameClickForEvolution && onAbilityNameClick && onMoveNameClick && onStageMove) {
          return (
            <PokemonDetailBar
              pokemonData={pokemonData}
              isCaught={isCaught || false}
              onToggleCaught={onToggleCaught}
              onAddToTeam={onAddToTeam}
              onPokemonNameClickForEvolution={onPokemonNameClickForEvolution}
              onAbilityNameClick={onAbilityNameClick}
              onMoveNameClick={onMoveNameClick}
              onStageMove={onStageMove}
              stagedMoveNameForThisPokemon={stagedMoveNameForThisPokemon || null}
              onClose={onClose} 
            />
          );
        }
        return <p className="text-slate-400 p-4 text-center">No Pokémon data available.</p>;
      case 'ability':
        if (abilityData) {
          return <AbilityDetailDisplay abilityData={abilityData} onPokemonNameClick={onPokemonNameClickForEvolution} />;
        }
        return <p className="text-slate-400 p-4 text-center">No ability data available.</p>;
      case 'move':
        if (moveData) {
          return <MoveDetailDisplay moveData={moveData} onPokemonNameClick={onPokemonNameClickForEvolution} />;
        }
        return <p className="text-slate-400 p-4 text-center">No move data available.</p>;
      default:
        return null;
    }
  };

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur-md border-t-2 border-sky-500 shadow-2xl_top z-40 text-slate-100 animate-fadeIn"
      style={{height: '33vh'}}
      role="dialog"
      aria-labelledby="detail-bar-title"
      aria-modal="true"
    >
      <div className="flex justify-between items-center px-4 pt-3 pb-1">
        <h2 id="detail-bar-title" className="text-lg font-semibold text-sky-300 sr-only">
          {activeView === 'pokemon' && pokemonData?.name ? `${pokemonData.name} Details` : 
           activeView === 'ability' && abilityData?.name ? `${abilityData.name} Ability Details` :
           activeView === 'move' && moveData?.name ? `${moveData.name} Move Details` : 'Details'}
        </h2>
        <div>
          {onBackToPokemon && pokemonContextForDetailViewName && (activeView === 'ability' || activeView === 'move') && (
            <button
              onClick={onBackToPokemon}
              className="text-sm py-1 px-3 bg-slate-700 hover:bg-slate-600 rounded-md text-sky-300 hover:text-sky-200 transition-colors"
              aria-label={`Back to ${pokemonContextForDetailViewName} details`}
            >
              &larr; Back to {pokemonContextForDetailViewName}
            </button>
          )}
        </div>
        <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white text-2xl font-bold leading-none" 
            aria-label="Close details bar"
        >
            &times;
        </button>
      </div>
      <div className="h-[calc(100%-48px)] overflow-y-auto"> {/* Adjust height to account for header */}
        {renderContent()}
      </div>
    </div>
  );
};