
import { GameLocationNode } from './types';

export const ULTRA_MOON_PROGRESSION: GameLocationNode[] = [
  { id: "your-house", name: "Your House (Hau'oli Outskirts)", island: "Melemele" },
  { id: "iki-town-initial", name: "Iki Town (Initial Visit)", island: "Melemele" },
  { id: "mahalo-trail", name: "Mahalo Trail", island: "Melemele" },
  { id: "route-1-hauoli-outskirts", name: "Route 1 (Hau'oli Outskirts)", island: "Melemele" },
  { id: "professors-lab", name: "Professor Kukui's Lab", island: "Melemele" },
  { id: "trainers-school", name: "Trainers' School", island: "Melemele" }, 
  { id: "hauoli-city-beachfront", name: "Hau'oli City - Beachfront", island: "Melemele" },
  { id: "hauoli-city-shopping-district", name: "Hau'oli City - Shopping District", island: "Melemele" },
  { id: "hauoli-city-marina", name: "Hau'oli City - Marina", island: "Melemele" },
  { id: "route-2-melemele", name: "Route 2 (Melemele Island)", island: "Melemele" },
  { id: "berry-fields", name: "Berry Fields (Route 2)", island: "Melemele" },
  { id: "verdant-cavern-entrance", name: "Verdant Cavern - Entrance", island: "Melemele" },
  { 
    id: "verdant-cavern-trial-site", 
    name: "Verdant Cavern - Trial Site",
    significantBattleLevel: 12, 
    significantBattleName: "Totem Gumshoos / Raticate",
    significantBattlePokemonCount: 2, 
    island: "Melemele"
  },
  { id: "route-3-melemele", name: "Route 3 (Melemele Island)", island: "Melemele" },
  { id: "melemele-meadow", name: "Melemele Meadow", island: "Melemele" },
  { id: "seaward-cave", name: "Seaward Cave (Kala'e Bay entrance)", island: "Melemele" },
  { id: "kalae-bay", name: "Kala'e Bay", island: "Melemele" },
  { 
    id: "iki-town-grand-trial", 
    name: "Iki Town - Grand Trial",
    significantBattleLevel: 16, 
    significantBattleName: "Kahuna Hala",
    significantBattlePokemonCount: 3,
    island: "Melemele"
  },
  // Akala Island locations
  { id: "heahea-city", name: "Heahea City", island: "Akala" },
  { id: "route-4-akala", name: "Route 4 (Akala Island)", island: "Akala" },
  { id: "paniola-town", name: "Paniola Town", island: "Akala" },
  { id: "paniola-ranch", name: "Paniola Ranch", island: "Akala" },
  { id: "route-5-akala", name: "Route 5 (Akala Island)", island: "Akala" },
  { 
    id: "brooklet-hill-trial", 
    name: "Brooklet Hill - Trial Site",
    significantBattleLevel: 20, 
    significantBattleName: "Totem Araquanid", // Wishiwashi is Sun/Moon Totem
    significantBattlePokemonCount: 2, 
    island: "Akala"
  },
  { id: "route-6-akala", name: "Route 6 (Akala Island)", island: "Akala" },
  { id: "royal-avenue", name: "Royal Avenue", island: "Akala" },
  { id: "route-7-akala", name: "Route 7 (Akala Island)", island: "Akala" },
  { 
    id: "wela-volcano-park-trial", 
    name: "Wela Volcano Park - Trial Site",
    significantBattleLevel: 22, 
    significantBattleName: "Totem Marowak", // Salazzle is Sun/Moon Totem
    significantBattlePokemonCount: 2,
    island: "Akala"
  },
  { id: "route-8-akala", name: "Route 8 (Akala Island)", island: "Akala" },
  { 
    id: "lush-jungle-trial", 
    name: "Lush Jungle - Trial Site",
    significantBattleLevel: 24, 
    significantBattleName: "Totem Lurantis",
    significantBattlePokemonCount: 2,
    island: "Akala"
  },
  { id: "digletts-tunnel", name: "Diglett's Tunnel", island: "Akala" },
  { id: "konikoni-city", name: "Konikoni City", island: "Akala" },
  { id: "memorial-hill", name: "Memorial Hill", island: "Akala" },
  { id: "akala-outskirts", name: "Akala Outskirts", island: "Akala" },
  { 
    id: "ruins-of-life-grand-trial", 
    name: "Ruins of Life - Grand Trial",
    significantBattleLevel: 27, 
    significantBattleName: "Kahuna Olivia",
    significantBattlePokemonCount: 3,
    island: "Akala"
  },
  // Ula'ula Island locations (Placeholder for next additions)
  // { id: "malie-city-ulaula", name: "Malie City", island: "Ula'ula" },

  // Poni Island locations (Placeholder for next additions)
  // { id: "seafolk-village-poni", name: "Seafolk Village", island: "Poni" },
];

export const GEMINI_MODEL_NAME = 'gemini-2.5-flash-preview-04-17';
