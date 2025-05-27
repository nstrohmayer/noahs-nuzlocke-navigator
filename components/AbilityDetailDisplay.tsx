import React from 'react';
import { AbilityDetailDisplayProps } from '../types';

export const AbilityDetailDisplay: React.FC<AbilityDetailDisplayProps> = ({ abilityData, onPokemonNameClick }) => {
  return (
    <div className="p-4 h-full">
      <h2 className="text-xl font-bold text-sky-400 mb-3">{abilityData.name}</h2>
      <div className="flex flex-col md:flex-row gap-4 h-[calc(100%-3rem)]">
        {/* Left Column: Ability Information */}
        <div className="w-full md:w-2/3 space-y-3 overflow-y-auto pr-2">
          <div className="bg-slate-700/50 p-3 rounded-md">
            <h3 className="font-semibold text-slate-200 mb-1">Effect:</h3>
            <p className="text-slate-300 leading-relaxed text-sm">{abilityData.effect}</p>
          </div>

          {abilityData.shortEffect && abilityData.shortEffect !== abilityData.effect && (
            <div className="bg-slate-700/50 p-3 rounded-md">
              <h3 className="font-semibold text-slate-200 mb-1">Short Effect:</h3>
              <p className="text-slate-300 leading-relaxed text-sm">{abilityData.shortEffect}</p>
            </div>
          )}

          {abilityData.flavorText && (
            <div className="bg-slate-700/50 p-3 rounded-md">
              <h3 className="font-semibold text-slate-200 mb-1">Game Description (USUM):</h3>
              <p className="text-slate-300 italic leading-relaxed text-sm">{abilityData.flavorText}</p>
            </div>
          )}
        </div>

        {/* Right Column: Pokémon with this ability */}
        <div className="w-full md:w-1/3">
          <h3 className="font-semibold text-slate-200 mb-2 text-lg">Pokémon with this ability:</h3>
          {abilityData.pokemonWithAbility && abilityData.pokemonWithAbility.length > 0 ? (
            <ul className="space-y-1.5 bg-slate-700/30 p-3 rounded-md max-h-[calc(100%-2.5rem)] overflow-y-auto">
              {abilityData.pokemonWithAbility.map(p => (
                <li key={p.id || p.name} className="text-sm">
                  <button
                    onClick={() => onPokemonNameClick && onPokemonNameClick(p.id || p.name)}
                    className="text-slate-300 hover:text-sky-400 focus:text-sky-400 transition-colors duration-150 w-full text-left p-1 rounded hover:bg-slate-600/50 focus:bg-slate-600/50 focus:outline-none"
                    aria-label={`View details for ${p.name}`}
                  >
                    {p.name}
                    {p.isHidden && <span className="text-sky-400 ml-1 text-xs">(Hidden)</span>}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-400 italic text-sm">No specific Pokémon listed with this ability in the provided data.</p>
          )}
           <p className="text-xxs text-slate-500 mt-1">Note: List from PokeAPI data; verify in-game for Nuzlocke.</p>
        </div>
      </div>
    </div>
  );
};