# Ash County

A playable, original isometric zombie-survival prototype built with Three.js, TypeScript, and Vite. A fixed orthographic camera presents original textured low-poly characters, vehicles, and scenery.

![Ash County gameplay screenshot](screenshot.png)

The county covers roughly 3 × 3 km, with seven named towns, connecting highways, forest, farmland, isolated cabins, three lakes and a winding river. Terrain and settlement contents stream in as you explore; towns no longer repeat endlessly. Open **M → COUNTY** for the regional road map; drag to pan and scroll to zoom.

With the bat equipped, **right-click** shoves up to three nearby zombies in front of you. A shove winds up before contact; knockdown chance depends on stamina, alignment, distance and crowd size. Resisted shoves only stagger. Fallen zombies remain vulnerable for a few seconds, then get back up. **Left-click** a nearby fallen zombie for a full two-handed overhead finishing strike: lift, brace, drive downward and recover. Damage lands during the downswing. Finishers cost 24 stamina, shoves cost 18, and movement slows during either committed action. Shoves and swings consume stamina. Guns retain right-click aiming.

Inventory, containers and crafting use distinct generated icons for foods, medicine, materials, tools and firearms. Weapon artwork in the equipment slots is kept compact.

Item art: [county atlas](public/assets/cool-utility/county-items.png). Generation notes: [asset direction](docs/county-item-art.md).

### Driving and base building

A red **Vesper GT sports coupe** is parked beside the starter station wagon. It accelerates 60% faster than the wagon, with a top speed of 27.2 world units/sec versus 15 for the wagon and 21 for the police cruiser. Town centers are now about half their previous distance apart, with the county road connections adjusted accordingly.

Loot the roadside starter crate for a hammer, planks, nails and scrap. Open **B → Construction**, select a floor, wall, door or roof recipe, and choose **PLACE IN WORLD**. Click a green footprint within reach to place the piece; red means blocked or missing materials. **R** rotates, and **Esc/right-click** ends placement. Materials are charged only when placement succeeds. Floors snap to a shared 2 × 2 grid; walls and doors snap to its edges. Build foundations before walls and roofs. **E** opens/closes a base door. Walls and closed doors block movement and sight. Roof panels hide near the player so the base interior remains visible.

Right-click an interactable object to open its context menu. Choose **Pick up** on movable furniture and remain still while the green progress bar fills. Movement, combat or damage interrupts pickup. Furniture is packed into available inventory grid space; a full-inventory dialog leaves it in the world. Open **I**, select the packed furniture and choose **PLACE IN WORLD** when ready. **R** rotates; **Esc** cancels placement and keeps the item in inventory. Fixed objects show a disabled pickup option explaining why they cannot be moved. **Delete** dismantles nearby construction and refunds half its materials; supported foundations cannot be removed until their walls, roof and furnishings are cleared.

New recipe artwork: [floor, doorway and roof icons](public/assets/cool-utility/base-pieces.png).

The firearm hotbar follows the selected weapon: its individual icon and name, loaded rounds / magazine capacity, and spare ammunition update on selection, firing and reloading.

The compact olive HUD matches the crafting menu. Entering a building hides the outside world against black, keeping attention on the current interior. Walking, running and sneaking have been slowed by 20% for more deliberate movement.
