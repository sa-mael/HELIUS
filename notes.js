/* ================== Theme ================== */
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

/* ================== Back ================== */
document.getElementById('backBtn').addEventListener('click', ()=>{
  if(history.length>1) history.back(); else location.href='index.html';
});

/* ================== Storage ================== */
const K_NOTES = 'helius-notes';
function getJSON(k, f){ try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch { return f; } }
function setJSON(k, v){ localStorage.setItem(k, JSON.stringify(v)); }

let notes = getJSON(K_NOTES, []);
let activeId = null;

/* ================== Elements ================== */
const q = document.getElementById('q');
const sortSel = document.getElementById('sort');
const orderSel = document.getElementById('order');
const pinnedFirst = document.getElementById('pinnedFirst');
const showArchived = document.getElementById('showArchived');
const tagCloud = document.getElementById('tagCloud');
const quickTag = document.getElementById('quickTag');
const clearTag = document.getElementById('clearTag');

const list = document.getElementById('notesList');
const emptyMsg = document.getElementById('emptyMsg');
const countEl = document.getElementById('count');
const itemTmpl = document.getElementById('itemTmpl');

const newBtn = document.getElementById('newBtn');
const saveBtn = document.getElementById('saveBtn');
const dupBtn = document.getElementById('dupBtn');
const pinBtn = document.getElementById('pinBtn');
const archBtn = document.getElementById('archBtn');
const delBtn = document.getElementById('delBtn');

const titleEl = document.getElementById('title');
const tagsEl  = document.getElementById('tags');
const bodyEl  = document.getElementById('body');
const metaEl  = document.getElementById('meta');

const exportBtn = document.getElementById('exportBtn');
const importInput = document.getElementById('importInput');

/* ================== Utils ================== */
function uid(){ return Math.random().toString(36).slice(2, 10); }
function now(){ return new Date().toISOString(); }
function fmtDate(iso){ try{ return new Date(iso).toLocaleString(); } catch{ return iso; } }
function csv(s){ return (s||'').split(',').map(x=>x.trim()).filter(Boolean); }
function uniq(a){ return [...new Set(a)]; }
function debounce(fn, ms){ let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), ms); }; }

/* ================== Seed ================== */
if(!notes.length){
  const n1 = mkNote('Welcome to Notes', 'Use the **Editor** to write. Tags like research, argument.\n- Pin to keep on top.\n- Archive to hide.\n- Export/Import for backup.', ['welcome','help']);
  const n2 = mkNote('Metaphysics reading list', 'Start with SEP article, then Aristotle *Metaphysics* selections.\nWhat is fundamental? Identity over time?', ['metaphysics','reading']);
  notes = [n1, n2];
  setJSON(K_NOTES, notes);
}

/* ================== Model ================== */
function mkNote(title='', body='', tags=[]){
  const t = now();
  return {
    id: uid(),
    title: title.trim() || 'Untitled',
    body: body || '',
    tags: uniq(tags.map(x=>x.toLowerCase())),
    pinned: false,
    archived: false,
    createdAt: t,
    updatedAt: t
  };
}
function saveAll(){ setJSON(K_NOTES, notes); }

/* ================== Filters state ================== */
let filterTag = '';
function currentFilters(){
  return {
    q: q.value.trim().toLowerCase(),
    sort: sortSel.value,
    order: orderSel.value,
    pinnedFirst: pinnedFirst.checked,
    showArchived: showArchived.checked,
    tag: filterTag || quickTag.value.trim().toLowerCase()
  };
}

/* ================== Render ================== */
function render(){
  const F = currentFilters();
  const rows = filteredNotes(F);
  countEl.textContent = String(rows.length);
  list.innerHTML = '';
  emptyMsg.hidden = rows.length !== 0;

  rows.forEach(n=>{
    const li = itemTmpl.content.firstElementChild.cloneNode(true);
    li.dataset.id = n.id;
    li.querySelector('.title').textContent = n.title || 'Untitled';
    li.querySelector('.snippet').textContent = snippet(n.body);
    li.querySelector('.meta').textContent = (n.archived?'Archived · ':'') + `Updated ${fmtDate(n.updatedAt)}`;
    // tags
    const line = li.querySelector('.tagline');
    (n.tags||[]).forEach(t=>{
      const s = document.createElement('span');
      s.className = 'tag';
      s.textContent = t;
      s.addEventListener('click', ()=>{ filterTag = t; quickTag.value=''; render(); buildTagCloud(); });
      line.appendChild(s);
    });
    // pin state
    const pin = li.querySelector('.pin');
    pin.textContent = n.pinned ? '★' : '☆';
    pin.title = n.pinned ? 'Unpin' : 'Pin';
    pin.addEventListener('click', ()=>{
      n.pinned = !n.pinned; n.updatedAt = now(); saveAll(); render();
    });

    // open
    li.querySelector('.open').addEventListener('click', ()=> openNote(n.id));
    // more menu placeholder
    li.querySelector('.more').addEventListener('click', ()=>{
      const acts = [];
      acts.push(n.archived ? 'Unarchive' : 'Archive');
      acts.push('Duplicate');
      acts.push('Delete');
      const pick = prompt(`Action for "${n.title}":\n- ${acts.join('\n- ')}`);
      if(!pick) return;
      if(/unarchive/i.test(pick)) toggleArchive(n.id,false);
      else if(/archive/i.test(pick)) toggleArchive(n.id,true);
      else if(/duplicate/i.test(pick)) duplicate(n.id);
      else if(/delete/i.test(pick)) remove(n.id);
    });

    list.appendChild(li);
  });

  buildTagCloud();
  refreshEditorButtons();
}
function filteredNotes(F){
  let rows = notes.slice();

  // text search
  if(F.q){
    rows = rows.filter(n=>{
      const hay = [n.title, n.body, ...(n.tags||[])].join(' ').toLowerCase();
      return hay.includes(F.q);
    });
  }
  // tag filter
  if(F.tag){
    rows = rows.filter(n=> (n.tags||[]).includes(F.tag));
  }
  // archived
  if(!F.showArchived){
    rows = rows.filter(n=> !n.archived);
  }
  // sort
  rows.sort((a,b)=>{
    const dir = F.order === 'asc' ? 1 : -1;
    let cmp = 0;
    if(F.sort==='title') cmp = a.title.localeCompare(b.title);
    if(F.sort==='created') cmp = a.createdAt.localeCompare(b.createdAt);
    if(F.sort==='updated') cmp = a.updatedAt.localeCompare(b.updatedAt);
    cmp *= dir;
    // pinned on top
    if(F.pinnedFirst && a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return cmp;
  });

  return rows;
}
function snippet(s){
  const x = s.replace(/\s+/g,' ').trim();
  return x.length > 120 ? x.slice(0,117) + '…' : x;
}
function buildTagCloud(){
  const freq = new Map();
  notes.forEach(n=> (n.tags||[]).forEach(t=> freq.set(t, (freq.get(t)||0)+1) ));
  const top = [...freq.entries()].sort((a,b)=> b[1]-a[1]).slice(0,30);
  tagCloud.innerHTML = '';
  top.forEach(([t,c])=>{
    const b = document.createElement('button');
    b.className = 'tag';
    b.textContent = `${t} (${c})`;
    if(t === filterTag) b.classList.add('active');
    b.addEventListener('click', ()=>{
      filterTag = (filterTag === t) ? '' : t;
      quickTag.value = '';
      render();
    });
    tagCloud.appendChild(b);
  });
}

/* ================== Editor ================== */
function openNote(id){
  const n = notes.find(x=>x.id===id);
  if(!n) return;
  activeId = id;
  titleEl.value = n.title || '';
  tagsEl.value  = (n.tags||[]).join(', ');
  bodyEl.value  = n.body || '';
  metaEl.textContent = `Created ${fmtDate(n.createdAt)} · Updated ${fmtDate(n.updatedAt)} · ${n.pinned?'Pinned · ':''}${n.archived?'Archived':''}`;
  refreshEditorButtons();
}
function collectEditor(){
  return {
    title: titleEl.value.trim() || 'Untitled',
    tags : uniq(csv(tagsEl.value.toLowerCase())),
    body : bodyEl.value
  };
}
function refreshEditorButtons(){
  const n = notes.find(x=>x.id===activeId);
  const has = !!n;
  saveBtn.disabled = !has;
  dupBtn.disabled = !has;
  pinBtn.disabled = !has;
  archBtn.disabled = !has;
  delBtn.disabled = !has;
  if(!n) return;
  pinBtn.textContent = n.pinned ? 'Unpin' : 'Pin';
  archBtn.textContent = n.archived ? 'Unarchive' : 'Archive';
}

/* Autosave with debounce */
const autosave = debounce(()=>{
  const n = notes.find(x=>x.id===activeId);
  if(!n) return;
  const data = collectEditor();
  n.title = data.title;
  n.tags  = data.tags;
  n.body  = data.body;
  n.updatedAt = now();
  saveAll();
  render(); // refresh list ordering/snippets
}, 500);

[titleEl, tagsEl, bodyEl].forEach(el=> el.addEventListener('input', autosave));

/* Toolbar inserts simple markers at caret */
document.querySelectorAll('.tool').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const ins = btn.dataset.ins || '';
    insertAtCursor(bodyEl, ins);
    bodyEl.dispatchEvent(new Event('input', {bubbles:true}));
  });
});
function insertAtCursor(textarea, text){
  const start = textarea.selectionStart, end = textarea.selectionEnd;
  const val = textarea.value;
  textarea.value = val.slice(0,start) + text + val.slice(end);
  const pos = start + text.length;
  textarea.selectionStart = textarea.selectionEnd = pos;
  textarea.focus();
}

/* ================== Actions ================== */
newBtn.addEventListener('click', ()=>{
  const n = mkNote('Untitled', '', []);
  notes.unshift(n); saveAll();
  render(); openNote(n.id);
});
saveBtn.addEventListener('click', ()=>{
  autosave(); // force immediate save by using same code path
});
dupBtn.addEventListener('click', ()=> duplicate(activeId));
pinBtn.addEventListener('click', ()=>{
  const n = notes.find(x=>x.id===activeId); if(!n) return;
  n.pinned = !n.pinned; n.updatedAt = now(); saveAll(); render(); refreshEditorButtons();
});
archBtn.addEventListener('click', ()=>{
  const n = notes.find(x=>x.id===activeId); if(!n) return;
  n.archived = !n.archived; n.updatedAt = now(); saveAll(); render(); refreshEditorButtons();
});
delBtn.addEventListener('click', ()=>{
  const n = notes.find(x=>x.id===activeId); if(!n) return;
  if(!confirm(`Delete "${n.title}"? This cannot be undone.`)) return;
  remove(n.id);
});

/* Helpers */
function duplicate(id){
  const src = notes.find(x=>x.id===id); if(!src) return;
  const copy = mkNote(src.title + ' (copy)', src.body, src.tags);
  copy.pinned = src.pinned;
  notes.unshift(copy); saveAll(); render(); openNote(copy.id);
}
function toggleArchive(id, to=true){
  const n = notes.find(x=>x.id===id); if(!n) return;
  n.archived = !!to; n.updatedAt = now(); saveAll(); render(); if(activeId===id) refreshEditorButtons();
}
function remove(id){
  const ix = notes.findIndex(x=>x.id===id); if(ix<0) return;
  notes.splice(ix,1); saveAll(); render();
  if(activeId===id){ activeId=null; titleEl.value=''; tagsEl.value=''; bodyEl.value=''; metaEl.textContent='No note selected.'; refreshEditorButtons(); }
}

/* ================== Filters bindings ================== */
[q, sortSel, orderSel, pinnedFirst, showArchived, quickTag].forEach(el=> el.addEventListener('input', render));
clearTag.addEventListener('click', ()=> { filterTag=''; quickTag.value=''; render(); });

/* ================== Import/Export ================== */
exportBtn.addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify({notes}, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'helius-notes.json';
  document.body.appendChild(a); a.click(); a.remove();
});
importInput.addEventListener('change', async (e)=>{
  const f = e.target.files?.[0]; if(!f) return;
  try{
    const txt = await f.text();
    const data = JSON.parse(txt);
    if(Array.isArray(data.notes)){
      // minimal normalization
      notes = data.notes.map(n=>({
        id: n.id || uid(),
        title: String(n.title||'Untitled'),
        body: String(n.body||''),
        tags: uniq((n.tags||[]).map(x=>String(x).toLowerCase())),
        pinned: !!n.pinned,
        archived: !!n.archived,
        createdAt: n.createdAt || now(),
        updatedAt: n.updatedAt || now()
      }));
      saveAll(); render();
      alert('Import completed.');
    }else{
      alert('Invalid file.');
    }
  }catch{
    alert('Import failed.');
  }
});

/* ================== Keyboard shortcuts ================== */
// Ctrl+N new, Ctrl+S save, Delete archive (if focused in editor)
document.addEventListener('keydown', (e)=>{
  const mod = e.ctrlKey || e.metaKey;
  if(mod && e.key.toLowerCase()==='n'){ e.preventDefault(); newBtn.click(); }
  if(mod && e.key.toLowerCase()==='s'){ e.preventDefault(); saveBtn.click(); }
  if(e.key==='Delete' && document.activeElement === bodyEl){
    e.preventDefault();
    archBtn.click();
  }
});

/* ================== Init ================== */
render();
// Open the most recently updated non-archived note by default
const initial = notes.slice().filter(n=>!n.archived).sort((a,b)=> b.updatedAt.localeCompare(a.updatedAt))[0];
if(initial){ openNote(initial.id); }
