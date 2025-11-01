HELIUS/
├─ index.html                 # Landing (video left, info right, theme toggle, Start btn)
├─ main.css
├─ main.js
├─ start.html                 # Onboarding: Profile → Topics → Bias → First vote → Done
├─ start.css
├─ start.js
├─ home.html                  # Dashboard (dark/white only). Left user column. Cards.
├─ home.css
├─ home.js
├─ meta.html                  # Docs hub shell (left menu, topbar, ToC, hash-router target)
├─ meta.css
├─ meta.js
├─ 404.html                   # GitHub Pages fallback + auto-redirect + Back button
│
├─ meta-pages/                # Docs content as HTML partials (loaded by meta.js)
│  ├─ metaphysics.html        # “What is metaphysics” + sections (default route)
│  ├─ profile.html            # User profile docs
│  ├─ home.html               # Home/dashboard docs
│  ├─ analytics.html          # Analytics docs
│  ├─ settings.html           # Settings docs
│  └─ friends.html            # Social/invite docs
│
├─ shared/                    # Reused tokens and utils
│  ├─ tokens.css              # Grayscale variables + spacing
│  ├─ reset.css               # Minimal CSS reset (optional)
│  ├─ theme.js                # get/set theme ('dark'|'light'|'auto' if used)
│  └─ storage.js              # getJSON/setJSON wrappers for localStorage
│
├─ api-mock/                  # Placeholders for backend/AI
│  └─ ai.mock.js              # bootstrap(payload) → Promise.resolve({ok:true})
│
├─ data/
│  └─ topics.json             # Topics list + blurbs for Start/Home
│
├─ assets/
│  ├─ media/
│  │  └─ 0001-0210.mp4        # Landing video (keep ≤2–4MB; preload="metadata")
│  ├─ images/
│  │  ├─ hilus.png            # Video poster or logo image
│  │  └─ placeholders/*.png   # Any doc/hero placeholders
│  └─ icons/
│     ├─ favicon.ico
│     ├─ favicon.svg
│     ├─ apple-touch-icon.png
│     └─ site.webmanifest     # Optional PWA manifest
│
├─ robots.txt                 # Allow crawling; disallow nothing
├─ sitemap.xml                # Optional; list index/start/home/meta routes
├─ README.md                  # How to run, structure, contribution rules
└─ LICENSE                    # Project license (MIT or chosen)
