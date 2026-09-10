import {CLOTHING_ITEMS} from './wardrobe';
import {EXPEDITION_ITEMS} from './expedition-content';
export const GUNS={
 carbine:{name:'M6 Carbine',capacity:12,damage:70,cadence:.16,noise:26,pellets:1,spread:.035,desc:'Fast automatic fire; versatile at medium range.'},
 pistol:{name:'Rook 9mm',capacity:15,damage:48,cadence:.32,noise:16,pellets:1,spread:.025,desc:'Quietest firearm; accurate, measured shots.'},
 shotgun:{name:'Homestead 12G',capacity:5,damage:32,cadence:.85,noise:38,pellets:7,spread:.20,desc:'Seven-pellet spread; devastating up close, very loud.'},
 hunting:{name:'Ranger .308',capacity:4,damage:150,cadence:1.1,noise:32,pellets:1,spread:.008,desc:'Slow, precise shots with exceptional stopping power.'},
 smg:{name:'Wasp SMG',capacity:24,damage:38,cadence:.085,noise:30,pellets:1,spread:.075,desc:'High fire rate; burns ammunition quickly.'}
};
export type GunKind=keyof typeof GUNS;
export const VEHICLES={sports:{name:'Vesper GT sports coupe',speed:27.2,accel:14.4,steer:2.6},wagon:{name:'Station wagon',speed:15,accel:9,steer:2.1},sedan:{name:'Sedan',speed:18,accel:10,steer:2.3},pickup:{name:'Pickup truck',speed:14,accel:8,steer:1.9},van:{name:'Delivery van',speed:12,accel:6,steer:1.6},police:{name:'Police cruiser',speed:21,accel:12,steer:2.4}};
export type VehicleKind=keyof typeof VEHICLES;
const item=(name:string,icon:string,category:string,desc:string,weight=.2)=>({name,icon,category,desc,weight,w:1,h:1});
export const SUPPLIES={...EXPEDITION_ITEMS,...CLOTHING_ITEMS,
 Axe:{name:"Woodcutting axe",icon:"Axe",category:"Tool",desc:"Right-click a tree to chop it into logs. A saw can also cut timber.",weight:2.2,w:2,h:3},
 BatRepair:item('Melee repair wrap','Tape','Utility','Use to restore 55 condition to your crowbar or bat grip.'),Nails:item('Box of nails','ammo','Material','Fasteners for carpentry.'),Scrap:item('Scrap metal','wood','Material','Repair parts and reinforced structures.',.6),Cloth:item('Cloth strips','bandage','Material','Bandages, bedding and filters.'),Tape:item('Duct tape','bandage','Material','Useful for repairs and improvised gear.'),Electronics:item('Electronic parts','compass','Material','Components for sound lures.'),Charcoal:item('Charcoal','food','Material','Fuel for cooking.'),
 Hammer:item('Claw hammer','axe','Tool','Reusable tool required for construction.',.7),Wrench:item('Wrench','axe','Tool','Reusable tool for vehicle repairs.',.6),Manual:item('Workshop handbook','book','Book','Read to gain carpentry experience.'),MedicalGuide:item('First aid guide','book','Book','Read to gain first aid experience.'),
 Pistol:item('Rook 9mm','rifle','Firearm','Use to unlock/equip the pistol.',1),Shotgun:item('Homestead 12G','rifle','Firearm','Use to unlock/equip the shotgun.',3),HuntingRifle:item('Ranger .308','rifle','Firearm','Use to unlock/equip the hunting rifle.',3),SMG:item('Wasp SMG','rifle','Firearm','Use to unlock/equip the SMG.',2),
 RepairKit:item('Vehicle repair kit','axe','Utility','Use beside a vehicle to repair its condition.',1),EnergyBar:item('Energy bar','food','Food','Restores 20 food and 35 stamina.'),Painkillers:item('Painkillers','bandage','Medical','Restores 15 health.'),Stew:item('Hearty stew','food','Food','Restores 60 food, 15 hydration and 35 stamina.',.5)
};
export type SupplyKind=keyof typeof SUPPLIES;
export const SKILLS={carpentry:'Carpentry',mechanics:'Mechanics',cooking:'Cooking',firstaid:'First aid',shooting:'Marksmanship',scavenging:'Scavenging'};
export type Skill=keyof typeof SKILLS;
export type BuildKind='floor'|'door'|'roof'|'furniture'|'wall'|'bench'|'barrel'|'bed'|'fire'|'lure'|'storage';
export type Recipe={name:string;desc:string;cost:Record<string,number>;tool?:string;skill:Skill;level:number;output?:string;amount?:number;build?:BuildKind;station?:BuildKind;durability?:number};
export const RECIPES:Record<string,Recipe>={
 handsaw:{name:'Hand saw',desc:'Fit a salvaged toothed blade to a wooden handle. Reusable for trees and timber.',cost:{Scrap:3,Plank:1,Tape:1},skill:'carpentry',level:0,output:'Saw'},
 crowbar:{name:'Crowbar',desc:'Shape a salvaged steel bar into a pry tool and melee weapon.',cost:{Scrap:4,Cloth:1},tool:'Hammer',skill:'mechanics',level:0,output:'Crowbar'},
 hammer:{name:'Improvised claw hammer',desc:'Secure a salvaged metal head to a short wooden handle. Starts your construction toolkit.',cost:{Scrap:2,Plank:1,Tape:1},skill:'carpentry',level:0,output:'Hammer'},
 axe:{name:'Woodcutting axe',desc:'Mount a scrap steel cutting head onto a reinforced handle.',cost:{Scrap:4,Plank:2,Tape:2},tool:'Hammer',skill:'carpentry',level:1,output:'Axe'},
 wrench:{name:'Salvaged wrench',desc:'Rebuild a wrench from metal parts for vehicle maintenance.',cost:{Scrap:3,Tape:1},tool:'Hammer',skill:'mechanics',level:0,output:'Wrench'},
 fishingrod:{name:'Fishing rod',desc:'Assemble a pole with cloth cord and a scrap hook for bank fishing.',cost:{Plank:1,Cloth:3,Scrap:1},skill:'carpentry',level:0,output:'FishingRod'},
 nails:{name:'Salvaged nails',desc:'Straighten reusable fasteners from scrap metal. Makes one box.',cost:{Scrap:2},tool:'Hammer',skill:'carpentry',level:0,output:'Nails'},

 reinforced:{name:'Reinforced timber wall',desc:'Scrap braces make a much stronger defensive wall.',cost:{Plank:3,Nails:2,Scrap:4},tool:'Hammer',skill:'carpentry',level:2,build:'wall',durability:420},
 rebuildbattery:{name:'Rebuild car battery',desc:'Restore a usable battery from salvaged electronics at a workbench.',cost:{Scrap:4,Electronics:3,Tape:2},tool:'Wrench',skill:'mechanics',level:2,station:'bench',output:'Battery'},

 storage:{name:'Storage chest',desc:'Store up to 100 kg of supplies. Click to take or deposit items.',cost:{Plank:3,Nails:2},tool:'Hammer',skill:'carpentry',level:0,build:'storage'},
 sawlogs:{name:'Saw timber',desc:'Turn harvested timber into four useful planks.',cost:{Log:1},tool:'Saw',skill:'carpentry',level:0,output:'Plank',amount:4},
 grilledfish:{name:'Grill fresh fish',desc:'Cook fish safely over charcoal.',cost:{FreshFish:1,Charcoal:1},skill:'cooking',level:0,station:'fire',output:'CookedFish'},
 preserve:{name:'Preserve vegetables',desc:'Make shelf-stable provisions for longer expeditions.',cost:{Carrots:2,Water:1,Charcoal:1},skill:'cooking',level:1,station:'fire',output:'PreservedFood',amount:2},
 batrepair:{name:'Melee repair wrap',desc:'Reinforce the grip of your crowbar or bat. Use this wrap from inventory. Requires a workbench.',cost:{Plank:1,Tape:1},skill:'carpentry',level:1,station:'bench',output:'BatRepair'},

 floor:{name:'Timber floor',desc:'A walkable 2 × 2 foundation tile. Snap tiles together to lay out your base.',cost:{Plank:2,Nails:1},tool:'Hammer',skill:'carpentry',level:0,build:'floor'},
 door:{name:'Wooden doorway',desc:'A full-height wall opening with a hinged door. Press E nearby to open or close it.',cost:{Plank:3,Nails:1,Scrap:1},tool:'Hammer',skill:'carpentry',level:0,build:'door'},
 roof:{name:'Roof panel',desc:'Cover a foundation tile. Panels hide when you stand underneath your base roof.',cost:{Plank:2,Nails:1},tool:'Hammer',skill:'carpentry',level:0,build:'roof'},
 bandage:{name:'Cloth bandage',desc:'Turn spare cloth into dressings.',cost:{Cloth:2},skill:'firstaid',level:0,output:'Bandage'},
 fuel:{name:'Charcoal bundle',desc:'Prepare wood for a cooking fire.',cost:{Plank:1},skill:'cooking',level:0,output:'Charcoal',amount:3},
 repair:{name:'Vehicle repair kit',desc:'Restore a battered vehicle. Requires a workbench.',cost:{Scrap:3,Tape:1},tool:'Wrench',skill:'mechanics',level:1,station:'bench',output:'RepairKit'},
 stew:{name:'Hearty stew',desc:'Cook a filling meal at a campfire.',cost:{Beans:1,Carrots:1,Water:1,Charcoal:1},skill:'cooking',level:0,station:'fire',output:'Stew'},
 wall:{name:'Timber wall',desc:'A two-metre wall that snaps to foundation edges. Blocks movement and sight; zombies can damage it.',cost:{Plank:3,Nails:1},tool:'Hammer',skill:'carpentry',level:0,build:'wall'},
 bench:{name:'Workbench',desc:'Enables repair kits and advanced devices nearby.',cost:{Plank:4,Nails:2},tool:'Hammer',skill:'carpentry',level:0,build:'bench'},
 bed:{name:'Bedroll',desc:'Use with E to recover health and stamina. Time still passes.',cost:{Cloth:4,Tape:1},skill:'carpentry',level:0,build:'bed'},
 fire:{name:'Cooking fire',desc:'Outdoor cooking station. Keep a stock of charcoal.',cost:{Scrap:2,Plank:2},skill:'cooking',level:0,build:'fire'},
 barrel:{name:'Water collector',desc:'Collects rainwater. Right-click to collect a bottle.',cost:{Plank:4,Scrap:2,Tape:1},tool:'Hammer',skill:'carpentry',level:1,build:'barrel'},
 lure:{name:'Noise lure',desc:'Use E to draw nearby zombies away for 20 seconds.',cost:{Electronics:2,Scrap:1,Tape:1},skill:'mechanics',level:1,station:'bench',build:'lure'}
};
