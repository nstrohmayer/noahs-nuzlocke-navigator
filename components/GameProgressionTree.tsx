
import React, { useState, useMemo, useEffect } from 'react';
import { GameLocationNode } from '../types';

interface GameProgressionTreeProps {
  locations: GameLocationNode[];
  selectedLocationId: string | null;
  onSelectLocation: (location: GameLocationNode) => void;
  currentLocationId: string | null;
  onSetCurrentLocation: (locationId: string) => void;
}

export const GameProgressionTree: React.FC<GameProgressionTreeProps> = ({ 
  locations, 
  selectedLocationId, 
  onSelectLocation,
  currentLocationId,
  onSetCurrentLocation
}) => {
  const islandFilters = useMemo(() => {
    const uniqueIslands = new Set(locations.map(loc => loc.island).filter(island => !!island));
    return Array.from(uniqueIslands).sort((a, b) => {
      const islandOrder = ["Melemele", "Akala", "Ula'ula", "Poni"];
      const indexA = islandOrder.indexOf(a!);
      const indexB = islandOrder.indexOf(b!);

      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a!.localeCompare(b!);
    });
  }, [locations]);

  const [activeIslandFilter, setActiveIslandFilter] = useState<string | null>(null);

  useEffect(() => {
    if (islandFilters.length > 0) {
      if (!activeIslandFilter || !islandFilters.includes(activeIslandFilter)) {
        setActiveIslandFilter(islandFilters[0]);
      }
    } else {
      setActiveIslandFilter(null);
    }
  }, [islandFilters, activeIslandFilter]);

  const filteredLocations = useMemo(() => {
    if (!activeIslandFilter) {
      return [];
    }
    return locations.filter(location => location.island === activeIslandFilter);
  }, [locations, activeIslandFilter]);

  const handleStarClick = (e: React.MouseEvent, locationId: string) => {
    e.stopPropagation(); // Prevent the location button click
    onSetCurrentLocation(locationId);
  };

  return (
    <>
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Filter by Island</h3>
        {islandFilters.length > 0 ? (
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
        ) : (
          <p className="text-sm text-slate-400 italic">No islands available to filter.</p>
        )}
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
            aria-current={selectedLocationId === location.id ? "page" : undefined}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className={`mr-3 h-2.5 w-2.5 rounded-full ${selectedLocationId === location.id ? 'bg-white' : 'bg-sky-400'}`}></span>
                <span className="font-medium">{location.name}</span>
              </div>
              <button
                onClick={(e) => handleStarClick(e, location.id)}
                className={`p-1 rounded-full transition-colors text-lg ${currentLocationId === location.id ? 'text-yellow-400 hover:text-yellow-300' : 'text-slate-400 hover:text-yellow-400'}`}
                aria-label={currentLocationId === location.id ? `Unmark ${location.name} as current` : `Mark ${location.name} as current`}
                title={currentLocationId === location.id ? `Unmark as current` : `Mark as current`}
              >
                {currentLocationId === location.id ? '⭐' : '☆'}
              </button>
            </div>
          </button>
        ))}
        {filteredLocations.length === 0 && activeIslandFilter && (
            <p className="text-sm text-slate-400 italic text-center py-3">No locations found for {activeIslandFilter} island.</p>
        )}
      </nav>
    </>
  );
};
