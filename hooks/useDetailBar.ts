
import { useState, useCallback } from 'react';
import {
  PokemonDetailData, AbilityDetailData, FullMoveDetailData,
  TeamMember, PokemonMoveInfo
} from '../types';
import { fetchPokemonDetails, fetchAbilityDetails, fetchFullMoveDetails } from '../services/pokeApiService';

export const useDetailBar = (apiKeyMissing: boolean, team: TeamMember[]) => {
  const [activeBottomBarView, setActiveBottomBarView] = useState<'pokemon' | 'ability' | 'move' | null>(null);
  const [selectedPokemonDetailData, setSelectedPokemonDetailData] = useState<PokemonDetailData | null>(null);
  const [selectedAbilityDetailData, setSelectedAbilityDetailData] = useState<AbilityDetailData | null>(null);
  const [selectedMoveDetailData, setSelectedMoveDetailData] = useState<FullMoveDetailData | null>(null);
  const [pokemonContextForDetailView, setPokemonContextForDetailView] = useState<PokemonDetailData | null>(null);

  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [selectedMoveForAssignment, setSelectedMoveForAssignment] = useState<{ pokemonId: number; moveName: string; moveDetails: PokemonMoveInfo } | null>(null);

  const handleOpenPokemonDetail = useCallback(async (pokemonNameOrId: string | number) => {
    if (apiKeyMissing) { // Though PokeAPI doesn't use this key, good to check for consistency
      setDetailError("Cannot fetch Pokémon details currently (API Key status might affect other parts).");
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
     if (apiKeyMissing) { // Consistency check
      setDetailError("Cannot fetch ability details currently.");
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
     if (apiKeyMissing) { // Consistency check
      setDetailError("Cannot fetch move details currently.");
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

  return {
    activeBottomBarView,
    selectedPokemonDetailData,
    selectedAbilityDetailData,
    selectedMoveDetailData,
    pokemonContextForDetailView,
    isLoadingDetail,
    detailError,
    selectedMoveForAssignment,
    setSelectedMoveForAssignment, // Expose setter for App.tsx to clear
    handleOpenPokemonDetail,
    handleAbilityNameClick,
    handleMoveNameClick,
    handleBackToPokemonDetail,
    handleCloseBottomBar,
    handleStageMove,
  };
};
