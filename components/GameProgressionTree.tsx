
import React from 'react';
import { GameLocationNode } from '../types';

interface GameProgressionTreeProps {
  locations: GameLocationNode[];
  selectedLocationId: string | null;
  onSelectLocation: (location: GameLocationNode) => void;
}

export const GameProgressionTree: React.FC<GameProgressionTreeProps> = ({ locations, selectedLocationId, onSelectLocation }) => {
  return (
    <nav className="space-y-2">
      {locations.map((location, index) => (
        <button
          key={location.id}
          onClick={() => onSelectLocation(location)}
          className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-sky-500
            ${selectedLocationId === location.id 
              ? 'bg-sky-600 text-white shadow-lg ring-2 ring-sky-400' 
              : 'bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white'
            }
          `}
        >
          <div className="flex items-center">
            <span className={`mr-3 h-2.5 w-2.5 rounded-full ${selectedLocationId === location.id ? 'bg-white' : 'bg-sky-400'}`}></span>
            <span className="font-medium">{location.name}</span>
          </div>
        </button>
      ))}
    </nav>
  );
};
    