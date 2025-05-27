
import React from 'react';

interface PokemonNameProps {
  pokemonName: string;
  onClick: (pokemonName: string) => void;
}

export const PokemonName: React.FC<PokemonNameProps> = ({ pokemonName, onClick }) => {
  return (
    <button
      onClick={() => onClick(pokemonName)}
      className="ml-2 text-slate-200 flex-grow text-left hover:text-sky-400 focus:text-sky-400 transition-colors duration-150 focus:outline-none"
      aria-label={`View details for ${pokemonName}`}
    >
      {pokemonName.charAt(0).toUpperCase() + pokemonName.slice(1)}
    </button>
  );
};
