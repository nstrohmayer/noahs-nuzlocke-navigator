
import { useState, useEffect, useCallback } from 'react';
import { GameLocationNode, DetailedLocationInfo } from '../types';
import { ULTRA_MOON_PROGRESSION, CURRENT_LOCATION_STORAGE_KEY, DEFAULT_CURRENT_LOCATION_ID } from '../constants';
import { fetchLocationDetailsFromGemini } from '../services/geminiService';

export const useGameProgression = (
  apiKeyMissing: boolean,
  activeMainPanel: 'location' | 'navigator',
  setActiveMainPanel: (panel: 'location' | 'navigator') => void
) => {
  const [currentLocationId, setCurrentLocationIdState] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<GameLocationNode | null>(null);
  const [locationDetails, setLocationDetails] = useState<DetailedLocationInfo | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [levelCap, setLevelCap] = useState<number | null>(null);
  const [nextBattleName, setNextBattleName] = useState<string | null>(null);
  const [nextBattleLocation, setNextBattleLocation] = useState<string | null>(null);
  const [nextBattlePokemonCount, setNextBattlePokemonCount] = useState<number | null>(null);

  const handleSelectLocation = useCallback((location: GameLocationNode) => {
    setSelectedLocation(location);
    setLocationDetails(null); // Clear old details
    setLocationError(null);   // Clear old errors
    setActiveMainPanel('location');
  }, [setActiveMainPanel]);

  const setCurrentLocation = useCallback((locationId: string) => {
    try {
      localStorage.setItem(CURRENT_LOCATION_STORAGE_KEY, locationId);
    } catch (e) {
      console.error("Failed to save current location ID to localStorage", e);
    }
    setCurrentLocationIdState(locationId); // Update internal state for the star icon

    // If the location being starred is already selected, don't re-trigger detail fetching.
    // The visual update of the star is handled by the state change above.
    if (selectedLocation?.id === locationId) {
      return;
    }
    
    const newCurrentLocation = ULTRA_MOON_PROGRESSION.find(loc => loc.id === locationId);
    if (newCurrentLocation) {
      // This will also trigger the useEffect below to fetch details for the new current location
      handleSelectLocation(newCurrentLocation);
    }
  }, [handleSelectLocation, selectedLocation?.id]); // Added selectedLocation.id dependency
  
  // Effect for initializing current/selected location ONCE on mount
  useEffect(() => {
    let initialLocationId: string | null = null;
    try {
      initialLocationId = localStorage.getItem(CURRENT_LOCATION_STORAGE_KEY);
    } catch (e) {
      console.error("Failed to read current location ID from localStorage", e);
    }

    let locationToSelect: GameLocationNode | null = null;

    if (initialLocationId) {
      locationToSelect = ULTRA_MOON_PROGRESSION.find(loc => loc.id === initialLocationId) || null;
    }

    if (!locationToSelect) {
      locationToSelect = ULTRA_MOON_PROGRESSION.find(loc => loc.id === DEFAULT_CURRENT_LOCATION_ID) || null;
    }
    
    if (!locationToSelect && ULTRA_MOON_PROGRESSION.length > 0) {
      locationToSelect = ULTRA_MOON_PROGRESSION[0];
    }

    if (locationToSelect) {
      setCurrentLocationIdState(locationToSelect.id); 
      handleSelectLocation(locationToSelect); 
    } else {
      // No valid location found, ensure panel is location and states are cleared
      setActiveMainPanel('location');
      setSelectedLocation(null);
      setLocationDetails(null);
      setLocationError(null);
      setIsLoadingLocation(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only once on mount


  // Effect for fetching location details AND pre-fetching neighbors
  useEffect(() => {
    let currentFetchSuccessful = false;
    let currentIndex = -1;

    if (selectedLocation) {
      currentIndex = ULTRA_MOON_PROGRESSION.findIndex(loc => loc.id === selectedLocation.id);
    }

    // Update Level Cap and Next Battle Info based on selectedLocation
    let nextCap: number | null = null;
    let battleName: string | null = null;
    let battleLoc: string | null = null;
    let battlePokemonCount: number | null = null;

    if (selectedLocation && currentIndex !== -1) {
      for (let i = currentIndex + 1; i < ULTRA_MOON_PROGRESSION.length; i++) {
        const futureLocation = ULTRA_MOON_PROGRESSION[i];
        if (futureLocation.significantBattleLevel) {
          nextCap = futureLocation.significantBattleLevel;
          battleName = futureLocation.significantBattleName || "Significant Battle";
          battleLoc = futureLocation.name;
          battlePokemonCount = futureLocation.significantBattlePokemonCount || null;
          break;
        }
      }
    }
    setLevelCap(nextCap);
    setNextBattleName(battleName);
    setNextBattleLocation(battleLoc);
    setNextBattlePokemonCount(battlePokemonCount);

    // Handle fetching details for the selected location
    if (apiKeyMissing) {
      setLocationDetails(null);
      setIsLoadingLocation(false);
      // Do not set locationError here, App.tsx handles global API key error
      return;
    }

    if (selectedLocation && activeMainPanel === 'location') {
      const fetchAllDetails = async () => {
        setIsLoadingLocation(true);
        setLocationError(null);
        try {
          const details = await fetchLocationDetailsFromGemini(selectedLocation.name);
          setLocationDetails(details);
          currentFetchSuccessful = true; // Mark successful fetch
        } catch (err) {
          console.error("Error fetching location details:", err);
          setLocationError(err instanceof Error ? `Failed to fetch details for ${selectedLocation.name}: ${err.message}.` : `Failed to fetch details for ${selectedLocation.name}. An unknown error occurred.`);
          setLocationDetails(null);
        } finally {
          setIsLoadingLocation(false);

          // Pre-fetch neighbors AFTER current location fetch attempt (success or fail)
          if (currentFetchSuccessful && currentIndex !== -1) {
            const prefetchNeighbor = async (neighborLocation: GameLocationNode | undefined) => {
              if (neighborLocation) {
                try {
                  console.log(`Pre-fetching details for: ${neighborLocation.name}`);
                  await fetchLocationDetailsFromGemini(neighborLocation.name); // Caching handled internally
                } catch (prefetchError) {
                  console.warn(`Failed to pre-fetch details for ${neighborLocation.name}:`, prefetchError);
                }
              }
            };

            const prevLocation = ULTRA_MOON_PROGRESSION[currentIndex - 1];
            const nextLocation = ULTRA_MOON_PROGRESSION[currentIndex + 1];

            // Fire off pre-fetches without awaiting them to block UI updates
            prefetchNeighbor(prevLocation);
            prefetchNeighbor(nextLocation);
          }
        }
      };
      fetchAllDetails();
    } else if (!selectedLocation && activeMainPanel === 'location') {
        setLocationDetails(null);
        setLocationError(null); 
        setIsLoadingLocation(false); // Ensure loading is false if no location is selected
    }
  }, [selectedLocation, apiKeyMissing, activeMainPanel]); // Re-run when selectedLocation or panel changes

  return {
    selectedLocation,
    locationDetails,
    isLoadingLocation,
    locationError,
    levelCap,
    nextBattleName,
    nextBattleLocation,
    nextBattlePokemonCount,
    handleSelectLocation,
    currentLocationId,
    setCurrentLocation,
  };
};
