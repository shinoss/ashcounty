export type ActivityKind='refuel'|'cook'|'chop'|'saw'|'hammer'|'repair'|'gather'|'fish'|'carry'|'rest'|'drink';
export type ActivityPose={kind:ActivityKind;elapsed:number;duration:number};
export function activityFor(label:string):ActivityKind{
 if(/Refuelling|Siphoning|jerrycan/.test(label))return 'refuel';
 if(/Cooking|Grill|stew|Preserv/.test(label))return 'cook';
 if(/Chopping/.test(label))return 'chop';
 if(/Sawing|timber/.test(label))return 'saw';
 if(/Building|Reinforcing|barricade|boards/.test(label))return 'hammer';
 if(/Resting/.test(label))return 'rest';
 if(/Fishing/.test(label))return 'fish';
 if(/Drinking|bottle/.test(label))return 'drink';
 if(/Packing|Picking|Placing/.test(label))return 'carry';
 if(/Refitting|Repair|battery|generator|Dismantling|Salvaging|Prying/.test(label))return 'repair';
 return 'gather';
}
