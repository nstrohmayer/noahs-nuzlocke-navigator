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
  PokeApiMoveData,
  PokeApiAbility, // Added
  AbilityDetailData, // Added
  FullPokeApiMoveData, // Added
  FullMoveDetailData // Added
} from '../types';

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';
const CACHE_PREFIX_POKEMON = "pokemon_cache_";
const CACHE_PREFIX_ABILITY = "ability_cache_";
const CACHE_PREFIX_MOVE = "move_cache_";
const CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

async function fetchPokeApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${POKEAPI_BASE_URL}/${endpoint}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
    throw new Error(`PokeAPI request failed for ${endpoint}: ${response.status} ${response.statusText} - ${errorData.detail || errorData.message}`);
  }
  return response.json() as T;
}

function getCachedData<T>(cacheKey: string): T | null {
  try {
    const item = localStorage.getItem(cacheKey);
    if (!item) return null;
    const entry = JSON.parse(item) as CacheEntry<T>;
    if (Date.now() - entry.timestamp > CACHE_EXPIRATION_MS) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    return entry.data;
  } catch (error) {
    console.warn(`Error reading cache for ${cacheKey}:`, error);
    return null;
  }
}

function setCachedData<T>(cacheKey: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { timestamp: Date.now(), data };
    localStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch (error) {
    console.warn(`Error setting cache for ${cacheKey}:`, error);
  }
}

const extractIdFromUrl = (url: string): string => {
  const parts = url.split('/');
  return parts[parts.length - 2];
};


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
      apiCompatibleNameOrId = `${baseName}-alola`;
    } else {
      apiCompatibleNameOrId = name.replace(/\s+/g, '-').replace(/[.'"]/g, '');
    }
  } else {
    apiCompatibleNameOrId = pokemonNameOrId.toString();
  }
  
  const cacheKey = `${CACHE_PREFIX_POKEMON}${apiCompatibleNameOrId}`;
  let cached = getCachedData<PokemonDetailData>(cacheKey); 

  if (cached) {
    if (cached.abilities && cached.abilities.length > 0 && typeof (cached.abilities as any)[0] === 'string') {
        console.warn(`Old ability format (string[]) found in cache for ${apiCompatibleNameOrId}. Invalidating cache and refetching.`);
        localStorage.removeItem(cacheKey);
        cached = null; 
    } else {
        console.log(`Serving Pokémon data for "${apiCompatibleNameOrId}" from cache.`);
        return cached; 
    }
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

  const flavorTextEntry = speciesData.flavor_text_entries.find(entry => entry.language.name === 'en' && (entry.version.name === 'ultra-sun' || entry.version.name === 'ultra-moon'));
  const flavorText = flavorTextEntry ? flavorTextEntry.flavor_text.replace(/[\n\f\r]/g, ' ') : "No flavor text available for Ultra Sun/Moon.";

  const genusEntry = speciesData.genera.find(g => g.language.name === 'en');
  const genus = genusEntry ? genusEntry.genus : "Unknown Pokémon";

  const baseStats: PokemonBaseStat[] = pokemonData.stats.map(s => ({
    name: s.stat.name.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    value: s.base_stat,
  }));

  const structuredAbilities = pokemonData.abilities.map(a => ({
    displayName: a.ability.name.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    rawName: a.ability.name,
    isHidden: a.is_hidden,
  })).sort((a,b) => {
    if (a.isHidden !== b.isHidden) return a.isHidden ? 1 : -1;
    return a.displayName.localeCompare(b.displayName);
  });


  const levelUpMoves = pokemonData.moves
    .map(moveData => {
      const ultraSunUltraMoonDetail = moveData.version_group_details.find(
        detail => detail.version_group.name === 'ultra-sun-ultra-moon' && detail.move_learn_method.name === 'level-up'
      );
      if (ultraSunUltraMoonDetail && ultraSunUltraMoonDetail.level_learned_at > 0) {
        return {
          rawName: moveData.move.name,
          name: moveData.move.name.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          levelLearnedAt: ultraSunUltraMoonDetail.level_learned_at,
          learnMethod: 'Level Up',
        };
      }
      return null;
    })
    .filter((move): move is { rawName: string; name: string; levelLearnedAt: number; learnMethod: string; } => move !== null)
    .sort((a, b) => (a.levelLearnedAt || 0) - (b.levelLearnedAt || 0));

  const detailedMovesPromises = levelUpMoves.slice(0, 20).map(async (basicMoveInfo) => { 
    try {
      const moveDetails = await fetchPokeApi<PokeApiMoveData>(`move/${basicMoveInfo.rawName}`);
      const effectEntry = moveDetails.effect_entries.find(e => e.language.name === 'en');
      return {
        rawName: basicMoveInfo.rawName,
        name: basicMoveInfo.name,
        levelLearnedAt: basicMoveInfo.levelLearnedAt,
        learnMethod: basicMoveInfo.learnMethod,
        power: moveDetails.power,
        accuracy: moveDetails.accuracy,
        pp: moveDetails.pp,
        moveType: moveDetails.type.name.charAt(0).toUpperCase() + moveDetails.type.name.slice(1),
        damageClass: moveDetails.damage_class.name.charAt(0).toUpperCase() + moveDetails.damage_class.name.slice(1),
        shortEffect: effectEntry ? effectEntry.short_effect.replace(/\$effect_chance/g, `${moveDetails.effect_chance || ''}`) : 'No effect description.',
      } as PokemonMoveInfo;
    } catch (moveError) {
      console.warn(`Failed to fetch details for move ${basicMoveInfo.name}:`, moveError);
      return { 
        rawName: basicMoveInfo.rawName,
        name: basicMoveInfo.name,
        levelLearnedAt: basicMoveInfo.levelLearnedAt,
        learnMethod: basicMoveInfo.learnMethod,
        power: null, accuracy: null, pp: undefined, moveType: undefined, damageClass: undefined, shortEffect: 'Error fetching details.',
      } as PokemonMoveInfo;
    }
  });

  const resolvedDetailedMoves = await Promise.all(detailedMovesPromises);

  const processedPokemonDetails: PokemonDetailData = {
    id: pokemonData.id,
    name: pokemonData.name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('-'),
    spriteUrl: pokemonData.sprites.other?.['official-artwork']?.front_default || pokemonData.sprites.front_default,
    shinySpriteUrl: pokemonData.sprites.other?.['official-artwork']?.front_shiny || pokemonData.sprites.front_shiny,
    genus,
    types: pokemonData.types.map(t => t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1)),
    abilities: structuredAbilities,
    baseStats,
    evolutions: evolutionDataProcessed,
    flavorText,
    moves: resolvedDetailedMoves,
  };
  
  setCachedData(cacheKey, processedPokemonDetails);
  console.log(`Pokémon data for "${apiCompatibleNameOrId}" cached (new format).`);

  return processedPokemonDetails;
};


export const fetchAbilityDetails = async (abilityNameOrId: string | number): Promise<AbilityDetailData> => {
  const apiCompatibleName = abilityNameOrId.toString().toLowerCase().replace(/\s+/g, '-');
  const cacheKey = `${CACHE_PREFIX_ABILITY}${apiCompatibleName}`;
  
  const cached = getCachedData<AbilityDetailData>(cacheKey);
  if (cached) {
    // Validate cache structure if needed, e.g. pokemonWithAbility having IDs
    if (cached.pokemonWithAbility && cached.pokemonWithAbility.length > 0 && cached.pokemonWithAbility[0].id === undefined) {
        console.warn(`Old AbilityDetailData format (missing id in pokemonWithAbility) found in cache for ${apiCompatibleName}. Invalidating.`);
        localStorage.removeItem(cacheKey);
    } else {
        console.log(`Serving Ability data for "${apiCompatibleName}" from cache.`);
        return cached;
    }
  }

  const abilityData = await fetchPokeApi<PokeApiAbility>(`ability/${apiCompatibleName}`);

  const effectEntry = abilityData.effect_entries.find(e => e.language.name === 'en');
  const shortEffectEntry = abilityData.effect_entries.find(e => e.language.name === 'en' && e.short_effect);
  
  const flavorTextEntry = abilityData.flavor_text_entries.find(
    ft => ft.language.name === 'en' && (ft.version_group.name === 'ultra-sun-ultra-moon' || ft.version_group.name === 'sun-moon')
  );

  const usumPokemon = abilityData.pokemon.map(p => ({
    name: p.pokemon.name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('-'),
    isHidden: p.is_hidden,
    id: extractIdFromUrl(p.pokemon.url) // Extract ID
  })).sort((a,b) => a.name.localeCompare(b.name));


  const processedData: AbilityDetailData = {
    id: abilityData.id,
    name: abilityData.names.find(n => n.language.name === 'en')?.name || abilityData.name.split('-').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' '),
    effect: effectEntry ? effectEntry.effect.replace(/\s+/g, ' ') : "No effect description available.",
    shortEffect: shortEffectEntry ? shortEffectEntry.short_effect.replace(/\s+/g, ' ') : "No short effect description.",
    flavorText: flavorTextEntry ? flavorTextEntry.flavor_text.replace(/\s+/g, ' ') : "No flavor text available for Ultra Sun/Moon.",
    pokemonWithAbility: usumPokemon,
  };
  
  setCachedData(cacheKey, processedData);
  console.log(`Ability data for "${apiCompatibleName}" cached.`);
  return processedData;
};

export const fetchFullMoveDetails = async (moveNameOrId: string | number): Promise<FullMoveDetailData> => {
  const apiCompatibleName = typeof moveNameOrId === 'string' 
    ? moveNameOrId.toLowerCase().replace(/\s+/g, '-') 
    : moveNameOrId.toString();

  const cacheKey = `${CACHE_PREFIX_MOVE}${apiCompatibleName}`;

  const cached = getCachedData<FullMoveDetailData>(cacheKey);
  if (cached) {
    if (!cached.learnedByPokemon) { // Check if old cache format without learnedByPokemon
        console.warn(`Old FullMoveDetailData format (missing learnedByPokemon) found in cache for ${apiCompatibleName}. Invalidating.`);
        localStorage.removeItem(cacheKey);
    } else {
        console.log(`Serving Full Move data for "${apiCompatibleName}" from cache.`);
        return cached;
    }
  }

  const moveData = await fetchPokeApi<FullPokeApiMoveData>(`move/${apiCompatibleName}`);
  
  const effectEntry = moveData.effect_entries.find(e => e.language.name === 'en');
  const flavorTextEntry = moveData.flavor_text_entries.find(
    ft => ft.language.name === 'en' && (ft.version_group.name === 'ultra-sun-ultra-moon' || ft.version_group.name === 'sun-moon')
  );

  const learnedByPokemonProcessed = (moveData.learned_by_pokemon || []).map(p => ({
    name: p.name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('-'),
    id: extractIdFromUrl(p.url) // Extract ID from URL
  })).sort((a,b) => a.name.localeCompare(b.name));

  const processedData: FullMoveDetailData = {
    id: moveData.id,
    name: moveData.name.split('-').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' '),
    accuracy: moveData.accuracy,
    power: moveData.power,
    pp: moveData.pp,
    type: moveData.type.name.charAt(0).toUpperCase() + moveData.type.name.slice(1),
    damageClass: moveData.damage_class.name.charAt(0).toUpperCase() + moveData.damage_class.name.slice(1),
    effect: effectEntry ? effectEntry.effect.replace(/\$effect_chance/g, `${moveData.effect_chance || ''}`).replace(/\s+/g, ' ') : "No effect description.",
    effectChance: moveData.effect_chance,
    flavorText: flavorTextEntry ? flavorTextEntry.flavor_text.replace(/\s+/g, ' ') : "No flavor text available for Ultra Sun/Moon.",
    target: moveData.target.name.replace(/-/g, ' ').split(' ').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' '),
    learnedByPokemon: learnedByPokemonProcessed,
  };

  setCachedData(cacheKey, processedData);
  console.log(`Full Move data for "${apiCompatibleName}" cached.`);
  return processedData;
};