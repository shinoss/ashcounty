import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../.test-build/sim.js';
test('town contains civic landmarks and multiple sizes and heights',()=>{const s=new Simulation(),home=s.world.region(0,0);for(const kind of ['police','library','gas'])assert.ok(home.houses.some(h=>h.kind===kind));assert.ok(new Set(s.houses.map(h=>h.w+','+h.d)).size>5);assert.ok(s.houses.some(h=>h.floors===3));});
test('a closed house conceals occupants from outside zombies even when noisy',()=>{const s=new Simulation(),h=s.houses.find(h=>h.x===21&&h.y===13);s.player.x=23.5;s.player.y=17.6;h.door=true;const z={x:23.5,y:18.4,hp:100,phase:0,alert:true,cooldown:0,hit:0};s.zombies=[z];s.toggleDoor(h);s.sound=100;s.update(.05,{x:0,y:0,run:false,sneak:false});assert.equal(h.door,false);assert.equal(z.alert,false);assert.equal(s.player.hp,100);s.toggleDoor(h);s.update(.05,{x:0,y:0,run:false,sneak:false});assert.equal(z.alert,true);});
