
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { DetailedLocationInfo, GeminiLocationResponse, CatchablePokemonInfo } from '../types';
import { GEMINI_MODEL_NAME } from '../constants';

let ai: GoogleGenAI | null = null;
const CACHE_PREFIX_GEMINI = "gemini_cache_";
const CACHE_PREFIX_NAVIGATOR = "gemini_navigator_cache_"; // Cache for navigator

const getGoogleGenAI = (): GoogleGenAI => {
  if (!ai) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) { // This will be true if API_KEY is an empty string (or null/undefined)
      throw new Error("Gemini API Key (process.env.API_KEY) is not configured. This is typically set via the VITE_GEMINI_API_KEY environment variable during the build process. Please ensure it's correctly set in your .env file or deployment environment variables.");
    }
    ai = new GoogleGenAI({ apiKey: apiKey });
  }
  return ai;
};

export const fetchLocationDetailsFromGemini = async (locationName: string): Promise<DetailedLocationInfo> => {
  const genAI = getGoogleGenAI();
  const cacheKey = `${CACHE_PREFIX_GEMINI}${locationName.toLowerCase().replace(/\s+/g, '_')}`;

  try {
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      console.log(`Serving Gemini data for "${locationName}" from cache.`);
      return JSON.parse(cachedData) as DetailedLocationInfo;
    }
  } catch (error) {
    console.warn(`Error reading Gemini cache for "${locationName}":`, error);
  }

  const prompt = `
    You are an AI assistant for a Pokemon Nuzlocke challenge application.
    Your task is to provide detailed information about the game location "${locationName}" from Pokemon Ultra Moon.

    CRITICALLY IMPORTANT: Respond ONLY with a single, valid JSON object.
    - Do NOT include any introductory text, explanations, apologies, or markdown formatting (like \`\`\`json) surrounding the JSON object itself.
    - The entire response MUST be parseable by JSON.parse().
    - All string values within the JSON must be properly escaped. For example, any double quotes (") within a string value must be escaped as \\". Newline characters (\\n) or other special characters within strings must also be correctly escaped to ensure JSON validity.
    - Ensure all JSON objects and arrays are correctly structured with commas between elements/properties and no trailing commas.

    The JSON object must conform to the following structure:
    {
      "locationName": "string",
      "summary": "string",
      "catchablePokemon": [
        {
          "name": "string",
          "conditions": "string" 
        }
      ],
      "trainers": [
        {
          "name": "string",
          "strongestPokemonName": "string",
          "strongestPokemonLevel": "number",
          "notes": "string"
        }
      ],
      "items": [
        {
          "name": "string",
          "locationDescription": "string"
        }
      ],
      "staticEncounters": [
        {
          "pokemonName": "string",
          "level": "number",
          "notes": "string"
        }
      ]
    }

    Detailed instructions for each field:
    - "locationName": string (The confirmed name of the location, e.g., "Route 1 (Hau'oli Outskirts)")
    - "summary": string (A brief 1-2 sentence Nuzlocke-relevant summary of the location. Mention key events or purpose if applicable.)
    - "catchablePokemon": Array of objects. Each object must have:
        - "name": string (Name of the Pokemon species)
        - "conditions": string (Specific encounter conditions, e.g., "Day only", "Night only", "SOS Battle only", "Surfing", "Fishing - Old Rod", "Tall grass", "Berry tree". If no special condition or it's a standard encounter in the main area, use "Standard encounter" or an empty string.)
    - "trainers": Array of objects, where each object has:
        - "name": string (Trainer's class and name, e.g., "Youngster Joey", "Beauty Nova")
        - "strongestPokemonName": string (The name of their highest level or most threatening Pokemon)
        - "strongestPokemonLevel": number (The level of that Pokemon)
        - "notes": string (Optional: Brief notes like "Uses X Attack", "Key Rival Battle", "May use a Potion")
    - "items": Array of objects, where each object has:
        - "name": string (Item name, e.g., "Potion", "TM20 Safeguard")
        - "locationDescription": string (How/where to find it, e.g., "On the ground near the entrance", "Given by NPC after battle")
    - "staticEncounters": Array of objects, where each object has:
        - "pokemonName": string (Name of the Pokemon in a static encounter, e.g., "Snorlax", "Gift Eevee")
        - "level": number
        - "notes": string (Optional: e.g., "Blocks path", "Gift Pokemon from NPC if you have an empty slot")

    If specific information for a field is not applicable or not available for "${locationName}":
    - For string fields (like "summary", "notes", or "conditions" within "catchablePokemon"): use an empty string "".
    - For array fields (like "trainers", "items", "staticEncounters"): use an empty array [].
    - For the "catchablePokemon" array: if no Pokemon are catchable, use an empty array [].
    Do NOT omit any keys from the top-level JSON object or from the objects within the arrays. The full structure must always be present.

    Example of a "catchablePokemon" object:
    { "name": "Pikipek", "conditions": "Tall grass - common" }
    { "name": "Grubbin", "conditions": "SOS Battle (Pikipek)" }
    { "name": "Magikarp", "conditions": "Fishing - Any rod" }


    Now, provide the JSON data for the location: "${locationName}".
  `;

  try {
    const response: GenerateContentResponse = await genAI.models.generateContent({
        model: GEMINI_MODEL_NAME,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            temperature: 0.1,
            thinkingConfig: { thinkingBudget: 0 }
        }
    });

    const textOutput = response.text;

    if (typeof textOutput !== 'string') {
        let detailedErrorMsg = `AI response did not contain any text output for location "${locationName}".`;
        if (response.promptFeedback?.blockReason) {
            detailedErrorMsg = `AI request for "${locationName}" was blocked. Reason: ${response.promptFeedback.blockReason}. ${response.promptFeedback.blockReasonMessage || 'No additional message provided.'}`;
        } else if (response.candidates && response.candidates.length > 0) {
            const candidate = response.candidates[0];
            if (candidate.finishReason && candidate.finishReason !== 'STOP') {
                detailedErrorMsg = `AI generation for "${locationName}" stopped prematurely. Reason: ${candidate.finishReason}.`;
                if (candidate.finishReason === 'MAX_TOKENS' || candidate.finishReason === 'SAFETY' || candidate.finishReason === 'RECITATION') {
                    console.error("Full AI response when generation stopped prematurely:", JSON.stringify(response, null, 2));
                }
            } else if (candidate.safetyRatings && candidate.safetyRatings.some(r => r.blocked)) {
                detailedErrorMsg = `AI response for "${locationName}" might have been blocked by safety filters.`;
            }
        }
        if (!detailedErrorMsg.includes("Full AI response")) {
             console.error("Full AI response when text was missing or invalid:", JSON.stringify(response, null, 2));
        }
        throw new Error(detailedErrorMsg);
    }
    
    let jsonStr = textOutput.trim();
    const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    const parsedData = JSON.parse(jsonStr) as GeminiLocationResponse;
    
    if (typeof parsedData.locationName !== 'string' || 
        !Array.isArray(parsedData.catchablePokemon) || 
        !Array.isArray(parsedData.trainers) || 
        !Array.isArray(parsedData.items) || 
        !Array.isArray(parsedData.staticEncounters)) {
        console.warn("Gemini response for location " + locationName + " is missing some expected top-level fields or they are of incorrect type.", parsedData);
    }
    
    const catchablePokemonProcessed: CatchablePokemonInfo[] = (parsedData.catchablePokemon || []).map(p => ({
      name: p.name || "Unknown Pokemon",
      conditions: p.conditions || ""
    }));

    const processedDetails: DetailedLocationInfo = {
      locationId: locationName.toLowerCase().replace(/\s+/g, '-').replace(/[()',.]/g, ''),
      locationName: parsedData.locationName || locationName, 
      summary: parsedData.summary || "",
      catchablePokemon: catchablePokemonProcessed,
      trainers: parsedData.trainers || [],
      items: parsedData.items || [],
      staticEncounters: parsedData.staticEncounters || [],
    };

    try {
      localStorage.setItem(cacheKey, JSON.stringify(processedDetails));
      console.log(`Gemini data for "${locationName}" cached.`);
    } catch (error) {
      console.warn(`Error saving Gemini cache for "${locationName}":`, error);
    }

    return processedDetails;

  } catch (error) {
    console.error(`Error processing Gemini API response for location "${locationName}":`, error);
    
    let errorMessage = `Failed to get details from AI for ${locationName}.`;
    if (error instanceof SyntaxError) {
        errorMessage = `The AI returned malformed data for ${locationName} that could not be parsed as JSON. (Details: ${error.message})`;
    } else if (error instanceof Error) {
        errorMessage = error.message.startsWith("AI response") || error.message.startsWith("AI request") || error.message.startsWith("AI generation") || error.message.startsWith("Gemini API Key")
            ? error.message
            : `Error fetching details for ${locationName} from AI: ${error.message}`;
    }
    throw new Error(errorMessage);
  }
};

export const fetchNavigatorGuidanceFromGemini = async (userPrompt: string): Promise<string> => {
  const genAI = getGoogleGenAI();
  const cacheKey = `${CACHE_PREFIX_NAVIGATOR}${userPrompt.toLowerCase().replace(/\s+/g, '_').substring(0, 100)}`; 

  try {
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      console.log(`Serving Navigator guidance for prompt starting with "${userPrompt.substring(0, 50)}..." from cache.`);
      return JSON.parse(cachedData) as string;
    }
  } catch (error) {
    console.warn(`Error reading Navigator cache for prompt "${userPrompt.substring(0, 50)}...":`, error);
  }
  
  const systemInstruction = `
    You are an AI assistant for a Pokemon Nuzlocke challenge application, specifically for Pokemon Ultra Sun and Ultra Moon.
    The user will ask a question related to their Nuzlocke run.
    Your goal is to provide helpful, concise, and informative answers that aid the player in their Nuzlocke challenge.
    
    Key Guidelines:
    1.  **Nuzlocke Focus:** Tailor your advice to the Nuzlocke ruleset (first encounter per area, permadeath).
    2.  **Ultra Sun/Ultra Moon Specifics:** Ensure your information is accurate for Pokemon Ultra Sun and Ultra Moon. Note differences from Sun/Moon if relevant and known.
    3.  **Avoid Excessive Spoilers:** 
        *   When asked about a trainer's team (e.g., a Totem Pokemon, Kahuna, or major rival battle), you can mention the primary Pokemon's type(s), its level, and perhaps one or two of its notable Pokemon or a key strategy (e.g., "Totem Lurantis is Grass-type, level 24, and often calls for allies like Comfey or Castform. It can be tricky due to its high Special Defense and powerful Grass moves."). 
        *   Do NOT list full teams with all movesets, abilities, and items unless the user explicitly asks for that extreme level of detail. Err on the side of less detailed spoilers.
        *   For general locations, focus on common encounters, important items, or general strategies rather than exhaustive lists.
    4.  **Conciseness:** Provide the necessary information without being overly verbose. Get to the point.
    5.  **Formatting:** Use clear language. You can use paragraphs. If listing items or Pokémon, you can use simple markdown lists like:
        *   Item 1
        *   Pokemon A
    6.  **Handling Off-Topic/Broad Questions:** If the question is too broad, unrelated to Pokémon Nuzlockes, or asks for information outside of Ultra Sun/Ultra Moon, politely state that you can only assist with Nuzlocke-related queries for Pokémon Ultra Sun and Ultra Moon.
    7.  **Output:** Respond with plain text. Do not wrap your response in JSON or markdown code fences.
    8.  **Output Formatting for Links:**
        *   When you mention a specific Pokémon name (e.g., Pikachu, Snorlax, Rowlet), please wrap it in double curly braces: \`{{PokemonName}}\`. For example, \`{{Pikachu}}\` or \`{{Rowlet}}\`.
        *   When you mention a specific game location from the Alola region that players visit (e.g., Iki Town, Route 1, Paniola Ranch), please wrap it in double square brackets: \`[[LocationName]]\`. For example, \`[[Iki Town]]\` or \`[[Paniola Ranch]]\`.
  `;

  try {
    const response: GenerateContentResponse = await genAI.models.generateContent({
        model: GEMINI_MODEL_NAME,
        contents: userPrompt, // User's question is the main content
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.3, 
            topK: 40,
            topP: 0.95,
        }
    });
    
    const textOutput = response.text;

    if (typeof textOutput !== 'string' || textOutput.trim() === "") {
        let detailedErrorMsg = `AI response did not contain any text output for your query.`;
         if (response.promptFeedback?.blockReason) {
            detailedErrorMsg = `Your query was blocked. Reason: ${response.promptFeedback.blockReason}. ${response.promptFeedback.blockReasonMessage || 'No additional message provided.'}`;
        } else if (response.candidates && response.candidates.length > 0) {
            const candidate = response.candidates[0];
            if (candidate.finishReason && candidate.finishReason !== 'STOP') {
                detailedErrorMsg = `AI generation for your query stopped prematurely. Reason: ${candidate.finishReason}.`;
            } else if (candidate.safetyRatings && candidate.safetyRatings.some(r => r.blocked)) {
                detailedErrorMsg = `AI response for your query might have been blocked by safety filters.`;
            }
        }
        console.error("Full AI response when text was missing for navigator:", JSON.stringify(response, null, 2));
        throw new Error(detailedErrorMsg);
    }

    try {
      localStorage.setItem(cacheKey, JSON.stringify(textOutput));
      console.log(`Navigator guidance for prompt "${userPrompt.substring(0,50)}..." cached.`);
    } catch (error) {
      console.warn(`Error saving Navigator cache for prompt "${userPrompt.substring(0,50)}...":`, error);
    }

    return textOutput;

  } catch (error) {
    console.error(`Error processing Gemini API response for navigator prompt "${userPrompt.substring(0,50)}...":`, error);
    
    let errorMessage = `Failed to get guidance from AI.`;
    if (error instanceof Error) {
         errorMessage = error.message.startsWith("AI response") || error.message.startsWith("Your query was blocked") || error.message.startsWith("AI generation") || error.message.startsWith("Gemini API Key")
            ? error.message
            : `Error fetching guidance from AI: ${error.message}`;
    }
    throw new Error(errorMessage);
  }
};