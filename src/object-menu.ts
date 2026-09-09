import type {Simulation} from './sim';
import type {PickupTarget} from './survival';
export class ObjectMenu{
 menu=document.createElement('div');progress=document.createElement('div');dialog=document.createElement('dialog');target:PickupTarget|undefined;wasPaused=false;
 constructor(public s:Simulation,public clearInput:()=>void){
  this.menu.className='object-menu';this.menu.hidden=true;this.menu.setAttribute('role','menu');
  this.progress.className='pickup-progress';this.progress.hidden=true;this.progress.innerHTML='<span></span><progress max="1" value="0" aria-label="Picking up furniture"></progress>';
  this.dialog.className='object-notice';this.dialog.setAttribute('aria-label','Inventory full');this.dialog.innerHTML='<h3>No more inventory space</h3><p></p><button>OK</button>';
  document.body.append(this.menu,this.progress,this.dialog);
  this.menu.addEventListener('pointerdown',e=>e.stopPropagation());this.menu.addEventListener('contextmenu',e=>e.preventDefault());
  window.addEventListener('pointerdown',()=>this.close());window.addEventListener('resize',()=>this.close());
  this.dialog.querySelector('button')!.onclick=()=>this.dismiss();this.dialog.addEventListener('cancel',e=>{e.preventDefault();this.dismiss();});
 }
 get blocking(){return this.dialog.open;}
 open(t:PickupTarget,x:number,y:number){this.clearInput();this.target=t;this.menu.replaceChildren();const title=document.createElement('strong');title.textContent=t.label;const button=document.createElement('button');button.textContent='Pick up';button.setAttribute('role','menuitem');const reason=this.s.survival.pickupReason(t);button.disabled=!!reason;button.title=reason||'Pack into inventory';button.onclick=()=>{this.close();this.clearInput();this.s.survival.beginPickup(t);};this.menu.append(title,button);if(reason){const detail=document.createElement('small');detail.textContent=reason;this.menu.append(detail);}this.menu.hidden=false;this.menu.style.left=Math.max(8,Math.min(x,innerWidth-244))+'px';this.menu.style.top=Math.max(8,Math.min(y,innerHeight-this.menu.offsetHeight-8))+'px';}
 close(){this.menu.hidden=true;this.target=undefined;}
 dismiss(){this.dialog.close();this.s.paused=this.wasPaused;this.clearInput();}
 update(){
  if(this.s.paused||this.s.dead||this.s.player.moving)this.close();
  const job=this.s.survival.pickupJob;this.progress.hidden=!job||this.s.dead;if(job){this.progress.querySelector('span')!.textContent='Picking up '+job.target.label;this.progress.querySelector('progress')!.value=Math.min(1,job.elapsed/job.duration);}
  if(this.s.survival.notice&&!this.dialog.open){this.close();this.clearInput();this.wasPaused=this.s.paused;this.s.paused=true;this.dialog.querySelector('p')!.textContent=this.s.survival.notice;this.s.survival.notice='';this.dialog.showModal();this.dialog.querySelector('button')!.focus();}
 }
}
