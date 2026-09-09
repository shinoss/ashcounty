import {finishes} from './variety-art';
import type {Simulation} from './sim';
/** Event sounds only: no ambient noise loop. */
export class GameAudio{
 context?:AudioContext;master?:GainNode;engine?:OscillatorNode;engineGain?:GainNode;
 muted=true;distance=0;lastDistance=0;lastDoor=0;lastShot=0;lastSwing=0;lastShove=0;
 setMuted(muted:boolean){this.muted=muted;if(!this.context&&!muted){const c=this.context=new AudioContext();this.master=c.createGain();this.master.connect(c.destination);this.engine=c.createOscillator();this.engine.type='triangle';this.engineGain=c.createGain();this.engineGain.gain.value=0;this.engine.connect(this.engineGain);this.engineGain.connect(this.master);this.engine.start();}if(this.context){this.master!.gain.setTargetAtTime(muted?0:.45,this.context.currentTime,.03);if(!muted)void this.context.resume();}}
 tone(freq:number,end:number,duration:number,volume:number,type:OscillatorType='triangle',delay=0){if(this.muted||!this.context)return;const c=this.context,t=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(end,t+duration);g.gain.setValueAtTime(.001,t);g.gain.linearRampToValueAtTime(volume,t+.008);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(this.master!);o.start(t);o.stop(t+duration+.01);o.onended=()=>{o.disconnect();g.disconnect();};}
 surface(s:Simulation):'grass'|'pavement'|'tile'|'wood'|'gravel'{
  if(s.stairTravel||s.survival.buildings.some(b=>b.kind==='floor'&&b.floor===s.player.floor&&Math.abs(b.x-s.player.x)<1&&Math.abs(b.y-s.player.y)<1))return 'wood';
  // Interiors currently share a tiled floor; the stair treads use wood.
  const house=s.inside(s.player);if(house){const floor=finishes(house).floor;return floor===4?'wood':floor===7?'pavement':'tile';}
  const {x,y}=s.player,cx=Math.floor(x/46),cy=Math.floor(y/46),region=s.world.cache.get(`${cx},${cy}`);
  const patch=region?.patches.slice().reverse().find(p=>x>=p.x&&x<=p.x+p.w&&y>=p.y&&y<=p.y+p.h);
  if(patch)return patch.kind==='road'||patch.kind==='parking'?'pavement':patch.kind==='path'?'gravel':'grass';
  return 'grass';
 }
 footstep(s:Simulation){
  if(this.muted||!this.context)return;
  const c=this.context,surface=this.surface(s),run=s.player.running;
  const profiles={grass:{duration:.15,cutoff:1200,grit:.32,body:.10,freq:75},gravel:{duration:.13,cutoff:2600,grit:.36,body:.13,freq:90},pavement:{duration:.085,cutoff:1500,grit:.20,body:.32,freq:85},tile:{duration:.10,cutoff:3200,grit:.19,body:.28,freq:125},wood:{duration:.14,cutoff:950,grit:.14,body:.38,freq:105}};
  const profile=profiles[surface],variation=.92+Math.random()*.16,duration=profile.duration/(run?1.1:1),rate=c.sampleRate;
  const buffer=c.createBuffer(1,Math.ceil(rate*duration),rate),data=buffer.getChannelData(0);
  const alpha=1-Math.exp(-2*Math.PI*profile.cutoff/rate);let filtered=0;
  // A brief heel impact and softer sole scuff, with fresh variation each step.
  for(let i=0;i<data.length;i++){
   const t=i/rate;filtered+=alpha*((Math.random()*2-1)-filtered);
   const attack=Math.min(1,t/.003),impact=Math.exp(-t/(surface==='grass'?.025:.014));
   const scuff=Math.exp(-Math.pow((t-duration*.38)/(duration*.24),2));
   const body=Math.sin(2*Math.PI*profile.freq*variation*t)*Math.exp(-t/.018);
   data[i]=attack*(filtered*profile.grit*(impact+scuff*.4)+body*profile.body);
  }
  const source=c.createBufferSource(),gain=c.createGain();source.buffer=buffer;gain.gain.value=(s.player.sneaking?.28:run?1.15:.8)*variation;source.connect(gain);gain.connect(this.master!);source.start();source.onended=()=>{source.disconnect();gain.disconnect();};
 }
 update(s:Simulation){const p=s.player,active=!s.paused&&!s.dead;
  const traveled=Math.max(0,p.distance-this.lastDistance);this.lastDistance=p.distance;
  if(active&&!s.driving){this.distance+=traveled;if(p.moving&&this.distance>=(p.running?1.35:1.05)){this.distance%=p.running?1.35:1.05;this.footstep(s);}}
  else this.distance=0;
  if(s.doorSound.serial!==this.lastDoor){this.lastDoor=s.doorSound.serial;if(active){this.tone(s.doorSound.open?180:110,55,s.doorSound.open?.18:.12,.20);this.tone(650,300,.045,.08,'triangle',s.doorSound.open?0:.09);}}
  if(active&&s.shotTime>this.lastShot+.02)this.tone(s.gun==='pistol'?260:s.gun==='shotgun'?95:190,38,s.gun==='shotgun'?.24:.13,s.gun==='pistol'?.22:.35,'square');
  if(active&&s.weapon==='bat'){
   const swingAt=s.attackDuration*(s.groundAttack?.56:.76);
   if(this.lastSwing>swingAt&&s.attackTime<=swingAt)this.tone(s.groundAttack?300:240,60,s.groundAttack?.23:.14,s.groundAttack?.20:.12);
   if(s.shoveTime>this.lastShove+.02)this.tone(105,65,.18,.08,'sine');
   if(this.lastShove>.78*.55&&s.shoveTime<=.78*.55)this.tone(120,48,.13,.15,'triangle');
  }
  this.lastShove=s.shoveTime;
  this.lastShot=s.shotTime;this.lastSwing=s.attackTime;
  if(this.context&&this.engine&&this.engineGain){const t=this.context.currentTime,speed=Math.abs(s.vehicle.speed);this.engine.frequency.setTargetAtTime(42+speed*5,t,.12);this.engineGain.gain.setTargetAtTime(active&&s.driving&&!this.muted?.10+Math.min(speed,12)*.006:0,t,.08);}
 }
}
