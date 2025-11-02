// 112 link cards + pinned highlight by topic (no background)
(() => {
  const LINK = 'card.html';

  const topics = [
    {key:'metaphysics', name:'Metaphysics', count:6},
    {key:'ethics',      name:'Ethics',      count:8},
    {key:'politics',    name:'Politics',    count:8},
    {key:'economics',   name:'Economics',   count:12},
    {key:'science',     name:'Science',     count:12},
    {key:'technology',  name:'Technology',  count:11},
    {key:'health',      name:'Health',      count:8},
    {key:'education',   name:'Education',   count:8},
    {key:'art',         name:'Art',         count:8},
    {key:'culture',     name:'Culture',     count:8},
    {key:'ecology',     name:'Ecology',     count:7},
    {key:'psychology',  name:'Psychology',  count:8},
    {key:'law',         name:'Law',         count:8},
  ];

  const list = document.getElementById('topicList');
  const grid = document.getElementById('cardGrid');

  // build topic list
  topics.forEach(t => {
    const li = document.createElement('li');
    li.className = 'topic';
    li.dataset.key = t.key;
    li.innerHTML = `<span class="sw"></span><span class="nm">${t.name}</span><span class="ct">${t.count}</span>`;
    list.appendChild(li);
  });

  // build 112 link boxes
  let n = 1;
  topics.forEach(t => {
    for (let i = 0; i < t.count; i++) {
      const a = document.createElement('a');
      a.className = `card t-${t.key}`;
      a.dataset.topic = t.key;
      a.href = `${LINK}?id=${n}&topic=${encodeURIComponent(t.key)}`;
      a.setAttribute('aria-label', `${t.name}. Card ${n}`);
      a.textContent = n;
      grid.appendChild(a);
      n++;
    }
  });

  // persistent highlight
  let activeKey = localStorage.getItem('activeTopic') || '';

  function applyFilter() {
    list.querySelectorAll('.topic').forEach(el =>
      el.classList.toggle('is-active', el.dataset.key === activeKey)
    );
    if (activeKey) {
      grid.setAttribute('data-filter', activeKey);
      grid.querySelectorAll('.card').forEach(c =>
        c.classList.toggle('is-match', c.dataset.topic === activeKey)
      );
    } else {
      grid.removeAttribute('data-filter');
      grid.querySelectorAll('.card').forEach(c => c.classList.remove('is-match'));
    }
    localStorage.setItem('activeTopic', activeKey);
  }

  list.addEventListener('click', e => {
    const li = e.target.closest('.topic'); if (!li) return;
    const key = li.dataset.key;
    activeKey = (activeKey === key) ? '' : key;
    applyFilter();
  });

  applyFilter();
})();
