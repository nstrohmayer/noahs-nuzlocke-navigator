
import React, { useState, useEffect, useCallback } from 'react';
import { GameLocationNode, AddTeamMemberData, PokemonMoveInfo } from './types';
import { ULTRA_MOON_PROGRESSION } from './constants';
import { GameProgressionTree } from './components/GameProgressionTree';
import { LocationDetailsDisplay } from './components/LocationDetailsDisplay';
import { TeamManager } from './components/TeamManager';
import { DetailDisplayController } from './components/DetailDisplayController';
import { NavigatorDisplay } from './components/NavigatorDisplay';

import { useTeamManager } from './hooks/useTeamManager';
import { useNavigator } from './hooks/useNavigator';
import { useGameProgression } from './hooks/useGameProgression';
import { useDetailBar } from './hooks/useDetailBar';

// Placeholder icons - can be moved if they grow
const IconPokeball = () => <span className="text-red-500">◉</span>;
const IconTrainer = () => <span className="text-blue-400">👤</span>;
const IconItem = () => <span className="text-yellow-400">🛍️</span>;
const IconBattle = () => <span className="text-purple-400">⚔️</span>;

const App: React.FC = () => {
  const [apiKeyMissing, setApiKeyMissing] = useState<boolean>(() => {
    const keyMissing = !process.env.API_KEY; 
    if (keyMissing) {
        console.warn("API_KEY (derived from VITE_GEMINI_API_KEY) is missing or empty. Application functionality requiring Gemini API will be limited or unavailable.");
    }
    return keyMissing;
  });

  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState<boolean>(true); // Start with sidebar collapsed
  const [isMobileView, setIsMobileView] = useState<boolean>(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)'); // Tailwind's 'md' breakpoint
    
    const handleMediaQueryChange = () => {
      setIsMobileView(!mediaQuery.matches); // true if screen is < 768px
    };

    handleMediaQueryChange(); // Initial check
    mediaQuery.addEventListener('change', handleMediaQueryChange);

    return () => {
      mediaQuery.removeEventListener('change', handleMediaQueryChange);
    };
  }, []);


  const {
    team,
    setTeam, 
    caughtPokemon,
    handleToggleCaughtStatus,
    addTeamMember,
    removeTeamMember,
    handleUpdateTeamMemberNickname,
    handleUpdateTeamMemberLevel,
    handleUpdateTeamMemberItem,
    handleUpdateTeamMemberMove,
    handleToggleTeamMemberShiny,
  } = useTeamManager();

  const {
    activeMainPanel,
    setActiveMainPanel, 
    navigatorUserPrompt,
    navigatorGeminiResponse,
    isLoadingNavigatorQuery,
    navigatorError,
    switchToNavigatorPanel,
    handleNavigatorSubmit,
    handleNavigatorReset,
  } = useNavigator(apiKeyMissing);

  const gameProgressionHook = useGameProgression(apiKeyMissing, activeMainPanel, setActiveMainPanel);

  const {
    selectedLocation,
    locationDetails,
    isLoadingLocation,
    locationError,
    levelCap,
    nextBattleName,
    nextBattleLocation,
    nextBattlePokemonCount,
    currentLocationId, 
    setCurrentLocation, 
  } = gameProgressionHook;

  const {
    activeBottomBarView,
    selectedPokemonDetailData,
    selectedAbilityDetailData,
    selectedMoveDetailData,
    pokemonContextForDetailView,
    isLoadingDetail,
    detailError,
    selectedMoveForAssignment,
    setSelectedMoveForAssignment, 
    handleOpenPokemonDetail,
    handleAbilityNameClick,
    handleMoveNameClick,
    handleBackToPokemonDetail,
    handleCloseBottomBar,
    handleStageMove,
  } = useDetailBar(apiKeyMissing, team);

  // Wrapped handlers for auto-collapsing sidebar on mobile
  const handleLocationSelectionAndCollapse = useCallback((location: GameLocationNode) => {
    gameProgressionHook.handleSelectLocation(location);
    if (isMobileView) {
      setIsLeftSidebarCollapsed(true);
    }
  }, [gameProgressionHook, isMobileView]);

  const handleSwitchToNavigatorAndCollapse = useCallback(() => {
    switchToNavigatorPanel();
    if (isMobileView) {
      setIsLeftSidebarCollapsed(true);
    }
  }, [switchToNavigatorPanel, isMobileView]);


  // Effect for assigning a staged move to a team member
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
          if (!assigned) { currentMoves[0] = moveNameToAssign; } // Overwrite first if full
          memberToUpdate.moves = currentMoves;
          updatedTeam[teamMemberIndex] = memberToUpdate;
          return updatedTeam;
        });
        setSelectedMoveForAssignment(null); // Clear after assignment
      }
    }
  }, [selectedMoveForAssignment, team, setTeam, setSelectedMoveForAssignment]);

  // Callback to add Pokemon to team from detail view, handling staged move
  const handleAddPokemonToTeamFromDetailCallback = useCallback((speciesName: string, pokemonId: number) => {
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
    if (initialMoveName) { setSelectedMoveForAssignment(null); } // Clear staged move after using it
  }, [team, caughtPokemon, handleToggleCaughtStatus, addTeamMember, selectedMoveForAssignment, setSelectedMoveForAssignment]);


  const stagedMoveNameForCurrentPokemon =
    selectedPokemonDetailData && activeBottomBarView === 'pokemon' && selectedMoveForAssignment && selectedMoveForAssignment.pokemonId === selectedPokemonDetailData.id
    ? selectedMoveForAssignment.moveName
    : null;

  const handlePreviousLocation = useCallback(() => {
    if (!selectedLocation) return;
    const currentIndex = ULTRA_MOON_PROGRESSION.findIndex(loc => loc.id === selectedLocation.id);
    if (currentIndex > 0) {
      gameProgressionHook.handleSelectLocation(ULTRA_MOON_PROGRESSION[currentIndex - 1]);
    }
  }, [selectedLocation, gameProgressionHook]);

  const handleNextLocation = useCallback(() => {
    if (!selectedLocation) {
      if (ULTRA_MOON_PROGRESSION.length > 0) {
        // If no location selected, attempt to select current (starred) or default
        const locationToSelect = currentLocationId ? ULTRA_MOON_PROGRESSION.find(loc => loc.id === currentLocationId) : null;
        if (locationToSelect) {
             gameProgressionHook.handleSelectLocation(locationToSelect);
        } else {
             gameProgressionHook.handleSelectLocation(ULTRA_MOON_PROGRESSION[0]);
        }
      }
      return;
    }
    const currentIndex = ULTRA_MOON_PROGRESSION.findIndex(loc => loc.id === selectedLocation.id);
    if (currentIndex < ULTRA_MOON_PROGRESSION.length - 1) {
      gameProgressionHook.handleSelectLocation(ULTRA_MOON_PROGRESSION[currentIndex + 1]);
    }
  }, [selectedLocation, gameProgressionHook, currentLocationId]);


  if (apiKeyMissing) {
     return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="bg-slate-800 p-8 rounded-lg shadow-xl text-center max-w-lg w-full">
          <h1 className="text-3xl font-bold text-red-500 mb-4">Configuration Error</h1>
          <p className="text-slate-300 text-lg mb-3">
            Gemini API Key is missing. Please set the <code className="bg-slate-700 px-1 rounded text-base">VITE_GEMINI_API_KEY</code> environment variable.
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
            <li>If deploying (e.g., to Netlify, Vercel), ensure <code className="bg-slate-600 px-1 rounded">VITE_GEMINI_API_KEY</code> is set as an environment variable in your build/deployment settings.</li>
          </ul>
           <p className="text-slate-400 mt-3 text-xs">
            The application internally expects <code className="bg-slate-600 px-0.5 rounded">process.env.API_KEY</code> to be available.
            This value is populated by Vite from the <code className="bg-slate-600 px-0.5 rounded">VITE_GEMINI_API_KEY</code> environment variable during the build process.
            If <code className="bg-slate-600 px-0.5 rounded">VITE_GEMINI_API_KEY</code> is not found or is empty, this error will appear.
            Check your browser's developer console for more specific error messages if the problem persists after setting the key.
          </p>
        </div>
      </div>
    );
  }

  const currentLocIndex = selectedLocation ? ULTRA_MOON_PROGRESSION.findIndex(l => l.id === selectedLocation.id) : -1;
  const isFirstLocationSelected = currentLocIndex === 0;
  const isLastLocationSelected = currentLocIndex === ULTRA_MOON_PROGRESSION.length - 1;
  const noLocationSelected = currentLocIndex === -1;


  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 text-slate-100 relative">
      <aside
        className={`
          bg-slate-800/50 shadow-lg border-r border-slate-700
          transition-all duration-300 ease-in-out overflow-y-hidden
          w-full
          ${isLeftSidebarCollapsed ? 'px-2 py-4' : 'p-4'}
          md:max-h-screen
          md:${isLeftSidebarCollapsed ? 'w-52' : 'w-1/4'} {/* Changed w-20 to w-52 for collapsed desktop sidebar */}
          md:${isLeftSidebarCollapsed ? '' : 'p-6'}
        `}
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
            onClick={handleSwitchToNavigatorAndCollapse}
            title="Nuzlocke Navigator"
            className={`
              py-3 mb-4 rounded-lg transition-all duration-200 ease-in-out
              focus:outline-none focus:ring-2
              ${isLeftSidebarCollapsed
                ? 'w-full text-center px-0 flex justify-center items-center h-12 text-2xl' // Icon centered in full-width button
                : 'w-1/3 mx-auto text-left px-4 transform hover:scale-105' // Button is 1/3 width and centered, content left-aligned
              }
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
          
          {/* Previous/Next Location buttons for expanded sidebar */}
          {!isLeftSidebarCollapsed && (
            <div className="py-3 flex flex-col space-y-2">
              <button
                onClick={handlePreviousLocation}
                disabled={noLocationSelected || isFirstLocationSelected}
                className="w-full px-3 py-1.5 text-sm rounded-md flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous Location"
                title="Previous Location"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Prev
              </button>
              <button
                onClick={handleNextLocation}
                disabled={isLastLocationSelected}
                className="w-full px-3 py-1.5 text-sm rounded-md flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next Location"
                title="Next Location"
              >
                Next
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}


          {!isLeftSidebarCollapsed && (
            <div className="flex-1 min-h-0 overflow-y-auto pt-2"> {/* Added pt-2 for spacing from buttons above */}
              <GameProgressionTree
                locations={ULTRA_MOON_PROGRESSION}
                selectedLocationId={selectedLocation?.id || null}
                onSelectLocation={handleLocationSelectionAndCollapse}
                currentLocationId={currentLocationId}
                onSetCurrentLocation={setCurrentLocation}
              />
            </div>
          )}

          <div className={`mt-auto pt-4 ${isLeftSidebarCollapsed ? 'flex justify-between items-center w-full' : 'flex justify-end'}`}>
            {isLeftSidebarCollapsed && (
              <button
                onClick={handlePreviousLocation}
                className="p-2 rounded-md hover:bg-slate-600 text-slate-300 hover:text-sky-300 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous Location"
                title="Previous Location"
                disabled={noLocationSelected || isFirstLocationSelected}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            )}

            <button
              onClick={() => setIsLeftSidebarCollapsed(prev => !prev)}
              className={`p-2 rounded-md hover:bg-slate-600 text-slate-300 hover:text-sky-300 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 ${isLeftSidebarCollapsed ? 'flex-grow mx-2' : ''}`}
              aria-label={isLeftSidebarCollapsed ? "Show All Routes" : "Collapse sidebar"}
              title={isLeftSidebarCollapsed ? "Show All Routes" : "Collapse sidebar"}
            >
              {isLeftSidebarCollapsed ? (
                <div className="flex items-center justify-center text-sm">
                  <span className="mr-2 text-lg">☰</span> Show All Routes
                </div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            
            {isLeftSidebarCollapsed && (
              <button
                onClick={handleNextLocation}
                className="p-2 rounded-md hover:bg-slate-600 text-slate-300 hover:text-sky-300 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next Location"
                title="Next Location"
                disabled={isLastLocationSelected}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto md:max-h-screen">
        {activeMainPanel === 'location' && (
          <>
            {selectedLocation ? (
              <>
                {/* Location H1 title removed from here, will be inside LocationDetailsDisplay */}
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
                    currentLocationId={currentLocationId}
                    onSetCurrentLocation={setCurrentLocation}
                    selectedLocationNodeId={selectedLocation.id} 
                  />
                )}
                 {!locationDetails && !isLoadingLocation && !locationError && !selectedLocation && (
                  <div className="text-center py-10 text-slate-400">
                    <p className="text-xl">Select a location to see details or waiting for data...</p>
                  </div>
                )}
                 {!locationDetails && !isLoadingLocation && !locationError && selectedLocation && ( 
                    <div className="text-center py-10 text-slate-400">
                        <p className="text-xl">Loading details for {selectedLocation.name} or no details to display.</p>
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
            onLocationNameClick={handleLocationSelectionAndCollapse} 
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
          onAddToTeam={handleAddPokemonToTeamFromDetailCallback} 
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
