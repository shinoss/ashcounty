// Integration checks against a running Vite server. Artifacts are ignored by git.
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
await mkdir('output/three-regression',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:800}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:5174');await page.waitForFunction(()=>window.game?.renderer);await page.bringToFront();
 const snapshot=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
 const advance=ms=>page.evaluate(ms=>window.advanceTime(ms),ms);
 // Freeze wall-clock stepping while deterministic keyboard bursts run.
 await page.evaluate(()=>{window.requestAnimationFrame=()=>0;});await page.waitForTimeout(100);
 const initial=await snapshot();assert.equal(initial.renderer,'three');
 await page.evaluate(()=>{const v=window.game,z=[...v.zombies.keys()][0],m=v.zombies.get(z);m.pose({phase:.125,moving:true,time:10});const first=m.legs[0].rotation.x;m.pose({phase:.625,moving:true,time:10.05});if(first*m.legs[0].rotation.x>=0)throw Error('zombie gait does not alternate');const car=v.s.vehicle,original=car.angle;for(let i=0;i<=72;i++){car.angle=i*Math.PI/36;v.render(.001);const yaw=v.cars.get(car.id).root.rotation.y;if(Math.abs(yaw-(Math.PI/2-car.angle))>1e-8)throw Error('vehicle angle snapped');}car.angle=original;v.render(.001);});
 await page.keyboard.down('d');await advance(300);const walked=await snapshot();assert.ok(walked.player.distance>initial.player.distance);assert.notEqual(walked.actorPose.leftLeg,walked.actorPose.rightLeg);
 await page.keyboard.down('Shift');await advance(300);assert.equal((await snapshot()).player.running,true);await page.screenshot({path:'output/three-regression/running.png'});
 await page.keyboard.up('d');await page.keyboard.up('Shift');await advance(300);
 // Return to the starter wagon with an ordinary test fixture.
 await page.evaluate(()=>{const s=window.game.s;s.player.x=s.vehicle.x-1;s.player.y=s.vehicle.y;s.zombies.forEach(z=>z.x+=1000);});
 await page.keyboard.press('f');assert.equal((await snapshot()).driving,true);
 await page.keyboard.down('w');await page.keyboard.down('d');await advance(500);const driving=await snapshot();assert.ok(driving.vehicle.angle>.1);assert.ok(driving.vehicle.speed>0);assert.ok(Math.abs(driving.visualHeading-(Math.PI/2-driving.vehicle.angle))<1e-8);
 const heading=driving.vehicle.angle;await advance(17);const next=await snapshot();assert.notEqual(next.vehicle.angle,heading);assert.ok(Math.abs(next.visualHeading-(Math.PI/2-next.vehicle.angle))<1e-8);
 await page.screenshot({path:'output/three-regression/driving.png'});await page.keyboard.up('w');await page.keyboard.up('d');await page.keyboard.press(' ');await page.keyboard.press('f');assert.equal((await snapshot()).driving,false);
 await page.keyboard.press('i');assert.equal((await snapshot()).paused,true);const before=(await snapshot()).elapsed;await advance(400);assert.equal((await snapshot()).elapsed,before);await page.keyboard.press('Escape');
 await page.keyboard.press('6');const aimPoint=await page.evaluate(()=>{for(let y=280;y<500;y+=30)for(let x=700;x<1000;x+=30)if(document.elementFromPoint(x,y)===window.game.renderer.domElement&&!window.game.pick(x,y))return {x,y};throw Error('no clear aim target');});await page.mouse.move(aimPoint.x,aimPoint.y);await page.mouse.down({button:'right'});await advance(50);assert.equal((await snapshot()).player.aiming,true);await page.mouse.down();await advance(550);assert.ok((await snapshot()).ammo<5,'Holding left mouse while aiming must fire repeatedly');await page.mouse.up();await page.mouse.up({button:'right'});
 // Enter a kitchen, verify roof cutaway, then pick a real storage crate.
 const cratePoint=await page.evaluate(()=>{const v=window.game,s=v.s,h=s.houses.find(h=>h.x===12&&h.y===13);h.door=true;s.shotTime=0;v.zoom=1.65;v.resize();s.player.x=h.x+h.w/2;s.player.y=h.y+h.d/2;s.driving=false;v.target.set(s.player.x,.7,s.player.y);v.render(.05);const hview=v.houses.get(h);if(hview.roof.visible)throw Error('roof did not cut away');const c=s.crates.find(c=>s.inside(c)===h);if(!c)return null;s.player.x=c.x+.8;s.player.y=c.y+.8;v.target.set(s.player.x,.7,s.player.y);v.render(.05);const point=v.crates.get(c).position.clone();point.y=.45;point.project(v.camera);return {x:(point.x+1)*640,y:(1-point.y)*400,id:c.id};});
 assert.ok(cratePoint,'kitchen fixture contains a crate');await advance(100);await page.mouse.click(cratePoint.x,cratePoint.y);assert.equal((await snapshot()).openCrate,cratePoint.id);await page.screenshot({path:'output/three-regression/kitchen.png'});
 await page.keyboard.press('Escape');await page.mouse.move(900,400);const zoom=(await snapshot()).zoom;await page.mouse.wheel(0,200);await page.waitForTimeout(100);assert.ok((await snapshot()).zoom<zoom);
 // Stream away and back; detached region views must not accumulate.
 await page.evaluate(()=>{const v=window.game,s=v.s;for(let i=1;i<=4;i++){s.player.x=46*i+23;s.player.y=23;s.streamWorld();v.render(.05);}if(v.regions.size!==9)throw Error('region leak');if(v.houses.size!==s.houses.length)throw Error('house view leak');});
 assert.deepEqual(errors,[]);console.log('3D integration passed: gait, sprint, car yaw, controls, pause, aiming, auto fire, kitchen cutaway, loot picking, zoom, streaming.');
}finally{await browser.close();}
