import type {House} from './sim.js';
export const FLOOR_HEIGHT=2.65;
export const STAIR_LENGTH=1.8;
export const STAIR_WIDTH=1.2;
export const STAIR_CLEARANCE=3.2;
export function stairPoint(h:House,base=0){return {x:h.x+h.w-(base%2?2.45:1.0),y:h.y+h.d-1.35};}
