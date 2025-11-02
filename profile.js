/* ---------- Theme ---------- */
const THEME_KEY = 'helius-theme';
function applyTheme(mode){
  let effective = mode;
  if(mode === 'auto'){
    const h = new Date().getHours();
    effective = (h >= 19 || h < 7) ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', effective);
}
applyTheme(localStorage.getItem(THEME_KEY) || 'dark');

document.getElementById('themeBtn').addEventListener('click', ()=>{
  const cur = localStorage.getItem(THEME_KEY) || 'dark';
  const next = cur === 'dark' ? 'light' : (cur === 'light' ? 'auto' : 'dark');
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
});

/* ---------- Back button ---------- */
document.getElementById('backBtn').addEventListener('click', ()=>{
  if(history.length > 1) history.back(); else location.href = 'index.html';
});

/* ---------- State ---------- */
const KEYS = {
  profile : 'helius-profile',
  topics  : 'helius-topics',
  bias    : 'helius-bias',
  vote    : 'helius-first-vote',
  notes   : 'helius-notes',
  goals   : 'helius-goals',
  onboard : 'helius-onboarded',
};

const el = {
  avatarPreview: document.getElementById('avatarPreview'),
  avatarInput  : document.getElementById('avatarInput'),
  avatarReset  : document.getElementById('avatarReset'),

  fullName: document.getElementById('fullName'),
  username: document.getElementById('username'),
  email   : document.getElementById('email'),
  age     : document.getElementById('age'),
  status  : document.getElementById('status'),
  country : document.getElementById('country'),
  language: document.getElementById('language'),
  timezone: document.getElementById('timezone'),
  goals   : document.getElementById('goals'),
  interestsWrap: document.getElementById('interests'),

  segBtns : Array.from(document.querySelectorAll('.seg-btn')),
  digest  : document.getElementById('digest'),
  nProduct: document.getElementById('nProduct'),
  nMentions: document.getElementById('nMentions'),
  consent : document.getElementById('consent'),

  completeFill: document.getElementById('completeFill'),
  completePct : document.getElementById('completePct'),
  saveBtn : document.getElementById('saveBtn'),
  saveStatus: document.getElementById('saveStatus'),

  exportBtn: document.getElementById('exportBtn'),
  importInput: document.getElementById('importInput'),
  wipeBtn: document.getElementById('wipeBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
};

let profile = loadJSON(KEYS.profile, {
  fullName:'', username:'', email:'', age:null, status:'',
  country:'', language:'', timezone:'', goals:'',
  interests:[], consent:false, digest:'off', notify:{ product:false, mentions:false },
  avatarData:null
});

/* ---------- Helpers ---------- */
function loadJSON(key, fallback){ try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function saveJSON(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
function slugify(s){
  return (s||'').toLowerCase().trim()
    .replace(/['"]/g,'')
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'')
    .slice(0,40) || '';
}
function isEmail(x){ return !x || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x); }

/* ---------- Init bindings ---------- */
// timezone
try{ el.timezone.value = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; }
catch{ el.timezone.value = profile.timezone || ''; }

// identity
el.fullName.value = profile.fullName || '';
el.username.value = profile.username || slugify(profile.fullName);
el.email.value = profile.email || '';
el.age.value = profile.age ?? '';
el.status.value = profile.status || '';
el.country.value = profile.country || '';
el.language.value = profile.language || '';
el.goals.value = profile.goals || '';

Array.from(el.interestsWrap.querySelectorAll('input[type="checkbox"]')).forEach(cb=>{
  cb.checked = profile.interests?.includes(cb.value);
});

// avatar
if(profile.avatarData){
  el.avatarPreview.style.backgroundImage = `url(${profile.avatarData})`;
  el.avatarPreview.textContent = '';
}

// preferences
const themeCur = localStorage.getItem(THEME_KEY) || 'dark';
el.segBtns.forEach(b=> b.classList.toggle('is-active', b.dataset.theme === themeCur));
el.segBtns.forEach(b=> b.addEventListener('click', ()=>{
  localStorage.setItem(THEME_KEY, b.dataset.theme);
  el.segBtns.forEach(x=>x.classList.toggle('is-active', x===b));
  applyTheme(b.dataset.theme);
}));

el.digest.value = profile.digest || 'off';
el.nProduct.checked = !!profile.notify?.product;
el.nMentions.checked = !!profile.notify?.mentions;
el.consent.checked = !!profile.consent;

// listeners for change tracking
document.addEventListener('input', maybeEnableSave);
document.addEventListener('change', maybeEnableSave);

// auto-username from name
el.fullName.addEventListener('input', ()=>{
  if(!el.username.value || el.username.value === slugify(profile.fullName)){
    el.username.value = slugify(el.fullName.value);
  }
});

// avatar upload/reset
el.avatarInput.addEventListener('change', async (e)=>{
  const f = e.target.files?.[0]; if(!f) return;
  if(f.size > 2 * 1024 * 1024){ alert('File is too large. Please use ≤ 2 MB.'); return; }
  const data = await fileToDataURL(f);
  el.avatarPreview.style.backgroundImage = `url(${data})`;
  el.avatarPreview.textContent = '';
  profile.avatarData = data;
  maybeEnableSave();
});
el.avatarReset.addEventListener('click', ()=>{
  profile.avatarData = null;
  el.avatarPreview.style.backgroundImage = 'none';
  el.avatarPreview.textContent = '👤';
  maybeEnableSave();
});

/* ---------- Save / Validate ---------- */
function collect(){
  const interests = Array.from(el.interestsWrap.querySelectorAll('input:checked')).map(x=>x.value);
  return {
    fullName: el.fullName.value.trim(),
    username: slugify(el.username.value),
    email: el.email.value.trim(),
    age: Number(el.age.value) || null,
    status: el.status.value,
    country: el.country.value.trim(),
    language: el.language.value,
    timezone: el.timezone.value,
    goals: el.goals.value.trim(),
    interests,
    consent: el.consent.checked,
    digest: el.digest.value,
    notify: { product: el.nProduct.checked, mentions: el.nMentions.checked },
    avatarData: profile.avatarData || null
  };
}

function validate(p){
  const okAge = !p.age || (p.age >= 13 && p.age <= 120);
  const okStatus = !!p.status;
  const okEmail = isEmail(p.email);
  return okAge && okStatus && okEmail;
}

function maybeEnableSave(){
  const p = collect();
  const changed = JSON.stringify(strip(profile)) !== JSON.stringify(strip(p));
  el.saveBtn.disabled = !(changed && validate(p));
}

function strip(p){ // remove non-deterministic fields if any
  return p;
}

el.saveBtn.addEventListener('click', ()=>{
  const p = collect();
  if(!validate(p)){ alert('Please fix validation errors.'); return; }
  profile = p;
  saveJSON(KEYS.profile, profile);
  el.saveStatus.textContent = 'Saved.';
  setTimeout(()=> el.saveStatus.textContent = '', 1000);
  maybeEnableSave();
  updateCompleteness();
});

/* ---------- Completeness ---------- */
function updateCompleteness(){
  const req = ['fullName','age','status'];
  const opt = ['email','country','language','goals','interests'];
  let have = 0, total = req.length + opt.length;

  req.forEach(k=>{ if(profile[k]) have++; });
  opt.forEach(k=>{
    const v = profile[k];
    if(Array.isArray(v)) { if(v.length) have++; }
    else if(v) have++;
  });

  const pct = Math.round((have / total) * 100);
  el.completeFill.style.width = pct + '%';
  el.completePct.textContent = String(pct);
}
updateCompleteness();

/* ---------- Export / Import ---------- */
el.exportBtn.addEventListener('click', ()=>{
  const bundle = {
    meta: { app:'HELIUS', version:1, exportedAt:new Date().toISOString() },
    theme: localStorage.getItem(THEME_KEY) || 'dark',
    profile: loadJSON(KEYS.profile, {}),
    topics : loadJSON(KEYS.topics, []),
    bias   : loadJSON(KEYS.bias, {}),
    vote   : localStorage.getItem(KEYS.vote) || null,
    notes  : loadJSON(KEYS.notes, []),
    goals  : loadJSON(KEYS.goals, []),
    onboard: localStorage.getItem(KEYS.onboard) || null
  };
  const blob = new Blob([JSON.stringify(bundle,null,2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'helius-backup.json';
  document.body.appendChild(a); a.click(); a.remove();
});

el.importInput.addEventListener('change', async (e)=>{
  const f = e.target.files?.[0]; if(!f) return;
  try{
    const text = await f.text();
    const data = JSON.parse(text);
    if(data?.profile) saveJSON(KEYS.profile, data.profile);
    if(data?.topics)  saveJSON(KEYS.topics, data.topics);
    if(data?.bias)    saveJSON(KEYS.bias, data.bias);
    if('vote' in data) localStorage.setItem(KEYS.vote, data.vote ?? '');
    if(data?.notes)   saveJSON(KEYS.notes, data.notes);
    if(data?.goals)   saveJSON(KEYS.goals, data.goals);
    if('onboard' in data) localStorage.setItem(KEYS.onboard, data.onboard ?? '');
    if(data?.theme)   localStorage.setItem(THEME_KEY, data.theme);
    alert('Import completed. Reloading…');
    location.reload();
  }catch(err){
    alert('Import failed: invalid file.');
  }
});

/* ---------- Danger zone ---------- */
el.wipeBtn.addEventListener('click', ()=>{
  if(!confirm('Delete all local data for HELIUS on this device?')) return;
  Object.values(KEYS).forEach(k=> localStorage.removeItem(k));
  localStorage.removeItem(THEME_KEY);
  alert('All local data deleted.');
  location.href = 'start.html';
});

el.logoutBtn.addEventListener('click', ()=>{
  localStorage.removeItem(KEYS.onboard);
  location.href = 'start.html';
});

/* ---------- Utils ---------- */
function fileToDataURL(file){
  return new Promise((resolve,reject)=>{
    const fr = new FileReader();
    fr.onload = ()=> resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}
