// Theme bootstrap from onboarding preference
const THEME_KEY = 'helius-theme';
(function initTheme(){
  const mode = localStorage.getItem(THEME_KEY) || 'dark';
  document.documentElement.setAttribute('data-theme',
    mode === 'auto' ? ((h=> (h>=19||h<7)?'dark':'light')(new Date().getHours())) : mode);
})();

// Pull onboarding data
const profile   = JSON.parse(localStorage.getItem('helius-profile') || '{}');
const topicsLS  = JSON.parse(localStorage.getItem('helius-topics') || 'null');

// Default topics if none stored
const ALL_TOPICS = topicsLS && topicsLS.length ? topicsLS : [
  'Economics','Technology','Geopolitics','Health & Science','Climate & Energy','Law & Policy','Education','Finance'
];

// User column render
document.getElementById('userName').textContent = profile.fullName || 'User';
document.getElementById('userStatus').textContent =
  (profile.age ? `Age ${profile.age}` : '') + (profile.status ? ` · ${profile.status}` : '');

const autoTheme = document.getElementById('autoTheme');
autoTheme.checked = (localStorage.getItem(THEME_KEY) === 'auto');
autoTheme.addEventListener('change', ()=>{
  localStorage.setItem(THEME_KEY, autoTheme.checked ? 'auto' : 'dark');
  location.reload();
});

// Notes with localStorage
const noteForm = document.getElementById('noteForm');
const noteInput = document.getElementById('noteInput');
const noteList = document.getElementById('noteList');
let notes = JSON.parse(localStorage.getItem('helius-notes') || '[]');

function saveNotes(){ localStorage.setItem('helius-notes', JSON.stringify(notes)); }
function renderNotes(){
  noteList.innerHTML = '';
  notes.forEach((t,i)=>{
    const li = document.createElement('li');
    li.innerHTML = `<span>${t}</span>`;
    const del = document.createElement('button'); del.textContent = '×';
    del.addEventListener('click', ()=>{ notes.splice(i,1); saveNotes(); renderNotes(); });
    li.appendChild(del); noteList.appendChild(li);
  });
}
noteForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const v = noteInput.value.trim(); if(!v) return;
  notes.push(v); noteInput.value = ''; saveNotes(); renderNotes();
});
renderNotes();

// Progress = share of topics opened in this session
let opened = new Set();
function updateProgress(){
  const pct = Math.round((opened.size / ALL_TOPICS.length) * 100);
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressText').textContent = String(pct);
}

// Wheel rendering
const wheel = document.getElementById('wheel');
const center = document.querySelector('.center');
const arrow = document.getElementById('arrow');
const detail = document.getElementById('detail');
const detailTitle = document.getElementById('detailTitle');
const detailKicker = document.getElementById('detailKicker');
const detailBody = document.getElementById('detailBody');

let selected = null;

function placeTopics(){
  wheel.innerHTML = '';
  const N = ALL_TOPICS.length;
  const r = wheel.clientWidth/2 - 34;   // radius minus item offset

  ALL_TOPICS.forEach((name, idx)=>{
    const angle = (idx / N) * Math.PI*2 - Math.PI/2; // start at top
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);

    const btn = document.createElement('button');
    btn.className = 'topic';
    btn.textContent = name;
    btn.style.transform = `translate(${x}px, ${y}px)`;   // first position
    // then shift to center using CSS var
    btn.style.left = '50%'; btn.style.top = '50%';
    btn.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;

    btn.addEventListener('click', ()=>selectTopic(name, btn));
    wheel.appendChild(btn);
  });
  // Reselect if possible
  if(selected){
    const btn = Array.from(wheel.children).find(b=>b.textContent===selected);
    if(btn) btn.click();
  }
}

function selectTopic(name, btn){
  selected = name;
  center.classList.add('dim','show-arrow');
  document.body.classList.add('focus-detail');

  Array.from(wheel.children).forEach(el=>el.classList.toggle('selected', el===btn));

  // Arrow is already pointing right; just show it
  // Detail content
  opened.add(name); updateProgress();
  detailTitle.textContent = name;
  detailKicker.textContent = 'Focused view. Other elements are dimmed.';
  detailBody.innerHTML = `
    <div class="card"><strong>Summary:</strong> curated theses, versions, counter-arguments.</div>
    <div class="card"><strong>Signals:</strong> new sources, revisions, author activity.</div>
    <div class="card"><strong>Starter theses:</strong> examples to explore inside this topic.</div>
  `;
}

// Resize handler to keep polar positions responsive
window.addEventListener('resize', placeTopics);
placeTopics();

// Logout simulation
document.getElementById('logoutBtn').addEventListener('click', (e)=>{
  e.preventDefault();
  localStorage.removeItem('helius-onboarded');
  // In a real app you would also revoke the session token here.
  window.location.href = 'start.html';
});
