
export interface GameLocationNode {
  id: string;
  name: string;
  isCompleted?: boolean; 
  significantBattleLevel?: number; // Level of the ace/totem in a significant battle at this location
  significantBattleName?: string;  // Name of the significant battle/opponent
  significantBattlePokemonCount?: number; // Number of Pokemon the opponent has in this significant battle
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

export interface PokeApiMoveData {
  id: number;
  name: string;
  accuracy: number | null;
  power: number | null;
  pp: number;
  type: PokeApiNamedAPIResource;
  damage_class: PokeApiNamedAPIResource;
  effect_entries: PokeApiVerboseEffect[];
  effect_chance?: number | null; 
  // other fields as needed
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

export interface PokemonMoveInfo {
  name: string;
  levelLearnedAt?: number;
  learnMethod: string;
  // Detailed move info
  power?: number | null;
  accuracy?: number | null;
  pp?: number;
  moveType?: string;
  damageClass?: string;
  shortEffect?: string;
}


export interface PokemonDetailData {
  id: number;
  name: string;
  spriteUrl: string | null;
  shinySpriteUrl?: string | null; 
  genus: string; 
  types: string[];
  abilities: string[];
  baseStats: PokemonBaseStat[];
  evolutions: {
    currentStage: { name: string; id: number; spriteUrl: string | null };
    nextStages: PokemonEvolutionStep[];
    previousStage?: { name: string; id: number; spriteUrl: string | null }; 
  } | null; 
  flavorText: string;
  moves: PokemonMoveInfo[]; // Key moves, now with more details
}

// Type for storing caught status
export type CaughtStatusMap = Record<string, boolean>; // Pokemon ID (string) -> caught (boolean)

// Props for PokemonDetailBar
export interface PokemonDetailBarProps {
  pokemonData: PokemonDetailData | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  isCaught: boolean;
  onToggleCaught: (pokemonId: string | number) => void;
  onAddToTeam: (speciesName: string, pokemonId: number) => void;
  onPokemonNameClick: (pokemonName: string) => void; // For clicking evolutions
  // Props for simplified move staging
  onStageMove: (pokemonId: number, moveName: string, moveDetails: PokemonMoveInfo) => void;
  stagedMoveNameForThisPokemon: string | null;
}
