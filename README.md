# Ash County

A playable, original isometric zombie-survival prototype built with Phaser, TypeScript, and Vite. All world artwork is drawn procedurally in the project. 

![Ash County gameplay screenshot](screenshot.png)

## Play

Run `npm install`, then `npm run dev`. Open the local address printed by Vite.

- WASD / arrow keys: move in screen directions
- Shift: run, consuming stamina and making more noise
- C: hold to sneak
- Space / click the world: use the equipped weapon
- Q: switch bat / carbine; 1: equip bat; 6: equip carbine
- Hold right mouse: aim the carbine toward the cursor; R: reload
- The starting carbine carries 6 loaded rounds and 24 spare rounds; it is visible on the back while the bat is equipped.
- E: open or close a nearby front door; search when inside
- 2: bandage, 3: water, 4: canned food, 5: secure shelter with planks
- I: inventory, M: neighborhood map, J: objectives, Escape: pause
- Mouse wheel: zoom
- Phones: directional and action buttons are shown

Search two houses and collect two planks, then use the planks inside a house to secure your shelter. Houses 16 and 15 contain planks. All front doors face southeast (the +y edge of the isometric footprint). Open the door, move through the doorway, and press E again to search. You cannot walk through walls. Zombies respond to proximity and noise; two bat hits defeat one. Fighting and sprinting share a stamina reserve.

## Scope

A familiar starting neighborhood surrounded by an unbounded procedural world, with cutaway homes, roaming undead, combat, survival needs, inventory, a scrolling map, ambient wind, and win/death/restart states. Menus pause the world. Sessions are not saved. Vehicles and most furniture are scenery. This is a short survival prototype, not a feature-equivalent recreation of a full commercial game.

## Validate

`npm test` checks collision and door entry, one-time looting, consumables, combat cooldowns, pause and running, the shelter objective, and death. `npm run build` checks TypeScript and produces the static build in `dist/`.

## Structure

- `src/sim.ts`: simulation rules, collisions, survival, loot, enemies
- `src/art.ts`: deterministic isometric environment and character artwork
- `src/main.ts`: Phaser scene, camera, input, ambient audio
- `src/ui.ts`, `src/style.css`: responsive DOM HUD, inventory, map, journal

Visual direction: dusty sage, parchment, muted rust; restrained editorial typography; pitched-roof suburban homes, autumn trees, abandoned cars, and a clear central playfield.

The survivor uses continuously drawn, distance-driven locomotion poses, preserving gait phase between walking and running. Exhaustion has a recovery threshold to prevent rapid sprint/walk toggling. Aiming slows movement and disables sprinting; gunshots attract nearby undead and cannot pass through closed walls.

## Grid inventory

Press I to open the paused equipment screen. Drag entire item stacks between pockets, the backpack, and the field stash. Items have different cell sizes; overlaps and out-of-bounds drops are rejected. Matching stacks merge. Click an item and then an empty cell as an alternative to dragging. Select a carried consumable and choose Use Item, or use Take/Store Item to transfer automatically. Drag weapons between In Hands and On Back to equip them. The field stash is a session-wide cache; stashed supplies cannot be consumed or used to reload until retrieved. Layout and contents persist between inventory openings, but not across page reloads or new games. Empty headwear and armor slots indicate equipment that is not available in this prototype.

## Clickable crate looting

Eight wooden storage crates are placed along the road, beside houses, and inside homes. A labeled crate is within reach of the starting position. Walk within three tiles and click a crate to open its top-right loot panel. Scroll the item list, take an individual stack, or choose Loot All. Food, water, dressings, planks, and ammunition transfer into the existing inventory; ammunition adds to reserve rounds. Empty crates change appearance and do not refill during the session. Indoor crates are only visible and accessible from inside the same house. The world remains live while this panel is open. Walking out of reach, opening a paused menu, death, or Escape closes the panel. The original E-key house search remains available for the shelter objective.

## Procedural world and combat update

The world expands in every direction in deterministic 46-tile regions. Each region generates a varied set of homes, tree cover, undead, and crates with randomized contents and quantities. A 3×3 neighborhood of regions is rendered around the survivor; distant graphics and textures are disposed of. Visited region state remains in session memory, so searched houses, emptied crates, and killed zombies do not reset on return. Memory for visited state grows with exploration; there is no disk save or multiplayer simulation. The map follows the player beyond the starting neighborhood.

Killed zombies disappear immediately. Living undead now have idle, walking, attack, and stagger poses, with physical knockback when struck by the bat. The carbine fires repeatedly while left mouse is held (six rounds per magazine), stops on release or menus, and still reloads with R. Hold right mouse to aim. Closed house walls block all four sides and corners; an open front door is the only entry.

## Varied scenery, map zoom, and driving

The neighboring regions now showcase woodland with a reservoir, farmland with fields and hay bales, market streets and parking lots with fuel pumps, industrial storage yards, garden suburbs, and a memorial park. Districts vary in building placement, tree density, terrain, local roads, props, and parked vehicles. Shops and warehouses have distinct flat roofs and signs. The wider world continues to generate these district types deterministically.

Press M for the map. Scroll over the map or use the minus/plus controls to zoom from 20% to 300%; Reset returns to the normal scale. Generated surrounding regions and retained explored regions appear with district labels and terrain colors. The gameplay camera can also zoom farther out using the mouse wheel.

A green station wagon is near the starting position. F enters/exits; W accelerates, S brakes/reverses, A/D steer, and Space brakes immediately. Release the accelerator to coast to a stop. Exit requires low speed and clear space beside the car. Driving follows the same procedural streaming system, blocks traversal through buildings and water, and disables weapon use. The car remains where it is parked for the session. Other parked cars are scenery.
