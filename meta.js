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
