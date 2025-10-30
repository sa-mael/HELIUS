// Simple theme toggle (dark/white only)
const THEME_KEY = 'helius-theme';
const themeToggle = document.getElementById('themeToggle');
function setTheme(mode){
  document.documentElement.setAttribute('data-theme', mode);
  localStorage.setItem(THEME_KEY, mode);
}
setTheme(localStorage.getItem(THEME_KEY) || 'dark');
themeToggle.addEventListener('click', ()=>{
  const cur = document.documentElement.getAttribute('data-theme');
  setTheme(cur === 'dark' ? 'light' : 'dark');
});

// Persistent Back button
document.getElementById('backBtn').addEventListener('click', ()=>{
  if (window.history.length > 1) window.history.back();
  else window.location.href = 'home.html'; // fallback
});

// Build “On this page” ToC and scrollspy
const headings = Array.from(document.querySelectorAll('.doc h2'));
const tocList = document.getElementById('tocList');
const links = headings.map(h => {
  const id = h.id || h.textContent.toLowerCase().replace(/\s+/g,'-').replace(/[^\w-]/g,'');
  h.id = id;
  const a = document.createElement('a');
  a.href = `#${id}`;
  a.textContent = h.textContent;
  tocList.appendChild(a);
  return a;
});

// Scrollspy
const observer = new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      links.forEach(l => l.classList.toggle('active', l.hash === `#${e.target.id}`));
      // Highlight sidebar item as well
      document.querySelectorAll('.side-nav .nav-item').forEach(n=>{
        n.classList.toggle('is-active', n.getAttribute('href') === `#${e.target.id}`);
      });
    }
  });
},{ rootMargin:'-40% 0px -50% 0px', threshold:0.01 });

headings.forEach(h=>observer.observe(h));
