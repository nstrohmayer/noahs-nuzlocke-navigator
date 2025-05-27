
import { GameLocationNode } from './types';

export const ULTRA_MOON_PROGRESSION: GameLocationNode[] = [
  { id: "your-house", name: "Your House (Hau'oli Outskirts)" },
  { id: "iki-town-initial", name: "Iki Town (Initial Visit)" },
  { id: "mahalo-trail", name: "Mahalo Trail" },
  { id: "route-1-hauoli-outskirts", name: "Route 1 (Hau'oli Outskirts)" },
  { id: "professors-lab", name: "Professor Kukui's Lab" },
  { id: "trainers-school", name: "Trainers' School" }, // Teacher Emily is a mini-boss here, level 8
  { id: "hauoli-city-beachfront", name: "Hau'oli City - Beachfront" },
  { id: "hauoli-city-shopping-district", name: "Hau'oli City - Shopping District" },
  { id: "hauoli-city-marina", name: "Hau'oli City - Marina" },
  { id: "route-2", name: "Route 2 (Melemele Island)" },
  { id: "berry-fields", name: "Berry Fields (Route 2)" },
  { id: "verdant-cavern-entrance", name: "Verdant Cavern - Entrance" },
  { 
    id: "verdant-cavern-trial-site", 
    name: "Verdant Cavern - Trial Site",
    significantBattleLevel: 12, 
    significantBattleName: "Totem Gumshoos / Raticate",
    significantBattlePokemonCount: 2 // Totem + Ally
  },
  { id: "route-3", name: "Route 3 (Melemele Island)" },
  { id: "melemele-meadow", name: "Melemele Meadow" },
  { id: "seaward-cave", name: "Seaward Cave (Kala'e Bay entrance)" },
  { id: "kalae-bay", name: "Kala'e Bay" },
  { 
    id: "iki-town-grand-trial", 
    name: "Iki Town - Grand Trial",
    significantBattleLevel: 16, 
    significantBattleName: "Kahuna Hala",
    significantBattlePokemonCount: 3
  },
  // Akala Island locations
  { id: "hehea-city", name: "Heahea City (Akala Island)" },
  { id: "route-4-akala", name: "Route 4 (Akala Island)" },
  { id: "paniola-town", name: "Paniola Town" },
  { id: "paniola-ranch", name: "Paniola Ranch" },
  { id: "route-5-akala", name: "Route 5 (Akala Island)" },
  { 
    id: "brooklet-hill", 
    name: "Brooklet Hill - Trial Site",
    significantBattleLevel: 20, 
    significantBattleName: "Totem Araquanid / Wishiwashi",
    significantBattlePokemonCount: 2 // Totem + Ally
  },
  // Add more locations as needed for Ultra Moon
];

export const GEMINI_MODEL_NAME = 'gemini-2.5-flash-preview-04-17';