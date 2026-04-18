/* ================================================================
   BeautyKatalog · salon-app.js  v1.0
   Profil pojedynczego salonu: zdjęcia, zabiegi, kontakt, mapa
================================================================ */
(function () {
"use strict";

const { sb, BK } = window;

/* ── ID z URL ──────────────────────────────────────────────── */
const params   = new URLSearchParams(location.search);
const salonId  = params.get("id");

if (!salonId) {
  location.href = "index.html";
  return;
}

/* ── BOOT ──────────────────────────────────────────────────── */
BK.nav("index");
buildShell();
fetchSalon();

/* ── SHELL ─────────────────────────────────────────────────── */
function buildShell() {
  document.body.insertAdjacentHTML("beforeend", `
    <div id="salon-wrap">
      <div class="bk-spinner"></div>
    </div>
    <footer class="bk-footer">
      © 2026 BeautyKatalog by Aura Consulting ·
      <a href="index.html">← Wróć do katalogu</a>
    </footer>`);
}

/* ── FETCH ─────────────────────────────────────────────────── */
async function fetchSalon() {
  const { data, error } = await sb
    .from("salons")
    .select("*,salon_photos(*),salon_services(*)")
    .eq("id", salonId)
    .maybeSingle();

  const wrap = document.getElementById("salon-wrap");

  if (error || !data) {
    wrap.innerHTML = `
      <div class="bk-container" style="padding:4rem 1rem;text-align:center">
        <p style="font-size:3rem;margin-bottom:1rem">😕</p>
        <h2 style="margin-bottom:.5rem">Salon nie został znaleziony</h2>
        <p style="color:var(--muted);margin-bottom:2rem">Sprawdź czy link jest poprawny.</p>
        <a href="index.html" class="bk-btn bk-btn-primary">← Wróć do katalogu</a>
      </div>`;
    return;
  }

  // Ustaw meta tagi SEO
  document.title = `${data.name} — BeautyKatalog`;
  document.querySelector('meta[name="description"]')
    ?.setAttribute("content", data.tagline || data.description || `Profil salonu ${data.name}`);

  renderSalon(data, wrap);
}

/* ── RENDER ────────────────────────────────────────────────── */
function renderSalon(s, wrap) {
  const photos  = (s.salon_photos  ?? []).sort((a, b) => (b.is_cover - a.is_cover) || (a.sort_order - b.sort_order));
  const services = s.salon_services ?? [];
  const cover   = photos.find(p => p.is_cover) ?? photos[0];

  // Godziny otwarcia (jsonb → tekst)
  let hoursHtml = "";
  if (s.opening_hours) {
    const raw = typeof s.opening_hours === "string"
      ? s.opening_hours
      : (s.opening_hours.text ?? JSON.stringify(s.opening_hours));
    hoursHtml = raw.split("\n").map(l => `<p style="font-size:.875rem;color:var(--muted)">${BK.esc(l)}</p>`).join("");
  }

  // Social media
  const socials = [
    s.instagram_url && `<a href="${BK.esc(s.instagram_url)}" target="_blank" rel="noopener" style="color:var(--v);font-weight:700;font-size:.85rem">Instagram</a>`,
    s.facebook_url  && `<a href="${BK.esc(s.facebook_url)}"  target="_blank" rel="noopener" style="color:var(--v);font-weight:700;font-size:.85rem">Facebook</a>`,
    s.tiktok_url    && `<a href="${BK.esc(s.tiktok_url)}"    target="_blank" rel="noopener" style="color:var(--v);font-weight:700;font-size:.85rem">TikTok</a>`,
  ].filter(Boolean).join(" · ");

  // Zabiegi pogrupowane wg dostępności
  const available   = services.filter(sv => sv.is_available !== false);
  const unavailable = services.filter(sv => sv.is_available === false);

  wrap.innerHTML = `
    <!-- HERO -->
    <div style="background:linear-gradient(135deg,#3b0764,#7c3aed);color:#fff;padding:2.5rem 0 0">
      <div class="bk-container">
        <a href="index.html" style="font-size:.8rem;color:rgba(255,255,255,.7);font-weight:600;display:inline-block;margin-bottom:1rem">← Katalog salonów</a>
        <div style="display:flex;align-items:flex-start;gap:1.5rem;flex-wrap:wrap;padding-bottom:2rem">
          <!-- Avatar / okładka mała -->
          <div style="width:80px;height:80px;border-radius:1rem;overflow:hidden;border:3px solid rgba(255,255,255,.3);flex-shrink:0;background:rgba(255,255,255,.1)">
            ${cover
              ? `<img src="${BK.esc(cover.url)}" alt="${BK.esc(s.name)}" style="width:100%;height:100%;object-fit:cover">`
              : `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:2rem">💅</div>`}
          </div>
          <div style="flex:1;min-width:200px">
            <h1 style="font-size:clamp(1.5rem,4vw,2.2rem);margin-bottom:.3rem">${BK.esc(s.name)}</h1>
            <p style="opacity:.8;font-size:.95rem;margin-bottom:.5rem">📍 ${BK.esc(s.city)}${s.street ? `, ${BK.esc(s.street)}` : ""}${s.postal_code ? ` ${BK.esc(s.postal_code)}` : ""}</p>
            ${s.tagline ? `<p style="opacity:.9;font-style:italic;font-size:.95rem">${BK.esc(s.tagline)}</p>` : ""}
          </div>
        </div>
      </div>
    </div>

    <!-- GALERIA -->
    ${photos.length ? `
    <div style="background:#1e1b4b;padding:.75rem 0">
      <div class="bk-container" style="display:flex;gap:.5rem;overflow-x:auto;scrollbar-width:none;padding-bottom:.25rem">
        ${photos.map(p => `
          <div style="flex-shrink:0;width:${photos.length === 1 ? "100%" : "220px"};height:160px;border-radius:.75rem;overflow:hidden;cursor:pointer"
               onclick="openLightbox('${BK.esc(p.url)}')">
            <img src="${BK.esc(p.url)}" alt="Zdjęcie salonu" loading="lazy"
              style="width:100%;height:100%;object-fit:cover;transition:.2s"
              onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform=''">
          </div>`).join("")}
      </div>
    </div>` : ""}

    <!-- GŁÓWNA TREŚĆ -->
    <main class="bk-container" style="padding-top:2rem;padding-bottom:3rem;display:grid;grid-template-columns:1fr minmax(0,340px);gap:2rem;align-items:start">

      <!-- LEWA KOLUMNA -->
      <div>
        ${s.description ? `
        <section class="bk-card" style="padding:1.5rem;margin-bottom:1.5rem">
          <h2 style="font-size:1.05rem;margin-bottom:.75rem">O salonie</h2>
          <p style="color:var(--muted);line-height:1.7;font-size:.9rem">${BK.esc(s.description).replace(/\n/g,"<br>")}</p>
        </section>` : ""}

        <!-- ZABIEGI -->
        <section class="bk-card" style="padding:1.5rem;margin-bottom:1.5rem">
          <h2 style="font-size:1.05rem;margin-bottom:1rem">Zabiegi i usługi
            <span class="bk-badge" style="margin-left:.5rem">${services.length}</span>
          </h2>
          ${services.length === 0
            ? `<p style="color:var(--muted);font-size:.875rem">Salon nie dodał jeszcze listy zabiegów.</p>`
            : `
            <div style="display:flex;flex-direction:column;gap:.5rem">
              ${available.map(sv => serviceRow(sv)).join("")}
              ${unavailable.length ? `
                <p style="font-size:.75rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-top:.75rem">Tymczasowo niedostępne</p>
                ${unavailable.map(sv => serviceRow(sv, true)).join("")}` : ""}
            </div>`}
        </section>
      </div>

      <!-- PRAWA KOLUMNA -->
      <div style="display:flex;flex-direction:column;gap:1.25rem">

        <!-- KONTAKT -->
        <div class="bk-card" style="padding:1.25rem">
          <h3 style="font-size:.95rem;margin-bottom:1rem">Kontakt</h3>
          <div style="display:flex;flex-direction:column;gap:.6rem">
            ${s.phone         ? `<a href="tel:${BK.esc(s.phone)}" style="display:flex;align-items:center;gap:.6rem;font-size:.875rem;color:var(--navy);font-weight:600"><span style="font-size:1.1rem">📞</span>${BK.esc(s.phone)}</a>` : ""}
            ${s.email_contact ? `<a href="mailto:${BK.esc(s.email_contact)}" style="display:flex;align-items:center;gap:.6rem;font-size:.875rem;color:var(--navy);font-weight:600"><span style="font-size:1.1rem">✉️</span>${BK.esc(s.email_contact)}</a>` : ""}
            ${s.website       ? `<a href="${BK.esc(s.website)}" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:.6rem;font-size:.875rem;color:var(--v);font-weight:600"><span style="font-size:1.1rem">🌐</span>Strona WWW</a>` : ""}
            ${s.street        ? `<p style="display:flex;align-items:flex-start;gap:.6rem;font-size:.875rem;color:var(--muted)"><span style="font-size:1.1rem">📍</span><span>${BK.esc(s.street)}, ${BK.esc(s.city)}${s.postal_code ? ` ${BK.esc(s.postal_code)}` : ""}</span></p>` : ""}
          </div>
          ${socials ? `<div style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border);display:flex;gap:.75rem;flex-wrap:wrap">${socials}</div>` : ""}
        </div>

        <!-- GODZINY -->
        ${hoursHtml ? `
        <div class="bk-card" style="padding:1.25rem">
          <h3 style="font-size:.95rem;margin-bottom:.75rem">🕐 Godziny otwarcia</h3>
          <div style="display:flex;flex-direction:column;gap:.2rem">${hoursHtml}</div>
        </div>` : ""}

        <!-- MAPA -->
        ${s.lat && s.lng ? `
        <div class="bk-card" style="overflow:hidden">
          <div id="salon-map" style="height:220px"></div>
          <div style="padding:.75rem 1rem">
            <a href="https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}"
               target="_blank" rel="noopener"
               style="font-size:.8rem;color:var(--v);font-weight:700">Otwórz w Google Maps →</a>
          </div>
        </div>` : ""}

        <!-- CTA -->
        ${s.phone || s.email_contact ? `
        <div class="bk-card" style="padding:1.25rem;background:var(--vl);border-color:var(--v)">
          <p style="font-size:.875rem;font-weight:700;color:var(--vd);margin-bottom:.75rem">Umów wizytę</p>
          <div style="display:flex;flex-direction:column;gap:.5rem">
            ${s.phone         ? `<a href="tel:${BK.esc(s.phone)}" class="bk-btn bk-btn-primary" style="width:100%;justify-content:center">📞 Zadzwoń</a>` : ""}
            ${s.email_contact ? `<a href="mailto:${BK.esc(s.email_contact)}" class="bk-btn bk-btn-outline" style="width:100%;justify-content:center">✉️ Napisz email</a>` : ""}
          </div>
        </div>` : ""}

      </div>
    </main>

    <!-- LIGHTBOX -->
    <div id="lightbox" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:500;align-items:center;justify-content:center;cursor:pointer"
         onclick="closeLightbox()">
      <img id="lightbox-img" src="" alt="" style="max-width:90vw;max-height:90vh;border-radius:.5rem;object-fit:contain">
    </div>`;

  // Mapa Leaflet
  if (s.lat && s.lng && window.L) {
    setTimeout(() => {
      const map = L.map("salon-map", { zoomControl: true, scrollWheelZoom: false })
        .setView([s.lat, s.lng], 15);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>'
      }).addTo(map);
      L.marker([s.lat, s.lng])
        .addTo(map)
        .bindPopup(`<b>${s.name}</b><br>${s.city}`);
    }, 100);
  }
}

/* ── WIERSZ ZABIEGU ────────────────────────────────────────── */
function serviceRow(sv, dimmed = false) {
  const price = sv.price_from
    ? (sv.price_to && sv.price_to !== sv.price_from
        ? `${sv.price_from}–${sv.price_to} zł`
        : `${sv.price_from} zł`)
    : "";
  return `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:.75rem;padding:.6rem .75rem;border-radius:.5rem;background:${dimmed ? "#f8fafc" : "var(--white)"};border:1px solid var(--border);opacity:${dimmed ? ".55" : "1"}">
      <div>
        <p style="font-size:.875rem;font-weight:600;color:var(--navy)">${BK.esc(sv.service_name)}</p>
        ${sv.duration_min ? `<p style="font-size:.75rem;color:var(--muted)">⏱ ${sv.duration_min} min</p>` : ""}
      </div>
      ${price ? `<span style="font-size:.875rem;font-weight:700;color:var(--v);flex-shrink:0">${price}</span>` : ""}
    </div>`;
}

/* ── LIGHTBOX ──────────────────────────────────────────────── */
window.openLightbox = (url) => {
  const lb = document.getElementById("lightbox");
  document.getElementById("lightbox-img").src = url;
  lb.style.display = "flex";
};
window.closeLightbox = () => {
  document.getElementById("lightbox").style.display = "none";
};

/* Responsywność: na mobile prawa kolumna idzie na dół */
const style = document.createElement("style");
style.textContent = `
  @media(max-width:768px){
    #salon-wrap main { grid-template-columns:1fr !important; }
  }
`;
document.head.appendChild(style);

})();
