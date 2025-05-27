
import React, { useEffect, useState } from 'react';
import { PokemonDetailData, PokemonBaseStat, PokemonMoveInfo, PokemonEvolutionStep, PokemonDetailBarProps } from '../types';

const StatBar: React.FC<{ stat: PokemonBaseStat }> = ({ stat }) => {
  const percentage = Math.min((stat.value / 255) * 100, 100);
  let barColor = 'bg-sky-500';
  if (stat.value < 50) barColor = 'bg-red-500';
  else if (stat.value < 80) barColor = 'bg-yellow-500';
  else if (stat.value < 110) barColor = 'bg-green-500';
  
  return (
    <div className="mb-1">
      <div className="flex justify-between text-xs text-slate-300 mb-0.5">
        <span>{stat.name}</span>
        <span>{stat.value}</span>
      </div>
      <div className="w-full bg-slate-600 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full ${barColor} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

const TypeBadge: React.FC<{ type: string }> = ({ type }) => {
    const typeColors: Record<string, string> = {
        Normal: 'bg-gray-400 text-black', Fighting: 'bg-red-700', Flying: 'bg-sky-300 text-black',
        Poison: 'bg-purple-600', Ground: 'bg-yellow-600 text-black', Rock: 'bg-yellow-700',
        Bug: 'bg-lime-500', Ghost: 'bg-indigo-700', Steel: 'bg-slate-400', Fire: 'bg-orange-500',
        Water: 'bg-blue-500', Grass: 'bg-green-500', Electric: 'bg-yellow-400 text-black',
        Psychic: 'bg-pink-500', Ice: 'bg-cyan-300 text-black', Dragon: 'bg-indigo-500',
        Dark: 'bg-neutral-700', Fairy: 'bg-pink-300 text-black',
    };
    return <span className={`px-2 py-0.5 rounded-md text-xs font-semibold mr-1 ${typeColors[type] || 'bg-gray-500'}`}>{type}</span>;
}

const EvolutionDisplay: React.FC<{ evolutionInfo: PokemonDetailData['evolutions'], onPokemonNameClick: (name:string) => void }> = ({ evolutionInfo, onPokemonNameClick }) => {
    if (!evolutionInfo) return <p className="text-sm text-slate-400">Evolution data not available.</p>;
    
    const { currentStage, nextStages, previousStage } = evolutionInfo;

    return (
        <div className="flex flex-col items-center space-y-2">
            {previousStage && (
                 <div className="flex flex-col items-center text-center p-1 rounded hover:bg-slate-600/50 cursor-pointer transition-colors" onClick={() => onPokemonNameClick(previousStage.name)}>
                    {previousStage.spriteUrl && <img src={previousStage.spriteUrl} alt={previousStage.name} className="w-10 h-10 pixelated-sprite" />}
                    <p className="text-xs text-slate-300">{previousStage.name.charAt(0).toUpperCase() + previousStage.name.slice(1)}</p>
                    <p className="text-xs text-sky-400">↑ Prev Stage</p>
                </div>
            )}
            <div className="flex flex-col items-center text-center p-2 bg-slate-700/60 rounded-md">
                {currentStage.spriteUrl && <img src={currentStage.spriteUrl} alt={currentStage.name} className="w-16 h-16 pixelated-sprite" />}
                <p className="text-sm font-semibold">{currentStage.name.charAt(0).toUpperCase() + currentStage.name.slice(1)}</p>
                <p className="text-xs text-slate-400">(Current)</p>
            </div>
            {nextStages && nextStages.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                    {nextStages.map(evo => (
                        <div key={evo.name} className="flex flex-col items-center text-center p-1 rounded hover:bg-slate-600/50 cursor-pointer transition-colors" onClick={() => onPokemonNameClick(evo.name)}>
                           {evo.spriteUrl && <img src={evo.spriteUrl} alt={evo.name} className="w-12 h-12 pixelated-sprite" />}
                            <p className="text-xs text-slate-200">{evo.name.charAt(0).toUpperCase() + evo.name.slice(1)}</p>
                            <p className="text-xxs text-sky-400 leading-tight">{evo.trigger}</p>
                            {evo.conditions.map(cond => <p key={cond} className="text-xxs text-slate-400 leading-tight">{cond}</p>)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


export const PokemonDetailBarComponent: React.FC<PokemonDetailBarProps> = ({ 
    pokemonData, 
    isCaught, 
    onToggleCaught, 
    onAddToTeam,
    onPokemonNameClickForEvolution,
    onAbilityNameClick,
    onMoveNameClick,
    onStageMove,
    stagedMoveNameForThisPokemon,
    onClose // This onClose is now from DetailDisplayController
}) => {

  useEffect(() => {
    const styleId = "pokemon-detail-bar-custom-styles";
    if (document.getElementById(styleId)) return;
    // Styles are fine, no changes needed here
  }, []);
  
  const abilitiesToRender = pokemonData.abilities.map(structuredAbility => ({
    displayName: `${structuredAbility.displayName}${structuredAbility.isHidden ? ' (Hidden)' : ''}`,
    rawName: structuredAbility.rawName
  }));


  return (
    // Outer container is now managed by DetailDisplayController, this component renders its content
    // No fixed positioning or height style here.
    <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-2 h-full p-4 overflow-y-auto">
        {/* Column 1: Sprite & Basic Info, Actions */}
        <div className="flex flex-col items-center text-center col-span-1 md:col-span-1 space-y-2">
        <div className="flex items-center justify-center gap-2">
            {pokemonData.spriteUrl && <img src={pokemonData.spriteUrl} alt={pokemonData.name} className="w-20 h-20 md:w-24 md:h-24 pixelated-sprite" />}
            {pokemonData.shinySpriteUrl && <img src={pokemonData.shinySpriteUrl} alt={`Shiny ${pokemonData.name}`} className="w-20 h-20 md:w-24 md:h-24 pixelated-sprite" />}
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-sky-400">{pokemonData.name}</h2>
        <p className="text-xs md:text-sm text-slate-400 italic -mt-1">{pokemonData.genus}</p>
        <div>
            {pokemonData.types.map(type => <TypeBadge key={type} type={type} />)}
        </div>
        <p className="text-xxs md:text-xs text-slate-400">ID: #{pokemonData.id}</p>
        
        <div className="flex flex-col sm:flex-row sm:justify-center gap-2 w-full pt-1">
            <button
            onClick={() => onToggleCaught(pokemonData.id)}
            className={`w-full sm:w-auto flex-grow sm:flex-grow-0 py-1.5 px-3 text-xs rounded-md font-semibold transition-colors ${
                isCaught ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-slate-600 hover:bg-slate-500 text-slate-200'
            }`}
            >
            {isCaught ? '✓ Caught' : 'Mark as Caught'}
            </button>
            <button
                onClick={() => onAddToTeam(pokemonData.name, pokemonData.id)}
                className="w-full sm:w-auto flex-grow sm:flex-grow-0 py-1.5 px-3 text-xs rounded-md font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
            >
                Add to Party
            </button>
        </div>
        </div>

        {/* Column 2: Stats & Abilities */}
        <div className="col-span-1 md:col-span-1">
        <h3 className="text-base md:text-lg font-semibold mb-1 text-sky-300">Base Stats</h3>
        {pokemonData.baseStats.map(stat => <StatBar key={stat.name} stat={stat} />)}
        <h3 className="text-base md:text-lg font-semibold mt-2 mb-1 text-sky-300">Abilities</h3>
        <ul className="text-xs md:text-sm text-slate-300 list-disc list-inside space-y-0.5">
            {abilitiesToRender.map(ability => (
            <li key={ability.rawName}>
                <button 
                    onClick={() => onAbilityNameClick(ability.rawName)}
                    className="hover:text-sky-400 focus:text-sky-400 transition-colors duration-150 underline_on_hover"
                    title={`View details for ${ability.displayName}`}
                >
                {ability.displayName}
                </button>
            </li>
            ))}
        </ul>
        </div>
        
        {/* Column 3: Evolutions & Flavor Text */}
        <div className="col-span-1 md:col-span-1">
        <h3 className="text-base md:text-lg font-semibold mb-1 text-sky-300">Evolutions</h3>
        <EvolutionDisplay evolutionInfo={pokemonData.evolutions} onPokemonNameClick={onPokemonNameClickForEvolution} />
        <h3 className="text-base md:text-lg font-semibold mt-2 mb-1 text-sky-300">Pokédex Entry</h3>
        <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-h-20 md:max-h-24 overflow-y-auto">{pokemonData.flavorText}</p>
        </div>

        {/* Column 4: Key Moves */}
        <div className="col-span-1 md:col-span-1">
        <h3 className="text-base md:text-lg font-semibold mb-1 text-sky-300">Key Level-Up Moves <span className="text-xs text-slate-400">(Gen 7)</span></h3>
        {pokemonData.moves.length > 0 ? (
            <ul className="space-y-0.5 text-xs md:text-sm max-h-40 md:max-h-full overflow-y-auto pr-1">
            {pokemonData.moves.map(move => {
                const isStaged = move.name === stagedMoveNameForThisPokemon;
                return (
                <li 
                    key={move.name} 
                    className="bg-slate-700/50 p-1.5 rounded-md text-slate-300 flex justify-between items-center group"
                >
                    <button
                        onClick={() => onMoveNameClick(move.name, move.rawName || move.name.toLowerCase().replace(/\s+/g, '-'))}
                        className="flex-grow text-left hover:text-sky-400 focus:text-sky-400 transition-colors duration-150 underline_on_hover"
                        title={`View details for ${move.name}`}
                    >
                    <span className="font-semibold text-slate-200">Lvl {move.levelLearnedAt}:</span> {move.name}
                    </button>
                    <div className="flex items-center space-x-1.5 opacity-50 group-hover:opacity-100 transition-opacity">
                    {/* Informational icon (i) and its tooltip removed */}
                    <button 
                        className={`${isStaged ? 'text-emerald-400' : 'text-green-400 hover:text-green-300'}`} 
                        title={isStaged ? "Unstage this move" : "Stage this move for assignment"}
                        onClick={() => onStageMove(pokemonData.id, move.name, move)}
                    >
                        {isStaged ? '✓' : '⊕'}
                    </button>
                    </div>
                </li>
                );
            })}
            </ul>
        ) : (
            <p className="text-xs md:text-sm text-slate-400 italic">No specific level-up moves found for Gen 7.</p>
        )}
        </div>
    </div>
  );
};

export { PokemonDetailBarComponent as PokemonDetailBar };
// Added CSS for underline on hover for clickable names
const style = document.createElement('style');
style.textContent = `
  .underline_on_hover:hover {
    text-decoration: underline;
  }
`;
document.head.appendChild(style);
