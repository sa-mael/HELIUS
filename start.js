// Theme: reuse preference from main (dark | light | auto)
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

/* ---------- Wizard state ---------- */
const panels = Array.from(document.querySelectorAll('.panel'));
const steps  = Array.from(document.querySelectorAll('.step'));
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

let stepIndex = 0; // 0..4
let selectedTopics = new Set();
let bias = { risk:0, trust:0, openness:0 };
let firstVote = null;

// Profile data container
let profile = {
  fullName: '',
  age: null,
  status: '',
  country: '',
  language: '',
  goals: '',
  interests: [],
  email: '',
  consent: false
};

function setStep(i){
  stepIndex = Math.max(0, Math.min(i, panels.length - 1));
  panels.forEach((p,idx)=>p.classList.toggle('is-active', idx === stepIndex));
  steps.forEach((s,idx)=>s.classList.toggle('is-active', idx === stepIndex));
  prevBtn.disabled = (stepIndex === 0);

  // Button text and enable rules
  if(stepIndex === panels.length - 1){
    nextBtn.textContent = 'Finish';
    nextBtn.dataset.state = 'finish';
    nextBtn.disabled = false;
  }else{
    nextBtn.textContent = 'Next';
    nextBtn.dataset.state = 'next';
    nextBtn.disabled = getNextDisabled();
  }
}
setStep(0);

/* ---------- Validation rules ---------- */
function validateProfile(){
  const age = Number(document.getElementById('age').value);
  const status = document.getElementById('status').value;
  const consent = document.getElementById('consent').checked;
  return Number.isFinite(age) && age >= 13 && age <= 120 && status && consent;
}
function validateTopics(){ return selectedTopics.size >= 3; }
function getNextDisabled(){
  if(stepIndex === 0) return !validateProfile();
  if(stepIndex === 1) return !validateTopics();
  return false;
}

/* ---------- Bind profile form ---------- */
const form = document.getElementById('profileForm');
form.addEventListener('input', ()=>{
  profile.fullName = document.getElementById('fullName').value.trim();
  profile.age = Number(document.getElementById('age').value) || null;
  profile.status = document.getElementById('status').value;
  profile.country = document.getElementById('country').value.trim();
  profile.language = document.getElementById('language').value;
  profile.goals = document.getElementById('goals').value.trim();
  profile.email = document.getElementById('email').value.trim();
  profile.consent = document.getElementById('consent').checked;
  profile.interests = Array.from(form.querySelectorAll('fieldset .checks input:checked')).map(x=>x.value);
  if(stepIndex === 0) nextBtn.disabled = getNextDisabled();
});

/* ---------- Step 2: topics ---------- */
const chips = Array.from(document.querySelectorAll('.chip'));
const pickCount = document.getElementById('pickCount');
chips.forEach(chip=>{
  chip.addEventListener('click', ()=>{
    const topic = chip.dataset.topic;
    if(selectedTopics.has(topic)){ selectedTopics.delete(topic); chip.classList.remove('is-selected'); }
    else { selectedTopics.add(topic); chip.classList.add('is-selected'); }
    pickCount.textContent = String(selectedTopics.size);
    if(stepIndex === 1) nextBtn.disabled = getNextDisabled();
  });
});

/* ---------- Step 3: bias sliders ---------- */
document.querySelectorAll('input[type="range"][data-bias]').forEach(r=>{
  const out = r.parentElement.querySelector('output');
  const set = () => { out.textContent = String(r.value); bias[r.dataset.bias] = Number(r.value); };
  r.addEventListener('input', set); set();
});

/* ---------- Step 4: first vote ---------- */
const voteBtns = Array.from(document.querySelectorAll('.vote-btn'));
const voteStatus = document.getElementById('voteStatus');
voteBtns.forEach(b=>{
  b.addEventListener('click', ()=>{
    firstVote = b.dataset.vote; // 'up' | 'down'
    voteBtns.forEach(x=>x.classList.toggle('is-picked', x === b));
    voteStatus.textContent = firstVote === 'up' ? 'You agreed.' : 'You disagreed.';
  });
});

/* ---------- Controls ---------- */
prevBtn.addEventListener('click', ()=> setStep(stepIndex - 1));

nextBtn.addEventListener('click', async ()=>{
  if(nextBtn.dataset.state === 'finish'){
    // Persist onboarding results locally
    localStorage.setItem('helius-profile', JSON.stringify(profile));
    localStorage.setItem('helius-topics', JSON.stringify(Array.from(selectedTopics)));
    localStorage.setItem('helius-bias', JSON.stringify(bias));
    if(firstVote) localStorage.setItem('helius-first-vote', firstVote);
    localStorage.setItem('helius-onboarded', new Date().toISOString());

    /* ===================== AI HOOK (INTEGRATION POINT) =====================
       Here we will connect the AI to bootstrap the account:
       - Send 'profile', 'topics', 'bias', and 'firstVote' to the backend.
       - Get back personalized streams, bias presets, and first digest.
       Example:
         await ai.bootstrap({ profile, topics:[...selectedTopics], bias, firstVote });
       For now we simulate a short async call.
    ======================================================================== */
    await fakeAISync({ profile, topics:[...selectedTopics], bias, firstVote });

    /* ================== NAVIGATION (GO TO HOME / MAIN PAGE) =================
       After the AI finishes initialization, redirect to the main app.
    ======================================================================== */
    window.location.href = 'main.html';
    return;
  }
  setStep(stepIndex + 1);
});

/* ---------- Fake AI call (placeholder) ---------- */
function fakeAISync(payload){
  return new Promise(resolve=>{
    // Dev aid: inspect payload in console
    console.log('AI payload preview →', payload);
    setTimeout(resolve, 500); // simulate latency
  });
}

/* ---------- Keyboard UX ---------- */
document.addEventListener('keydown', (e)=>{
  if(e.key === 'ArrowRight') { if(!nextBtn.disabled) nextBtn.click(); }
  if(e.key === 'ArrowLeft')  { if(!prevBtn.disabled) prevBtn.click(); }
});
