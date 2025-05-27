
import { 
  PokeApiPokemon, 
  PokeApiSpecies, 
  PokeApiEvolutionChain,
  PokeApiEvolutionChainLink,
  PokemonDetailData,
  PokemonBaseStat,
  PokemonEvolutionStep,
  PokemonMoveInfo,
  PokeApiResource,
  PokeApiMoveData // Added
} from '../types';

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';
const CACHE_PREFIX_POKEMON = "pokemon_cache_";

async function fetchPokeApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${POKEAPI_BASE_URL}/${endpoint}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
    throw new Error(`PokeAPI request failed for ${endpoint}: ${response.status} ${response.statusText} - ${errorData.detail || errorData.message}`);
  }
  return response.json() as T;
}

function processEvolutionChain(chainLink: PokeApiEvolutionChainLink, currentPokemonId: number): PokemonDetailData['evolutions'] {
    const evolutions: PokemonDetailData['evolutions'] = {
        currentStage: { name: '', id: 0, spriteUrl: null },
        nextStages: [],
    };

    let chainPath: PokeApiEvolutionChainLink[] = [];

    function findPath(link: PokeApiEvolutionChainLink, path: PokeApiEvolutionChainLink[]): boolean {
        path.push(link);
        const speciesId = parseInt(link.species.url.split('/').slice(-2, -1)[0], 10);
        if (speciesId === currentPokemonId) {
            chainPath = [...path];
            return true;
        }
        for (const next of link.evolves_to) {
            if (findPath(next, [...path])) return true;
        }
        return false;
    }

    findPath(chainLink, []);
    
    if (chainPath.length > 0) {
        const currentSpeciesLink = chainPath[chainPath.length - 1];
        const currentSpeciesId = parseInt(currentSpeciesLink.species.url.split('/').slice(-2, -1)[0], 10);
        evolutions.currentStage = {
            name: currentSpeciesLink.species.name,
            id: currentSpeciesId,
            spriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${currentSpeciesId}.png`
        };

        if (chainPath.length > 1) {
            const prevSpeciesLink = chainPath[chainPath.length - 2];
            const prevSpeciesId = parseInt(prevSpeciesLink.species.url.split('/').slice(-2, -1)[0], 10);
            evolutions.previousStage = {
                name: prevSpeciesLink.species.name,
                id: prevSpeciesId,
                spriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${prevSpeciesId}.png`
            };
        }
        
        currentSpeciesLink.evolves_to.forEach(evo => {
            const nextSpeciesId = parseInt(evo.species.url.split('/').slice(-2, -1)[0], 10);
            const detail = evo.evolution_details[0]; 
            let trigger = detail?.trigger.name || "Unknown";
            const conditions: string[] = [];

            if (detail?.min_level) trigger = `Level ${detail.min_level}`;
            else if (detail?.item) trigger = `Use ${detail.item.name.replace(/-/g, ' ')}`;
            
            if (detail?.gender === 1) conditions.push("Female");
            if (detail?.gender === 2) conditions.push("Male");
            if (detail?.held_item) conditions.push(`Hold ${detail.held_item.name.replace(/-/g, ' ')}`);
            if (detail?.known_move) conditions.push(`Knows ${detail.known_move.name.replace(/-/g, ' ')}`);
            if (detail?.min_affection) conditions.push(`Affection ${detail.min_affection}+`);
            if (detail?.min_beauty) conditions.push(`Beauty ${detail.min_beauty}+`);
            if (detail?.min_happiness) conditions.push(`Happiness ${detail.min_happiness}+`);
            if (detail?.time_of_day) conditions.push(detail.time_of_day.charAt(0).toUpperCase() + detail.time_of_day.slice(1));
            if (detail?.location) conditions.push(`At ${detail.location.name.replace(/-/g, ' ')}`);
            if (detail?.needs_overworld_rain) conditions.push("Overworld rain");
            if (detail?.party_species) conditions.push(`With ${detail.party_species.name.replace(/-/g, ' ')} in party`);

            evolutions.nextStages.push({
                name: evo.species.name,
                spriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${nextSpeciesId}.png`,
                trigger: trigger,
                conditions: conditions,
            });
        });

    } else {
      const baseSpeciesId = parseInt(chainLink.species.url.split('/').slice(-2, -1)[0], 10);
      evolutions.currentStage = {
        name: chainLink.species.name,
        id: baseSpeciesId,
        spriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${baseSpeciesId}.png`
      };
       if(currentPokemonId === baseSpeciesId) {
         chainLink.evolves_to.forEach(evo => {
            const nextSpeciesId = parseInt(evo.species.url.split('/').slice(-2, -1)[0], 10);
            const detail = evo.evolution_details[0];
            let trigger = detail?.trigger.name || "Unknown";
            const conditions: string[] = [];
            if (detail?.min_level) trigger = `Level ${detail.min_level}`;
            else if (detail?.item) trigger = `Use ${detail.item.name.replace(/-/g, ' ')}`;
            evolutions.nextStages.push({
                name: evo.species.name,
                spriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${nextSpeciesId}.png`,
                trigger: trigger,
                conditions: conditions,
            });
        });
       }
    }
    return evolutions;
}


export const fetchPokemonDetails = async (pokemonNameOrId: string | number): Promise<PokemonDetailData> => {
  let apiCompatibleNameOrId: string;

  if (typeof pokemonNameOrId === 'string') {
    let name = pokemonNameOrId.toLowerCase();
    if (name.startsWith('alolan ')) {
      const baseName = name.substring(7).trim().replace(/\s+/g, '-');
      apiCompatibleNameOrId = `${baseName}-alola`; // Corrected: -alola instead of -alolan
    } else {
      apiCompatibleNameOrId = name.replace(/\s+/g, '-').replace(/[.'']/g, '');
    }
  } else {
    apiCompatibleNameOrId = pokemonNameOrId.toString();
  }
  
  const cacheKey = `${CACHE_PREFIX_POKEMON}${apiCompatibleNameOrId}`;

  try {
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      console.log(`Serving Pokémon data for "${apiCompatibleNameOrId}" from cache.`);
      const parsed = JSON.parse(cachedData) as PokemonDetailData;
      // Ensure moves have all fields, even if cached before this change
      parsed.moves = parsed.moves.map(m => ({
          ...m,
          power: m.power === undefined ? null : m.power,
          accuracy: m.accuracy === undefined ? null : m.accuracy,
      }));
      return parsed;
    }
  } catch (error) {
    console.warn(`Error reading Pokémon cache for "${apiCompatibleNameOrId}":`, error);
  }
  
  const pokemonData = await fetchPokeApi<PokeApiPokemon>(`pokemon/${apiCompatibleNameOrId}`);
  const speciesData = await fetchPokeApi<PokeApiSpecies>(pokemonData.species.url.replace(POKEAPI_BASE_URL + '/', ''));
  
  let evolutionDataProcessed: PokemonDetailData['evolutions'] = null;
  if (speciesData.evolution_chain?.url) {
    try {
        const evolutionChainData = await fetchPokeApi<PokeApiEvolutionChain>(speciesData.evolution_chain.url.replace(POKEAPI_BASE_URL + '/', ''));
        evolutionDataProcessed = processEvolutionChain(evolutionChainData.chain, pokemonData.id);
    } catch (evoError) {
        console.warn(`Failed to fetch or process evolution chain for ${pokemonData.name}:`, evoError);
    }
  }

  const flavorTextEntry = speciesData.flavor_text_entries.find(entry => entry.language.name === 'en');
  const flavorText = flavorTextEntry ? flavorTextEntry.flavor_text.replace(/[\n\f\r]/g, ' ') : "No flavor text available.";

  const genusEntry = speciesData.genera.find(g => g.language.name === 'en');
  const genus = genusEntry ? genusEntry.genus : "Unknown Pokémon";

  const baseStats: PokemonBaseStat[] = pokemonData.stats.map(s => ({
    name: s.stat.name.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    value: s.base_stat,
  }));

  const abilities = pokemonData.abilities.map(a => ({
    name: a.ability.name.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    isHidden: a.is_hidden,
  })).sort((a,b) => a.isHidden === b.isHidden ? 0 : a.isHidden ? 1 : -1) 
   .map(a => `${a.name}${a.isHidden ? ' (Hidden)' : ''}`);

  const levelUpMoves = pokemonData.moves
    .map(moveData => {
      const ultraSunUltraMoonDetail = moveData.version_group_details.find(
        detail => detail.version_group.name === 'ultra-sun-ultra-moon' && detail.move_learn_method.name === 'level-up'
      );
      if (ultraSunUltraMoonDetail && ultraSunUltraMoonDetail.level_learned_at > 0) {
        return {
          name: moveData.move.name, // Keep raw name for API lookup
          displayName: moveData.move.name.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          levelLearnedAt: ultraSunUltraMoonDetail.level_learned_at,
          learnMethod: 'Level Up',
        };
      }
      return null;
    })
    .filter((move): move is { name: string; displayName: string; levelLearnedAt: number; learnMethod: string; } => move !== null)
    .sort((a, b) => (a.levelLearnedAt || 0) - (b.levelLearnedAt || 0));

  const detailedMovesPromises = levelUpMoves.slice(0, 15).map(async (basicMoveInfo) => {
    try {
      const moveDetails = await fetchPokeApi<PokeApiMoveData>(`move/${basicMoveInfo.name}`);
      const effectEntry = moveDetails.effect_entries.find(e => e.language.name === 'en');
      return {
        name: basicMoveInfo.displayName,
        levelLearnedAt: basicMoveInfo.levelLearnedAt,
        learnMethod: basicMoveInfo.learnMethod,
        power: moveDetails.power,
        accuracy: moveDetails.accuracy,
        pp: moveDetails.pp,
        moveType: moveDetails.type.name.charAt(0).toUpperCase() + moveDetails.type.name.slice(1),
        damageClass: moveDetails.damage_class.name.charAt(0).toUpperCase() + moveDetails.damage_class.name.slice(1),
        shortEffect: effectEntry ? effectEntry.short_effect.replace(/\$effect_chance/g, `${moveDetails.effect_chance || ''}`) : 'No effect description.',
      };
    } catch (moveError) {
      console.warn(`Failed to fetch details for move ${basicMoveInfo.name}:`, moveError);
      return { // Return basic info if detailed fetch fails
        name: basicMoveInfo.displayName,
        levelLearnedAt: basicMoveInfo.levelLearnedAt,
        learnMethod: basicMoveInfo.learnMethod,
        power: null, accuracy: null, pp: undefined, moveType: undefined, damageClass: undefined, shortEffect: 'Error fetching details.',
      };
    }
  });

  const resolvedDetailedMoves = await Promise.all(detailedMovesPromises);

  const processedPokemonDetails: PokemonDetailData = {
    id: pokemonData.id,
    name: pokemonData.name.charAt(0).toUpperCase() + pokemonData.name.slice(1),
    spriteUrl: pokemonData.sprites.other?.['official-artwork']?.front_default || pokemonData.sprites.front_default,
    shinySpriteUrl: pokemonData.sprites.other?.['official-artwork']?.front_shiny || pokemonData.sprites.front_shiny,
    genus,
    types: pokemonData.types.map(t => t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1)),
    abilities,
    baseStats,
    evolutions: evolutionDataProcessed,
    flavorText,
    moves: resolvedDetailedMoves,
  };

  try {
    localStorage.setItem(cacheKey, JSON.stringify(processedPokemonDetails));
    console.log(`Pokémon data for "${apiCompatibleNameOrId}" cached.`);
  } catch (error) {
    console.warn(`Error saving Pokémon cache for "${apiCompatibleNameOrId}":`, error);
  }

  return processedPokemonDetails;
};
