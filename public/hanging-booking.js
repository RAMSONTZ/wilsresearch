(()=>{'use strict';const el=document.querySelector('.booking-hang');if(!el)return;let start=null;
el.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;start={y:e.clientY,id:e.pointerId};});
el.addEventListener('pointerup',e=>{if(!start||e.pointerId!==start.id)return;const moved=e.clientY-start.y;start=null;if(moved>22){e.preventDefault();window.location.assign('/book/')}});
el.addEventListener('pointercancel',()=>{start=null});})();
