// Theme switcher: dark | light | auto (time-based)
const THEME_KEY = 'helius-theme';
const themeButtons = Array.from(document.querySelectorAll('.theme-btn'));

function applyTheme(mode){
  let effective = mode;
  if(mode === 'auto'){
    const h = new Date().getHours();
    effective = (h >= 19 || h < 7) ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', effective);
  themeButtons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.theme === mode)));
}

function scheduleAutoTick(){
  if(localStorage.getItem(THEME_KEY) !== 'auto') return;
  const now = new Date();
  const h = now.getHours();
  const next = new Date(now);
  const targetHour = (h >= 19 || h < 7) ? 7 : 19;
  next.setHours(targetHour, 0, 0, 0);
  if(next <= now) next.setDate(next.getDate() + 1);
  setTimeout(() => { applyTheme('auto'); scheduleAutoTick(); }, next - now);
}

// Init theme (default: dark)
const savedMode = localStorage.getItem(THEME_KEY) || 'dark';
applyTheme(savedMode);
scheduleAutoTick();

// Button handlers
themeButtons.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const mode = btn.dataset.theme;
    localStorage.setItem(THEME_KEY, mode);
    applyTheme(mode);
    scheduleAutoTick();
  });
});

// Add hover-scale to common elements programmatically
['.nav-link','.btn','.info-item','.card','.video-wrap','.quick-links a','.chip','.kpi']
  .forEach(sel => document.querySelectorAll(sel).forEach(el => el.classList.add('hover-scale')));
