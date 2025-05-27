
import React, { useState, useEffect, useCallback } from 'react';
import { 
  GameLocationNode, DetailedLocationInfo, TeamMember, 
  PokemonDetailData, CaughtStatusMap, AddTeamMemberData, PokemonMoveInfo,
  AbilityDetailData, FullMoveDetailData
} from './types';
import { ULTRA_MOON_PROGRESSION } from './constants';
import { GameProgressionTree } from './components/GameProgressionTree';
import { LocationDetailsDisplay } from './components/LocationDetailsDisplay';
import { TeamManager } from './components/TeamManager';
import { DetailDisplayController } from './components/DetailDisplayController';
import { NavigatorDisplay } from './components/NavigatorDisplay'; // New Navigator component
import { fetchLocationDetailsFromGemini, fetchNavigatorGuidanceFromGemini } from './services/geminiService'; // Added navigator service
import { fetchPokemonDetails, fetchAbilityDetails, fetchFullMoveDetails } from './services/pokeApiService';


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
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const [apiKeyMissing, setApiKeyMissing] = useState<boolean>(() => {
    const keyMissing = typeof import.meta.env === 'undefined' || !import.meta.env.VITE_GEMINI_API_KEY;
    if (keyMissing) {
        console.warn("VITE_GEMINI_API_KEY is missing. Application functionality will be limited.");
    }
    return keyMissing;
  });
  
  const [levelCap, setLevelCap] = useState<number | null>(null);
  const [nextBattleName, setNextBattleName] = useState<string | null>(null);
  const [nextBattleLocation, setNextBattleLocation] = useState<string | null>(null);
  const [nextBattlePokemonCount, setNextBattlePokemonCount] = useState<number | null>(null);

  // --- Bottom Bar State ---
  const [activeBottomBarView, setActiveBottomBarView] = useState<'pokemon' | 'ability' | 'move' | null>(null);
  const [selectedPokemonDetailData, setSelectedPokemonDetailData] = useState<PokemonDetailData | null>(null);
  const [selectedAbilityDetailData, setSelectedAbilityDetailData] = useState<AbilityDetailData | null>(null);
  const [selectedMoveDetailData, setSelectedMoveDetailData] = useState<FullMoveDetailData | null>(null);
  const [pokemonContextForDetailView, setPokemonContextForDetailView] = useState<PokemonDetailData | null>(null);

  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  // --- End Bottom Bar State ---

  const [caughtPokemon, setCaughtPokemon] = useState<CaughtStatusMap>({});
  const [selectedMoveForAssignment, setSelectedMoveForAssignment] = useState<{ pokemonId: number; moveName: string; moveDetails: PokemonMoveInfo } | null>(null);

  // --- Navigator State ---
  const [activeMainPanel, setActiveMainPanel] = useState<'location' | 'navigator'>('location');
  const [navigatorUserPrompt, setNavigatorUserPrompt] = useState<string>("");
  const [navigatorGeminiResponse, setNavigatorGeminiResponse] = useState<string | null>(null);
  const [isLoadingNavigatorQuery, setIsLoadingNavigatorQuery] = useState<boolean>(false);
  const [navigatorError, setNavigatorError] = useState<string | null>(null);
  // --- End Navigator State ---

  // --- Sidebar State ---
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState<boolean>(false);
  // --- End Sidebar State ---


  useEffect(() => {
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
          if (currentMoves.includes(moveNameToAssign)) {
            setSelectedMoveForAssignment(null); 
            return prevTeam; 
          }
          let assigned = false;
          for (let i = 0; i < 4; i++) {
            if (!currentMoves[i] || currentMoves[i] === "") {
              currentMoves[i] = moveNameToAssign;
              assigned = true;
              break;
            }
          }
          if (!assigned) { currentMoves[0] = moveNameToAssign; }
          memberToUpdate.moves = currentMoves;
          updatedTeam[teamMemberIndex] = memberToUpdate;
          return updatedTeam;
        });
        setSelectedMoveForAssignment(null);
      }
    }
  }, [selectedMoveForAssignment, team]);

  const handleToggleCaughtStatus = useCallback((pokemonId: string | number) => {
    const idStr = pokemonId.toString();
    setCaughtPokemon(prev => ({ ...prev, [idStr]: !prev[idStr] }));
  }, []);

  const addTeamMember = useCallback((memberData: AddTeamMemberData) => {
    const newMoves = ['', '', '', ''];
    if (memberData.initialMove) { newMoves[0] = memberData.initialMove; }
    setTeam(prevTeam => [
        ...prevTeam, 
        { 
            id: Date.now().toString(), species: memberData.species, level: memberData.level,
            nickname: memberData.nickname || memberData.species, heldItem: '', moves: newMoves,
            isShiny: false, pokemonId: memberData.pokemonId 
        }
    ]);
  }, []);

  const handleAddPokemonToTeamFromDetail = useCallback((speciesName: string, pokemonId: number) => {
    if (team.some(member => member.pokemonId === pokemonId)) {
        alert(`${speciesName} is already in your team!`); return;
    }
    if (team.length >= 6) {
        alert("Your team is full (6 Pokémon maximum)!"); return;
    }
    let initialMoveName: string | undefined = undefined;
    if (selectedMoveForAssignment && selectedMoveForAssignment.pokemonId === pokemonId) {
        initialMoveName = selectedMoveForAssignment.moveName;
    }
    addTeamMember({ species: speciesName, level: 5, pokemonId: pokemonId, initialMove: initialMoveName }); 
    if (!caughtPokemon[pokemonId.toString()]) { handleToggleCaughtStatus(pokemonId); }
    if (initialMoveName) { setSelectedMoveForAssignment(null); }
  }, [team, caughtPokemon, handleToggleCaughtStatus, addTeamMember, selectedMoveForAssignment]);

  const handleSelectLocation = useCallback((location: GameLocationNode) => {
    setSelectedLocation(location);
    setLocationDetails(null); 
    setLocationError(null);
    setActiveMainPanel('location'); 
  }, []);

  useEffect(() => {
    let nextCap: number | null = null;
    let battleName: string | null = null;
    let battleLoc: string | null = null; 
    let battlePokemonCount: number | null = null;

    if (selectedLocation) {
      const currentIndex = ULTRA_MOON_PROGRESSION.findIndex(loc => loc.id === selectedLocation.id);
      if (currentIndex !== -1) {
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
    }
    setLevelCap(nextCap);
    setNextBattleName(battleName);
    setNextBattleLocation(battleLoc);
    setNextBattlePokemonCount(battlePokemonCount);

    if (apiKeyMissing) {
      setLocationDetails(null);
      setIsLoadingLocation(false);
      return;
    }

    if (selectedLocation && activeMainPanel === 'location') {
      const fetchAllDetails = async () => {
        setIsLoadingLocation(true);
        setLocationError(null);
        try {
          const details = await fetchLocationDetailsFromGemini(selectedLocation.name);
          setLocationDetails(details);
        } catch (err) {
          console.error("Error fetching location details:", err);
          setLocationError(err instanceof Error ? `Failed to fetch details for ${selectedLocation.name}: ${err.message}.` : `Failed to fetch details for ${selectedLocation.name}. An unknown error occurred.`);
          setLocationDetails(null);
        } finally {
          setIsLoadingLocation(false);
        }
      };
      fetchAllDetails();
    } else if (!selectedLocation && activeMainPanel === 'location') {
        setLocationDetails(null);
        setLocationError(null);
    }
  }, [selectedLocation, apiKeyMissing, activeMainPanel]);

  const removeTeamMember = (id: string) => setTeam(prevTeam => prevTeam.filter(member => member.id !== id));
  const handleUpdateTeamMemberNickname = useCallback((memberId: string, nickname: string) => setTeam(prevTeam => prevTeam.map(m => m.id === memberId ? { ...m, nickname } : m)), []);
  const handleUpdateTeamMemberLevel = useCallback((memberId: string, level: number) => setTeam(prevTeam => prevTeam.map(m => m.id === memberId ? { ...m, level: Math.max(1, Math.min(100, level)) } : m)), []);
  const handleUpdateTeamMemberItem = useCallback((memberId: string, item: string) => setTeam(prevTeam => prevTeam.map(m => m.id === memberId ? { ...m, heldItem: item } : m)), []);
  const handleUpdateTeamMemberMove = useCallback((memberId: string, moveIndex: number, moveName: string) => {
    setTeam(prevTeam => prevTeam.map(m => {
      if (m.id === memberId) { const newMoves = [...(m.moves || ['', '', '', ''])]; newMoves[moveIndex] = moveName; return { ...m, moves: newMoves }; }
      return m;
    }));
  }, []);
  const handleToggleTeamMemberShiny = useCallback((memberId: string) => setTeam(prevTeam => prevTeam.map(m => m.id === memberId ? { ...m, isShiny: !m.isShiny } : m)), []);

  const handleOpenPokemonDetail = useCallback(async (pokemonNameOrId: string | number) => {
    if (apiKeyMissing) {
      setDetailError("Cannot fetch Pokémon details: API Key is missing.");
      setIsLoadingDetail(false);
      return;
    }
    setIsLoadingDetail(true);
    setDetailError(null);
    setSelectedPokemonDetailData(null);
    setSelectedAbilityDetailData(null);
    setSelectedMoveDetailData(null);
    setPokemonContextForDetailView(null);
    setSelectedMoveForAssignment(null);
    try {
      const details = await fetchPokemonDetails(pokemonNameOrId);
      setSelectedPokemonDetailData(details);
      setActiveBottomBarView('pokemon');
    } catch (err) {
      console.error(`Error fetching Pokémon details for ${pokemonNameOrId}:`, err);
      setDetailError(err instanceof Error ? err.message : `An unknown error occurred while fetching details for ${pokemonNameOrId}.`);
      setActiveBottomBarView(null);
    } finally {
      setIsLoadingDetail(false);
    }
  }, [apiKeyMissing]);

  const handleAbilityNameClick = useCallback(async (abilityName: string) => {
    if (apiKeyMissing) {
      setDetailError("Cannot fetch ability details: API Key is missing.");
      setIsLoadingDetail(false);
      return;
    }
    setIsLoadingDetail(true);
    setDetailError(null);
    setPokemonContextForDetailView(selectedPokemonDetailData); 
    setSelectedAbilityDetailData(null);
    try {
      const details = await fetchAbilityDetails(abilityName);
      setSelectedAbilityDetailData(details);
      setActiveBottomBarView('ability');
    } catch (err) {
      console.error(`Error fetching ability details for ${abilityName}:`, err);
      setDetailError(err instanceof Error ? err.message : `An unknown error occurred.`);
      setActiveBottomBarView(pokemonContextForDetailView ? 'pokemon' : null);
    } finally {
      setIsLoadingDetail(false);
    }
  }, [selectedPokemonDetailData, pokemonContextForDetailView, apiKeyMissing]);

  const handleMoveNameClick = useCallback(async (moveDisplayName: string, rawMoveName: string) => {
    if (apiKeyMissing) {
      setDetailError("Cannot fetch move details: API Key is missing.");
      setIsLoadingDetail(false);
      return;
    }
    setIsLoadingDetail(true);
    setDetailError(null);
    setPokemonContextForDetailView(selectedPokemonDetailData); 
    setSelectedMoveDetailData(null);
    try {
      const details = await fetchFullMoveDetails(rawMoveName); 
      setSelectedMoveDetailData(details);
      setActiveBottomBarView('move');
    } catch (err) {
      console.error(`Error fetching move details for ${rawMoveName}:`, err);
      setDetailError(err instanceof Error ? err.message : `An unknown error occurred.`);
      setActiveBottomBarView(pokemonContextForDetailView ? 'pokemon' : null);
    } finally {
      setIsLoadingDetail(false);
    }
  }, [selectedPokemonDetailData, pokemonContextForDetailView, apiKeyMissing]);

  const handleBackToPokemonDetail = useCallback(() => {
    if (pokemonContextForDetailView) {
      setSelectedPokemonDetailData(pokemonContextForDetailView);
      setSelectedAbilityDetailData(null);
      setSelectedMoveDetailData(null);
      setActiveBottomBarView('pokemon');
      setPokemonContextForDetailView(null);
      setDetailError(null);
    }
  }, [pokemonContextForDetailView]);

  const handleCloseBottomBar = useCallback(() => {
    setActiveBottomBarView(null);
    setSelectedPokemonDetailData(null);
    setSelectedAbilityDetailData(null);
    setSelectedMoveDetailData(null);
    setPokemonContextForDetailView(null);
    setSelectedMoveForAssignment(null);
    setDetailError(null);
  }, []);

  const handleStageMove = useCallback((pokemonId: number, moveName: string, moveDetails: PokemonMoveInfo) => {
    setSelectedMoveForAssignment(prev => {
        if (prev && prev.pokemonId === pokemonId && prev.moveName === moveName) return null;
        return { pokemonId, moveName, moveDetails };
    });
  }, []);

  const stagedMoveNameForCurrentPokemon = 
    selectedPokemonDetailData && activeBottomBarView === 'pokemon' && selectedMoveForAssignment && selectedMoveForAssignment.pokemonId === selectedPokemonDetailData.id
    ? selectedMoveForAssignment.moveName
    : null;

  const switchToNavigatorPanel = () => {
    setActiveMainPanel('navigator');
  };

  const handleNavigatorSubmit = async (prompt: string) => {
    if (apiKeyMissing) {
      setNavigatorError("API Key is missing. Navigator cannot function.");
      setIsLoadingNavigatorQuery(false);
      return;
    }
    setIsLoadingNavigatorQuery(true);
    setNavigatorError(null);
    setNavigatorGeminiResponse(null);
    try {
      const response = await fetchNavigatorGuidanceFromGemini(prompt);
      setNavigatorGeminiResponse(response);
    } catch (err) {
      console.error("Error fetching navigator guidance:", err);
      setNavigatorError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoadingNavigatorQuery(false);
    }
  };

  const handleNavigatorReset = () => {
    setNavigatorUserPrompt("");
    setNavigatorGeminiResponse(null);
    setNavigatorError(null);
    setIsLoadingNavigatorQuery(false);
  };

  if (apiKeyMissing) {
     return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="bg-slate-800 p-8 rounded-lg shadow-xl text-center max-w-lg w-full">
          <h1 className="text-3xl font-bold text-red-500 mb-4">Configuration Error</h1>
          <p className="text-slate-300 text-lg mb-3">
            API Key is missing. Please set the <code className="bg-slate-700 px-1 rounded text-base">VITE_GEMINI_API_KEY</code> environment variable.
          </p>
          <p className="text-slate-300 mt-4 text-left">
            This application requires a Gemini API key to function. To resolve this:
          </p>
          <ul className="list-disc list-inside text-left text-slate-300 text-sm mt-2 space-y-1.5 pl-4 bg-slate-700/30 p-3 rounded-md">
            <li>Ensure a file named <code className="bg-slate-600 px-1 rounded">.env</code> exists in your project's root directory.</li>
            <li>Inside the <code className="bg-slate-600 px-1 rounded">.env</code> file, add a line: <br />
                <code className="bg-slate-600 px-1 rounded text-xs sm:text-sm">VITE_GEMINI_API_KEY=YOUR_ACTUAL_GEMINI_API_KEY</code>
                <br/>(Replace <code className="bg-slate-500 px-0.5 rounded">YOUR_ACTUAL_GEMINI_API_KEY</code> with your valid key).
            </li>
            <li>After creating or modifying the <code className="bg-slate-600 px-1 rounded">.env</code> file, **restart your Vite development server**.</li>
            <li>If deploying (e.g., to Netlify), ensure <code className="bg-slate-600 px-1 rounded">VITE_GEMINI_API_KEY</code> is set as an environment variable in your build/deployment settings.</li>
          </ul>
           <p className="text-slate-400 mt-3 text-xs">
            The application checks for <code className="bg-slate-600 px-0.5 rounded">import.meta.env.VITE_GEMINI_API_KEY</code>. 
            If this value is not found or <code className="bg-slate-600 px-0.5 rounded">import.meta.env</code> itself is not available (e.g., not running via Vite), this error will appear.
            Check your browser's developer console for more specific error messages if the problem persists after setting the key.
          </p>
        </div>
      </div>
    );
  }


  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 text-slate-100 relative">
      <aside 
        className={`bg-slate-800/50 shadow-lg md:max-h-screen border-r border-slate-700 
                    transition-all duration-300 ease-in-out overflow-y-hidden 
                    w-full md:${isLeftSidebarCollapsed ? 'w-20 px-2 py-4' : 'w-1/4 p-4 md:p-6'}`}
      >
        <div className="flex flex-col h-full">
          {/* Top Section: Logo + App Title */}
          <div className={`flex items-center mb-4 ${isLeftSidebarCollapsed ? 'justify-center' : 'justify-start'}`}>
            <img 
              src="/favicon.png" 
              alt="App Logo" 
              className={`${isLeftSidebarCollapsed ? 'h-10 w-10' : 'h-12 w-12'} transition-all duration-300`} 
            />
            {!isLeftSidebarCollapsed && (
              <h1 className="ml-3 text-xl font-bold text-sky-400 tracking-tight">
                Noah's Nuzlocke Navigator
              </h1>
            )}
          </div>

          <button
            onClick={switchToNavigatorPanel}
            title="Nuzlocke Navigator"
            className={`w-full text-left py-3 mb-4 rounded-lg transition-all duration-200 ease-in-out 
                        ${isLeftSidebarCollapsed ? 'px-0 flex justify-center items-center h-12 text-2xl' : 'px-4 transform hover:scale-105'} 
                        focus:outline-none focus:ring-2 
                        ${activeMainPanel === 'navigator'
                          ? 'bg-purple-600 text-white shadow-lg ring-2 ring-purple-400'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white focus:ring-purple-500'
                        }
                      `}
          >
            {isLeftSidebarCollapsed ? (
              '🧭' 
            ) : (
              <div className="flex items-center">
                <span className={`mr-3 h-2.5 w-2.5 rounded-full ${activeMainPanel === 'navigator' ? 'bg-white' : 'bg-purple-400'}`}></span>
                <span className="font-medium">Nuzlocke Navigator</span>
              </div>
            )}
          </button>
          
          {!isLeftSidebarCollapsed && (
            <div className="flex-1 min-h-0 overflow-y-auto">
              <GameProgressionTree
                locations={ULTRA_MOON_PROGRESSION}
                selectedLocationId={selectedLocation?.id || null}
                onSelectLocation={handleSelectLocation}
              />
            </div>
          )}

          <div className={`mt-auto pt-4 ${isLeftSidebarCollapsed ? 'flex justify-center' : 'flex justify-end'}`}>
            <button
              onClick={() => setIsLeftSidebarCollapsed(prev => !prev)}
              className="p-2 rounded-md hover:bg-slate-600 text-slate-300 hover:text-sky-300 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500"
              aria-label={isLeftSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={isLeftSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isLeftSidebarCollapsed ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg> 
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg> 
              )}
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto md:max-h-screen">
        {activeMainPanel === 'location' && (
          <>
            {selectedLocation ? (
              <>
                <h1 className="text-4xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">
                  {selectedLocation.name}
                </h1>
                {isLoadingLocation && (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-sky-500"></div>
                    <p className="ml-4 text-xl text-slate-300">Consulting the Pokedex Oracle...</p>
                  </div>
                )}
                {locationError && !isLoadingLocation && (
                    <div className="bg-red-800/30 border border-red-700 text-red-300 p-4 rounded-lg shadow-md">
                        <p className="font-semibold">Error:</p>
                        <p>{locationError}</p>
                    </div>
                )}
                {locationDetails && !isLoadingLocation && !locationError && (
                  <LocationDetailsDisplay 
                    details={locationDetails} 
                    IconPokeball={IconPokeball}
                    IconTrainer={IconTrainer}
                    IconItem={IconItem}
                    IconBattle={IconBattle}
                    onPokemonNameClick={handleOpenPokemonDetail}
                  />
                )}
                 {!locationDetails && !isLoadingLocation && !locationError && (
                  <div className="text-center py-10 text-slate-400">
                    <p className="text-xl">Select a location to see details or waiting for data...</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-10 text-slate-400">
                <p className="text-2xl font-semibold">Welcome to the Nuzlocke Navigator!</p>
                <p className="mt-2">Select a location from the Game Progression panel or use the Nuzlocke Navigator tool.</p>
              </div>
            )}
          </>
        )}
        {activeMainPanel === 'navigator' && (
          <NavigatorDisplay
            initialPromptValue={navigatorUserPrompt}
            onPromptSubmit={handleNavigatorSubmit}
            isLoading={isLoadingNavigatorQuery}
            apiResponse={navigatorGeminiResponse}
            apiError={navigatorError}
            onReset={handleNavigatorReset}
            apiKeyMissing={apiKeyMissing}
            onPokemonNameClick={handleOpenPokemonDetail}
            onLocationNameClick={handleSelectLocation}
            gameLocations={ULTRA_MOON_PROGRESSION}
          />
        )}
      </main>

      <aside className="w-full md:w-1/4 bg-slate-800/50 p-4 md:p-6 shadow-lg overflow-y-auto md:max-h-screen border-l border-slate-700">
        <TeamManager
          team={team}
          onAddTeamMember={addTeamMember}
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
      
      {activeBottomBarView && (
        <DetailDisplayController
          activeView={activeBottomBarView}
          pokemonData={selectedPokemonDetailData}
          abilityData={selectedAbilityDetailData}
          moveData={selectedMoveDetailData}
          isLoading={isLoadingDetail}
          error={detailError}
          onClose={handleCloseBottomBar}
          onBackToPokemon={pokemonContextForDetailView ? handleBackToPokemonDetail : undefined}
          pokemonContextForDetailViewName={pokemonContextForDetailView?.name}
          isCaught={!!(selectedPokemonDetailData && caughtPokemon[selectedPokemonDetailData.id.toString()])}
          onToggleCaught={handleToggleCaughtStatus}
          onAddToTeam={handleAddPokemonToTeamFromDetail}
          onStageMove={handleStageMove}
          stagedMoveNameForThisPokemon={stagedMoveNameForCurrentPokemon}
          onPokemonNameClickForEvolution={handleOpenPokemonDetail}
          onAbilityNameClick={handleAbilityNameClick}
          onMoveNameClick={handleMoveNameClick}
        />
      )}
    </div>
  );
};

export default App;
