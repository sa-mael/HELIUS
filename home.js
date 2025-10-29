// Theme toggle (dark/white only)
const THEME_KEY = 'helius-theme';
const themeBtn = document.getElementById('themeBtn');
function setTheme(mode){
  document.documentElement.setAttribute('data-theme', mode);
  localStorage.setItem(THEME_KEY, mode);
}
setTheme(localStorage.getItem(THEME_KEY) || 'dark');
themeBtn.addEventListener('click', ()=>{
  setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
});

// Greet from onboarding profile
const profile = JSON.parse(localStorage.getItem('helius-profile') || '{}');
document.getElementById('helloName').textContent = profile.fullName || 'User';

// Simple SVG line chart without libs
(function lineChart(){
  const el = document.getElementById('lineChart');
  const w = 280, h = 110, pad = 10;
  const points = [14,22,18,30,26,32,28]; // 7 days, grayscale only
  const max = Math.max(...points), min = Math.min(...points);
  const scaleX = (i)=> pad + i*( (w-2*pad)/(points.length-1) );
  const scaleY = (v)=> h-pad - ( (v-min)/(max-min || 1) ) * (h-2*pad);
  const path = points.map((v,i)=> (i?'L':'M')+scaleX(i)+','+scaleY(v)).join(' ');
  el.innerHTML = `
    <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">
      <rect x="0" y="0" width="${w}" height="${h}" rx="12" ry="12" fill="none"/>
      <path d="${path}" fill="none" stroke="currentColor" stroke-width="2"/>
      ${points.map((v,i)=>`<circle cx="${scaleX(i)}" cy="${scaleY(v)}" r="3" fill="currentColor"/>`).join('')}
    </svg>`;
})();

// Donut progress (72% by default)
(function donut(){
  const wrap = document.getElementById('donut');
  const pct = Math.round((parseFloat(wrap.dataset.value) || 0)*100);
  const dash = pct * 100 / 100; // percent in "36 radius circle scale" simplified
  // 100 length for simplicity; we visually map to 360deg
  wrap.querySelector('.val').setAttribute('stroke-dasharray', `${dash} ${100-dash}`);
  document.getElementById('donutPct').textContent = pct + '%';
})();

// Goals checkbox persistence
(function goals(){
  const list = document.getElementById('goalList');
  const KEY = 'helius-goals';
  const saved = JSON.parse(localStorage.getItem(KEY) || '[]');
  Array.from(list.querySelectorAll('input')).forEach((cb,i)=>{
    cb.checked = !!saved[i];
    cb.addEventListener('change', ()=>{
      const arr = Array.from(list.querySelectorAll('input')).map(x=>x.checked);
      localStorage.setItem(KEY, JSON.stringify(arr));
    });
  });
})();

// Add task button (placeholder)
document.getElementById('addTask').addEventListener('click', ()=>{
  alert('Hook up your task creator here.');
});

// Create button (placeholder)
document.getElementById('createBtn').addEventListener('click', ()=>{
  alert('Attach creation modal here.');
});
