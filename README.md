# Ash County

An isometric zombie-survival game built with Three.js, TypeScript, and Vite. Inspired by Project Zomboid.

To play, run `npm run dev`

![Ash County gameplay screenshot](screenshot.png)

![Inside room](screenshot2.png)

![Menu](screenshot3.png)


### Town life and survival

Inventory (**I**) and crafting (**B**) keep the world running. Your survivor stops moving while browsing, but zombies, vehicle momentum, hunger and crafting jobs continue. **P** pauses or resumes the simulation (avoiding the browser’s Escape shortcut); switching away from the game also pauses it.

Start with a textured combat helmet and Kevlar vest. Together they absorb half of zombie attack damage while intact; protection wears down with hits. Zombies move 10% faster, and furniture pickup takes half its previous time. Right-click packed furniture in **I** and choose **Place in world**. Empty plank slots are hidden from the hotbar.

Fire stations, banks, laundromats, pubs, post offices, bakeries, town halls and woodland lodges join the town layouts, with new materials, silhouettes, furnishing layouts and loot pools. Supplies live in building storage and refrigerators instead of random roadside boxes. Street lamps illuminate nearby streets after dusk, with a day/night lighting cycle tied to the game clock.

Crashes damage vehicle condition according to impact speed. At zero condition, the engine stops; a repair kit gets it moving again. Condition is displayed beside driving speed.

New original artwork and generation prompts: [survivor and town assets](docs/survivor-town-art.md).
