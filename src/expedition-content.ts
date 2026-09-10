const supply=(name:string,icon:string,category:string,desc:string,weight=.3,w=1,h=1)=>({name,icon,category,desc,weight,w,h});
export const EXPEDITION_ITEMS={
 helmet:supply('Combat helmet','helmet','Armor','Use to equip a protective helmet.',1.4,2,2),kevlar:supply('Kevlar vest','kevlar','Armor','Use to equip a protective vest.',3,2,3),
 Carbine:supply('M6 Carbine','rifle','Firearm','Equip a recovered carbine.',3,3,1),
 PistolAmmo:supply('9mm rounds','Ammo','Ammunition','For the Rook pistol and Wasp SMG.',.02),
 Shells:supply('12 gauge shells','Ammo','Ammunition','For the Homestead shotgun.',.045),
 RifleAmmo:supply('.308 rounds','Ammo','Ammunition','For the Ranger hunting rifle.',.03),
 Jerrycan:supply('Empty jerrycan','Water','Tool','Right-click a vehicle or gas station to collect fuel.',1,2,2),
 Petrol:supply('Petrol · 1 litre','Water','Fuel','Right-click a car to refuel, or supply an installed generator.',.75),
 Battery:supply('Car battery','Electronics','Vehicle part','Right-click a car to replace a depleted battery.',4,2,2),
 Generator:supply('Portable generator','RepairKit','Utility','Right-click clear ground near home to install. Needs fuel and a field guide.',12,3,3),
 ElectricalGuide:supply('Generator field guide','Manual','Book','Read to learn safe generator installation and gain mechanics XP.',.2),
 Crowbar:supply('Crowbar','Crowbar','Tool','Right-click a locked door to pry it open, or furniture to dismantle it.',1.3,1,3),
 Saw:supply('Hand saw','Saw','Tool','Process fallen timber into planks.',.8,2,1),
 Log:supply('Fallen timber','Plank','Material','Saw into four building planks.',4,1,3),
 Seeds:supply('Vegetable seeds','Carrots','Gardening','Right-click grass to plant a garden. Water it or wait for rain.',.05),
 FishingRod:supply('Fishing rod','Plank','Tool','Right-click water to fish from a safe bank.',.8,1,3),
 FreshFish:supply('Fresh fish','Sandwich','Food','Cook at a fire. Raw fish is unsafe and spoils quickly.',.7),
 CookedFish:supply('Grilled fish','Stew','Food','A filling meal. Best eaten fresh.',.6),
 PreservedFood:supply('Preserved vegetables','Beans','Food','A shelf-stable meal for expeditions.',.4),
 MapNote:supply('Handwritten supply map','Manual','Clue','Read to mark three nearby supply sites on your county map.',.02),
 Berries:supply('Wild blackberries','Apple','Food','A small, safe snack found while foraging.',.1),
 RottenFood:supply('Spoiled food','Beans','Waste','Unfit to eat. Can be composted at a garden.',.2)
};
// Keep art aliases separate from inventory definitions, which normalize icon keys.
export const EXPEDITION_ART=Object.fromEntries(Object.entries(EXPEDITION_ITEMS).map(([key,item])=>[key,item.icon]));
export const AMMO_KIND={carbine:'Ammo',pistol:'PistolAmmo',smg:'PistolAmmo',shotgun:'Shells',hunting:'RifleAmmo'} as const;
export const AMMO_NAMES={Ammo:'5.56mm',PistolAmmo:'9mm',Shells:'12 gauge',RifleAmmo:'.308'};
export const VEHICLE_STORAGE={sports:35,wagon:85,sedan:60,pickup:150,van:180,police:70};
export const VEHICLE_TANK={sports:45,wagon:55,sedan:50,pickup:70,van:75,police:60};
export const ENCOUNTERS=[
 {id:'workshop',name:'Shuttered workshop',hint:'Tools, a generator and a field guide. The side office is alarmed.',locked:true,alarm:true,loot:{Generator:1,ElectricalGuide:1,Wrench:1,Saw:1,Axe:1,RangerJacket:1,Battery:1,Petrol:8,Jerrycan:1,Scrap:6}},
 {id:'survivor',name:'Boarded survivor refuge',hint:'Someone prepared here. Look for preserved food and carpentry tools.',locked:false,alarm:false,loot:{Hammer:1,Crowbar:1,Plank:8,Nails:12,Cloth:6,PreservedFood:4,MapNote:1}},
 {id:'medical',name:'Emergency triage post',hint:'Medical supplies remain, but the waiting room is occupied.',locked:false,alarm:false,loot:{Bandage:6,Painkillers:3,MedicalGuide:1,Water:3,Cloth:6}},
 {id:'ranger',name:'Abandoned ranger shelter',hint:'Outdoor equipment and a hunting rifle. Approach quietly.',locked:true,alarm:false,loot:{HuntingRifle:1,RifleAmmo:16,FishingRod:1,Seeds:4,Saw:1,Water:3}},
 {id:'armory',name:'Police evidence lockup',hint:'Firearms and ammunition behind a locked, alarmed entrance.',locked:true,alarm:true,loot:{Shotgun:1,Pistol:1,Shells:18,PistolAmmo:30,Ammo:24,Bandage:2}},
 {id:'provisions',name:'Evacuation supply depot',hint:'Vehicle supplies and food for a long journey. Expect company.',locked:false,alarm:true,loot:{Jerrycan:1,Petrol:12,Battery:1,RepairKit:2,Beans:6,Water:5,Seeds:3}}
];
