# Planned towns and institutional architecture

September 10, 2026. Original raster assets generated with the built-in image generation tool and copied into this project. No external API key or third-party game art was used.

## Playable changes

- Retail anchors sit east of town centres on the main road. Smaller shops and homes occupy neighbouring blocks, civic services sit to the north, and industrial services occupy the southeast edge. Small villages have fewer developed blocks.
- Wren has a two-storey county hospital northeast of the starting neighbourhood and a correctional facility on its eastern outskirts. Millhaven has its own hospital and Fort Alder on the northeast edge. These sites are marked on M.
- Supermarkets have L-shaped footprints, shelving aisles, produce, checkout lanes and a separate stockroom. Hospitals have two ward wings surrounding an open courtyard, a reception block, medical furniture and working stairs. The prison has cell wings, administration, a mess hall and an accessible outdoor exercise yard. Fort Alder has separate barracks, an armory, a repair garage and a clinic, behind perimeter fencing with road access.
- Building footprints are shared by collision, floor containment, roof geometry and the map. Courtyard voids contain no invisible floor. Interior cutaway and the existing exterior-hiding behaviour remain in place.
- New institution shelves, medicine cabinets, produce stands and lockers have themed loot and support the existing container interaction. Movable institutional furniture retains its material style after placement elsewhere.
- Parks have lawns, intersecting paths, fountains, benches, clipped hedges and planted flower beds. Homes mix maintained borders with overgrowth. The countryside has clusters of brambles, ferns, wildflowers and fewer repeated trees. Six botanical varieties use generated textures on shaped 3D meshes, with instancing for foliage and security fencing.

## Generated assets and prompts

All source atlases are under `public/assets/town-variety/`:

### districts-v1.png — 4 × 4

Prompt: one production texture atlas for an original retro realistic isometric survival game; cool muted utility palette; exactly four columns and four rows of edge-to-edge square orthographic material swatches without labels, borders or perspective. Row 1: supermarket red brick, pale hospital concrete with mint paint, military olive corrugated steel, prison stained concrete. Row 2: shopfront glass and aluminium mullions, pale blue hospital ceramic tiles, weathered army canvas, black security bars. Row 3: grocery checker floor, hospital terrazzo, olive linoleum, prison concrete floor. Row 4: commercial gravel roof, blue-grey hospital roof, olive metal roof, aged prison slate. Subtle stains and scuffs, textured low-resolution realism for 3D UV mapping.

### institutions-v1.png — 4 × 4

Prompt: one production orthographic material atlas for retro survival interiors, sixteen equally sized edge-to-edge squares. Row 1: grocery shelf packages, produce crate apples and cabbages, commercial refrigerator glass and beverages, cashier register controls. Row 2: hospital mattress with blue blanket, medicine cabinet with bottles, blue privacy curtain, clinical teal-white wall. Row 3: olive military locker, khaki sleeping-bag canvas, olive ammunition crate slats, dark rubber worktop. Row 4: prison cell bars, worn institutional mattress, stainless washbasin, orange institutional cloth. Muted cool utility palette, low-resolution realism, no lettering or logos.

### botanical-v1.png — 3 × 2

Prompt: a production 3D foliage material atlas, not isolated plant sprites; exactly three columns and two rows of equal squares filled edge to edge with orthographic botanical macro texture. Row 1: dense bramble leaves and berries, clipped boxwood foliage, purple lavender heads among narrow leaves. Row 2: white/yellow daisies among dark leaves, overlapping fern fronds, pink rose blossoms among deep green foliage. Low-resolution realism with natural muted colours. No text, frames, empty backdrop, gradients, pots or whole trees.

Earlier foliage cutout generations produced opaque backdrops and were not shipped. The final foliage material atlas is used on actual 3D shrub and flower geometry, so no background-removal matte is needed.

## Saves and verification

Existing explored regions, player progress, built bases and save data are preserved. Unexplored regions use the new planner; a new county provides the complete coherent layout throughout. New layout, foliage and perimeter fields are optional for old saved regions.

TypeScript compilation and the production bundle pass. No automated tests or browser playtests were run, following the user's preference. Visual proportions and navigation have not been browser-verified in this pass.
