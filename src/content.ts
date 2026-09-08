export const GUNS={
 carbine:{name:'M6 Carbine',capacity:12,damage:70,cadence:.16,noise:26,pellets:1,spread:.035,desc:'Fast automatic fire; versatile at medium range.'},
 pistol:{name:'Rook 9mm',capacity:15,damage:48,cadence:.32,noise:16,pellets:1,spread:.025,desc:'Quietest firearm; accurate, measured shots.'},
 shotgun:{name:'Homestead 12G',capacity:5,damage:32,cadence:.85,noise:38,pellets:7,spread:.20,desc:'Seven-pellet spread; devastating up close, very loud.'},
 hunting:{name:'Ranger .308',capacity:4,damage:150,cadence:1.1,noise:32,pellets:1,spread:.008,desc:'Slow, precise shots with exceptional stopping power.'},
 smg:{name:'Wasp SMG',capacity:24,damage:38,cadence:.085,noise:30,pellets:1,spread:.075,desc:'High fire rate; burns ammunition quickly.'}
};
export type GunKind=keyof typeof GUNS;
export const VEHICLES={wagon:{name:'Station wagon',speed:15,accel:9,steer:2.1},sedan:{name:'Sedan',speed:18,accel:10,steer:2.3},pickup:{name:'Pickup truck',speed:14,accel:8,steer:1.9},van:{name:'Delivery van',speed:12,accel:6,steer:1.6},police:{name:'Police cruiser',speed:21,accel:12,steer:2.4}};
export type VehicleKind=keyof typeof VEHICLES;
const item=(name:string,icon:string,category:string,desc:string,weight=.2)=>({name,icon,category,desc,weight,w:1,h:1});
export const SUPPLIES={
 Nails:item('Box of nails','ammo','Material','Fasteners for carpentry.'),Scrap:item('Scrap metal','wood','Material','Repair parts and reinforced structures.',.6),Cloth:item('Cloth strips','bandage','Material','Bandages, bedding and filters.'),Tape:item('Duct tape','bandage','Material','Useful for repairs and improvised gear.'),Electronics:item('Electronic parts','compass','Material','Components for sound lures.'),Charcoal:item('Charcoal','food','Material','Fuel for cooking.'),
 Hammer:item('Claw hammer','axe','Tool','Reusable tool required for construction.',.7),Wrench:item('Wrench','axe','Tool','Reusable tool for vehicle repairs.',.6),Manual:item('Workshop handbook','book','Book','Read to gain carpentry experience.'),MedicalGuide:item('First aid guide','book','Book','Read to gain first aid experience.'),
 Pistol:item('Rook 9mm','rifle','Firearm','Use to unlock/equip the pistol.',1),Shotgun:item('Homestead 12G','rifle','Firearm','Use to unlock/equip the shotgun.',3),HuntingRifle:item('Ranger .308','rifle','Firearm','Use to unlock/equip the hunting rifle.',3),SMG:item('Wasp SMG','rifle','Firearm','Use to unlock/equip the SMG.',2),
 RepairKit:item('Vehicle repair kit','axe','Utility','Use beside a vehicle to repair its condition.',1),EnergyBar:item('Energy bar','food','Food','Restores 20 food and 35 stamina.'),Painkillers:item('Painkillers','bandage','Medical','Restores 15 health.'),Stew:item('Hearty stew','food','Food','Restores 60 food, 15 hydration and 35 stamina.',.5)
};
export type SupplyKind=keyof typeof SUPPLIES;
export const SKILLS={carpentry:'Carpentry',mechanics:'Mechanics',cooking:'Cooking',firstaid:'First aid',shooting:'Marksmanship',scavenging:'Scavenging'};
export type Skill=keyof typeof SKILLS;
export type BuildKind='wall'|'bench'|'barrel'|'bed'|'fire'|'lure';
export type Recipe={name:string;desc:string;cost:Record<string,number>;tool?:string;skill:Skill;level:number;output?:string;amount?:number;build?:BuildKind;station?:BuildKind};
export const RECIPES:Record<string,Recipe>={
 bandage:{name:'Cloth bandage',desc:'Turn spare cloth into dressings.',cost:{Cloth:2},skill:'firstaid',level:0,output:'Bandage'},
 fuel:{name:'Charcoal bundle',desc:'Prepare wood for a cooking fire.',cost:{Plank:1},skill:'cooking',level:0,output:'Charcoal',amount:3},
 repair:{name:'Vehicle repair kit',desc:'Restore a battered vehicle. Requires a workbench.',cost:{Scrap:3,Tape:1},tool:'Wrench',skill:'mechanics',level:0,station:'bench',output:'RepairKit'},
 stew:{name:'Hearty stew',desc:'Cook a filling meal at a campfire.',cost:{Beans:1,Carrots:1,Water:1,Charcoal:1},skill:'cooking',level:0,station:'fire',output:'Stew'},
 wall:{name:'Wooden barricade',desc:'A solid barrier. Zombies can break it down.',cost:{Plank:3,Nails:1},tool:'Hammer',skill:'carpentry',level:0,build:'wall'},
 bench:{name:'Workbench',desc:'Enables repair kits and advanced devices nearby.',cost:{Plank:4,Nails:2},tool:'Hammer',skill:'carpentry',level:0,build:'bench'},
 bed:{name:'Bedroll',desc:'Use with E to recover health and stamina. Time still passes.',cost:{Cloth:4,Tape:1},skill:'carpentry',level:0,build:'bed'},
 fire:{name:'Cooking fire',desc:'Outdoor cooking station. Keep a stock of charcoal.',cost:{Scrap:2,Plank:2},skill:'cooking',level:0,build:'fire'},
 barrel:{name:'Water collector',desc:'Collects one bottle every two minutes; use E to take it.',cost:{Plank:4,Scrap:2,Tape:1},tool:'Hammer',skill:'carpentry',level:1,build:'barrel'},
 lure:{name:'Noise lure',desc:'Use E to draw nearby zombies away for 20 seconds.',cost:{Electronics:2,Scrap:1,Tape:1},skill:'mechanics',level:1,station:'bench',build:'lure'}
};
