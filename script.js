(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const body = document.body;
  const GLYPHS = "!<>-_\\/[]{}—=+*^?#01";

  /* ================= BOOT SEQUENCE ================= */
  const bootLines = [
    ["> mounting /dev/parthiv", ""],
    ["> loading kernel modules", ""],
    ["  typescript ............ ok", "ok"],
    ["  next.js ............... ok", "ok"],
    ["  python/fastapi ........ ok", "ok"],
    ["  java (design patterns)  ok", "ok"],
    ["  supabase realtime ..... ok", "ok"],
    ["  ai vision ............. ok", "ok"],
    ["> resolving coffee dependency", ""],
    ["  warn: caffeine < recommended", "warn"],
    ["> compiling portfolio --prod", ""],
    ["  ✓ 6 projects  ✓ 1 internship  ✓ 0 vulnerabilities", "ok"],
    ["> starting render loop", ""],
  ];

  let booted = false;
  function finishBoot() {
    if (booted) return;
    booted = true;
    body.classList.add("reveal");
    setTimeout(() => {
      $("#boot").classList.add("done");
      body.classList.remove("is-loading");
      body.classList.add("ready");
      startRole();
    }, reduced ? 0 : 520);
  }

  function runBoot() {
    if (reduced) return finishBoot();
    const log = $("#bootLog"), bar = $("#bootBar"), pct = $("#bootPct");
    const total = 2300, start = performance.now();
    let li = 0;
    const tick = (t) => {
      if (booted) return;
      const p = Math.min(1, (t - start) / total);
      const eased = 1 - Math.pow(1 - p, 3);
      bar.style.width = eased * 100 + "%";
      pct.textContent = String(Math.round(eased * 100)).padStart(3, "0");
      while (li < bootLines.length && li / bootLines.length <= p) {
        const [txt, cls] = bootLines[li++];
        const el = document.createElement("p");
        el.textContent = txt;
        if (cls) el.className = cls;
        log.appendChild(el);
      }
      p < 1 ? requestAnimationFrame(tick) : setTimeout(finishBoot, 250);
    };
    requestAnimationFrame(tick);
    $("#bootSkip").addEventListener("click", finishBoot);
    addEventListener("keydown", (e) => { if (!booted && (e.key === "Enter" || e.key === "Escape")) finishBoot(); });
  }
  runBoot();

  /* ================= SCRAMBLE ================= */
  function scramble(el, to, dur = 600) {
    const from = el.textContent;
    const len = Math.max(from.length, to.length);
    const start = performance.now();
    cancelAnimationFrame(el._raf);
    const frame = (t) => {
      const p = Math.min(1, (t - start) / dur);
      let out = "";
      for (let i = 0; i < len; i++) {
        const settle = i / len;
        if (p >= settle + 0.25 || p === 1) out += to[i] || "";
        else if (p >= settle) out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
        else out += from[i] || "";
      }
      el.textContent = out;
      if (p < 1) el._raf = requestAnimationFrame(frame);
    };
    el._raf = requestAnimationFrame(frame);
  }
  $$("[data-scramble]").forEach((el) => {
    const txt = el.textContent;
    el.addEventListener("mouseenter", () => scramble(el, txt, 450));
  });

  /* ================= AVAILABILITY STATUS ================= */
  const statuses = [
    "open to software engineering roles",
    "open to fintech & trading-systems SWE roles",
    "open to financial analyst roles",
  ];
  const statusEl = $("#status");
  let si = 0;
  setInterval(() => {
    si = (si + 1) % statuses.length;
    reduced ? (statusEl.textContent = statuses[si]) : scramble(statusEl, statuses[si], 700);
  }, 3200);

  /* ================= ROLE CYCLER ================= */
  const roles = ["real-time systems", "AI-powered apps", "full-stack products", "clean architecture", "things that ship"];
  function startRole() {
    const el = $("#role");
    let i = 0;
    if (reduced) return;
    setInterval(() => { i = (i + 1) % roles.length; scramble(el, roles[i], 900); }, 2600);
  }

  /* ================= CLOCK ================= */
  const clock = $("#clock");
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const tickClock = () => (clock.textContent = fmt.format(new Date()) + " EST");
  tickClock(); setInterval(tickClock, 1000);

  /* ================= CURSOR ================= */
  const cursor = $("#cursor"), label = $("#cursorLabel");
  const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
  addEventListener("pointermove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  if (finePointer) {
    // snap brackets: four corners trail the pointer, then lock onto whatever link/button you hover
    const box = $("#cursorBox"), dot = $("#cursorDot");
    const SIZE = 22, PAD = 8;
    const b = { x: mouse.x - SIZE / 2, y: mouse.y - SIZE / 2, w: SIZE, h: SIZE };
    let target = null;
    addEventListener("pointerdown", () => cursor.classList.add("is-down"));
    addEventListener("pointerup", () => cursor.classList.remove("is-down"));
    (function loop() {
      let tx = mouse.x - SIZE / 2, ty = mouse.y - SIZE / 2, tw = SIZE, th = SIZE;
      if (target && target.isConnected) {
        const r = target.getBoundingClientRect(); // read every frame so it follows scroll + magnetic drift
        tx = r.left - PAD; ty = r.top - PAD; tw = r.width + PAD * 2; th = r.height + PAD * 2;
      }
      const k = reduced ? 1 : target ? 0.28 : 0.4;
      b.x += (tx - b.x) * k; b.y += (ty - b.y) * k; b.w += (tw - b.w) * k; b.h += (th - b.h) * k;
      box.style.transform = `translate(${b.x}px, ${b.y}px)`;
      box.style.width = b.w + "px";
      box.style.height = b.h + "px";
      dot.style.transform = `translate(${mouse.x}px, ${mouse.y}px)`;
      requestAnimationFrame(loop);
    })();
    document.addEventListener("pointerover", (e) => {
      const t = e.target.closest("a, button, [data-cursor]");
      const field = e.target.closest("input");
      target = t || null;
      cursor.classList.toggle("is-locked", !!t);
      cursor.classList.toggle("is-label", !!(t && t.dataset.cursor));
      cursor.classList.toggle("is-text", !!field);
      if (t && t.dataset.cursor) label.textContent = t.dataset.cursor;
    });
    document.addEventListener("pointerleave", () => { target = null; cursor.classList.remove("is-locked", "is-label"); });
  }

  /* ================= MAGNETIC ================= */
  if (finePointer && !reduced) {
    $$("[data-magnetic]").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${dx * 0.3}px, ${dy * 0.4}px)`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.transition = "transform .6s cubic-bezier(.2,1.6,.4,1)";
        el.style.transform = "";
        setTimeout(() => (el.style.transition = ""), 600);
      });
    });
  }

  /* ================= PARTICLE GLYPH FIELD ================= */
  const cvs = $("#particles"), ctx = cvs.getContext("2d");
  const shapes = ["{ }", "</>", "λ", "PM", "∞"];
  let shapeIdx = 0, parts = [], W = 0, H = 0, dpr = 1;

  function sampleShape(text) {
    const off = document.createElement("canvas");
    const mobile = W < 720;
    const size = Math.min(W * (mobile ? 0.9 : 0.5), H * 0.75);
    off.width = W; off.height = H;
    const o = off.getContext("2d");
    o.fillStyle = "#fff";
    o.textAlign = "center"; o.textBaseline = "middle";
    o.font = `900 ${size * (text.length > 2 ? 0.55 : 0.85)}px Unbounded, sans-serif`;
    const cx = mobile ? W / 2 : W * 0.78, cy = mobile ? H * 0.42 : H * 0.48;
    o.fillText(text, cx, cy);
    const data = o.getImageData(0, 0, W, H).data;
    const pts = [], step = mobile ? 7 : 6;
    for (let y = 0; y < H; y += step)
      for (let x = 0; x < W; x += step)
        if (data[(y * W + x) * 4 + 3] > 128) pts.push([x, y]);
    return pts;
  }

  function setShape(i) {
    const pts = sampleShape(shapes[i]);
    pts.sort(() => Math.random() - 0.5);
    while (parts.length < pts.length) parts.push({ x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0, tx: 0, ty: 0, a: 0, hot: Math.random() < 0.08 });
    parts.length = pts.length;
    parts.forEach((p, k) => { p.tx = pts[k][0]; p.ty = pts[k][1]; p.vx += (Math.random() - 0.5) * 30; p.vy += (Math.random() - 0.5) * 30; });
  }

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = cvs.clientWidth; H = cvs.clientHeight;
    cvs.width = W * dpr; cvs.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    setShape(shapeIdx);
  }

  let heroVisible = true;
  new IntersectionObserver(([e]) => (heroVisible = e.isIntersecting)).observe($("#hero"));

  function drawParticles() {
    requestAnimationFrame(drawParticles);
    if (!heroVisible) return;
    ctx.clearRect(0, 0, W, H);
    const r = cvs.getBoundingClientRect();
    const mx = mouse.x - r.left, my = mouse.y - r.top;
    for (const p of parts) {
      const dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
      if (d2 < 14000) { const f = (14000 - d2) / 14000 * 6; const d = Math.sqrt(d2) || 1; p.vx += dx / d * f; p.vy += dy / d * f; }
      p.vx += (p.tx - p.x) * 0.012; p.vy += (p.ty - p.y) * 0.012;
      p.vx *= 0.86; p.vy *= 0.86;
      p.x += p.vx; p.y += p.vy;
      const speed = Math.min(1, Math.abs(p.vx) + Math.abs(p.vy));
      ctx.fillStyle = p.hot || speed > 0.6 ? "#c6ff3d" : `rgba(236,232,223,${0.35 + speed * 0.5})`;
      ctx.fillRect(p.x, p.y, 2.2, 2.2);
    }
  }

  document.fonts.ready.then(() => {
    resize();
    if (reduced) {
      parts.forEach((p) => { p.x = p.tx; p.y = p.ty; });
      ctx.fillStyle = "rgba(236,232,223,.4)";
      parts.forEach((p) => ctx.fillRect(p.x, p.y, 2, 2));
    } else {
      drawParticles();
      setInterval(() => { if (heroVisible && !document.hidden) setShape((shapeIdx = (shapeIdx + 1) % shapes.length)); }, 4200);
    }
  });
  let rz; addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(resize, 200); });
  $("#hero").addEventListener("click", (e) => {
    if (e.target.closest("a")) return;
    for (const p of parts) { const a = Math.random() * 6.28; const f = 20 + Math.random() * 40; p.vx += Math.cos(a) * f; p.vy += Math.sin(a) * f; }
  });

  /* ================= SCROLL: progress, marquee velocity ================= */
  /* ================= NAV: frosted pill on scroll, hide going down, show going up ================= */
  const nav = $(".nav");
  let navLastY = scrollY;
  const updateNav = () => {
    const y = scrollY;
    nav.classList.toggle("is-scrolled", y > 60);
    if (Math.abs(y - navLastY) > 6) {
      nav.classList.toggle("is-hidden", y > navLastY && y > innerHeight * 0.6 && cmdk.hidden);
      navLastY = y;
    }
  };
  addEventListener("scroll", updateNav, { passive: true });
  nav.addEventListener("focusin", () => nav.classList.remove("is-hidden"));

  // highlight the nav link for the section currently on screen
  const navLinks = $$(".nav__links a");
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + e.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  ["hero", "about", "work", "experience", "stack", "contact"].forEach((id) => spy.observe(document.getElementById(id)));

  const progress = $("#progress"), marquee = $("#marquee");
  marquee.innerHTML += marquee.innerHTML; // seamless loop
  let mx = 0, lastY = scrollY, vel = 0;
  (function scrollLoop() {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    vel += ((y - lastY) - vel) * 0.1; lastY = y;
    if (!reduced) {
      mx -= 1.2 + Math.abs(vel) * 0.5;
      const half = marquee.scrollWidth / 2;
      if (-mx > half) mx += half;
      marquee.style.transform = `translateX(${mx}px) skewX(${Math.max(-12, Math.min(12, -vel * 0.4))}deg)`;
    }
    requestAnimationFrame(scrollLoop);
  })();

  /* ================= ABOUT: word-by-word light-up ================= */
  const lead = $(".split-words");
  const walk = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((w) => {
          if (!w.trim()) return frag.appendChild(document.createTextNode(w));
          const s = document.createElement("span"); s.className = "w"; s.textContent = w; frag.appendChild(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) { n.classList.add("w"); }
    });
  };
  walk(lead);
  const words = $$(".w", lead);
  const lightWords = () => {
    const r = lead.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35)));
    const n = reduced ? words.length : Math.round(p * words.length);
    words.forEach((w, i) => w.classList.toggle("on", i < n));
  };
  addEventListener("scroll", lightWords, { passive: true }); lightWords();

  /* ================= IN-VIEW: counters, projects, timeline ================= */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      io.unobserve(el);
      if (el.dataset.count) {
        const end = +el.dataset.count, t0 = performance.now();
        const step = (t) => {
          const p = Math.min(1, (t - t0) / 1400);
          el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4)));
          if (p < 1) requestAnimationFrame(step);
        };
        reduced ? (el.textContent = end) : requestAnimationFrame(step);
      } else el.classList.add("in");
    });
  }, { threshold: 0.15 });
  $$("[data-count], .project, .tl, .tb__card").forEach((el) => io.observe(el));

  /* ================= PROJECT TILT + GLOW ================= */
  if (finePointer && !reduced) {
    $$("[data-tilt]").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", px * 100 + "%");
        card.style.setProperty("--my", py * 100 + "%");
        card.style.transform = `rotateX(${(0.5 - py) * 6}deg) rotateY(${(px - 0.5) * 8}deg)`;
      });
      card.addEventListener("pointerleave", () => (card.style.transform = ""));
    });
  }

  /* ================= LATEST ON GITHUB: repos tagged "portfolio", newest first ================= */
  (() => {
    const wrap = $("#gh"), list = $("#ghList");
    if (!wrap) return;
    const USER = "beyondparthiv", TOPIC = "portfolio";
    const LANG = { TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5", Java: "#b07219", PHP: "#4F5D95", HTML: "#e34c26", CSS: "#563d7c", Kotlin: "#A97BFF", "C++": "#f34b7d", C: "#555555" };
    const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const ago = (iso) => {
      const s = (Date.now() - new Date(iso)) / 1000;
      for (const [u, n] of [["year", 31536e3], ["month", 2592e3], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60]])
        if (s >= n) { const v = Math.floor(s / n); return `${v} ${u}${v > 1 ? "s" : ""} ago`; }
      return "just now";
    };
    // on Vercel this hits our cached function; when previewing locally there's no /api, so ask GitHub directly
    async function load() {
      try {
        const r = await fetch("/api/github");
        if (r.ok && (r.headers.get("content-type") || "").includes("json")) return (await r.json()).items || [];
      } catch (e) {}
      const r = await fetch(`https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed`);
      if (!r.ok) return [];
      return (await r.json())
        .filter((x) => !x.fork && !x.archived && (x.topics || []).includes(TOPIC))
        .slice(0, 6)
        .map((x) => ({ name: x.name, description: x.description, url: x.html_url, language: x.language, stars: x.stargazers_count, pushedAt: x.pushed_at, topics: (x.topics || []).filter((t) => t !== TOPIC).slice(0, 4) }));
    }
    let started = false;
    new IntersectionObserver(async ([e], obs) => {
      if (!e.isIntersecting || started) return;
      started = true; obs.disconnect();
      wrap.hidden = false;
      list.innerHTML = '<div class="gh__skel"></div>'.repeat(3);
      let items = [];
      try { items = await load(); } catch (err) {}
      if (!items.length) { wrap.hidden = true; return; } // nothing tagged yet: stay invisible
      list.innerHTML = items.map((x, i) => `
        <a class="gh__card" href="${esc(x.url)}" target="_blank" rel="noopener" data-cursor="git clone" style="transition-delay:${i * 70}ms">
          <div class="gh__top"><span>${esc(USER)} /</span><span>updated ${ago(x.pushedAt)}</span></div>
          <div class="gh__name">${esc(x.name)}</div>
          <p class="gh__desc${x.description ? "" : " is-empty"}">${x.description ? esc(x.description) : "work in progress"}</p>
          ${x.topics && x.topics.length ? `<div class="gh__tags">${x.topics.map((t) => `<i>${esc(t)}</i>`).join("")}</div>` : ""}
          <div class="gh__meta">${x.language ? `<span class="gh__lang" style="--c:${LANG[x.language] || "var(--muted)"}"><b></b>${esc(x.language)}</span>` : ""}<span>★ ${x.stars || 0}</span></div>
        </a>`).join("");
      requestAnimationFrame(() => $$(".gh__card", list).forEach((c) => c.classList.add("in")));
    }, { rootMargin: "300px" }).observe($(".projects"));
  })();

  /* ================= TOOLBOX: hover a skill to see where it was used ================= */
  $$(".tb__card").forEach((card) => {
    const used = $(".tb__used em", card), fallback = finePointer ? "hover a skill" : "tap a skill";
    used.textContent = fallback;
    let cur = null;
    const on = (chip) => {
      if (cur === chip) return;
      if (cur) cur.classList.remove("is-on");
      cur = chip; chip.classList.add("is-on"); card.classList.add("is-peek");
      reduced ? (used.textContent = chip.dataset.used) : scramble(used, chip.dataset.used, 420);
    };
    const off = () => {
      if (cur) cur.classList.remove("is-on");
      cur = null; card.classList.remove("is-peek");
      cancelAnimationFrame(used._raf); used.textContent = fallback;
    };
    $$(".tb__chip", card).forEach((chip) => {
      chip.addEventListener("pointerenter", () => on(chip));
      chip.addEventListener("focus", () => on(chip));
      chip.addEventListener("keydown", (e) => { if (e.key === "Escape") chip.blur(); });
    });
    card.addEventListener("pointerleave", (e) => { if (e.pointerType !== "touch") off(); });
    card.addEventListener("focusout", (e) => { if (!card.contains(e.relatedTarget)) off(); });
    document.addEventListener("pointerdown", (e) => { if (cur && !card.contains(e.target)) off(); });
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", e.clientX - r.left + "px");
      card.style.setProperty("--my", e.clientY - r.top + "px");
    });
  });

  /* ================= DAYBOOK DEMO: photo -> events -> clash caught ================= */
  const db = $("#dbDemo"), dbStatus = $("#dbStatus"), dbEvents = $$(".db__ev", db);
  const dbState = (cls, msg) => { db.className = "db " + cls; dbStatus.textContent = msg; };
  function dbFinal() { dbEvents.forEach((e) => e.classList.add("is-in")); dbState("is-clash is-done", "6 events added · 1 clash caught (Thu: Shift × Dentist)"); }
  let dbTimers = [], dbRunning = false;
  function dbRun() {
    dbTimers.forEach(clearTimeout); dbTimers = [];
    const at = (ms, fn) => dbTimers.push(setTimeout(fn, ms));
    dbEvents.forEach((e) => e.classList.remove("is-in"));
    dbState("is-scanning", "scanning photo…");
    at(1900, () => dbState("is-placing", "reading schedule → 6 events"));
    dbEvents.forEach((e, i) => at(2100 + i * 260, () => e.classList.add("is-in")));
    at(2100 + dbEvents.length * 260 + 300, () => dbState("is-clash", "⚠ clash: Thu Shift overlaps Dentist"));
    at(2100 + dbEvents.length * 260 + 2000, dbFinal);
    at(2100 + dbEvents.length * 260 + 5200, () => dbRunning && dbRun());
  }
  if (reduced) dbFinal();
  else new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !dbRunning) { dbRunning = true; dbRun(); }
    else if (!e.isIntersecting && dbRunning) { dbRunning = false; dbTimers.forEach(clearTimeout); dbFinal(); }
  }, { threshold: 0.4 }).observe(db);

  /* ================= HABIT GRID ================= */
  const hg = $("#habitGrid");
  for (let i = 0; i < 56; i++) { const s = document.createElement("span"); hg.appendChild(s); }
  const cells = $$("span", hg);
  const paint = () => cells.forEach((c) => { const r = Math.random(); c.className = r > 0.45 ? "on" : r > 0.3 ? "mid" : ""; });
  paint(); if (!reduced) setInterval(() => { const c = cells[(Math.random() * cells.length) | 0]; c.className = c.className ? "" : "on"; }, 220);
  hg.addEventListener("click", paint);

  /* ================= TOAST / COPY ================= */
  const toast = $("#toast"); let tt;
  const say = (m) => { toast.textContent = m; toast.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove("show"), 2200); };
  const EMAIL = "parthivmodi23@gmail.com";
  const copyEmail = () => navigator.clipboard?.writeText(EMAIL).then(() => say("✓ email copied to clipboard"), () => say(EMAIL));
  $("#copyEmail").addEventListener("click", copyEmail);

  /* ================= MATRIX MODE ================= */
  const mc = $("#matrix"), mctx = mc.getContext("2d");
  let matrixOn = false, drops = [];
  function matrixLoop() {
    if (!matrixOn) return;
    mctx.fillStyle = "rgba(7,8,10,.12)"; mctx.fillRect(0, 0, mc.width, mc.height);
    mctx.fillStyle = "#c6ff3d"; mctx.font = "16px JetBrains Mono";
    drops.forEach((y, i) => {
      mctx.fillText("01アイウエオカキクケコ{}<>/λ"[(Math.random() * 24) | 0], i * 16, y * 16);
      drops[i] = y * 16 > mc.height && Math.random() > 0.975 ? 0 : y + 1;
    });
    requestAnimationFrame(matrixLoop);
  }
  function toggleMatrix() {
    matrixOn = !matrixOn; body.classList.toggle("matrix", matrixOn);
    if (matrixOn) { mc.width = innerWidth; mc.height = innerHeight; drops = Array(Math.ceil(innerWidth / 16)).fill(1); matrixLoop(); say("wake up, recruiter… 🐇"); }
    else say("back to reality");
  }
  const konami = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let kpos = 0;
  addEventListener("keydown", (e) => {
    // Shift / Caps Lock / held-key repeats must not break the sequence, and "B A" counts as "b a"
    if (e.repeat || ["Shift", "CapsLock", "Control", "Alt", "Meta"].includes(e.key)) return;
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    kpos = key === konami[kpos] ? kpos + 1 : key === konami[0] ? 1 : 0;
    if (kpos === konami.length) { kpos = 0; toggleMatrix(); }
  });

  /* ================= COMMAND PALETTE ================= */
  const cmdk = $("#cmdk"), cin = $("#cmdkInput"), clist = $("#cmdkList");
  const go = (id) => () => document.getElementById(id).scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  const open = (u) => () => window.open(u, "_blank", "noopener");
  const commands = [
    ["Go to work", "section", go("work")],
    ["Go to experience", "section", go("experience")],
    ["Go to stack", "section", go("stack")],
    ["Go to contact", "section", go("contact")],
    ["Open GitHub", "link", open("https://github.com/beyondparthiv")],
    ["StockXchange source", "repo", open("https://github.com/beyondparthiv/StockXchange")],
    ["Daybook source", "repo", open("https://github.com/beyondparthiv/DayBook")],
    ["HabitFlow source", "repo", open("https://github.com/beyondparthiv/HabitFlow")],
    ["Copy email", "action", copyEmail],
    ["Toggle matrix mode", "fun", toggleMatrix],
    ["Explode particles", "fun", () => { go("hero")(); $("#hero").click(); }],
  ];
  let filtered = commands, active = 0;
  const render = () => {
    clist.innerHTML = filtered.map((c, i) => `<li class="${i === active ? "active" : ""}" data-i="${i}">${c[0]}<small>${c[1]}</small></li>`).join("") || "<li><small>no results</small></li>";
  };
  const openCmdk = () => { cmdk.hidden = false; cin.value = ""; filtered = commands; active = 0; render(); setTimeout(() => cin.focus(), 10); };
  const closeCmdk = () => (cmdk.hidden = true);
  const run = (i) => { const c = filtered[i]; if (c) { closeCmdk(); c[2](); } };
  $("#cmdOpen").addEventListener("click", openCmdk);
  addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); cmdk.hidden ? openCmdk() : closeCmdk(); }
    else if (!cmdk.hidden) {
      if (e.key === "Escape") closeCmdk();
      if (e.key === "ArrowDown") { e.preventDefault(); active = (active + 1) % filtered.length; render(); }
      if (e.key === "ArrowUp") { e.preventDefault(); active = (active - 1 + filtered.length) % filtered.length; render(); }
      if (e.key === "Enter") run(active);
    }
  });
  cin.addEventListener("input", () => { const q = cin.value.toLowerCase(); filtered = commands.filter((c) => (c[0] + c[1]).toLowerCase().includes(q)); active = 0; render(); });
  clist.addEventListener("click", (e) => { const li = e.target.closest("li[data-i]"); if (li) run(+li.dataset.i); });
  cmdk.addEventListener("click", (e) => { if (e.target === cmdk) closeCmdk(); });

  /* ================= TERMINAL ================= */
  const term = $("#term"), tin = $("#termInput"), tout = $("#termOut");
  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const chip = (c) => `<button type="button" class="term__chip" data-run="${c}">${c}</button>`;
  const T = {
    help: () => "commands: " + ["whoami", "ls", "skills", "contact", "github", "matrix", "clear", "sudo hire-me"].map(chip).join(""),
    whoami: () => "parthiv modi: grad CS @ northeastern, full-stack engineer, intern @ ipserlab.",
    ls: () => "stockxchange/  daybook/  habitflow/  bookmycourt/  calendar-app/  analytics-dashboard/ (planned)",
    skills: () => "ts · js · python · java · c/c++ · sql · php · react · next.js · tailwind · fastapi · express · postgres · mysql · mongodb · firebase · pandas · android · llm apis",
    contact: () => { copyEmail(); return `email: <b>${EMAIL}</b> (copied)`; },
    github: () => { open("https://github.com/beyondparthiv")(); return "opening github.com/beyondparthiv…"; },
    matrix: () => { toggleMatrix(); return "follow the white rabbit."; },
    clear: () => { tout.innerHTML = ""; return null; },
    "sudo hire-me": () => { setTimeout(() => go("contact")(), 400); return "[sudo] password for recruiter: ******<br/><b>access granted.</b> great choice. → " + EMAIL; },
  };
  const history = []; let hpos = 0;
  function runCmd(raw) {
    const q = raw.trim().toLowerCase();
    if (!q) return;
    history.push(q); hpos = history.length;
    const p = document.createElement("p"); p.className = "cmd"; p.textContent = "~ $ " + q; tout.appendChild(p);
    let ans;
    if (T[q]) ans = T[q]();
    else if (q.startsWith("cat ")) ans = `${esc(q.slice(4))}: see the work section above ↑`;
    else if (q === "rm -rf /" || q.startsWith("sudo rm")) ans = "nice try. 🙂";
    else ans = `command not found: ${esc(q)}. try ${chip("help")}`;
    if (ans !== null) { const r = document.createElement("p"); r.innerHTML = ans; tout.appendChild(r); }
    tout.scrollTop = tout.scrollHeight;
  }
  // tapping a command types it out, then runs it, so it still feels like a terminal
  let typing = false;
  function typeAndRun(cmd) {
    if (typing) return;
    typing = true; tin.focus(); tin.value = "";
    let i = 0;
    const step = () => {
      tin.value = cmd.slice(0, ++i);
      if (i < cmd.length && !reduced) setTimeout(step, 38);
      else { setTimeout(() => { runCmd(tin.value); tin.value = ""; typing = false; }, reduced ? 0 : 160); }
    };
    reduced ? (tin.value = cmd, runCmd(cmd), tin.value = "", typing = false) : step();
  }
  tin.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { runCmd(tin.value); tin.value = ""; }
    else if (e.key === "ArrowUp" && history.length) { e.preventDefault(); hpos = Math.max(0, hpos - 1); tin.value = history[hpos]; }
    else if (e.key === "ArrowDown" && history.length) { e.preventDefault(); hpos = Math.min(history.length, hpos + 1); tin.value = history[hpos] || ""; }
  });
  term.addEventListener("click", (e) => {
    const c = e.target.closest(".term__chip");
    if (c) return typeAndRun(c.dataset.run);
    if (!getSelection().toString()) tin.focus({ preventScroll: true });
  });
  tin.addEventListener("focus", () => term.classList.add("is-focus"));
  tin.addEventListener("blur", () => term.classList.remove("is-focus"));

  console.log("%c hey, fellow dev 👋 ", "background:#c6ff3d;color:#07080a;font:700 14px monospace;padding:6px");
  console.log("Press Ctrl+K anywhere, or try the konami code. Source is unminified, have a look.");
})();
