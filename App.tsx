
import React, { useState, useEffect, useCallback } from 'react';
import { GameLocationNode, DetailedLocationInfo, TeamMember, PokemonDetailData, CaughtStatusMap, AddTeamMemberData, PokemonMoveInfo } from './types';
import { ULTRA_MOON_PROGRESSION } from './constants';
import { GameProgressionTree } from './components/GameProgressionTree';
import { LocationDetailsDisplay } from './components/LocationDetailsDisplay';
import { TeamManager } from './components/TeamManager';
import { PokemonDetailBar } from './components/PokemonDetailBar';
import { fetchLocationDetailsFromGemini } from './services/geminiService';
import { fetchPokemonDetails } from './services/pokeApiService';


// Placeholder icons - replace with actual SVGs or a library if needed
const IconPokeball = () => <span className="text-red-500">◉</span>;
const IconTrainer = () => <span className="text-blue-400">👤</span>;
const IconItem = () => <span className="text-yellow-400">🛍️</span>;
const IconBattle = () => <span className="text-purple-400">⚔️</span>;

const CAUGHT_POKEMON_STORAGE_KEY = 'nuzlocke-caught-pokemon';
const TEAM_STORAGE_KEY = 'nuzlocke-team';


const App: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<GameLocationNode | null>(ULTRA_MOON_PROGRESSION[0] || null);
  const [locationDetails, setLocationDetails] = useState<DetailedLocationInfo | null>(null);
  const [team, setTeam] = useState<TeamMember[]>(() => {
    try {
      const storedTeam = localStorage.getItem(TEAM_STORAGE_KEY);
      return storedTeam ? JSON.parse(storedTeam) : [];
    } catch (e) {
      console.error("Failed to load team from localStorage", e);
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState<boolean>(false);
  
  const [levelCap, setLevelCap] = useState<number | null>(null);
  const [nextBattleName, setNextBattleName] = useState<string | null>(null);
  const [nextBattleLocation, setNextBattleLocation] = useState<string | null>(null);
  const [nextBattlePokemonCount, setNextBattlePokemonCount] = useState<number | null>(null);

  const [selectedPokemonDetailData, setSelectedPokemonDetailData] = useState<PokemonDetailData | null>(null);
  const [isLoadingPokemonDetailData, setIsLoadingPokemonDetailData] = useState<boolean>(false);
  const [pokemonDetailDataError, setPokemonDetailDataError] = useState<string | null>(null);

  const [caughtPokemon, setCaughtPokemon] = useState<CaughtStatusMap>({});

  const [selectedMoveForAssignment, setSelectedMoveForAssignment] = useState<{ pokemonId: number; moveName: string; moveDetails: PokemonMoveInfo } | null>(null);

  useEffect(() => {
    if (!process.env.API_KEY) {
      setApiKeyMissing(true);
      setError("API Key is missing. Please set the API_KEY environment variable.");
    }
    try {
      const storedCaughtPokemon = localStorage.getItem(CAUGHT_POKEMON_STORAGE_KEY);
      if (storedCaughtPokemon) {
        setCaughtPokemon(JSON.parse(storedCaughtPokemon));
      }
    } catch (e) {
      console.error("Failed to load caught Pokemon status from localStorage", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CAUGHT_POKEMON_STORAGE_KEY, JSON.stringify(caughtPokemon));
    } catch (e) {
      console.error("Failed to save caught Pokemon status to localStorage", e);
    }
  }, [caughtPokemon]);

  useEffect(() => {
    try {
      localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(team));
    } catch (e) {
      console.error("Failed to save team to localStorage", e);
    }
  }, [team]);

  // Effect to auto-assign staged move to an existing team member
  useEffect(() => {
    if (selectedMoveForAssignment) {
      const targetPokemonId = selectedMoveForAssignment.pokemonId;
      const moveNameToAssign = selectedMoveForAssignment.moveName;

      const teamMemberIndex = team.findIndex(member => member.pokemonId === targetPokemonId);

      if (teamMemberIndex !== -1) {
        setTeam(prevTeam => {
          const updatedTeam = [...prevTeam];
          const memberToUpdate = { ...updatedTeam[teamMemberIndex] };
          let currentMoves = [...(memberToUpdate.moves || ['', '', '', ''])];
          
          // Prevent adding duplicate moves
          if (currentMoves.includes(moveNameToAssign)) {
            // Optionally, provide feedback that move is already learned
            // console.log(`${memberToUpdate.nickname || memberToUpdate.species} already knows ${moveNameToAssign}.`);
            setSelectedMoveForAssignment(null); // Clear staged move
            return prevTeam; // No change
          }

          let assigned = false;
          for (let i = 0; i < 4; i++) {
            if (!currentMoves[i] || currentMoves[i] === "") {
              currentMoves[i] = moveNameToAssign;
              assigned = true;
              break;
            }
          }
          if (!assigned) { // If all slots are full, replace the first move
            currentMoves[0] = moveNameToAssign;
          }
          memberToUpdate.moves = currentMoves;
          updatedTeam[teamMemberIndex] = memberToUpdate;
          return updatedTeam;
        });
        console.log(`Assigned ${moveNameToAssign} to ${team[teamMemberIndex].nickname || team[teamMemberIndex].species}.`);
        setSelectedMoveForAssignment(null); // Clear staged move after assignment
      }
    }
  }, [selectedMoveForAssignment, team]);


  const handleToggleCaughtStatus = useCallback((pokemonId: string | number) => {
    const idStr = pokemonId.toString();
    setCaughtPokemon(prev => ({
      ...prev,
      [idStr]: !prev[idStr]
    }));
  }, []);

  const addTeamMember = useCallback((memberData: AddTeamMemberData) => {
    const newMoves = ['', '', '', ''];
    if (memberData.initialMove) {
        newMoves[0] = memberData.initialMove;
    }
    setTeam(prevTeam => [
        ...prevTeam, 
        { 
            id: Date.now().toString(), // Ensure id is always string
            species: memberData.species,
            level: memberData.level,
            nickname: memberData.nickname || memberData.species,
            heldItem: '',
            moves: newMoves,
            isShiny: false,
            pokemonId: memberData.pokemonId 
        }
    ]);
  }, []);

  const handleAddPokemonToTeamFromDetail = useCallback((speciesName: string, pokemonId: number) => {
    const isAlreadyInTeam = team.some(member => member.species.toLowerCase() === speciesName.toLowerCase());
    if (isAlreadyInTeam) {
        alert(`${speciesName} is already in your team!`);
        return;
    }
    if (team.length >= 6) {
        alert("Your team is full (6 Pokémon maximum)!");
        return;
    }

    let initialMoveName: string | undefined = undefined;
    if (selectedMoveForAssignment && selectedMoveForAssignment.pokemonId === pokemonId) {
        initialMoveName = selectedMoveForAssignment.moveName;
    }

    addTeamMember({ 
        species: speciesName, 
        level: 5, 
        pokemonId: pokemonId,
        initialMove: initialMoveName
    }); 

    if (!caughtPokemon[pokemonId.toString()]) {
        handleToggleCaughtStatus(pokemonId);
    }
    if (initialMoveName) {
      setSelectedMoveForAssignment(null); // Clear staged move after adding to team
    }
  }, [team, caughtPokemon, handleToggleCaughtStatus, addTeamMember, selectedMoveForAssignment]);


  const handleSelectLocation = useCallback((location: GameLocationNode) => {
    setSelectedLocation(location);
    setLocationDetails(null); 
    setError(null);
  }, []);

  useEffect(() => {
    let nextCap: number | null = null;
    let battleName: string | null = null;
    let battleLocation: string | null = null;
    let battlePokemonCount: number | null = null;

    if (selectedLocation) {
      const currentIndex = ULTRA_MOON_PROGRESSION.findIndex(loc => loc.id === selectedLocation.id);
      if (currentIndex !== -1) {
        for (let i = currentIndex + 1; i < ULTRA_MOON_PROGRESSION.length; i++) {
          const futureLocation = ULTRA_MOON_PROGRESSION[i];
          if (futureLocation.significantBattleLevel) {
            nextCap = futureLocation.significantBattleLevel;
            battleName = futureLocation.significantBattleName || "Significant Battle";
            battleLocation = futureLocation.name; 
            battlePokemonCount = futureLocation.significantBattlePokemonCount || null;
            break; 
          }
        }
      }
    }
    setLevelCap(nextCap);
    setNextBattleName(battleName);
    setNextBattleLocation(battleLocation);
    setNextBattlePokemonCount(battlePokemonCount);

    if (selectedLocation && !apiKeyMissing) {
      const fetchAllDetails = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
          const details = await fetchLocationDetailsFromGemini(selectedLocation.name);
          setLocationDetails(details);
        } catch (err) {
          console.error("Error fetching location details:", err);
          if (err instanceof Error) {
            setError(`Failed to fetch details for ${selectedLocation.name}: ${err.message}.`);
          } else {
            setError(`Failed to fetch details for ${selectedLocation.name}. An unknown error occurred.`);
          }
          setLocationDetails(null);
        } finally {
          setIsLoading(false);
        }
      };
      fetchAllDetails();
    } else if (!selectedLocation) {
        setLocationDetails(null);
        setError(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocation, apiKeyMissing]);


  const removeTeamMember = (id: string) => {
    setTeam(prevTeam => prevTeam.filter(member => member.id !== id));
  };

  const handleUpdateTeamMemberNickname = useCallback((memberId: string, nickname: string) => {
    setTeam(prevTeam => prevTeam.map(member => 
      member.id === memberId ? { ...member, nickname } : member
    ));
  }, []);

  const handleUpdateTeamMemberLevel = useCallback((memberId: string, level: number) => {
    setTeam(prevTeam => prevTeam.map(member => 
      member.id === memberId ? { ...member, level: Math.max(1, Math.min(100, level)) } : member
    ));
  }, []);

  const handleUpdateTeamMemberItem = useCallback((memberId: string, item: string) => {
    setTeam(prevTeam => prevTeam.map(member => 
      member.id === memberId ? { ...member, heldItem: item } : member
    ));
  }, []);

  const handleUpdateTeamMemberMove = useCallback((memberId: string, moveIndex: number, moveName: string) => {
    setTeam(prevTeam => prevTeam.map(member => {
      if (member.id === memberId) {
        const newMoves = [...(member.moves || ['', '', '', ''])];
        newMoves[moveIndex] = moveName;
        return { ...member, moves: newMoves };
      }
      return member;
    }));
  }, []);

  const handleToggleTeamMemberShiny = useCallback((memberId: string) => {
    setTeam(prevTeam => prevTeam.map(member => 
      member.id === memberId ? { ...member, isShiny: !member.isShiny } : member
    ));
  }, []);


  const handlePokemonNameClick = useCallback(async (pokemonName: string) => {
    setIsLoadingPokemonDetailData(true);
    setPokemonDetailDataError(null);
    setSelectedPokemonDetailData(null); 
    setSelectedMoveForAssignment(null); // Clear staged move when opening a new Pokemon detail
    try {
      const details = await fetchPokemonDetails(pokemonName);
      setSelectedPokemonDetailData(details);
    } catch (err) {
      console.error(`Error fetching Pokémon details for ${pokemonName}:`, err);
      if (err instanceof Error) {
        setPokemonDetailDataError(err.message);
      } else {
        setPokemonDetailDataError(`An unknown error occurred while fetching details for ${pokemonName}.`);
      }
    } finally {
      setIsLoadingPokemonDetailData(false);
    }
  }, []);

  const handleClosePokemonDetailBar = useCallback(() => {
    setSelectedPokemonDetailData(null);
    setPokemonDetailDataError(null);
    setSelectedMoveForAssignment(null); // Also clear staged move on close
  }, []);

  const handleStageMove = useCallback((pokemonId: number, moveName: string, moveDetails: PokemonMoveInfo) => {
    setSelectedMoveForAssignment(prev => {
        // If clicking the same move again, unstage it
        if (prev && prev.pokemonId === pokemonId && prev.moveName === moveName) {
            return null;
        }
        return { pokemonId, moveName, moveDetails };
    });
  }, []);

  const stagedMoveNameForCurrentPokemon = 
    selectedPokemonDetailData && selectedMoveForAssignment && selectedMoveForAssignment.pokemonId === selectedPokemonDetailData.id
    ? selectedMoveForAssignment.moveName
    : null;


  if (apiKeyMissing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="bg-slate-800 p-8 rounded-lg shadow-xl text-center">
          <h1 className="text-3xl font-bold text-red-500 mb-4">Configuration Error</h1>
          <p className="text-slate-300 text-lg">{error}</p>
          <p className="text-slate-400 mt-4">This application requires a Gemini API key to function. Please ensure the <code className="bg-slate-700 px-1 rounded">API_KEY</code> environment variable is correctly set up in your deployment environment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 text-slate-100 relative">
      <aside className="w-full md:w-1/4 bg-slate-800/50 p-4 md:p-6 shadow-lg overflow-y-auto md:max-h-screen border-r border-slate-700">
        <h2 className="text-2xl font-bold mb-6 text-sky-400 tracking-tight">Game Progression</h2>
        <GameProgressionTree
          locations={ULTRA_MOON_PROGRESSION}
          selectedLocationId={selectedLocation?.id || null}
          onSelectLocation={handleSelectLocation}
        />
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto md:max-h-screen">
        {selectedLocation ? (
          <>
            <h1 className="text-4xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">
              {selectedLocation.name}
            </h1>
            {isLoading && (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-sky-500"></div>
                <p className="ml-4 text-xl text-slate-300">Consulting the Pokedex Oracle...</p>
              </div>
            )}
            {error && !isLoading && (
                <div className="bg-red-800/30 border border-red-700 text-red-300 p-4 rounded-lg shadow-md">
                    <p className="font-semibold">Error:</p>
                    <p>{error}</p>
                </div>
            )}
            {locationDetails && !isLoading && !error && (
              <LocationDetailsDisplay 
                details={locationDetails} 
                IconPokeball={IconPokeball}
                IconTrainer={IconTrainer}
                IconItem={IconItem}
                IconBattle={IconBattle}
                onPokemonNameClick={handlePokemonNameClick}
              />
            )}
             {!locationDetails && !isLoading && !error && !apiKeyMissing && (
              <div className="text-center py-10 text-slate-400">
                <p className="text-xl">Select a location to see details or waiting for data...</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-10 text-slate-400">
            <p className="text-2xl font-semibold">Welcome to the Nuzlocke Navigator!</p>
            <p className="mt-2">Select a location from the Game Progression panel to begin.</p>
          </div>
        )}
      </main>

      <aside className="w-full md:w-1/4 bg-slate-800/50 p-4 md:p-6 shadow-lg overflow-y-auto md:max-h-screen border-l border-slate-700">
        <TeamManager
          team={team}
          onAddTeamMember={addTeamMember} // This is still needed if we have other ways to add, but form is removed
          onRemoveTeamMember={removeTeamMember}
          IconPokeball={IconPokeball}
          levelCap={levelCap}
          nextBattleName={nextBattleName}
          nextBattleLocation={nextBattleLocation}
          nextBattlePokemonCount={nextBattlePokemonCount}
          onUpdateTeamMemberNickname={handleUpdateTeamMemberNickname}
          onUpdateTeamMemberLevel={handleUpdateTeamMemberLevel}
          onUpdateTeamMemberItem={handleUpdateTeamMemberItem}
          onUpdateTeamMemberMove={handleUpdateTeamMemberMove}
          onToggleTeamMemberShiny={handleToggleTeamMemberShiny}
        />
      </aside>
      
      {(selectedPokemonDetailData || isLoadingPokemonDetailData || pokemonDetailDataError) && (
        <PokemonDetailBar
          pokemonData={selectedPokemonDetailData}
          isLoading={isLoadingPokemonDetailData}
          error={pokemonDetailDataError}
          onClose={handleClosePokemonDetailBar}
          isCaught={!!selectedPokemonDetailData && !!caughtPokemon[selectedPokemonDetailData.id.toString()]}
          onToggleCaught={handleToggleCaughtStatus}
          onAddToTeam={handleAddPokemonToTeamFromDetail}
          onPokemonNameClick={handlePokemonNameClick}
          onStageMove={handleStageMove}
          stagedMoveNameForThisPokemon={stagedMoveNameForCurrentPokemon}
        />
      )}
    </div>
  );
};

export default App;
