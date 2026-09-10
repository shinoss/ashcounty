import type {Simulation} from './sim';
import {ActionQueue,actionsFor,targetExists,type ActionTarget,type WorldAction} from './world-actions';
import {ITEM_INFO} from './inventory';
export class ObjectMenu{
 menu=document.createElement('div');progress=document.createElement('div');dialog=document.createElement('dialog');target:ActionTarget|undefined;wasPaused=false;actions:ActionQueue;lastRefresh=0;selected='';
 constructor(public s:Simulation,public clearInput:()=>void){
  this.actions=new ActionQueue(s);this.menu.className='object-menu world-context';this.menu.hidden=true;this.menu.setAttribute('role','menu');this.menu.setAttribute('aria-label','Object actions');
  this.progress.className='pickup-progress';this.progress.hidden=true;this.progress.innerHTML='<span></span><progress max="1" value="0" aria-label="Action progress"></progress>';
  this.dialog.className='object-notice';this.dialog.setAttribute('aria-label','Inventory full');this.dialog.innerHTML='<h3>No more inventory space</h3><p></p><button>OK</button>';
  document.body.append(this.menu,this.progress,this.dialog);
  this.menu.addEventListener('pointerdown',e=>e.stopPropagation());this.menu.addEventListener('contextmenu',e=>e.preventDefault());
  this.menu.addEventListener('keydown',e=>{const buttons=Array.from(this.menu.querySelectorAll<HTMLButtonElement>('button'));let i=buttons.indexOf(document.activeElement as HTMLButtonElement);if(['ArrowUp','ArrowDown','Home','End','Escape','Enter',' '].includes(e.key)){e.stopPropagation();if(e.key==='Enter'||e.key===' ')return;e.preventDefault();if(e.key==='Escape'){this.close();return;}i=e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;buttons[i]?.focus();}});
  window.addEventListener('pointerdown',()=>this.close());window.addEventListener('resize',()=>this.close());
  this.dialog.querySelector('button')!.onclick=()=>this.dismiss();this.dialog.addEventListener('cancel',e=>{e.preventDefault();this.dismiss();});
 }
 get blocking(){return this.dialog.open;}
 open(t:ActionTarget,x:number,y:number){
  const options=actionsFor(this.s,t);if(!options.length)return false;
  this.clearInput();this.actions.cancel();this.target=t;this.selected='';this.menu.replaceChildren();
  const title=document.createElement('strong');title.className='context-title';title.textContent=t.label;this.menu.append(title);
  const list=document.createElement('div');list.className='context-rows';this.menu.append(list);
  for(const a of options){const b=document.createElement('button');b.dataset.action=a.id;b.textContent=a.label;b.setAttribute('role','menuitem');this.availability(b,a);b.onmouseenter=b.onfocus=()=>{this.selected=a.id;this.detail(actionsFor(this.s,t).find(o=>o.id===a.id)||a);};b.onclick=()=>{const now=actionsFor(this.s,t).find(o=>o.id===a.id);if(!now||now.reason){if(now){this.detail(now);if(now.id==='pickup'&&now.reason?.startsWith('Not enough backpack'))this.s.survival.noSpace();}return;}this.close();this.clearInput();this.actions.start(t,a.id);};list.append(b);}
  const detail=document.createElement('div');detail.className='context-detail';detail.setAttribute('role','status');this.menu.append(detail);this.detail(options[0]);
  this.menu.hidden=false;this.menu.style.left=Math.max(8,Math.min(x,innerWidth-this.menu.offsetWidth-8))+'px';this.menu.style.top=Math.max(8,Math.min(y,innerHeight-this.menu.offsetHeight-8))+'px';this.lastRefresh=0;return true;
 }
 availability(button:HTMLButtonElement,a:WorldAction){button.setAttribute('aria-disabled',String(!!a.reason));}
 detail(a:WorldAction){const el=this.menu.querySelector('.context-detail');if(!el)return;el.replaceChildren();const desc=document.createElement('p');desc.textContent=a.description+(a.seconds?' · '+a.seconds+' sec':'');el.append(desc);
  for(const [key,n]of Object.entries({...a.tools,...a.cost})){const row=document.createElement('div'),have=this.s.life.quantity(key);row.className=have>=n?'context-have':'context-missing';row.textContent=`${have>=n?'✓':'×'} ${ITEM_INFO[key]?.name||key}  ${have} / ${n}${a.tools?.[key]?' · kept':''}`;el.append(row);}
  if(a.reason){const reason=document.createElement('p');reason.className='context-missing';reason.textContent=a.reason;el.append(reason);}
 }
 close(){if(this.menu.contains(document.activeElement)){const canvas=document.querySelector<HTMLCanvasElement>('#game canvas');if(canvas){canvas.tabIndex=-1;canvas.focus({preventScroll:true});}}this.menu.hidden=true;this.target=undefined;}
 dismiss(){this.dialog.close();this.s.paused=this.wasPaused;this.clearInput();}
 update(){
  if(this.s.paused||this.s.dead||this.s.player.moving||this.target&&!targetExists(this.s,this.target))this.close();
  if(this.target&&this.s.elapsed>this.lastRefresh){this.lastRefresh=this.s.elapsed+.2;const options=actionsFor(this.s,this.target);for(const b of Array.from(this.menu.querySelectorAll<HTMLButtonElement>('[data-action]'))){const a=options.find(a=>a.id===b.dataset.action);if(a){b.textContent=a.label;this.availability(b,a);}else b.setAttribute('aria-disabled','true');}const active=options.find(a=>a.id===this.selected)||options[0];if(active)this.detail(active);}
  const job=this.s.survival.pickupJob||this.s.life.job,walking=this.actions.pending;this.progress.hidden=(!job&&!walking)||this.s.dead;
  if(job){this.progress.querySelector('span')!.textContent='target' in job?'Picking up '+job.target.label:job.label;this.progress.querySelector('progress')!.value=Math.min(1,job.elapsed/job.duration);}
  else if(walking){this.progress.querySelector('span')!.textContent='Walking to '+walking.target.label;this.progress.querySelector('progress')!.removeAttribute('value');}
  if(this.s.survival.notice&&!this.dialog.open){this.close();this.actions.cancel();this.clearInput();this.wasPaused=this.s.paused;this.s.paused=true;this.dialog.querySelector('p')!.textContent=this.s.survival.notice;this.s.survival.notice='';this.dialog.showModal();this.dialog.querySelector('button')!.focus();}
 }
}
