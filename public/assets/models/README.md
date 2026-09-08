# Original articulated 3D assets

The editable source for these seven models is `src/models3d.ts`. `scripts/export-models.mjs` exports the original survivor, three zombie clothing variants, and three vehicle colors to glTF 2.0 binary files with embedded textures.

These are first-pass low-poly models with rigid articulated joints, not skinned or motion-captured humans. Character limb nodes (`leg0`, `knee0`, `arm0`, `elbow0`, and their right-side counterparts) are animated continuously by traveled distance at runtime. Car wheel nodes rotate separately from the body. Local +Z is forward; +Y is up. Model dimensions use world tile units.

The GLB files load through Three.js GLTFLoader and share geometry/material resources across instances. The source builders remain available for regenerating artwork. Higher-detail skinned GLB characters and authored animation clips can replace this initial artwork in a later art pass.

Regenerate with Vite running: `GAME_URL=http://127.0.0.1:5173 node scripts/export-models.mjs`.
