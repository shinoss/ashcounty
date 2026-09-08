Original prompt: Implement the proposed Three.js rendering pipeline with animated characters, continuously rotating vehicles, an isometric camera, and the existing game systems.

Implementation: preserve the Phaser view as a comparison, add a Three.js adapter over Simulation, use original articulated low-poly models and deterministic textured materials. Existing planar collisions remain authoritative; this is a rendering migration, not a new physics simulation.

Completed: main game now uses Three.js and GLTFLoader, with seven exported original GLB assets, continuous articulated gait, carrying/aiming/attack/stagger poses, continuous vehicle yaw and wheel animation, original textured scenery, instanced trees, interiors/cutaways, ray-picked loot, camera zoom, and all existing DOM overlays/audio. Previous renderer is at /legacy.html in development.

Fixed during integration: mouse button combinations need mousedown/up (pointerdown only fires for the first button); deterministic stepping must avoid a tiny final floating-point timestep; vehicle region ownership must move with the car. Pause freezes wheel animation.

Validation: production build and 34 simulation tests passed. tests/render3d.mjs exercises real browser controls for gait, sprint, arbitrary car headings, exit/brake, pause, aiming with held automatic fire, interior cutaway, crate picking, zoom, and region disposal. Screenshots inspected in output/three-regression. Local test server runs on 5174 because the user's existing 5173 server is still present.

Art limitation: these are original first-pass rigid articulated models with procedural joint animation. Further realism needs a dedicated model/texture and authored animation pass; no motion-capture or skinned animation is claimed. GLB source/export instructions are in public/assets/models/README.md.

Nine-item follow-up completed: 2x locomotion with adjusted stride; shared static collider index plus oriented vehicle overlap; zombie/car separation and occupant damage; water generation removed; large-map left-drag; old artwork mapped onto solid 3D scenery with pitched roofs and textured foliage; analytic rifle rays with no fixed damage cutoff; 13–20 tile radial darkness shader; death metadata, animated corpse falls, and blood (including runovers). Kept browser work to one short shader/screenshot check at the user's request. Regression speed fixtures updated for the intentional movement change.

Town follow-up: integrated town.ts building catalog with generated neighborhoods, 1–3-story exteriors, roof forms, signage, civic facades, shared furnishing colliders and landmark interiors. Art swatches texture character body parts. Front door is independent of the hidden facade; click/G toggles it, E searches. Closed shelters conceal from outside zombie detection and attack. 41 tests and build passed. Upper floors are visual only, documented explicitly.

Bat animation: replaced the small arm flick with staged wind-up, fast broad torso/arm sweep and follow-through. Added white world-space ribbons sampled from the bat shaft, with a brighter outer streak and short fade. Build passed; one brief browser capture confirmed the trail and no browser errors.

Encounters/interiors follow-up: outdoor zombies now cluster around local hotspots with home-biased wandering, and buildings can contain zombies on each floor. E only toggles the front door; search rewards/objective removed. Added screen-space dithered occluder transparency around the survivor. Multi-story rooms now have floor-local movement, furnishings, loot and combat with T/click stairs and Shift+T descent, plus smooth camera/player elevation transitions. Refrigerators are clickable containers stocked with six varied consumable foods; inventory/stash handles the new food kinds. Updated UI and README controls. Validation: all 41 tests and production build pass. One focused browser check confirmed upstairs visibility, actual refrigerator click and Loot All transfer with no console errors; captures in output/upper-floor.png and output/fridge.png. Stairs use an interaction-triggered floor transition; room layouts currently repeat between floors.

Foreground fade artifact fix: the dither mask now activates only when a visible world object intersects the camera-to-survivor sight line. Hidden cutaway meshes are ignored, the ray stops in front of the survivor, and surfaces at floor height are excluded from fading. This removes the persistent stippled patch on unobstructed ground while retaining scenery transparency. Production build passes.

Walkable stairs: movement now controls stair ascent/descent continuously from each landing, including stopping and reversing mid-flight. Stair flights align with the movement path, with separate lanes for adjacent flights in three-story buildings. Removed T/Shift+T interactions and updated help/README. Rendered character elevation matches stair progress directly so feet do not lag behind the slope; camera retains smooth following. Added ascent/descent and stop/reverse regression tests. All 43 tests and production build pass.


Stamina capacity and starting stamina doubled to 200; HUD bar normalized to the new maximum. Costs and regeneration rate unchanged. User preference: do not run tests going forward unless explicitly requested. No tests run for this change.


Vehicle safety: zombies now need 2.5 seconds of uninterrupted contact alongside a window of a nearly stopped vehicle before hurting its occupant. Vehicle damage reduced to 3 with a 3-second cooldown; moving away or interrupting the zombie resets contact. Player occlusion fading disabled while driving. No tests run, per user preference.


Roominess: widened starter houses and generated residential footprints while keeping roadside lots within their available space. Stair flights widened from .5 to 1.2 tiles, entrance tolerance expanded, adjacent flights spaced apart, and furniture clearance widened. Player retains lateral movement on stairs instead of snapping to their centerline. No tests run per user preference.


Upper-floor stair visibility: replaced each upper floor slab with four sections around an opening aligned to the descending stair flight. Steps below the floor are now visible through the stairwell, including the correct alternating flight on third floors. No tests run per user preference.


Exterior occlusion privacy: ground-floor interior slabs and furnishings now render only while occupying that building, matching existing loot/stair visibility. Indoor zombies and blood also stay hidden from outside, so the foreground fade reveals the survivor without exposing house contents. Exterior structure remains visible and fadeable. No tests run per user preference.


Inventory/combat/audio follow-up: removed journal access, quest objective and safehouse victory trigger; removed field stash from inventory UI/model. Pointer drags now use window-level end/cancel cleanup, aligned previews and grab-offset placement, including boundary clamping. Added aiming crosshair and two-bone grip poses for both hands, shoulder raise, braced legs, torso lean and recoil. Replaced ambient noise and interval sounds with GameAudio: movement footsteps, door events, speed-responsive continuous engine and short combat sounds; muting covers all output. No tests/browser checks run per user preference; production compilation succeeded.


Movement/audio tuning: walking, running and sneaking speeds reduced 30% to 3.78/6.44/1.89. Replaced pitched footstep beeps with short synthesized heel/scuff samples varied per contact. Surface selection follows tiled interiors, wooden stair flights, paved roads/sidewalks, gravel paths and grass/fields. Running steps use a longer stride consistent with the animation and stronger impacts; sneaking is quieter. No tests run.


Junction/building rendering fix: joined base road strips edge-to-edge, interrupted sidewalks and center markings at the cross street, and gave generated overlays distinct heights to remove coplanar flicker. Building materials now use a non-fading shader variant, keeping walls/roofs opaque from outside regardless of the player visibility mask. Interior cutaways still activate when entering. Trees retain foreground fading. No tests run.


Player readability correction: keep buildings opaque and draw a muted character silhouette only for player fragments behind existing scene depth. The overlay follows animated body/weapon geometry and is disabled while driving; it does not expose building interiors. No tests run.


Silhouette self-occlusion fix: draw scenery depth before the player, apply the hidden-fragment silhouette against that scenery-only buffer, then draw the normally lit player on a separate layer. Player limbs no longer count as blockers for the silhouette. Shared lighting enabled for both render layers, background/depth preserved between passes. No tests run.

Survival variety expansion: added content.ts catalog, Survival construction/recipe/skill simulation and B workshop UI. Five firearm profiles with models, magazines, damage/spread/pellets/noise/cadence and discovered arsenal; shared ammo explicitly documented. Five vehicle profiles with shape/handling differences, collision condition loss and repair kits. Added hardware/garage/pharmacy/outfitter/motel generation alongside previous destinations, furnishings/facade details, themed loot, eighteen new item types and enlarged backpack. Six buildable stations/barriers, four consumable recipes, placement clearance and marker, material/tool/skill/station gates, dismantling, zombie structure damage, solid/bullet collision, water production, noise lures and interruptible rest. Six XP skills provide bonuses and recipe unlocks. Audio defaults enabled after first input. Final production build passes; no tests or browser checks run per user instruction. All progression remains session-only; balance and visual tuning await user play feedback.


Generated-art update completed incrementally: three original built-in imagegen atlases saved as public/assets/town-variety/{materials,furniture,outfits}-v2.png, with exact prompts in GENERATION.md. Integrated 16 architecture finishes, 16 furniture finishes/faces and eight zombie outfit profiles plus trousers/skin/boots onto existing 3D geometry. Retained and adapted the room-furniture/layout additions present in the workspace; added per-building finish selection, correct shelf-facing materials and matching floor audio. Corrected back-facing roofs with double-sided material rendering. Captured updated town/home/library game views and a clearly staged zombie lineup in docs/screenshots; updated README gallery. Build passed. No tests run; browser use was for requested screenshots. Local Vite server restarted on 5174.


Daylight visibility: brighter warm sunlight and stronger pale ambient fill; substantially reduced screen-edge vignette. Fully clear sight increased from 13 to 32 tiles, fog outer radius from 20 to 44 tiles (nearly five times the visible area). Zombie and construction render distances now match the extended sight radius. No tests run.


Morning daylight correction: moved the warm sun onto the camera-facing side so visible facades receive direct light, strengthened sunlight and sky fill, added ambient illumination to shaded faces, and lifted baked-dark texture midtones before fog is applied. Removed the remaining dark vignette entirely. Retained 32–44 tile fog transition. No tests run.


Crafting UI redesign: compact three-column workshop with category rail, searchable/sortable recipe list, Can craft filter, session favorites, selectable recipe detail, ingredient icons/counts, retained tools, skill/station requirements, outputs and bounded quantity/MAX crafting. Structures stay single-placement. Arsenal and skills preserved as separate tabs. Search fields no longer trigger game hotkeys. No tests run.


Two-handed bat: bat now follows a torso-relative ready/swing pose and both bent arms solve to adjacent handle grips, including wind-up and follow-through. Preserved the white swing trail. New players start with all five firearm types unlocked in B → Arsenal; starting ammunition unchanged. No tests run.
