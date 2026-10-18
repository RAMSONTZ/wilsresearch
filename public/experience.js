/* Global theme + accessible, working on-page service search. No external dependencies. */
(() => { 'use strict';
  const root = document.documentElement;
  let saved;try{saved=localStorage.getItem('wils-theme')}catch{}
  const systemTheme=window.matchMedia('(prefers-color-scheme: dark)');
  let theme=(saved==='dark'||saved==='light')?saved:(systemTheme.matches?'dark':'light');
  systemTheme.addEventListener?.('change', event=>{try{if(localStorage.getItem('wils-theme'))return;}catch{} theme=event.matches?'dark':'light';apply();});
  const buttons=[...document.querySelectorAll('.theme-toggle')];
  function apply(){root.dataset.theme=theme;buttons.forEach(b=>{b.textContent='◐';b.setAttribute('aria-label',theme==='dark'?'Switch to light theme':'Switch to dark theme');b.title=theme==='dark'?'Switch to light theme':'Switch to dark theme'});const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=theme==='dark'?'#0d1713':'#fcfdfa';}
  apply();buttons.forEach(b=>b.addEventListener('click',()=>{theme=theme==='dark'?'light':'dark';try{localStorage.setItem('wils-theme',theme)}catch{}apply()}));
  const panel=document.getElementById('siteSearchPanel'),input=document.getElementById('siteSearchInput'),results=document.getElementById('siteSearchResults'),toggle=document.querySelector('.site-search-toggle'),close=document.querySelector('.site-search-close');
  if(!panel||!input||!results||!toggle)return;
  const records=[['Research proposals','/services/?topic=proposals','Study design, sample size, methodology'],['SPSS & statistical analysis','/services/?topic=spss','Analysis plan, regression, results'],['Microsoft Excel','/services/?topic=excel','Data entry, cleaning, charts'],['Stata & epidemiology','/services/?topic=stata','Modelling, research statistics'],['Python & R','/services/?topic=python','Reproducible data analysis'],['Scientific writing','/services/?topic=writing','Editing, results and discussion'],['PowerPoint & defence','/services/?topic=presentations','Presentations, research defence'],['CV & professional writing','/services/?topic=careers','CV, cover letters, applications'],['Business plans','/services/?topic=business','Plans, budgets, reports'],['Book a service','/book/','Send a research enquiry'],['Talk to WILS','/contact/','WhatsApp, call, SMS, email']];
  function render(){let q=input.value.toLowerCase().trim();let selected=q?records.filter(item=>item.join(' ').toLowerCase().includes(q)):records.slice(0,6);results.replaceChildren();selected.forEach(([name,url,description])=>{let a=document.createElement('a');a.href=url;a.setAttribute('role','listitem');let b=document.createElement('strong');b.textContent=name;let t=document.createElement('span');t.textContent=description;a.append(b,t);results.append(a)});if(!selected.length){let m=document.createElement('p');m.textContent='No matching service. You can send a general enquiry through Contact.';results.append(m)}}
  function hide(){panel.hidden=true;toggle.setAttribute('aria-expanded','false');}
  toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','siteSearchPanel');toggle.addEventListener('click',()=>{panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden){render();input.focus();}});
  close?.addEventListener('click',hide);input.addEventListener('input',render);document.addEventListener('keydown',e=>{if(e.key==='Escape')hide()});document.addEventListener('pointerdown',e=>{if(!panel.hidden&&!panel.contains(e.target)&&!toggle.contains(e.target))hide()});
})();
