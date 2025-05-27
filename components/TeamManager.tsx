
import React, { useState } from 'react';
import { TeamMember, TeamManagerProps, AddTeamMemberData } from '../types';

interface PokemonTeamCardProps {
   member: TeamMember;
   onRemove: (id: string) => void;
   IconPokeball: React.ElementType;
   onUpdateNickname: (id: string, nickname: string) => void;
   onUpdateLevel: (id: string, level: number) => void;
   onUpdateItem: (id: string, item: string) => void;
   onUpdateMove: (id: string, moveIndex: number, moveName: string) => void;
   onToggleShiny: (id: string) => void;
}

const PokemonTeamCard: React.FC<PokemonTeamCardProps> = ({
    member,
    onRemove,
    IconPokeball,
    onUpdateNickname,
    onUpdateLevel,
    onUpdateItem,
    onUpdateMove,
    onToggleShiny
}) => {
  const spriteBaseUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";
  const spriteUrl = member.pokemonId
    ? `${spriteBaseUrl}${member.isShiny ? 'shiny/' : ''}${member.pokemonId}.png`
    : null;

  const handleLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLevel = parseInt(e.target.value);
    if (!isNaN(newLevel)) {
        onUpdateLevel(member.id, Math.max(1, Math.min(100, newLevel)));
    } else if (e.target.value === '') {
        onUpdateLevel(member.id, 1); // Or handle empty string as desired
    }
  };

  const handleMoveChange = (index: number, value: string) => {
    onUpdateMove(member.id, index, value);
  };

  return (
    <div className="bg-slate-700/80 p-3 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 relative group backdrop-blur-sm border border-slate-600/70 text-sm">
      <button
        onClick={() => onRemove(member.id)}
        className="absolute top-1.5 right-1.5 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 focus:outline-none focus:ring-1 focus:ring-red-400 z-10 leading-none"
        aria-label={`Remove ${member.nickname || member.species}`}
      >
        &times;
      </button>

      <div className="flex items-start space-x-3">
        {spriteUrl ? (
          <img 
            src={spriteUrl} 
            alt={member.nickname || member.species} 
            className="w-16 h-16 pixelated-sprite bg-slate-600/50 rounded-md mt-1" 
            onError={(e) => (e.currentTarget.style.display = 'none')} // Hide if sprite fails to load
          />
        ) : (
          <div className="w-16 h-16 bg-slate-600/50 rounded-md flex items-center justify-center mt-1">
            <IconPokeball className="text-3xl text-slate-500" />
          </div>
        )}
        <div className="flex-1 space-y-1.5">
          <input
            type="text"
            value={member.nickname || ''}
            onChange={(e) => onUpdateNickname(member.id, e.target.value)}
            placeholder="Nickname"
            className="w-full bg-slate-800/70 text-slate-100 placeholder-slate-400 px-2 py-1 rounded-md text-base font-semibold border border-slate-600 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 outline-none"
          />
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Lvl:</span>
            <input
              type="number"
              value={member.level}
              onChange={handleLevelChange}
              min="1"
              max="100"
              className="w-16 bg-slate-800/70 text-slate-100 px-2 py-0.5 rounded-md text-xs border border-slate-600 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 outline-none"
            />
             <button 
                onClick={() => onToggleShiny(member.id)}
                className={`px-2 py-0.5 text-xs rounded ${member.isShiny ? 'bg-yellow-400 text-black hover:bg-yellow-500' : 'bg-slate-600 text-slate-200 hover:bg-slate-500'} transition-colors`}
                title={member.isShiny ? "Make Non-Shiny" : "Make Shiny"}
            >
                {member.isShiny ? '🌟 Shiny' : 'Normal'}
            </button>
          </div>
          <p className="text-xs text-sky-300">{member.species}</p>
        </div>
      </div>
      
      <div className="mt-2 space-y-1">
        <input
            type="text"
            value={member.heldItem || ''}
            onChange={(e) => onUpdateItem(member.id, e.target.value)}
            placeholder="Held Item"
            className="w-full bg-slate-800/70 text-slate-100 placeholder-slate-400 px-2 py-1 rounded-md text-xs border border-slate-600 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 outline-none"
        />
        <div className="grid grid-cols-2 gap-1.5">
            {(member.moves || ['', '', '', '']).slice(0,4).map((move, index) => (
                <input
                    key={index}
                    type="text"
                    value={move}
                    onChange={(e) => handleMoveChange(index, e.target.value)}
                    placeholder={`Move ${index + 1}`}
                    className="w-full bg-slate-800/70 text-slate-100 placeholder-slate-400 px-2 py-1 rounded-md text-xs border border-slate-600 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 outline-none"
                />
            ))}
        </div>
      </div>
    </div>
  );
};


export const TeamManager: React.FC<TeamManagerProps> = ({ 
    team, 
    onAddTeamMember, 
    onRemoveTeamMember, 
    IconPokeball,
    levelCap,
    nextBattleName,
    nextBattleLocation,
    nextBattlePokemonCount,
    onUpdateTeamMemberNickname,
    onUpdateTeamMemberLevel,
    onUpdateTeamMemberItem,
    onUpdateTeamMemberMove,
    onToggleTeamMemberShiny
}) => {

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-sky-400 tracking-tight">My Nuzlocke Team</h2>
      
      { (levelCap || nextBattleName) && (
        <div className="bg-slate-700/60 p-3 rounded-lg border border-slate-600/70">
            <h3 className="text-sm font-semibold text-sky-300 mb-1">Next Challenge Info:</h3>
            {nextBattleName && nextBattleLocation && (
                 <p className="text-xs text-slate-200">
                    <span className="font-medium">{nextBattleName}</span> at {nextBattleLocation}
                 </p>
            )}
            {nextBattlePokemonCount && (
                <p className="text-xs text-slate-300">Opponent Pokémon: {nextBattlePokemonCount}</p>
            )}
            {levelCap && (
                <p className="text-xs text-slate-300">Recommended Level Cap: <span className="font-semibold text-yellow-300">{levelCap}</span></p>
            )}
            {!levelCap && !nextBattleName && <p className="text-xs text-slate-400 italic">No specific challenge data found next.</p>}
        </div>
      )}

      <div className="space-y-4">
        {team.length > 0 ? (
          team.map(member => (
            <PokemonTeamCard 
              key={member.id} 
              member={member} 
              onRemove={onRemoveTeamMember} 
              IconPokeball={IconPokeball}
              onUpdateNickname={onUpdateTeamMemberNickname}
              onUpdateLevel={onUpdateTeamMemberLevel}
              onUpdateItem={onUpdateTeamMemberItem}
              onUpdateMove={onUpdateTeamMemberMove}
              onToggleShiny={onToggleTeamMemberShiny}
            />
          ))
        ) : (
          <p className="text-slate-400 italic text-center py-4">Your team is empty. Add Pokémon via the detail view!</p>
        )}
      </div>
      {/* Manual Add Pokemon Form Removed */}
    </div>
  );
};
