# Noah's Nuzlocke Navigator

## Motivation and Explanation

Hey everyone!

So, I've been getting into Pokémon lately, and the other day, while planning a run, I was tired of constantly Googling for answers. It's 2025, right? There *has* to be a better way!

That's when I had the idea to use AI. I started prompting a **generative AI development tool**, thinking I could build a little web app to answer my questions about the game – basically, building my own little AI wrapper.

And the results? Mind-blowing.

Within just **30 minutes**, I had a working prototype of an app that gives you information about any Pokémon run, running right in the AI environment! After a bit more "doodling" and prompting to figure out deployment, I went from initial idea to a fully deployed React app in **no longer than 4 hours total**. The crazy part? I wrote *zero* code for the core functionality! 🤯

The speed and the potential here are insane. This isn't just about making things faster; it's about unlocking creativity and letting you build things you might never have thought possible.

## About the App
https://noahs-nuzlock-navigator.netlify.app/

This project was a quick experiment to see what's possible with generative AI tools. The core functionality is driven by AI, allowing users to ask questions about Pokémon runs and receive relevant information.

## Technologies Used

* Generative AI (for AI model interaction and code generation)
* React (for the web app frontend)
* Vite for bundling
* Netlify for deployment

## Get Involved!

Have you built anything with generative code AI? I'd love to hear about your experiences – good, bad, or mind-blowing! Feel free to check out the code and let me know your feedback/thoughts!

Also, I'm based in Amsterdam – if you know of any cool companies or meetups where this kind of generative AI development is being discussed or shared, please let me know!

P.S. I'm currently exploring new job opportunities, so I'd be thrilled to connect and discuss this project or anything AI/web dev related!

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `VITE_GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
