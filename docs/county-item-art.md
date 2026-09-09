# County inventory artwork

Generated with the built-in image generation tool, September 9, 2026.

Final asset: `public/assets/cool-utility/county-items.png`.

Direction: an original retro survival inventory atlas with textured realism, natural colors, three-quarter top view, and distinct readable silhouettes at 40px. Six columns by five rows, one item centered per cell, no brands, grid lines or labels. The initial checkerboard background was replaced by a dark olive background to match inventory panels.

Row-major subjects:

1. Apple, cheese, sandwich, yogurt, carrots, milk.
2. Beans, water, bandage, planks, ammunition, nails.
3. Scrap metal, cloth, duct tape, electronics, charcoal, hammer.
4. Wrench, workshop handbook, medical guide, repair kit, energy bar, painkillers.
5. Stew, pistol, shotgun, scoped hunting rifle, SMG, backpack.

Final edit prompt: Keep exactly all 30 objects, positions, sizes and the six-column/five-row layout. Replace the checkerboard with solid dark olive #20271f. No transparency, checkerboard, grid lines or text. Preserve every object intact.

The loader extracts the 30 cells at runtime. Item kinds have individual icon keys shared by inventory, loot and crafting. The existing carbine and bat art is retained at a smaller display size.

## Construction recipe icons

Generated using the built-in image generation tool. Final asset: `public/assets/cool-utility/crafting-structures.png`.

Prompt: A precisely aligned three-column, two-row crafting atlas, containing wooden barricade, carpenter workbench, water collection barrel, olive bedroll, stone-ring campfire, and homemade electronic noise lure in row-major order. Original textured retro realism, three-quarter isometric view, clear at 40px, centered objects, ample padding. Solid dark olive #20271f background; no transparency, checkerboard, borders, labels or logos.

Dedicated `build:` icon keys are used in the recipe list, selected recipe header, output preview, and station requirement. Ingredients retain their individual item artwork.

## Base pieces

Generated with the built-in image generation tool. Final asset: `public/assets/cool-utility/base-pieces.png`.

Prompt: Original retro realistic isometric survival crafting atlas with exactly three columns and one row: square timber floor foundation with boards and joists; wooden doorway with frame, ajar door and handle; gray shingle roof panel on timber rafters. Natural muted textures, readable at 40px, centered objects with ample padding and consistent upper-left light. Uniform dark olive #20271f background; no text, grid lines, checkerboard, transparency or watermark.

## Transparent menu rendering

All three olive-backed atlases now pass through a one-time alpha extraction in `src/sprite-assets.ts`. Each cell's connected background is removed and its edge pixels are unmixed from the olive matte. The UI receives transparent PNG data URLs, allowing hover and selection colors to show around the artwork. Original source atlases remain intact. A built-in background-extraction attempt returned an opaque PNG and was discarded.

## Movable furniture icons

Final asset: `public/assets/cool-utility/movable-furniture-icons.png`. Generated with the built-in image generation tool.

Prompt direction: exactly three columns by three rows, isolated objects in equal cells, generous margins, textured retro realism, three-quarter isometric view and muted natural colors. Row order: CRT television, office desk, bookshelf; stocked supermarket shelf, steel locker, medicine cabinet; mechanic tool chest, church pew, diner booth. Solid olive #20271f background, no labels, borders or checkerboard. The loader removes the matte using the existing alpha extraction.

Corrected original furniture sheet mappings: cabinet 0, refrigerator 3, table 4, chair 5, sofa 6, bed 7, nightstand 10, plant 11. The new TV no longer references the plant slot; shelves no longer reference a bed.
