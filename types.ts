export interface GameLocationNode {
  id: string;
  name: string;
  isCompleted?: boolean; 
  significantBattleLevel?: number; // Level of the ace/totem in a significant battle at this location
  significantBattleName?: string;  // Name of the significant battle/opponent
  significantBattlePokemonCount?: number; // Number of Pokemon the opponent has in this significant battle
  island?: string; // Island where the location is
}

export interface TrainerInfo {
  name: string;
  strongestPokemonName: string;
  strongestPokemonLevel: number;
  notes?: string;
}

export interface ItemInfo {
  name: string;
  locationDescription: string;
}

export interface StaticEncounterInfo {
  pokemonName: string;
  level: number;
  notes?: string;
}

export interface CatchablePokemonInfo {
  name: string;
  conditions?: string; // e.g., "Day only", "SOS Battle", "Surfing"
}

export interface LocationDetailsDisplayProps {
  details: DetailedLocationInfo;
  IconPokeball: React.ElementType;
  IconTrainer: React.ElementType;
  IconItem: React.ElementType;
  IconBattle: React.ElementType;
  onPokemonNameClick: (pokemonName: string) => void;
  currentLocationId: string | null; // ID of the currently starred location
  onSetCurrentLocation: (locationNodeId: string) => void; // Function to set a location as current
  selectedLocationNodeId: string; // ID of the location whose details are being displayed
}

export interface DetailedLocationInfo {
  locationId: string;
  locationName: string;
  summary?: string;
  catchablePokemon: CatchablePokemonInfo[];
  trainers: TrainerInfo[];
  items: ItemInfo[];
  staticEncounters: StaticEncounterInfo[];
}

export interface AddTeamMemberData {
  species: string;
  level: number;
  nickname?: string;
  pokemonId?: number; // For fetching sprite
  initialMove?: string; // For setting the first move
}

export interface TeamMember {
  id: string;
  species: string;
  nickname?: string;
  level: number;
  pokemonId?: number; // For sprite
  heldItem?: string;
  moves?: string[]; // Array of 4 move names
  isShiny?: boolean;
}

export interface TeamManagerProps {
  team: TeamMember[];
  onAddTeamMember: (memberData: AddTeamMemberData) => void; // Updated to use AddTeamMemberData
  onRemoveTeamMember: (id: string) => void;
  IconPokeball: React.ElementType;
  levelCap?: number | null;
  nextBattleName?: string | null;
  nextBattleLocation?: string | null;
  nextBattlePokemonCount?: number | null;
  onUpdateTeamMemberNickname: (memberId: string, nickname: string) => void;
  onUpdateTeamMemberLevel: (memberId: string, level: number) => void;
  onUpdateTeamMemberItem: (memberId: string, item: string) => void;
  onUpdateTeamMemberMove: (memberId: string, moveIndex: number, moveName: string) => void;
  onToggleTeamMemberShiny: (memberId: string) => void;
}

// Structure Gemini is expected to return
export interface GeminiLocationResponse {
  locationName: string;
  summary?: string;
  catchablePokemon: Array<{
    name: string;
    conditions: string; 
  }>;
  trainers: Array<{
    name: string;
    strongestPokemonName: string;
    strongestPokemonLevel: number;
    notes?: string;
  }>;
  items: Array<{
    name: string;
    locationDescription: string;
  }>;
  staticEncounters: Array<{
    pokemonName: string;
    level: number;
    notes?: string;
  }>;
}

// --- PokeAPI Specific Types ---

export interface PokeApiResource {
  name: string;
  url: string;
}

export interface PokeApiNamedAPIResource extends PokeApiResource {}

export interface PokeApiEffect {
  effect: string;
  language: PokeApiNamedAPIResource;
}

export interface PokeApiVerboseEffect extends PokeApiEffect {
  short_effect: string;
}

export interface PokeApiMoveData { // This is used for the initial list of moves in PokemonDetailBar
  id: number;
  name: string;
  accuracy: number | null;
  power: number | null;
  pp: number;
  type: PokeApiNamedAPIResource;
  damage_class: PokeApiNamedAPIResource;
  effect_entries: PokeApiVerboseEffect[];
  effect_chance?: number | null; 
  // Other fields for full move detail might be needed if we expand this type for the dedicated view
  // For now, PokemonMoveInfo will be a subset/processed version
}


export interface PokeApiPokemon {
  id: number;
  name: string;
  sprites: {
    front_default: string | null;
    front_shiny: string | null; 
    other?: {
      "official-artwork"?: {
        front_default: string | null;
        front_shiny?: string | null;
      };
    };
  };
  types: Array<{
    slot: number;
    type: PokeApiResource;
  }>;
  abilities: Array<{
    ability: PokeApiResource;
    is_hidden: boolean;
    slot: number;
  }>;
  stats: Array<{
    base_stat: number;
    effort: number;
    stat: PokeApiResource;
  }>;
  moves: Array<{
    move: PokeApiResource;
    version_group_details: Array<{
      level_learned_at: number;
      move_learn_method: PokeApiResource;
      version_group: PokeApiResource;
    }>;
  }>;
  species: PokeApiResource;
}

export interface PokeApiSpecies {
  id: number;
  name: string;
  evolution_chain: { url: string };
  flavor_text_entries: Array<{
    flavor_text: string;
    language: PokeApiResource;
    version: PokeApiResource;
  }>;
  genera: Array<{
    genus: string;
    language: PokeApiResource;
  }>;
}

export interface PokeApiEvolutionDetail {
  item: PokeApiResource | null;
  trigger: PokeApiResource;
  gender: number | null;
  held_item: PokeApiResource | null;
  known_move: PokeApiResource | null;
  known_move_type: PokeApiResource | null;
  location: PokeApiResource | null;
  min_affection: number | null;
  min_beauty: number | null;
  min_happiness: number | null;
  min_level: number | null;
  needs_overworld_rain: boolean;
  party_species: PokeApiResource | null;
  party_type: PokeApiResource | null;
  relative_physical_stats: number | null;
  time_of_day: string;
  trade_species: PokeApiResource | null;
  turn_upside_down: boolean;
}

export interface PokeApiEvolutionChainLink {
  is_baby: boolean;
  species: PokeApiResource;
  evolution_details: PokeApiEvolutionDetail[];
  evolves_to: PokeApiEvolutionChainLink[];
}

export interface PokeApiEvolutionChain {
  id: number;
  baby_trigger_item: PokeApiResource | null;
  chain: PokeApiEvolutionChainLink;
}

// --- Processed Pokemon Detail Data for UI ---
export interface PokemonBaseStat {
  name: string;
  value: number;
}

export interface PokemonEvolutionStep {
  name: string;
  spriteUrl?: string; 
  trigger: string; 
  conditions: string[];
}

export interface PokemonMoveInfo { // Basic move info for lists
  name: string;
  levelLearnedAt?: number;
  learnMethod: string;
  power?: number | null;
  accuracy?: number | null;
  pp?: number;
  moveType?: string;
  damageClass?: string;
  shortEffect?: string;
  // Raw name for fetching full details
  rawName?: string; 
}

export interface PokemonAbilityInfo {
  displayName: string;
  rawName: string;
  isHidden: boolean;
}

export interface PokemonDetailData {
  id: number;
  name: string;
  spriteUrl: string | null;
  shinySpriteUrl?: string | null; 
  genus: string; 
  types: string[];
  abilities: PokemonAbilityInfo[]; // Array of ability objects
  baseStats: PokemonBaseStat[];
  evolutions: {
    currentStage: { name: string; id: number; spriteUrl: string | null };
    nextStages: PokemonEvolutionStep[];
    previousStage?: { name: string; id: number; spriteUrl: string | null }; 
  } | null; 
  flavorText: string;
  moves: PokemonMoveInfo[];
}

// Type for storing caught status
export type CaughtStatusMap = Record<string, boolean>;

// --- Ability Detail Types ---
export interface AbilityEffectChange {
  effect_entries: PokeApiEffect[];
  version_group: PokeApiNamedAPIResource;
}

export interface AbilityFlavorText {
  flavor_text: string;
  language: PokeApiNamedAPIResource;
  version_group: PokeApiNamedAPIResource;
}

export interface AbilityPokemonEntry { // Renamed for clarity
  is_hidden: boolean;
  slot: number;
  pokemon: PokeApiNamedAPIResource;
}

export interface PokeApiAbility {
  id: number;
  name: string;
  is_main_series: boolean;
  generation: PokeApiNamedAPIResource;
  names: Array<{ name: string; language: PokeApiNamedAPIResource }>;
  effect_entries: PokeApiVerboseEffect[];
  effect_changes: AbilityEffectChange[];
  flavor_text_entries: AbilityFlavorText[];
  pokemon: AbilityPokemonEntry[]; 
}

export interface AbilityDetailData {
  id: number;
  name: string;
  effect: string; // Primary effect in English
  shortEffect: string; // Short effect in English
  flavorText: string; // Flavor text for USUM if available
  pokemonWithAbility: Array<{ name: string; isHidden: boolean; id: string | number }>; // Processed list for USUM, added id
}

// --- Full Move Detail Types ---
export interface PokeApiMoveFlavorText {
  flavor_text: string;
  language: PokeApiNamedAPIResource;
  version_group: PokeApiNamedAPIResource;
}

export interface PokeApiMoveMetaData {
  ailment: PokeApiNamedAPIResource;
  category: PokeApiNamedAPIResource;
  min_hits: number | null;
  max_hits: number | null;
  min_turns: number | null;
  max_turns: number | null;
  drain: number;
  healing: number;
  crit_rate: number;
  ailment_chance: number;
  flinch_chance: number;
  stat_chance: number;
}

export interface PokeApiPastMoveStatValues {
  accuracy: number | null;
  effect_chance: number | null;
  power: number | null;
  pp: number | null;
  effect_entries: PokeApiVerboseEffect[];
  type: PokeApiNamedAPIResource | null;
  version_group: PokeApiNamedAPIResource;
}

export interface FullPokeApiMoveData extends PokeApiMoveData { // Extends the basic PokeApiMoveData
  generation: PokeApiNamedAPIResource;
  target: PokeApiNamedAPIResource;
  flavor_text_entries: PokeApiMoveFlavorText[];
  learned_by_pokemon: PokeApiNamedAPIResource[];
  meta?: PokeApiMoveMetaData;
  past_values?: PokeApiPastMoveStatValues[];
}

export interface FullMoveDetailData {
  id: number;
  name: string;
  accuracy: number | null;
  power: number | null;
  pp: number;
  type: string;
  damageClass: string;
  effect: string;
  effectChance?: number | null;
  flavorText: string; // USUM flavor text
  target: string;
  learnedByPokemon: Array<{ name: string; id: string | number }>; // Added processed list
}


// Props for PokemonDetailBar - now passed through DetailDisplayController
export interface PokemonDetailBarProps {
  pokemonData: PokemonDetailData; // Not nullable here, controller handles null
  isCaught: boolean;
  onToggleCaught: (pokemonId: string | number) => void;
  onAddToTeam: (speciesName: string, pokemonId: number) => void;
  onPokemonNameClickForEvolution: (pokemonNameOrId: string | number) => void; // Can take name or ID
  onAbilityNameClick: (abilityName: string) => void; // abilityName is rawName
  onMoveNameClick: (moveName: string, rawMoveName: string) => void; // Pass raw name for API lookup
  onStageMove: (pokemonId: number, moveName: string, moveDetails: PokemonMoveInfo) => void;
  stagedMoveNameForThisPokemon: string | null;
  onClose: () => void; 
}

export interface AbilityDetailDisplayProps {
  abilityData: AbilityDetailData;
  onPokemonNameClick?: (pokemonNameOrId: string | number) => void; // Added for linking
}

export interface MoveDetailDisplayProps {
  moveData: FullMoveDetailData;
  onPokemonNameClick?: (pokemonNameOrId: string | number) => void; // Added for linking
}


// Props for DetailDisplayController
export interface DetailDisplayControllerProps {
  activeView: 'pokemon' | 'ability' | 'move';
  pokemonData: PokemonDetailData | null;
  abilityData: AbilityDetailData | null;
  moveData: FullMoveDetailData | null; 
  isLoading: boolean;
  error: string | null;
  
  onClose: () => void;
  onBackToPokemon?: () => void; 
  pokemonContextForDetailViewName?: string | null;

  // Props specifically for when PokemonDetailBar is active
  isCaught?: boolean;
  onToggleCaught?: (pokemonId: string | number) => void;
  onAddToTeam?: (speciesName: string, pokemonId: number) => void;
  onStageMove?: (pokemonId: number, moveName: string, moveDetails: PokemonMoveInfo) => void;
  stagedMoveNameForThisPokemon?: string | null;

  // Callbacks for navigation triggered from child components
  onPokemonNameClickForEvolution: (pokemonNameOrId: string | number) => void; // Can take name or ID
  onAbilityNameClick: (abilityName: string) => void; // abilityName is rawName
  onMoveNameClick: (moveName: string, rawMoveName: string) => void; // Pass raw name for API lookup
}

// Props for NavigatorDisplay
export interface NavigatorDisplayProps {
  initialPromptValue: string;
  onPromptSubmit: (prompt: string) => void;
  isLoading: boolean;
  apiResponse: string | null;
  apiError: string | null;
  onReset: () => void;
  apiKeyMissing: boolean;
  onPokemonNameClick: (pokemonName: string) => void;
  onLocationNameClick: (location: GameLocationNode) => void;
  gameLocations: GameLocationNode[];
}