/* ---------- Theme ---------- */
const THEME_KEY = 'helius-theme';
function applyTheme(mode){
  let eff = mode;
  if(mode === 'auto'){
    const h = new Date().getHours();
    eff = (h >= 19 || h < 7) ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', eff);
}
applyTheme(localStorage.getItem(THEME_KEY) || 'dark');
document.getElementById('themeBtn').addEventListener('click', ()=>{
  const cur = localStorage.getItem(THEME_KEY) || 'dark';
  const next = cur === 'dark' ? 'light' : (cur === 'light' ? 'auto' : 'dark');
  localStorage.setItem(THEME_KEY, next); applyTheme(next);
});

/* ---------- Back ---------- */
document.getElementById('backBtn').addEventListener('click', ()=>{
  if(history.length>1) history.back(); else location.href='index.html';
});

/* ---------- Storage ---------- */
const K_FRIENDS = 'helius-friends';
const K_INVITES = 'helius-invites';

function getJSON(k, f){ try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch { return f; } }
function setJSON(k, v){ localStorage.setItem(k, JSON.stringify(v)); }

let friends = getJSON(K_FRIENDS, []);
let invites = getJSON(K_INVITES, { incoming:[], outgoing:[] });

/* ---------- Elements ---------- */
const addForm = document.getElementById('addForm');
const addName = document.getElementById('addName');
const addHandle = document.getElementById('addHandle');
const addTags = document.getElementById('addTags');
const addNote = document.getElementById('addNote');
const addStatus = document.getElementById('addStatus');

const q = document.getElementById('q');
const sortSel = document.getElementById('sort');
const showBlocked = document.getElementById('showBlocked');
const showInactive = document.getElementById('showInactive');

const friendsList = document.getElementById('friendsList');
const emptyMsg = document.getElementById('emptyMsg');
const friendTmpl = document.getElementById('friendTmpl');

const exportBtn = document.getElementById('exportBtn');
const importInput = document.getElementById('importInput');

const makeInviteBtn = document.getElementById('makeInviteBtn');
const inviteCode = document.getElementById('inviteCode');
const copyInviteBtn = document.getElementById('copyInviteBtn');
const incomingList = document.getElementById('incomingList');
const outgoingList = document.getElementById('outgoingList');
const pasteCode = document.getElementById('pasteCode');
const acceptCodeBtn = document.getElementById('acceptCodeBtn');

const wipeBtn = document.getElementById('wipeBtn');

/* ---------- Seed (first visit) ---------- */
if(!friends.length && !invites.incoming.length && !invites.outgoing.length){
  friends = [
    mkFriend('Ada Lovelace', '@ada', 'mathematics, research', 'Pioneer of computing.'),
    mkFriend('Alan Turing', '@turing', 'research', 'Theory of computation.'),
  ];
  setJSON(K_FRIENDS, friends);
}

/* ---------- Helpers ---------- */
function uid(){ return Math.random().toString(36).slice(2,10); }
function mkFriend(name, handle, tags='', note=''){
  const now = new Date().toISOString();
  return {
    id: uid(),
    name: name.trim(),
    handle: handle.trim(),
    email: handle.includes('@') && !handle.startsWith('@') ? handle.trim() : '',
    tags: csv(tags),
    note: note.trim(),
    addedAt: now,
    blocked: false,
    active: Math.random() > 0.4 // fake presence
  };
}
function csv(s){ return (s||'').split(',').map(x=>x.trim()).filter(Boolean); }
function fmtDate(iso){ try { return new Date(iso).toLocaleDateString(); } catch{ return iso||''; } }

/* ---------- Add friend ---------- */
addForm.addEventListener('submit', e=>{
  e.preventDefault();
  const name = addName.value.trim();
  const handle = addHandle.value.trim();
  if(!name || !handle) return;
  friends.unshift(mkFriend(name, handle, addTags.value, addNote.value));
  setJSON(K_FRIENDS, friends);
  addForm.reset();
  addStatus.textContent = 'Added.';
  setTimeout(()=> addStatus.textContent = '', 800);
  render();
});

/* ---------- Render ---------- */
function render(){
  const term = q.value.trim().toLowerCase();
  let rows = friends.slice();

  // filters
  rows = rows.filter(f=>{
    if(!showBlocked.checked && f.blocked) return false;
    if(!showInactive.checked && !f.active) return false;
    if(!term) return true;
    const hay = [
      f.name, f.handle, f.email, f.note, ...(f.tags||[])
    ].join(' ').toLowerCase();
    return hay.includes(term);
  });

  // sort
  const by = sortSel.value;
  rows.sort((a,b)=>{
    if(by==='name') return a.name.localeCompare(b.name);
    if(by==='recent') return b.addedAt.localeCompare(a.addedAt);
    if(by==='active') return (b.active===a.active)? a.name.localeCompare(b.name) : (b.active?1:-1);
    if(by==='blocked') return (b.blocked===a.blocked)? a.name.localeCompare(b.name) : (b.blocked?1:-1);
    return 0;
  });

  friendsList.innerHTML = '';
  emptyMsg.hidden = rows.length !== 0;

  rows.forEach(f=>{
    const li = friendTmpl.content.firstElementChild.cloneNode(true);
    li.dataset.id = f.id;
    li.querySelector('.name').textContent = f.name || '—';
    li.querySelector('.handle').textContent = f.handle || f.email || '—';
    li.querySelector('.status').textContent = f.blocked ? 'Blocked' : (f.active ? 'Active' : 'Away');
    li.querySelector('.added').textContent = `Added ${fmtDate(f.addedAt)}`;
    const tagsBox = li.querySelector('.tags'); tagsBox.innerHTML = '';
    (f.tags||[]).forEach(t=>{
      const s = document.createElement('span'); s.className='tag'; s.textContent = t; tagsBox.appendChild(s);
    });
    const note = li.querySelector('.note'); note.value = f.note||'';

    // actions
    li.querySelector('.act-message').addEventListener('click', ()=> alert('Messaging will connect to HELIUS chat later.'));
    const blockBtn = li.querySelector('.act-block');
    blockBtn.textContent = f.blocked ? 'Unblock' : 'Block';
    blockBtn.addEventListener('click', ()=>{
      f.blocked = !f.blocked;
      setJSON(K_FRIENDS, friends);
      render();
    });
    li.querySelector('.act-remove').addEventListener('click', ()=>{
      if(!confirm(`Remove ${f.name}?`)) return;
      friends = friends.filter(x=>x.id!==f.id);
      setJSON(K_FRIENDS, friends);
      render();
    });
    note.addEventListener('change', ()=>{
      f.note = note.value.trim();
      setJSON(K_FRIENDS, friends);
    });

    friendsList.appendChild(li);
  });

  renderInvites();
}
[q, sortSel, showBlocked, showInactive].forEach(el=> el.addEventListener('input', render));
render();

/* ---------- Export / Import ---------- */
exportBtn.addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify({friends, invites}, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'helius-friends.json';
  document.body.appendChild(a); a.click(); a.remove();
});
importInput.addEventListener('change', async (e)=>{
  const f = e.target.files?.[0]; if(!f) return;
  try{
    const txt = await f.text();
    const data = JSON.parse(txt);
    if(Array.isArray(data.friends)) friends = data.friends;
    if(data.invites && data.invites.incoming && data.invites.outgoing) invites = data.invites;
    setJSON(K_FRIENDS, friends); setJSON(K_INVITES, invites);
    alert('Import completed.');
    render();
  }catch{ alert('Import failed.'); }
});

/* ---------- Invites ---------- */
function makeCode(){
  // simple, non-secure code for demo
  return (Date.now().toString(36)+Math.random().toString(36).slice(2,6)).toUpperCase();
}
makeInviteBtn.addEventListener('click', ()=>{
  const code = makeCode();
  invites.outgoing.unshift({ code, createdAt:new Date().toISOString(), used:false });
  setJSON(K_INVITES, invites);
  inviteCode.value = code;
  renderInvites();
});
copyInviteBtn.addEventListener('click', async ()=>{
  const c = inviteCode.value.trim(); if(!c) return;
  try{ await navigator.clipboard.writeText(c); alert('Copied.'); }catch{ alert('Copy failed.'); }
});
acceptCodeBtn.addEventListener('click', ()=>{
  const code = (pasteCode.value||'').trim().toUpperCase();
  if(!code) return;
  // simulate resolving a code to a user stub
  const stub = mkFriend('New Contact', '@friend', '', `Joined via code ${code}`);
  friends.unshift(stub);
  invites.incoming.unshift({ code, from:'unknown', acceptedAt:new Date().toISOString() });
  setJSON(K_FRIENDS, friends); setJSON(K_INVITES, invites);
  pasteCode.value = ''; inviteCode.value = '';
  render();
});
function renderInvites(){
  // incoming
  incomingList.innerHTML = invites.incoming.length ? '' : '<li class="muted small">No incoming invites.</li>';
  invites.incoming.forEach(x=>{
    const li = document.createElement('li'); li.className='row';
    li.innerHTML = `<span class="mono">${x.code}</span><span class="muted small">accepted ${fmtDate(x.acceptedAt)}</span>`;
    incomingList.appendChild(li);
  });
  // outgoing
  outgoingList.innerHTML = invites.outgoing.length ? '' : '<li class="muted small">No outgoing invites.</li>';
  invites.outgoing.forEach(x=>{
    const li = document.createElement('li'); li.className='row';
    li.innerHTML = `<span class="mono">${x.code}</span><span class="muted small">${fmtDate(x.createdAt)}</span>`;
    outgoingList.appendChild(li);
  });
}

/* ---------- Danger zone ---------- */
wipeBtn.addEventListener('click', ()=>{
  if(!confirm('Delete all friends and invites stored locally?')) return;
  friends = []; invites = {incoming:[], outgoing:[]};
  setJSON(K_FRIENDS, friends); setJSON(K_INVITES, invites);
  render();
});
