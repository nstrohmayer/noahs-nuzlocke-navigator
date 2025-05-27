
import React, { useState, useMemo } from 'react';
import { GameLocationNode } from '../types';

interface GameProgressionTreeProps {
  locations: GameLocationNode[];
  selectedLocationId: string | null;
  onSelectLocation: (location: GameLocationNode) => void;
}

export const GameProgressionTree: React.FC<GameProgressionTreeProps> = ({ locations, selectedLocationId, onSelectLocation }) => {
  const [activeIslandFilter, setActiveIslandFilter] = useState<string>("All");

  const islandFilters = useMemo(() => {
    const uniqueIslands = new Set(locations.map(loc => loc.island).filter(island => island));
    return ["All", ...Array.from(uniqueIslands)].sort((a, b) => {
      if (a === "All") return -1;
      if (b === "All") return 1;
      if (a === "Melemele") return -1;
      if (b === "Melemele") return 1;
      if (a === "Akala") return -1;
      if (b === "Akala") return 1;
      if (a === "Ula'ula") return -1;
      if (b === "Ula'ula") return 1;
      if (a === "Poni") return -1;
      if (b === "Poni") return 1;
      return a.localeCompare(b);
    });
  }, [locations]);

  const filteredLocations = useMemo(() => {
    if (activeIslandFilter === "All") {
      return locations;
    }
    return locations.filter(location => location.island === activeIslandFilter);
  }, [locations, activeIslandFilter]);

  return (
    <>
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Filter by Island</h3>
        <div className="flex flex-wrap gap-2">
          {islandFilters.map(island => (
            <button
              key={island}
              onClick={() => setActiveIslandFilter(island)}
              aria-pressed={activeIslandFilter === island}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-opacity-50
                ${activeIslandFilter === island
                  ? 'bg-sky-500 text-white ring-sky-400'
                  : 'bg-slate-600 hover:bg-slate-500 text-slate-200 hover:text-white ring-slate-500'
                }
              `}
            >
              {island}
            </button>
          ))}
        </div>
      </div>
      <nav className="space-y-2">
        {filteredLocations.map((location) => (
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
    </>
  );
};
