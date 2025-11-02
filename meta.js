/* meta.js */
(() => {
  "use strict";

  // ===== Utilities
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

  // ===== Theme toggle
  const html = document.documentElement;
  const themeBtn = $("#themeToggle");

  function getSystemTheme() {
    return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function applyTheme(t) {
    html.setAttribute("data-theme", t);
    if (themeBtn) themeBtn.setAttribute("aria-pressed", String(t === "dark"));
    localStorage.setItem("theme", t);
  }
  function initTheme() {
    const saved = localStorage.getItem("theme");
    const current = saved || html.getAttribute("data-theme") || getSystemTheme();
    applyTheme(current);
  }
  on(themeBtn, "click", () => {
    const next = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
  });

  // ===== User menu
  const userBtn = $("#userBtn");
  const userMenu = $("#userMenu");
  function closeUserMenu() {
    if (!userMenu) return;
    userMenu.hidden = true;
    userBtn?.setAttribute("aria-expanded", "false");
  }
  function toggleUserMenu() {
    if (!userMenu) return;
    const open = userMenu.hidden;
    userMenu.hidden = !open;
    userBtn?.setAttribute("aria-expanded", String(open));
    if (open) userMenu.querySelector("a")?.focus();
  }
  on(userBtn, "click", (e) => { e.stopPropagation(); toggleUserMenu(); });
  on(document, "click", (e) => {
    if (!userMenu || userMenu.hidden) return;
    if (e.target instanceof Node && !userMenu.contains(e.target) && e.target !== userBtn) closeUserMenu();
  });
  on(document, "keydown", (e) => { if (e.key === "Escape") closeUserMenu(); });

  // ===== Left menu actions (only what's present)
  $$(".menu-item[data-action]").forEach(btn => {
    on(btn, "click", () => {
      const a = btn.getAttribute("data-action");
      if (a === "home") { window.location.href = "index.html"; }
      if (a === "notes") {
        const pop = $(".notes-popover");
        if (pop) {
          const open = pop.getAttribute("aria-hidden") === "false";
          pop.setAttribute("aria-hidden", open ? "true" : "false");
          if (!open) pop.querySelector("textarea,button,[href],input,select")?.focus();
        }
      }
    });
  });

  // ===== Floating back button
  function ensureBackFab() {
    if ($(".back-fab")) return;
    const b = document.createElement("button");
    b.className = "back-fab";
    b.type = "button";
    b.setAttribute("aria-label", "Go back");
    b.textContent = "← Back";
    on(b, "click", () => {
      if (history.length > 1) history.back();
      else window.location.href = "index.html";
    });
    document.body.appendChild(b);
  }

  // ===== Build ToC + Scrollspy
  const tocList = $("#tocList");
  function buildToc() {
    if (!tocList) return;
    const roots = $("article.doc") || document;
    const heads = $$("h2[id], h3[id]", roots);
    tocList.innerHTML = "";
    const ul = document.createElement("ul");
    ul.setAttribute("role", "list");
    heads.forEach(h => {
      const id = h.id;
      if (!id) return;
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = `#${id}`;
      a.textContent = h.textContent?.trim() || id;
      a.dataset.target = id;
      if (h.tagName === "H3") li.style.paddingLeft = "12px";
      on(a, "click", (e) => {
        e.preventDefault();
        const target = document.getElementById(id);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
        setActiveToc(id);
      });
      li.appendChild(a);
      ul.appendChild(li);
    });
    tocList.appendChild(ul);
  }
  function setActiveToc(id) {
    $$(`#tocList a`).forEach(a => {
      const active = a.dataset.target === id;
      a.classList.toggle("active", active);
      a.setAttribute("aria-current", active ? "true" : "false");
    });
  }
  function initScrollSpy() {
    const roots = $("article.doc") || document;
    const heads = $$("h2[id], h3[id]", roots);
    if (!heads.length) return;
    const io = new IntersectionObserver((entries) => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      const top = visible[0] || entries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (top?.target?.id) setActiveToc(top.target.id);
    }, { rootMargin: "-40% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] });
    heads.forEach(h => io.observe(h));
  }

  // ===== Self-test modal with inline quiz
  const modal = $("#quizModal");
  const overlay = $("#quizOverlay");
  const openQuizBtn = $("#openQuizBtn");
  const closeBtn = $("#quizClose");
  const cancelBtn = $("#quizCancel");
  const quizBody = $("#quizBody");

  const QUIZ = [
    {
      q: "Which cause explains what a thing is essentially?",
      opts: ["Material", "Formal", "Efficient", "Final"],
      a: 1
    },
    {
      q: "Change as actuality of what is potential defines:",
      opts: ["Generation", "Alteration", "Motion", "Change in general"],
      a: 3
    },
    {
      q: "For Aristotle, primary reality lies in:",
      opts: ["Universals", "Propositions", "Individual substances", "Numbers"],
      a: 2
    },
    {
      q: "Time is:",
      opts: ["Independent of change", "Number of motion regarding before/after", "Purely subjective", "Identical to space"],
      a: 1
    },
    {
      q: "The unmoved mover is chiefly a:",
      opts: ["Pushing efficient cause", "Material cause", "Final cause", "Formal cause only"],
      a: 2
    }
  ];

  function renderQuiz() {
    if (!quizBody) return;
    quizBody.innerHTML = "";
    const form = document.createElement("form");
    form.id = "quizForm";
    QUIZ.forEach((item, i) => {
      const fs = document.createElement("fieldset");
      const lg = document.createElement("legend");
      lg.textContent = `${i + 1}. ${item.q}`;
      fs.appendChild(lg);
      item.opts.forEach((opt, j) => {
        const id = `q${i}o${j}`;
        const label = document.createElement("label");
        label.setAttribute("for", id);
        label.style.display = "block";
        const input = document.createElement("input");
        input.type = "radio";
        input.name = `q${i}`;
        input.value = String(j);
        input.id = id;
        label.appendChild(input);
        label.append(` ${opt}`);
        fs.appendChild(label);
      });
      form.appendChild(fs);
    });
    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.justifyContent = "flex-end";
    actions.style.gap = "8px";

    const checkBtn = document.createElement("button");
    checkBtn.type = "button";
    checkBtn.className = "btn";
    checkBtn.textContent = "Check answers";
    on(checkBtn, "click", () => {
      const data = new FormData(form);
      let score = 0;
      QUIZ.forEach((item, i) => {
        const pick = Number(data.get(`q${i}`));
        if (pick === item.a) score++;
      });
      const note = document.createElement("p");
      note.textContent = `Score: ${score} / ${QUIZ.length}`;
      note.setAttribute("aria-live", "polite");
      quizBody.appendChild(note);
    });

    actions.appendChild(checkBtn);
    form.appendChild(actions);
    quizBody.appendChild(form);
  }
  function openModal() {
    if (!modal) return;
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    closeUserMenu();
    renderQuiz();
    closeBtn?.focus();
  }
  function closeModal() {
    if (!modal) return;
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
  }
  on(openQuizBtn, "click", openModal);
  on(closeBtn, "click", closeModal);
  on(cancelBtn, "click", closeModal);
  on(overlay, "click", closeModal);
  on(document, "keydown", (e) => {
    if (e.key === "Escape" && modal?.classList.contains("show")) closeModal();
  });

  // ===== “Ask our Docs” → focus search
  on($(".help-box .btn-ghost"), "click", () => {
    const s = $(".search input");
    if (s) { s.focus(); s.select(); }
  });

  // ===== Smooth internal anchor behavior for all in-doc links
  $$('a[href^="#"]').forEach(a => {
    on(a, "click", (e) => {
      const id = a.getAttribute("href")?.slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", `#${id}`);
    });
  });

  // ===== Init
  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    ensureBackFab();
    buildToc();
    initScrollSpy();
  });
})();



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
