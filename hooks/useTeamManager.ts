
import { useState, useEffect, useCallback } from 'react';
import { TeamMember, CaughtStatusMap, AddTeamMemberData } from '../types';

const CAUGHT_POKEMON_STORAGE_KEY = 'nuzlocke-caught-pokemon';
const TEAM_STORAGE_KEY = 'nuzlocke-team';

export const useTeamManager = () => {
  const [team, setTeam] = useState<TeamMember[]>(() => {
    try {
      const storedTeam = localStorage.getItem(TEAM_STORAGE_KEY);
      return storedTeam ? JSON.parse(storedTeam) : [];
    } catch (e) {
      console.error("Failed to load team from localStorage", e);
      return [];
    }
  });

  const [caughtPokemon, setCaughtPokemon] = useState<CaughtStatusMap>(() => {
     try {
      const storedCaughtPokemon = localStorage.getItem(CAUGHT_POKEMON_STORAGE_KEY);
      return storedCaughtPokemon ? JSON.parse(storedCaughtPokemon) : {};
    } catch (e) {
      console.error("Failed to load caught Pokemon status from localStorage", e);
      return {};
    }
  });

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
  
  const removeTeamMember = useCallback((id: string) => {
    setTeam(prevTeam => prevTeam.filter(member => member.id !== id));
  }, []);

  const handleUpdateTeamMemberNickname = useCallback((memberId: string, nickname: string) => {
    setTeam(prevTeam => prevTeam.map(m => m.id === memberId ? { ...m, nickname } : m));
  }, []);

  const handleUpdateTeamMemberLevel = useCallback((memberId: string, level: number) => {
    setTeam(prevTeam => prevTeam.map(m => m.id === memberId ? { ...m, level: Math.max(1, Math.min(100, level)) } : m));
  }, []);

  const handleUpdateTeamMemberItem = useCallback((memberId: string, item: string) => {
    setTeam(prevTeam => prevTeam.map(m => m.id === memberId ? { ...m, heldItem: item } : m));
  }, []);

  const handleUpdateTeamMemberMove = useCallback((memberId: string, moveIndex: number, moveName: string) => {
    setTeam(prevTeam => prevTeam.map(m => {
      if (m.id === memberId) { const newMoves = [...(m.moves || ['', '', '', ''])]; newMoves[moveIndex] = moveName; return { ...m, moves: newMoves }; }
      return m;
    }));
  }, []);

  const handleToggleTeamMemberShiny = useCallback((memberId: string) => {
    setTeam(prevTeam => prevTeam.map(m => m.id === memberId ? { ...m, isShiny: !m.isShiny } : m));
  }, []);

  return {
    team,
    setTeam, // Expose setTeam directly for complex updates like move assignment effect
    caughtPokemon,
    handleToggleCaughtStatus,
    addTeamMember,
    removeTeamMember,
    handleUpdateTeamMemberNickname,
    handleUpdateTeamMemberLevel,
    handleUpdateTeamMemberItem,
    handleUpdateTeamMemberMove,
    handleToggleTeamMemberShiny,
  };
};
