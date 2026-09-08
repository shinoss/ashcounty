import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../.test-build/sim.js';
import {stairPoint,FLOOR_HEIGHT} from '../.test-build/stairs.js';
function setup(){const s=new Simulation(),h=s.houses.find(h=>h.floors>=2),at=stairPoint(h);Object.assign(s.player,{x:at.x,y:at.y+.05,floor:0});return s;}
test('walking up stairs changes height continuously and can stop or reverse',()=>{
 const s=setup();s.move(s.player,0,-.6);assert.ok(s.playerElevation>0&&s.playerElevation<FLOOR_HEIGHT);const height=s.playerElevation;
 s.move(s.player,0,0);assert.equal(s.playerElevation,height);
 s.move(s.player,0,.2);assert.ok(s.playerElevation<height);
 s.move(s.player,0,1);assert.equal(s.player.floor,0);assert.equal(s.playerElevation,0);assert.equal(s.stairTravel,undefined);
});
test('walking completes ascent and descent without interaction keys',()=>{
 const s=setup();s.move(s.player,0,-3.3);assert.equal(s.player.floor,1);assert.equal(s.playerElevation,FLOOR_HEIGHT);assert.equal(s.stairTravel,undefined);
 s.move(s.player,0,3.5);assert.equal(s.player.floor,0);assert.equal(s.playerElevation,0);assert.equal(s.stairTravel,undefined);
});
