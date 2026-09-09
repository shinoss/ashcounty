# Survivor and town expansion artwork

Generated with the built-in image-generation tool. Original material atlases are mapped onto 3D meshes; character joints and animations remain unchanged.

## Assets

- `public/assets/town-variety/survivor-v3.png`: 4 × 4 outfit/face/armor texture atlas.
- `public/assets/town-variety/city-v3.png`: 4 × 4 town exterior, roofing and interior materials.
- `public/assets/cool-utility/gear-utilities.png`: helmet, vest and washer inventory icons.

## Prompts

### Survivor
Game-ready texture atlas for original retro low-resolution realistic isometric zombie survival game Ash County. Square 1024x1024 image, exact 4 columns x 4 rows equal edge-to-edge square texture cells, no gutters no labels no borders. Flat front-facing diffuse/albedo surfaces, no perspective, no lighting baked shadows. Row1: olive Kevlar vest FRONT with nylon weave seams pockets; olive Kevlar vest BACK with straps seams; olive military helmet fabric subtle weathering; charcoal combat boot leather. Row2: weathered adult male face front realistic proportions stubble neutral expression filling square; same skin ear side of head; short dark hair texture; worn leather glove. Row3: faded grey long-sleeve shirt cloth front; grey sleeve fabric with creases; dark blue denim cargo trousers pockets; dark blue denim creased knees. Row4: olive vest side straps; grey shirt back seams; dark blue trouser rear pockets; tan skin neck texture. Each cell fully opaque fills all its square. Original subtle gritty cool utility aesthetic, muted natural colors, sharp detailed textures suitable small 3D character UV mapping. This is a material sheet not an illustration of a character.

### Town materials
Create an original game-ready architecture diffuse texture atlas for a weathered 1990s American county town, retro low-resolution textured realism muted cool utility colors. 1024x1024 exact regular 4 columns by 4 rows equal square cells, edge to edge NO gaps NO labels NO borders. Orthographic flat surface materials for mapping onto 3D buildings, not isometric objects or complete buildings. Row1: faded red firehouse brick wall; cream limestone civic masonry; pale turquoise laundromat glazed wall tiles; aged burgundy pub brick. Row2: worn blue corrugated postal depot siding; butter-yellow bakery painted stucco; faded white clapboard community hall siding; dark brown timber lodge siding. Row3: red corrugated firehouse roof; weathered copper standing seam roof; grey asphalt flat roof gravel; teal painted metal roof. Row4: tiled laundromat interior wall; bakery floral plaster wallpaper; pub dark wood wainscot wall; civic cream interior plaster wall. Every cell is seamless tileable material covering entire cell, subtle wear mortar chips realistic grain, flat evenly lit albedo without directional shadows, no doors windows signs logos letters props. Original artwork.

### Equipment icons
Original inventory icon strip for gritty realistic retro isometric survival game. Image 1536 by 1024, three equally spaced icons in ONE ROW, exactly three equal columns. Left: olive combat helmet. Center: olive Kevlar tactical vest. Right: white front-loading washing machine. Entire background genuinely transparent alpha, no shadows on background, no text labels borders or UI. Each isolated item centered in its column with ample padding, fully visible, consistent isometric three-quarter view and muted cool realistic material detail. Readable at small gameplay inventory scale.


### Icon matte correction

The initial icon output included a checkerboard background, so a built-in image edit replaced it using this prompt: “Replace ONLY the entire checkerboard background with a perfectly flat solid dark olive #151e12 background. Preserve all three objects, their positions, scale, colors and shapes exactly. Remove checkerboard from gaps and openings between straps too. Absolutely NO checkerboard, no background texture, no gradients, no shadows on background. Output same 3-column icon strip on uniform single-color dark olive. This background will be removed by the existing game icon import pipeline.”

Runtime import uses the existing connected-matte extraction and trims each icon before displaying it. The source atlas is retained unchanged.
