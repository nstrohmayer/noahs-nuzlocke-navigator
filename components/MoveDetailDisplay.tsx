import React from 'react';
import { MoveDetailDisplayProps } from '../types';

const TypeBadge: React.FC<{ type: string, className?: string }> = ({ type, className }) => {
    const typeColors: Record<string, string> = {
        Normal: 'bg-gray-400 text-black', Fighting: 'bg-red-700', Flying: 'bg-sky-300 text-black',
        Poison: 'bg-purple-600', Ground: 'bg-yellow-600 text-black', Rock: 'bg-yellow-700',
        Bug: 'bg-lime-500', Ghost: 'bg-indigo-700', Steel: 'bg-slate-400', Fire: 'bg-orange-500',
        Water: 'bg-blue-500', Grass: 'bg-green-500', Electric: 'bg-yellow-400 text-black',
        Psychic: 'bg-pink-500', Ice: 'bg-cyan-300 text-black', Dragon: 'bg-indigo-500',
        Dark: 'bg-neutral-700', Fairy: 'bg-pink-300 text-black',
    };
    return <span className={`px-2 py-1 rounded-md text-xs font-semibold ${typeColors[type] || 'bg-gray-500'} ${className}`}>{type}</span>;
}

const DamageClassIcon: React.FC<{ classType: string }> = ({ classType }) => {
    let icon = '❓';
    let color = 'text-slate-400';
    if (classType === 'Physical') { icon = '💥'; color = 'text-orange-400'; }
    else if (classType === 'Special') { icon = '💫'; color = 'text-sky-400'; }
    else if (classType === 'Status') { icon = '🌀'; color = 'text-gray-400'; }
    return <span className={`text-lg ${color}`} title={classType}>{icon}</span>;
};

export const MoveDetailDisplay: React.FC<MoveDetailDisplayProps> = ({ moveData, onPokemonNameClick }) => {
  return (
    <div className="p-4 h-full">
      <div className="flex justify-between items-start mb-3">
        <h2 className="text-xl font-bold text-sky-400">{moveData.name}</h2>
        <div className="flex items-center space-x-2">
            <TypeBadge type={moveData.type} />
            <DamageClassIcon classType={moveData.damageClass} />
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 h-[calc(100%-3.5rem)]">
        {/* Left Column: Move Information */}
        <div className="w-full md:w-2/3 space-y-3 overflow-y-auto pr-2">
            <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-700/50 p-2 rounded-md">
                    <p className="text-xs text-slate-400">Power</p>
                    <p className="font-semibold text-lg text-slate-100">{moveData.power ?? '—'}</p>
                </div>
                <div className="bg-slate-700/50 p-2 rounded-md">
                    <p className="text-xs text-slate-400">Accuracy</p>
                    <p className="font-semibold text-lg text-slate-100">{moveData.accuracy !== null ? `${moveData.accuracy}%` : '—'}</p>
                </div>
                <div className="bg-slate-700/50 p-2 rounded-md">
                    <p className="text-xs text-slate-400">PP</p>
                    <p className="font-semibold text-lg text-slate-100">{moveData.pp}</p>
                </div>
            </div>

            <div className="bg-slate-700/50 p-3 rounded-md">
                <h3 className="font-semibold text-slate-200 mb-1">Effect:</h3>
                <p className="text-slate-300 leading-relaxed text-sm">{moveData.effect}</p>
                {moveData.effectChance !== null && moveData.effectChance !== undefined && (
                    <p className="text-xs text-sky-300 mt-1">Effect Chance: {moveData.effectChance}%</p>
                )}
            </div>
            
            <div className="bg-slate-700/50 p-3 rounded-md">
                <h3 className="font-semibold text-slate-200 mb-1">Target:</h3>
                <p className="text-slate-300 text-sm">{moveData.target}</p>
            </div>

            {moveData.flavorText && (
                <div className="bg-slate-700/50 p-3 rounded-md">
                <h3 className="font-semibold text-slate-200 mb-1">Game Description (USUM):</h3>
                <p className="text-slate-300 italic leading-relaxed text-sm">{moveData.flavorText}</p>
                </div>
            )}
        </div>

        {/* Right Column: Pokémon that learn this move */}
        <div className="w-full md:w-1/3">
            <h3 className="font-semibold text-slate-200 mb-2 text-lg">Learned By:</h3>
            {moveData.learnedByPokemon && moveData.learnedByPokemon.length > 0 ? (
            <ul className="space-y-1.5 bg-slate-700/30 p-3 rounded-md max-h-[calc(100%-2.5rem)] overflow-y-auto">
                {moveData.learnedByPokemon.map(p => (
                <li key={p.id || p.name} className="text-sm">
                    <button
                    onClick={() => onPokemonNameClick && onPokemonNameClick(p.id || p.name)}
                    className="text-slate-300 hover:text-sky-400 focus:text-sky-400 transition-colors duration-150 w-full text-left p-1 rounded hover:bg-slate-600/50 focus:bg-slate-600/50 focus:outline-none"
                    aria-label={`View details for ${p.name}`}
                    >
                    {p.name}
                    </button>
                </li>
                ))}
            </ul>
            ) : (
            <p className="text-slate-400 italic text-sm">No specific Pokémon listed that learn this move in the provided data.</p>
            )}
            <p className="text-xxs text-slate-500 mt-1">Note: List from PokeAPI data, may not reflect specific learnsets in Ultra Sun/Moon (e.g. level-up, TM, tutor). Verify in-game.</p>
        </div>
      </div>
    </div>
  );
};