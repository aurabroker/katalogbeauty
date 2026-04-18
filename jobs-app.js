/* ================================================================
   BeautyKatalog · jobs-app.js  v1.0
   Publiczna lista ogłoszeń pracy w branży beauty
================================================================ */
(function () {
"use strict";

const { sb, BK } = window;

const LOOKING_COLOR = "#0891b2"; // cyan  — szukam pracy
const HIRING_COLOR  = "#7c3aed"; // violet — zatrudnię

let allJobs = [], filtered = [];
let filterType = "", filterCity = "", searchQ = "";
const PER_PAGE = 12;
let page = 0;

/* ── SHELL ─────────────────────────────────────────────────── */
function buildShell() {
  BK.nav("jobs");
  document.body.insertAdjacentHTML("beforeend", `
    <!-- HERO -->
    <section style="background:linear-gradient(135deg,#164e63 0%,#0891b2 50%,#7c3aed 100%);padding:3.5rem 0 2.5rem;color:#fff">
      <div class="bk-container">
        <p style="font-size:.75rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;opacity:.7;margin-bottom:.4rem">BeautyKatalog · Praca</p>
        <h1 style="font-size:clamp(1.7rem,4vw,2.6rem);margin-bottom:.5rem">Praca w branży beauty</h1>
        <p style="opacity:.85;max-width:500px;margin-bottom:1.75rem;font-size:.95rem">Ogłoszenia dla fryzjerów, kosmetologów, wizażystów, podologów i nie tylko.</p>
        <div style="display:flex;gap:.6rem;max-width:560px;flex-wrap:wrap">
          <input id="bk-search" type="search" placeholder="Stanowisko, miasto, słowo kluczowe..."
            style="flex:1;min-width:200px;padding:.75rem 1rem;border:none;border-radius:.65rem;font-size:.9rem;outline:none;font-family:inherit"
            aria-label="Szukaj ogłoszeń">
          <button onclick="JOB.search()" class="bk-btn"
            style="background:#fff;color:#0891b2;font-weight:700;border-radius:.65rem;padding:.75rem 1.4rem;flex-shrink:0">
            Szukaj
          </button>
        </div>
      </div>
    </section>

    <!-- FILTRY -->
    <div style="background:#fff;border-bottom:1px solid var(--border);position:sticky;top:58px;z-index:90">
      <div class="bk-container" style="padding-top:.6rem;padding-bottom:.6rem;display:flex;align-items:center;gap:.6rem;flex-wrap:wrap">

        <!-- Typ -->
        <div style="display:flex;gap:.35rem">
          <button id="btn-all"     onclick="JOB.setType('')"        class="bk-btn" style="padding:.35rem .85rem;font-size:.8rem;background:var(--v);color:#fff">Wszystkie</button>
          <button id="btn-hiring"  onclick="JOB.setType('hiring')"  class="bk-btn bk-btn-outline" style="padding:.35rem .85rem;font-size:.8rem">💼 Zatrudnię</button>
          <button id="btn-looking" onclick="JOB.setType('looking')" class="bk-btn bk-btn-outline" style="padding:.35rem .85rem;font-size:.8rem">🙋 Szukam pracy</button>
        </div>

        <!-- Miasto -->
        <select id="bk-city" onchange="JOB.search()" class="bk-input" style="width:auto;min-width:150px;font-size:.8rem">
          <option value="">Wszystkie miasta</option>
        </select>

        <span id="bk-count" style="font-size:.8rem;color:var(--muted);font-weight:600;margin-left:auto"></span>

        <a href="job-panel.html" class="bk-btn bk-btn-primary" style="font-size:.8rem;padding:.4rem .9rem;flex-shrink:0">+ Dodaj ogłoszenie</a>
      </div>
    </div>

    <!-- GRID -->
    <main class="bk-container" style="padding-top:1.75rem;padding-bottom:3rem">
      <div id="jobs-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.1rem" role="list"></div>
      <div id="jobs-more" style="text-align:center;margin-top:2rem;display:none">
        <button onclick="JOB.loadMore()" class="bk-btn bk-btn-outline" style="padding:.65rem 2rem">Załaduj więcej</button>
      </div>
    </main>

    <footer class="bk-footer">© 2026 BeautyKatalog · <a href="index.html">Katalog salonów</a></footer>
  `);

  document.getElementById("bk-search").addEventListener("keydown", e => {
    if (e.key === "Enter") JOB.search();
  });
}

/* ── FETCH ─────────────────────────────────────────────────── */
async function fetchJobs() {
  document.getElementById("jobs-grid").innerHTML =
    `<div class="bk-spinner" style="grid-column:1/-1"></div>`;

  const { data, error } = await sb
    .from("job_listings")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    document.getElementById("jobs-grid").innerHTML =
      `<div class="bk-empty" style="grid-column:1/-1"><h3>Błąd ładowania</h3><p>${BK.esc(error.message)}</p></div>`;
    return;
  }

  allJobs = data ?? [];
  fillCities();
  applyFilters();
}

function fillCities() {
  const sel = document.getElementById("bk-city");
  const cities = [...new Set(allJobs.map(j => j.city).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pl"));
  cities.forEach(c => {
    const o = document.createElement("option");
    o.value = c; o.textContent = c;
    sel.appendChild(o);
  });
}

/* ── FILTRY ────────────────────────────────────────────────── */
function applyFilters() {
  const q = searchQ.trim().toLowerCase();
  filtered = allJobs.filter(j => {
    if (filterType && j.type !== filterType) return false;
    if (filterCity && j.city !== filterCity) return false;
    if (q && !`${j.title} ${j.city} ${j.description ?? ""}`.toLowerCase().includes(q)) return false;
    return true;
  });
  page = 0;
  const n = filtered.length;
  document.getElementById("bk-count").textContent =
    n === 0 ? "Brak ogłoszeń" : n === 1 ? "1 ogłoszenie" : n < 5 ? `${n} ogłoszenia` : `${n} ogłoszeń`;
  renderCards(true);
}

/* ── KARTY ─────────────────────────────────────────────────── */
function renderCards(reset) {
  const grid = document.getElementById("jobs-grid");
  const end  = (page + 1) * PER_PAGE;
  if (reset) {
    grid.innerHTML = filtered.length === 0
      ? `<div class="bk-empty" style="grid-column:1/-1"><h3>Brak ogłoszeń</h3><p>Spróbuj innych filtrów lub <a href="job-panel.html" style="color:var(--v)">dodaj pierwsze ogłoszenie</a>.</p></div>`
      : filtered.slice(0, end).map(card).join("");
  } else {
    filtered.slice(page * PER_PAGE, end).forEach(j => grid.insertAdjacentHTML("beforeend", card(j)));
  }
  document.getElementById("jobs-more").style.display = filtered.length > end ? "block" : "none";
}

function card(j) {
  const isHiring  = j.type === "hiring";
  const typeColor = isHiring ? HIRING_COLOR : LOOKING_COLOR;
  const typeLabel = isHiring ? "💼 Zatrudnię" : "🙋 Szukam pracy";
  const typeTag   = isHiring ? "hiring" : "szukam";

  const salary = j.salary_from
    ? (j.salary_to && j.salary_to !== j.salary_from
        ? `${j.salary_from}–${j.salary_to} zł`
        : `od ${j.salary_from} zł`)
    : "";

  const empMap = { uop: "Umowa o pracę", b2b: "B2B", zlecenie: "Zlecenie", dowolna: "Dowolna" };
  const emp = j.employment ? empMap[j.employment] ?? "" : "";

  const ago = timeAgo(j.created_at);

  return `
    <div role="listitem" class="bk-card"
      style="display:flex;flex-direction:column;padding:1.25rem;gap:.75rem;transition:transform .2s,box-shadow .2s;cursor:default"
      onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 28px rgba(0,0,0,.1)'"
      onmouseout="this.style.transform='';this.style.boxShadow=''">

      <div style="display:flex;align-items:center;justify-content:space-between;gap:.5rem">
        <span style="font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#fff;background:${typeColor};padding:.2rem .6rem;border-radius:9999px">${typeLabel}</span>
        <span style="font-size:.72rem;color:var(--muted)">${ago}</span>
      </div>

      <div>
        <h2 style="font-size:1rem;margin-bottom:.25rem">${BK.esc(j.title)}</h2>
        <p style="font-size:.82rem;color:var(--muted)">📍 ${BK.esc(j.city)}${j.voivodeship ? `, ${BK.esc(j.voivodeship)}` : ""}</p>
      </div>

      ${j.description ? `<p style="font-size:.82rem;color:#475569;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">${BK.esc(j.description)}</p>` : ""}

      <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:auto">
        ${salary ? `<span class="bk-badge" style="background:#f0fdf4;color:#15803d">💰 ${salary}</span>` : ""}
        ${emp    ? `<span class="bk-badge" style="background:#f8fafc;color:var(--muted)">${emp}</span>` : ""}
      </div>

      <div style="border-top:1px solid var(--border);padding-top:.75rem;display:flex;gap:.6rem;flex-wrap:wrap">
        ${j.phone ? `<a href="tel:${BK.esc(j.phone)}" class="bk-btn bk-btn-primary" style="font-size:.8rem;padding:.35rem .85rem;background:${typeColor}">📞 ${BK.esc(j.phone)}</a>` : ""}
        ${j.email ? `<a href="mailto:${BK.esc(j.email)}" class="bk-btn bk-btn-outline" style="font-size:.8rem;padding:.35rem .85rem">✉️ Email</a>` : ""}
      </div>
    </div>`;
}

/* ── UTILS ─────────────────────────────────────────────────── */
function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60)   return `${m} min temu`;
  const h = Math.floor(m / 60);
  if (h < 24)   return `${h} godz. temu`;
  const d = Math.floor(h / 24);
  if (d < 30)   return `${d} dni temu`;
  return new Date(iso).toLocaleDateString("pl-PL");
}

/* ── PUBLICZNE API ─────────────────────────────────────────── */
window.JOB = {
  search() {
    searchQ    = document.getElementById("bk-search").value;
    filterCity = document.getElementById("bk-city").value;
    applyFilters();
  },
  setType(t) {
    filterType = t;
    // Podświetl aktywny button
    ["all","hiring","looking"].forEach(id => {
      const btn = document.getElementById(`btn-${id}`);
      const active = (id === "all" && t === "") || id === t;
      btn.style.background = active ? "var(--v)" : "#fff";
      btn.style.color      = active ? "#fff"     : "var(--v)";
      btn.style.border     = active ? "1.5px solid var(--v)" : "1.5px solid var(--v)";
    });
    applyFilters();
  },
  loadMore() { page++; renderCards(false); }
};

buildShell();
fetchJobs();

})();
