/* StockXchange demo terminal: a tiny, self-contained version of the real game loop.
   Days have 2 rounds. Each day opens with a headline that may be true or fake; the market
   drifts on the rumor, then the truth is revealed at the closing bell and prices settle. */
(() => {
  const root = document.getElementById("sx");
  if (!root) return;
  const $ = (id) => document.getElementById(id);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const TICK = reduced ? 900 : 420;          // ms per price tick
  const PER_CANDLE = 5;                      // ticks per candle
  const ROUND_TICKS = Math.round(18000 / TICK);
  const MAX_CANDLES = 34;
  const LOT = 10, SHORT_LIMIT = 50, START = 10000, DAYS = 3;

  const money = (n, d = 2) => (n < 0 ? "−$" : "$") + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  const pct = (n) => (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) * 1.15;
  const pick = (a) => a[(Math.random() * a.length) | 0];

  const companies = [
    ["AAPL", "Apple", 228, 0.010], ["META", "Meta", 590, 0.015], ["TSLA", "Tesla", 330, 0.022], ["NVDA", "Nvidia", 135, 0.019],
    ["AMZN", "Amazon", 205, 0.013], ["MSFT", "Microsoft", 430, 0.009], ["GOOGL", "Alphabet", 175, 0.012], ["CVS", "CVS Health", 64, 0.014],
  ].map(([s, n, p, v]) => ({ s, n, p, v, base: p, dayOpen: p, drift: 0, candles: [], cur: null, last: p }));

  // game headlines only: market-event flavor, never allegations of wrongdoing against a real company
  const GOOD = ["{n} beats earnings estimates", "{n} announces a surprise buyback", "{n} unveils a blockbuster product", "Analysts upgrade {n} to strong buy", "{n} raises full-year guidance"];
  const BAD = ["{n} misses revenue estimates", "Supply-chain delays hit {n} shipments", "Analysts downgrade {n} to sell", "{n} cuts full-year guidance", "{n} launch event underwhelms investors"];

  let cash, pos, markers, players, day, round, roundTick, tickCount, candleId, paused, news, selected, roundStartNet, hoverX = null;

  /* ---------- setup ---------- */
  function seedCompany(c) {
    c.candles = []; c.drift = 0;
    let p = c.base * (0.92 + Math.random() * 0.16);
    for (let i = 0; i < MAX_CANDLES - 4; i++) {
      const o = p; let h = p, l = p;
      for (let k = 0; k < PER_CANDLE; k++) { p *= 1 + gauss() * c.v * 0.6; h = Math.max(h, p); l = Math.min(l, p); }
      c.candles.push({ id: candleId++, o, h, l, c: p, vol: 0.3 + Math.random() * 0.7 });
    }
    c.p = c.last = c.dayOpen = p;
    c.cur = { id: candleId++, o: p, h: p, l: p, c: p, vol: 0.2 };
  }

  function newGame() {
    candleId = 0; cash = START; pos = {}; markers = []; day = 1; round = 1; tickCount = 0; paused = false;
    companies.forEach(seedCompany);
    players = [
      { name: "you", net: START, you: true },
      { name: "bull_run_99", net: START, bias: 0.0006 },
      { name: "diamond_hands", net: START, bias: 0 },
      { name: "short_king", net: START, bias: -0.0002 },
    ];
    if (selected == null) selected = 0;
    startDay();
  }

  function startDay() {
    round = 1; roundTick = 0;
    const c = pick(companies), good = Math.random() < 0.5;
    news = { c, sign: good ? 1 : -1, truth: Math.random() < 0.6 };
    companies.forEach((co) => { co.drift = 0; co.dayOpen = co.p; });
    c.drift = news.sign * 0.0016 * (TICK / 420);           // the market believes the rumor... for now
    const head = $("sxNews");
    head.textContent = `$${c.s} · ` + pick(good ? GOOD : BAD).replace("{n}", c.n);
    head.classList.remove("is-new"); void head.offsetWidth; head.classList.add("is-new");
    $("sxStamp").className = "sx__stamp"; $("sxStamp").textContent = "";
    roundStartNet = netWorth();
    renderAll();
  }

  /* ---------- simulation ---------- */
  function netWorth() { return companies.reduce((sum, c) => sum + (pos[c.s] || 0) * c.p, cash); }

  function step() {
    if (paused || !running) return;
    companies.forEach((c, i) => {
      c.last = c.p;
      c.p = Math.max(5, c.p * (1 + gauss() * c.v * 0.6 + c.drift));
      const k = c.cur; k.c = c.p; k.h = Math.max(k.h, c.p); k.l = Math.min(k.l, c.p); k.vol += Math.abs(c.p - c.last) / c.p * 40;
      flashCell(i, c.p >= c.last);
    });
    if (++tickCount % PER_CANDLE === 0) {
      companies.forEach((c) => {
        c.candles.push(c.cur);
        if (c.candles.length > MAX_CANDLES) c.candles.shift();
        c.cur = { id: candleId, o: c.p, h: c.p, l: c.p, c: c.p, vol: 0.2 };
      });
      candleId++;
    }
    players.forEach((p) => { if (!p.you) p.net *= 1 + gauss() * 0.0025 + p.bias; });
    players[0].net = netWorth();
    roundTick++;
    renderAll();
    if (roundTick >= ROUND_TICKS) endRound();
  }

  function endRound() {
    paused = true;
    const before = netWorth();
    if (round === 1) {
      const d = (before - roundStartNet) / roundStartNet * 100;
      splash("Round 1 settled", `net worth ${money(before, 0)} · ${pct(d)} this round`, 1500, d > 0.3 ? "win" : "");
      setTimeout(() => { round = 2; roundTick = 0; roundStartNet = netWorth(); paused = false; renderAll(); }, 1700);
      return;
    }
    // closing bell: reveal the headline and settle the price
    const { c, sign, truth } = news;
    const jump = truth ? sign * (0.06 + Math.random() * 0.06) : -sign * (0.05 + Math.random() * 0.06);
    c.drift = 0;
    c.p *= 1 + jump; c.cur.c = c.p; c.cur.h = Math.max(c.cur.h, c.p); c.cur.l = Math.min(c.cur.l, c.p); c.cur.vol += 3;
    companies.forEach((o) => { if (o !== c) { o.p *= 1 + gauss() * o.v; o.cur.c = o.p; o.cur.h = Math.max(o.cur.h, o.p); o.cur.l = Math.min(o.cur.l, o.p); } });
    players.forEach((p) => { if (!p.you) p.net *= 1 + gauss() * 0.04 + p.bias * 10; });
    players[0].net = netWorth();
    const stamp = $("sxStamp");
    stamp.textContent = truth ? "TRUE" : "FAKE";
    stamp.className = "sx__stamp " + (truth ? "is-true" : "is-fake");
    selectCompany(companies.indexOf(c));
    renderAll();

    const delta = netWorth() - before;
    if (Math.abs(delta) > 1) reward(delta);
    const shock = Math.abs(jump) > 0.085;
    const move = `${c.s} ${jump > 0 ? "▲" : "▼"} ${Math.abs(jump * 100).toFixed(1)}%`;
    const finalDay = day >= DAYS;
    setTimeout(() => {
      if (finalDay) return finalBell();
      splash(shock ? "Market shock" : `Day ${day} closed`, `${truth ? "news was TRUE" : "rumor busted"} · ${move}`, shock ? 2000 : 1700, shock ? "shock" : "");
      setTimeout(() => { day++; paused = false; startDay(); }, shock ? 2200 : 1900);
    }, 750);
  }

  function finalBell() {
    const ranked = [...players].sort((a, b) => b.net - a.net);
    const rank = ranked.findIndex((p) => p.you) + 1;
    const net = netWorth();
    splash(rank === 1 ? "You win" : "Final bell", `you finished #${rank} of ${players.length} · ${money(net, 0)} (${pct((net - START) / START * 100)})`, 3200, rank === 1 ? "win" : "");
    if (rank === 1) coins(28, root.clientWidth / 2, root.clientHeight / 2);
    setTimeout(newGame, 3500);
  }

  /* ---------- player actions ---------- */
  function act(type, btn) {
    btn = btn || root.querySelector(`[data-act="${type}"]`);
    btn.classList.add("is-pressed"); setTimeout(() => btn.classList.remove("is-pressed"), 130);
    if (paused) return deny(btn, "market closed");
    const c = companies[selected], held = pos[c.s] || 0, price = c.p;
    if (type === "buy") {
      if (cash < price * LOT) return deny(btn, "not enough cash");
      cash -= price * LOT; pos[c.s] = held + LOT;
      float(btn, `+${LOT} ${c.s} @ ${money(price)}`, "up");
      markers.push({ s: c.s, id: c.cur.id, price, type: "buy" });
    } else if (type === "sell") {
      if (held <= 0) return deny(btn, held < 0 ? "you're short, BUY to cover" : "no shares, try SHORT");
      const q = Math.min(LOT, held);
      cash += price * q; pos[c.s] = held - q;
      float(btn, `−${q} ${c.s} @ ${money(price)}`, "down");
      markers.push({ s: c.s, id: c.cur.id, price, type: "sell" });
    } else if (type === "short") {
      if (held > 0) return deny(btn, "SELL your shares first");
      if (held <= -SHORT_LIMIT) return deny(btn, "short limit reached");
      cash += price * LOT; pos[c.s] = held - LOT;
      float(btn, `SHORT ${LOT} ${c.s}`, "down");
      markers.push({ s: c.s, id: c.cur.id, price, type: "sell" });
    } else {
      float(btn, "PASS", "");
    }
    if (markers.length > 40) markers.shift();
    players[0].net = netWorth();
    renderAll();
  }

  function deny(btn, msg) {
    btn.classList.remove("is-denied"); void btn.offsetWidth; btn.classList.add("is-denied");
    float(btn, msg, "down");
  }

  function selectCompany(i) { selected = i; renderAll(); }

  /* ---------- effects ---------- */
  const fx = $("sxFx");
  function pointIn(el) {
    const r = el.getBoundingClientRect(), R = root.getBoundingClientRect();
    return [r.left - R.left + r.width / 2, r.top - R.top];
  }
  function float(el, text, tone) {
    const [x, y] = pointIn(el);
    const f = document.createElement("span");
    f.className = "sx__float " + tone;
    f.style.left = x + "px"; f.style.top = y + "px";
    if (!tone) f.style.color = "var(--muted)";
    f.textContent = text;
    fx.appendChild(f);
    f.addEventListener("animationend", () => f.remove());
  }
  function coins(n, x, y) {
    if (reduced) return;
    for (let i = 0; i < n; i++) {
      const c = document.createElement("span");
      c.className = "sx__coin"; c.textContent = "$";
      c.style.left = x + "px"; c.style.top = y + "px";
      c.style.setProperty("--dx", (Math.random() - 0.5) * 260 + "px");
      c.style.setProperty("--dy", -40 - Math.random() * 160 + "px");
      c.style.setProperty("--rot", (Math.random() - 0.5) * 720 + "deg");
      c.style.animationDelay = Math.random() * 120 + "ms";
      fx.appendChild(c);
      c.addEventListener("animationend", () => c.remove());
    }
  }
  function reward(delta) {
    const cls = delta > 0 ? "flash-up" : "flash-down";
    root.classList.remove("flash-up", "flash-down", "is-shake"); void root.offsetWidth;
    root.classList.add(cls);
    const net = $("sxNet");
    float(net, (delta > 0 ? "+" : "−") + money(Math.abs(delta), 0), delta > 0 ? "up" : "down");
    if (delta > 0) { const [x, y] = pointIn(net); coins(14, x, y + 10); }
    else if (!reduced) root.classList.add("is-shake");
  }
  let splashTimer;
  function splash(title, sub, ms, mood) {
    const s = $("sxSplash");
    s.querySelector("b").textContent = title;
    s.querySelector("span").textContent = sub;
    s.className = "sx__splash is-on" + (mood ? " is-" + mood : "");
    clearTimeout(splashTimer);
    splashTimer = setTimeout(() => (s.className = "sx__splash"), ms);
  }

  /* ---------- rendering ---------- */
  const watch = $("sxWatch");
  const rows = companies.map((c, i) => {
    const b = document.createElement("button");
    b.className = "sx__row"; b.type = "button";
    b.innerHTML = `<b>${c.s}</b><span class="px"></span><small class="nm"></small><small class="ch"></small>`;
    b.addEventListener("click", () => selectCompany(i));
    watch.appendChild(b);
    return { b, px: b.querySelector(".px"), nm: b.querySelector(".nm"), ch: b.querySelector(".ch") };
  });
  function flashCell(i, up) {
    const px = rows[i].px;
    px.classList.remove("flash-up", "flash-down"); void px.offsetWidth;
    px.classList.add(up ? "flash-up" : "flash-down");
  }

  const board = $("sxBoard");
  const boardRows = new Map();
  function renderBoard() {
    const ranked = [...players].sort((a, b) => b.net - a.net);
    ranked.forEach((p, i) => {
      let li = boardRows.get(p.name);
      if (!li) { li = document.createElement("li"); board.appendChild(li); boardRows.set(p.name, li); }
      li.className = (p.you ? "is-you" : "") + (i === 0 ? " is-top" : "");
      li.style.transform = `translateY(${i * 23}px)`;
      li.innerHTML = `<span class="rk">${i === 0 ? "★" : i + 1}</span><span class="nm">${p.name}</span><span>${money(p.net, 0)}</span>`;
    });
  }

  let lastShown = null;
  function renderAll() {
    const c = companies[selected];
    $("sxDay").textContent = day; $("sxRound").textContent = round;
    const left = Math.max(0, Math.ceil((ROUND_TICKS - roundTick) * TICK / 1000));
    const hot = left <= 5;
    $("sxClock").textContent = "00:" + String(left).padStart(2, "0");
    $("sxClock").classList.toggle("is-hot", hot && !paused);
    $("sxTimer").style.transform = `scaleX(${1 - roundTick / ROUND_TICKS})`;
    $("sxTimer").classList.toggle("is-hot", hot);

    const ch = (c.p - c.dayOpen) / c.dayOpen * 100;
    $("sxSym").textContent = c.s; $("sxName").textContent = c.n;
    const priceEl = $("sxPrice");
    priceEl.textContent = money(c.p);
    priceEl.className = lastShown && lastShown.s === c.s ? (c.p >= lastShown.p ? "tick-up" : "tick-down") : "";
    lastShown = { s: c.s, p: c.p };
    const chEl = $("sxChg"); chEl.textContent = pct(ch); chEl.className = ch >= 0 ? "up" : "down";

    companies.forEach((co, i) => {
      const r = rows[i], held = pos[co.s] || 0, d = (co.p - co.dayOpen) / co.dayOpen * 100;
      r.b.classList.toggle("is-active", i === selected);
      r.px.textContent = co.p.toFixed(2);
      r.ch.textContent = pct(d); r.ch.className = "ch " + (d >= 0 ? "up" : "down");
      r.nm.innerHTML = held > 0 ? `<span class="held">${held} held</span>` : held < 0 ? `<span class="shorted">${-held} short</span>` : (news && news.c === co ? '<span class="shorted">● in the news</span>' : co.n);
    });

    const net = netWorth(), pnl = (net - START) / START * 100, held = pos[c.s] || 0;
    $("sxCash").textContent = money(cash, 0);
    const posEl = $("sxPos");
    posEl.textContent = held === 0 ? `0 ${c.s}` : held > 0 ? `${held} ${c.s}` : `${held} ${c.s}`;
    posEl.className = held > 0 ? "up" : held < 0 ? "down" : "";
    $("sxNet").textContent = money(net, 0);
    const pnlEl = $("sxPnl"); pnlEl.textContent = pct(pnl); pnlEl.className = pnl >= 0 ? "up" : "down";
    renderBoard();
    drawChart();
  }

  /* ---------- candlestick chart ---------- */
  const cvs = $("sxCanvas"), ctx = cvs.getContext("2d");
  const css = getComputedStyle(document.documentElement);
  const UP = css.getPropertyValue("--acid").trim() || "#c6ff3d";
  const DOWN = css.getPropertyValue("--ember").trim() || "#ff5b2e";
  function drawChart() {
    const d = Math.min(devicePixelRatio || 1, 2), W = cvs.clientWidth, H = cvs.clientHeight;
    if (!W) return;
    if (cvs.width !== Math.round(W * d) || cvs.height !== Math.round(H * d)) { cvs.width = Math.round(W * d); cvs.height = Math.round(H * d); }
    ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const c = companies[selected], list = [...c.candles, c.cur];
    const AX = 56, padT = 12, volH = H * 0.16, plotH = H - padT - volH - 16, plotW = W - AX - 10;
    let lo = Infinity, hi = -Infinity;
    list.forEach((k) => { lo = Math.min(lo, k.l); hi = Math.max(hi, k.h); });
    const span = (hi - lo) || 1; lo -= span * 0.08; hi += span * 0.08;
    const Y = (p) => padT + (hi - p) / (hi - lo) * plotH;
    const slot = plotW / MAX_CANDLES, cw = Math.max(2, slot * 0.62);
    const X = (i) => 10 + (MAX_CANDLES - list.length + i) * slot + slot / 2;

    ctx.font = "10px 'JetBrains Mono', monospace"; ctx.textBaseline = "middle";
    for (let g = 0; g <= 4; g++) {
      const p = lo + (hi - lo) * g / 4, y = Y(p);
      ctx.strokeStyle = "#161a1e"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W - AX, y); ctx.stroke();
      ctx.fillStyle = "#4d535a"; ctx.fillText(p.toFixed(1), W - AX + 8, y);
    }
    const maxVol = Math.max(...list.map((k) => k.vol)) || 1;
    list.forEach((k, i) => {
      const x = X(i), up = k.c >= k.o, col = up ? UP : DOWN;
      ctx.globalAlpha = 0.18; ctx.fillStyle = col;
      const vh = k.vol / maxVol * volH; ctx.fillRect(x - cw / 2, H - 6 - vh, cw, vh);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(x, Y(k.h)); ctx.lineTo(x, Y(k.l)); ctx.stroke();
      const top = Y(Math.max(k.o, k.c)), bh = Math.max(1.5, Math.abs(Y(k.o) - Y(k.c)));
      if (up) { ctx.fillStyle = "#090b0d"; ctx.fillRect(x - cw / 2, top, cw, bh); ctx.strokeRect(x - cw / 2 + .5, top + .5, cw - 1, bh - 1); }
      else { ctx.fillStyle = col; ctx.fillRect(x - cw / 2, top, cw, bh); }
      if (i === list.length - 1 && !reduced) { ctx.shadowColor = col; ctx.shadowBlur = 12; ctx.fillStyle = col; ctx.fillRect(x - cw / 2, top, cw, bh); ctx.shadowBlur = 0; }
    });
    // your trades
    markers.filter((m) => m.s === c.s).forEach((m) => {
      const i = list.findIndex((k) => k.id === m.id); if (i < 0) return;
      const x = X(i), buy = m.type === "buy", y = buy ? Y(list[i].l) + 9 : Y(list[i].h) - 9;
      ctx.fillStyle = buy ? UP : DOWN; ctx.beginPath();
      if (buy) { ctx.moveTo(x, y - 5); ctx.lineTo(x - 5, y + 4); ctx.lineTo(x + 5, y + 4); }
      else { ctx.moveTo(x, y + 5); ctx.lineTo(x - 5, y - 4); ctx.lineTo(x + 5, y - 4); }
      ctx.fill();
    });
    // last price line + tag
    const ly = Y(c.p), lc = c.p >= c.dayOpen ? UP : DOWN;
    ctx.setLineDash([3, 4]); ctx.strokeStyle = lc; ctx.globalAlpha = 0.6;
    ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(W - AX, ly); ctx.stroke();
    ctx.setLineDash([]); ctx.globalAlpha = 1;
    ctx.fillStyle = lc; ctx.fillRect(W - AX + 2, ly - 9, AX - 4, 18);
    ctx.fillStyle = "#07080a"; ctx.font = "600 10px 'JetBrains Mono', monospace"; ctx.fillText(c.p.toFixed(2), W - AX + 7, ly);

    // crosshair + OHLC readout
    const ohlc = $("sxOhlc");
    if (hoverX != null && hoverX < W - AX) {
      const i = Math.max(0, Math.min(list.length - 1, Math.round((hoverX - 10 - slot / 2) / slot - (MAX_CANDLES - list.length))));
      const k = list[i], x = X(i);
      ctx.strokeStyle = "rgba(236,232,223,.25)"; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, H - 6); ctx.stroke(); ctx.setLineDash([]);
      ohlc.textContent = `O ${k.o.toFixed(2)}  H ${k.h.toFixed(2)}  L ${k.l.toFixed(2)}  C ${k.c.toFixed(2)}`;
    } else ohlc.textContent = `day open ${c.dayOpen.toFixed(2)} · ${PER_CANDLE * TICK / 1000}s candles`;
  }
  cvs.addEventListener("pointermove", (e) => { hoverX = e.clientX - cvs.getBoundingClientRect().left; drawChart(); });
  cvs.addEventListener("pointerleave", () => { hoverX = null; drawChart(); });
  addEventListener("resize", drawChart);

  /* ---------- wiring ---------- */
  root.querySelectorAll("[data-act]").forEach((b) => b.addEventListener("click", () => act(b.dataset.act, b)));

  let running = false, inView = false;
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; running = inView && !document.hidden; }, { threshold: 0.2 }).observe(root);
  document.addEventListener("visibilitychange", () => { running = inView && !document.hidden; });

  const KEYS = { b: "buy", s: "sell", x: "short", p: "pass" };
  addEventListener("keydown", (e) => {
    const k = KEYS[e.key.toLowerCase()];
    if (!k || !inView || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest("input, textarea, [contenteditable]")) return;
    const cmdk = document.getElementById("cmdk"); if (cmdk && !cmdk.hidden) return;
    act(k);
  });

  newGame();
  setInterval(step, TICK);
})();
