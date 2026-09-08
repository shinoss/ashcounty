# Cool utility art pack

Original artwork generated with the built-in image generation tool on September 7, 2026, from the user's approved cool utility direction. No Project Zomboid artwork is shipped. The full generation prompts are in `prompts.json`.

Nine source sheets supply 112 frames, props, surfaces and effects:

| Sheet | Contents |
| --- | --- |
| props.png | 16 trees, storage containers and roadside props |
| materials.png | 12 terrain, floor, wall and roofing textures |
| furniture.png | 12 kitchen, household and architectural sprites |
| survivor.png | 16 walking, back-facing, melee and hurt poses |
| rifle.png | 16 carrying and aiming poses, front and back |
| zombie.png | 16 walking, back-facing, attack and recoil poses |
| cars.png | Eight views of the station wagon |
| items.png | Eight weapon and supply icons |
| fx.png | Four muzzle-flash and four impact frames |

`src/sprite-assets.ts` loads the project-local PNGs, keys the opaque mattes, removes isolated character fragments, extracts cells and normalizes character sheets with one scale per sheet and a shared foot baseline. Exceptions to the generator's cell alignment are recorded as explicit car and item rectangles. Source PNGs are kept unchanged. The generated white mattes required extraction; they are not native transparent images.

`src/art.ts` composes those sprites and projects material textures onto world tiles and house surfaces. Building dimensions and doorway coordinates continue to come from simulation geometry. Character cycles have four source frames; running changes cadence, sneaking lowers the pose. Front/back sprites are mirrored for left facings. The car uses eight discrete directions. Weapons are visible in hands or slung on the back.

The procedural world, collision, loot, inventory and vehicle simulation are unchanged. Text, navigation symbols, targeting indicators and map diagrams remain code-rendered for clarity. Ambient audio is unchanged.

Run the development server and open `/art-review.html` to inspect every family at native gameplay scale with animated character previews. This development review page is not part of the production entry point.
