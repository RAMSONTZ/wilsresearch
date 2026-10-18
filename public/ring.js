(()=>{'use strict';
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
const rings=[...document.querySelectorAll('[data-ring]')];
for(const root of rings){
 const track=root.querySelector('.ring-track'),slides=[...root.querySelectorAll('.ring-slide')],dots=[...root.querySelectorAll('.ring-pip')],title=root.querySelector('.ring-current-title');
 if(!track||!slides.length)continue;
 const n=slides.length;let position=0,target=null,raf=0,drag=null,timer=0,wheelAnchor=null,old=-1,wheelAccum=0;
 const wrap=i=>((i%n)+n)%n;
 function dist(i,p){let v=wrap(i-wrap(p));if(v>n/2)v-=n;return v;}
 function current(){return wrap(Math.round(position));}
 function paint(){let w=track.clientWidth,h=track.clientHeight;
  slides.forEach((el,i)=>{const d=dist(i,position),ad=Math.abs(d);
   if(ad>1.6){el.style.visibility='hidden';el.style.opacity='0';el.style.pointerEvents='none';return;}
   // Content follows a circular arc. Never rotate the slide or its photographs.
   const a=Math.min(ad,1.7)*1.18;
   const x=Math.sin(a)*Math.sign(d)*w*.78;
   const y=0; // Keep every chapter anchored at the same vertical baseline; only slide horizontally.
   const scale=1-Math.min(.25,ad*.20);
   el.style.transform=`translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${scale.toFixed(4)})`;
   el.style.opacity=String(Math.max(0,1-ad*.8));el.style.visibility='visible';el.style.zIndex=String(90-Math.round(ad*25));el.style.pointerEvents=ad<.28?'auto':'none';
  });
  let active=current();if(active!==old){old=active;
    slides.forEach((el,i)=>{const yes=i===active;el.classList.toggle('active',yes);el.setAttribute('aria-hidden',yes?'false':'true');el.inert=!yes;
      if(Math.abs(dist(i,position))<1.5)el.querySelectorAll('img[loading="lazy"]').forEach(im=>{im.loading='eager';});
    });
    dots.forEach((d,i)=>d.setAttribute('aria-current',String(i===active)));
    if(title)title.textContent=slides[active].querySelector('.eyebrow')?.textContent||'WILS Research';
    if(root.dataset.ring==='home' && location.hash.slice(1)!==slides[active].id)history.replaceState(null,'','#'+slides[active].id);
  }
 }
 function tick(){if(target===null){raf=0;return;}let diff=target-position;if(reduce.matches||Math.abs(diff)<.006){position=target;target=null;paint();raf=0;return;}position+=diff*.20;paint();raf=requestAnimationFrame(tick);}
 function animate(x){target=x;if(!raf)raf=requestAnimationFrame(tick);}
 function shift(step){if(drag)return;animate(Math.round(target??position)+step);}
 function to(i){const dd=dist(i,position);animate(position+dd);}
 root.querySelector('.ring-prev')?.addEventListener('click',()=>shift(-1));root.querySelector('.ring-next')?.addEventListener('click',()=>shift(1));
 dots.forEach(d=>d.addEventListener('click',()=>to(+d.dataset.go)));
 if(root.dataset.ring==='home'){let id=decodeURIComponent(location.hash.slice(1)),hit=slides.findIndex(s=>s.id===id);if(hit>=0)position=hit;}
 if(root.dataset.ring==='services'){const t=new URLSearchParams(location.search).get('topic');const idx=slides.findIndex(s=>s.id===t);if(idx>=0)position=idx;}
 function interrupt(){if(target!==null){position+=(target-position)*.2;target=null;cancelAnimationFrame(raf);raf=0;}}
 function settle(){wheelAnchor=null;wheelAccum=0;animate(Math.round(position));}
 // Wheel is captured only in the full-screen story or when the pointer is within service/guide carousel.
 let lastWheelAt=0,wheelDirection=0,wheelEventAccum=0;
 track.addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey)return;
  if(root.dataset.ring!=='home' && e.target.closest('a,button,input,textarea,select'))return;
  e.preventDefault();if(drag)return;
  const d=e.deltaMode===1?e.deltaY*17:e.deltaMode===2?e.deltaY*track.clientHeight:e.deltaY;
  if(Math.abs(d)<1)return;
  const sign=Math.sign(d),now=performance.now();
  if(sign!==wheelDirection){wheelDirection=sign;wheelEventAccum=0;}
  wheelEventAccum+=Math.abs(d);
  if(now-lastWheelAt<580 || wheelEventAccum<28)return;
  wheelEventAccum=0;lastWheelAt=now;shift(sign);
 },{passive:false});
 track.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;if(e.target.closest('a,button,input,textarea,select'))return;
  interrupt();drag={id:e.pointerId,x:e.clientX,y:e.clientY,start:position};root.classList.add('dragging');try{track.setPointerCapture(e.pointerId);}catch{}});
 track.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y,vertical=Math.abs(dy)>=Math.abs(dx)*.85;
  const pixels=vertical?-dy:-dx,size=vertical?track.clientHeight*.62:track.clientWidth*.62;
  position=drag.start+Math.max(-1.12,Math.min(1.12,pixels/Math.max(size,180)));paint();if(e.cancelable)e.preventDefault();});
 function end(e){if(!drag||e.pointerId!==drag.id)return;const dd=position-drag.start;let next=Math.abs(dd)>.21?Math.round(drag.start)+Math.sign(dd):Math.round(drag.start);drag=null;root.classList.remove('dragging');animate(next);}
 track.addEventListener('pointerup',end);track.addEventListener('pointercancel',end);
 track.addEventListener('keydown',e=>{if(['ArrowRight','ArrowDown','PageDown'].includes(e.key)){e.preventDefault();shift(1);}if(['ArrowLeft','ArrowUp','PageUp'].includes(e.key)){e.preventDefault();shift(-1);}if(e.key==='Home'){e.preventDefault();to(0);}});
 window.addEventListener('resize',paint);
 if(root.dataset.ring==='home')window.addEventListener('hashchange',()=>{const idx=slides.findIndex(s=>s.id===location.hash.slice(1));if(idx>=0)to(idx);});
 paint();
}
})();