// Theme toggle (dark/white only)
const THEME_KEY = 'helius-theme';
const themeToggle = document.getElementById('themeToggle');
function setTheme(mode){
  document.documentElement.setAttribute('data-theme', mode);
  localStorage.setItem(THEME_KEY, mode);
}
setTheme(localStorage.getItem(THEME_KEY) || 'dark');
themeToggle.addEventListener('click', ()=>{
  setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
});

// Back button
document.getElementById('backBtn').addEventListener('click', ()=>{
  if (history.length > 1) history.back();
  else location.href = 'index.html';
});

// User menu
const userBtn  = document.getElementById('userBtn');
const userMenu = document.getElementById('userMenu');
userBtn.addEventListener('click', (e)=>{
  e.stopPropagation();
  const open = userMenu.classList.toggle('show');
  userBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
});
document.addEventListener('click', ()=> userMenu.classList.remove('show'));

// Build ToC and scrollspy
const headings = Array.from(document.querySelectorAll('.doc h2'));
const tocList = document.getElementById('tocList');
const links = headings.map(h => {
  const id = h.id || h.textContent.toLowerCase().replace(/\s+/g,'-').replace(/[^\w-]/g,'');
  h.id = id;
  const a = document.createElement('a');
  a.href = `#${id}`; a.textContent = h.textContent;
  tocList.appendChild(a);
  return a;
});
const observer = new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      links.forEach(l => l.classList.toggle('active', l.hash === `#${e.target.id}`));
      document.querySelectorAll('.side-nav .nav-item').forEach(n=>{
        n.classList.toggle('is-active', n.getAttribute('href') === `#${e.target.id}`);
      });
    }
  });
},{ rootMargin:'-40% 0px -50% 0px', threshold:0.01 });
headings.forEach(h=>observer.observe(h));

// Self-test modal based on “Core questions”
const openQuizBtn = document.getElementById('openQuizBtn');
const quizModal   = document.getElementById('quizModal');
const quizOverlay = document.getElementById('quizOverlay');
const quizClose   = document.getElementById('quizClose');
const quizCancel  = document.getElementById('quizCancel');
const quizBody    = document.getElementById('quizBody');

function openQuiz(){
  const items = Array.from(document.querySelectorAll('#coreList li')).map(li => li.textContent.trim());
  quizBody.innerHTML = `<ol class="checklist">${items.map(t=>`
      <li><label><input type="checkbox"> ${t}</label></li>`).join('')}
    </ol>
    <p class="muted small">Tick items you can answer out loud. Close to return.</p>`;
  quizModal.classList.add('show');
  quizModal.setAttribute('aria-hidden','false');
}
function closeQuiz(){
  quizModal.classList.remove('show');
  quizModal.setAttribute('aria-hidden','true');
}
openQuizBtn.addEventListener('click', openQuiz);
quizOverlay.addEventListener('click', closeQuiz);
quizClose.addEventListener('click', closeQuiz);
quizCancel.addEventListener('click', closeQuiz);

/* ------- Left menu actions ------- */
const menu = document.getElementById('app-menu');
const pop = document.getElementById('notes-popover');
const notesBtn = menu.querySelector('[data-action="notes"]');
const statusEl = document.getElementById('notes-status');
const noteKey = 'meta-quick-note';

// Open notes popover
notesBtn.addEventListener('click', ()=>{
  const open = pop.getAttribute('aria-hidden') === 'false';
  pop.setAttribute('aria-hidden', open ? 'true' : 'false');
  notesBtn.setAttribute('aria-expanded', open ? 'false' : 'true');
  if(!open){ document.getElementById('notes-text').value = localStorage.getItem(noteKey) || ''; }
});

// Save note
document.getElementById('notes-form').addEventListener('submit', e=>{
  e.preventDefault();
  const v = document.getElementById('notes-text').value.trim();
  localStorage.setItem(noteKey, v);
  statusEl.textContent = 'Saved.';
});

// Close popover
menu.querySelector('[data-close-notes]').addEventListener('click', ()=>{
  pop.setAttribute('aria-hidden','true'); notesBtn.setAttribute('aria-expanded','false');
});
document.addEventListener('keydown', e=>{
  if(e.key === 'Escape'){ pop.setAttribute('aria-hidden','true'); notesBtn.setAttribute('aria-expanded','false'); }
});
document.addEventListener('click', e=>{
  if(!pop.contains(e.target) && !notesBtn.contains(e.target)){
    pop.setAttribute('aria-hidden','true'); notesBtn.setAttribute('aria-expanded','false');
  }
});

// Navigation + utilities
menu.addEventListener('click', e=>{
  const btn = e.target.closest('.menu-item'); if(!btn) return;
  const act = btn.dataset.action;

  if(act === 'home'){ location.href = 'home.html'; }
  if(act === 'user'){ location.href = 'start.html#profile'; }
  if(act === 'settings'){ document.getElementById('themeToggle')?.click(); }
  if(act === 'analytics'){ location.hash = '#relations'; }
  if(act === 'add-friend'){ alert('Friend system: integrate backend here.'); }
  if(act === 'logout'){
    localStorage.removeItem('helius-onboarded');
    // optionally clear other keys
    location.href = 'start.html';
  }
});
(function(){
  const menu=document.getElementById('app-menu'); if(!menu) return;
  const notesBtn=menu.querySelector('[data-action="notes"]');
  const pop=document.getElementById('notes-popover');
  const form=document.getElementById('notes-form');
  const text=document.getElementById('notes-text');
  const status=document.getElementById('notes-status');

  const routes={
    user:()=>location.href='start.html',
    home:()=>location.href='home.html',
    analytics:()=>location.href='#core-qs',
    'add-friend':()=>alert('Invite dialog hook'),
    settings:()=>location.href='home.html#settings',
    logout:()=>{localStorage.removeItem('helius-onboarded');location.href='start.html';}
  };

  menu.addEventListener('click',e=>{
    const b=e.target.closest('.menu-item'); if(!b) return;
    const a=b.dataset.action;
    if(a==='notes') return toggleNotes(b);
    routes[a]?.();
  });

  function toggleNotes(anchor){
    const open=notesBtn.getAttribute('aria-expanded')==='true';
    if(open) return closeNotes();
    const r=anchor.getBoundingClientRect();
    pop.style.left=Math.round(r.right+12)+'px';
    pop.style.top=Math.round(r.top)+'px';
    notesBtn.setAttribute('aria-expanded','true');
    pop.setAttribute('aria-hidden','false');
    text.value=localStorage.getItem('helius-quick-note')||'';
    text.focus();
  }
  function closeNotes(){
    notesBtn.setAttribute('aria-expanded','false');
    pop.setAttribute('aria-hidden','true');
  }
  pop.querySelector('[data-close-notes]').addEventListener('click',closeNotes);
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeNotes(); });

  form.addEventListener('submit',e=>{
    e.preventDefault();
    localStorage.setItem('helius-quick-note',text.value.trim());
    status.textContent='Saved.'; setTimeout(()=>{status.textContent='';closeNotes();},600);
  });
})();
