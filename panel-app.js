/* ================================================================
   BeautyKatalog · panel-app.js  v2.0
   Panel właściciela — formularze inline (nie modal)
   Zabiegi: modal (krótki formularz 4 pola)
   Dane salonu / zdjęcia: inline
================================================================ */
(function () {
"use strict";

const { sb, BK } = window;

let currentUser  = null;
let currentSalon = null;
let services     = [];
let photos       = [];

/* ── BOOT ──────────────────────────────────────────────────── */
BK.nav("panel");

(async () => {
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    currentUser = session.user;
    await loadSalon();
    renderPanel();
  } else {
    renderAuth();
  }
})();

sb.auth.onAuthStateChange((_e, session) => {
  currentUser = session?.user ?? null;
  if (!currentUser) renderAuth();
});

/* ═══════════════════════════════════════════════════════════
   AUTH
═══════════════════════════════════════════════════════════ */
function renderAuth() {
  document.body.innerHTML = "";
  BK.nav("panel");

  const wrap = document.createElement("main");
  wrap.className = "bk-container";
  wrap.style.cssText = "max-width:440px;padding-top:4rem;padding-bottom:4rem";
  wrap.innerHTML = `
    <div class="bk-card" style="padding:2rem">
      <h1 style="font-size:1.4rem;margin-bottom:.25rem">Panel właściciela</h1>
      <p style="font-size:.85rem;color:var(--muted);margin-bottom:1.75rem">Zaloguj się lub utwórz konto, aby zarządzać swoim salonem.</p>
      <div style="display:flex;gap:.5rem;margin-bottom:1.5rem">
        <button onclick="showTab('login')" id="tab-login"
          style="flex:1;padding:.5rem;border:none;background:var(--v);color:#fff;border-radius:.5rem;font-weight:700;font-size:.875rem;cursor:pointer">Logowanie</button>
        <button onclick="showTab('register')" id="tab-register"
          style="flex:1;padding:.5rem;border:none;background:var(--vl);color:var(--v);border-radius:.5rem;font-weight:700;font-size:.875rem;cursor:pointer">Rejestracja</button>
      </div>
      <div id="form-login">
        <div style="margin-bottom:1rem">
          <label class="bk-label">Email</label>
          <input id="l-email" type="email" class="bk-input" placeholder="twoj@email.pl">
        </div>
        <div style="margin-bottom:1.25rem">
          <label class="bk-label">Hasło</label>
          <input id="l-pass" type="password" class="bk-input" placeholder="••••••••">
        </div>
        <button onclick="doLogin()" class="bk-btn bk-btn-primary" style="width:100%" id="btn-login">Zaloguj się</button>
        <p style="margin-top:1rem;font-size:.8rem;text-align:center">
          <a href="#" onclick="sendReset();return false" style="color:var(--v)">Zapomniałem/am hasła</a>
        </p>
      </div>
      <div id="form-register" style="display:none">
        <div style="margin-bottom:1rem">
          <label class="bk-label">Email</label>
          <input id="r-email" type="email" class="bk-input" placeholder="twoj@email.pl">
        </div>
        <div style="margin-bottom:1.25rem">
          <label class="bk-label">Hasło (min. 8 znaków)</label>
          <input id="r-pass" type="password" class="bk-input" placeholder="••••••••">
        </div>
        <button onclick="doRegister()" class="bk-btn bk-btn-primary" style="width:100%" id="btn-register">Utwórz konto</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);
}

window.showTab = (tab) => {
  document.getElementById("form-login").style.display    = tab === "login"    ? "" : "none";
  document.getElementById("form-register").style.display = tab === "register" ? "" : "none";
  const tl = document.getElementById("tab-login");
  const tr = document.getElementById("tab-register");
  tl.style.background = tab === "login"    ? "var(--v)" : "var(--vl)";
  tl.style.color      = tab === "login"    ? "#fff"     : "var(--v)";
  tr.style.background = tab === "register" ? "var(--v)" : "var(--vl)";
  tr.style.color      = tab === "register" ? "#fff"     : "var(--v)";
};

window.doLogin = async () => {
  const email = document.getElementById("l-email").value.trim();
  const pass  = document.getElementById("l-pass").value;
  const btn   = document.getElementById("btn-login");
  if (!email || !pass) { BK.toast("Uzupełnij email i hasło", "error"); return; }
  btn.disabled = true; btn.textContent = "Logowanie...";
  const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
  if (error) { BK.toast(error.message, "error"); btn.disabled = false; btn.textContent = "Zaloguj się"; return; }
  currentUser = data.user;
  await loadSalon();
  renderPanel();
};

window.doRegister = async () => {
  const email = document.getElementById("r-email").value.trim();
  const pass  = document.getElementById("r-pass").value;
  const btn   = document.getElementById("btn-register");
  if (!email || pass.length < 8) { BK.toast("Podaj poprawny email i hasło (min. 8 znaków)", "error"); return; }
  btn.disabled = true; btn.textContent = "Tworzenie konta...";
  const { error } = await sb.auth.signUp({ email, password: pass });
  if (error) { BK.toast(error.message, "error"); btn.disabled = false; btn.textContent = "Utwórz konto"; return; }
  BK.toast("Sprawdź skrzynkę email — potwierdź rejestrację", "success", 6000);
  btn.disabled = false; btn.textContent = "Utwórz konto";
};

window.sendReset = async () => {
  const email = document.getElementById("l-email")?.value.trim();
  if (!email) { BK.toast("Wpisz email powyżej", "error"); return; }
  await sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.href });
  BK.toast("Link resetowania wysłany", "success");
};

/* ═══════════════════════════════════════════════════════════
   LOAD
═══════════════════════════════════════════════════════════ */
async function loadSalon() {
  const { data, error } = await sb
    .from("salons")
    .select("*,salon_services(*),salon_photos(*)")
    .eq("owner_id", currentUser.id)
    .maybeSingle();
  if (error) { console.error(error); return; }
  if (data) {
    currentSalon = data;
    services     = data.salon_services ?? [];
    photos       = data.salon_photos   ?? [];
  }
}

/* ═══════════════════════════════════════════════════════════
   PANEL SHELL
═══════════════════════════════════════════════════════════ */
function renderPanel() {
  document.body.innerHTML = "";
  BK.nav("panel");

  const main = document.createElement("main");
  main.className = "bk-container";
  main.style.cssText = "padding-top:2rem;padding-bottom:4rem";
  main.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;margin-bottom:2rem">
      <div>
        <h1 style="font-size:1.5rem;margin-bottom:.15rem">Panel właściciela</h1>
        <p style="font-size:.8rem;color:var(--muted)">${BK.esc(currentUser.email)}</p>
      </div>
      <button onclick="doLogout()" class="bk-btn bk-btn-outline" style="font-size:.8rem;padding:.4rem .9rem">Wyloguj</button>
    </div>

    <!-- TABS -->
    <div style="display:flex;gap:.25rem;border-bottom:2px solid var(--border);margin-bottom:1.75rem;overflow-x:auto;scrollbar-width:none" id="panel-tabs"></div>

    <!-- CONTENT — tu renderujemy inline -->
    <div id="panel-content"></div>

    <footer class="bk-footer" style="margin-top:3rem;background:transparent;color:var(--muted)">© 2026 BeautyKatalog</footer>`;
  document.body.appendChild(main);

  buildTabs();
  switchTab("salon");
}

const TABS = [
  { id: "salon",    label: "📋 Dane salonu" },
  { id: "services", label: "✂️ Zabiegi"     },
  { id: "photos",   label: "📷 Zdjęcia"     },
];

function buildTabs() {
  document.getElementById("panel-tabs").innerHTML = TABS.map(t => `
    <button id="ptab-${t.id}" onclick="switchTab('${t.id}')"
      style="padding:.5rem 1.1rem;border:none;background:none;font-weight:700;font-size:.85rem;color:var(--muted);cursor:pointer;border-bottom:2px solid transparent;white-space:nowrap;margin-bottom:-2px;transition:.15s">
      ${t.label}
    </button>`).join("");
}

window.switchTab = (id) => {
  TABS.forEach(t => {
    const b = document.getElementById(`ptab-${t.id}`);
    b.style.color        = t.id === id ? "var(--v)"           : "var(--muted)";
    b.style.borderBottom = t.id === id ? "2px solid var(--v)" : "2px solid transparent";
  });
  const c = document.getElementById("panel-content");
  if (id === "salon")    renderSalonForm(c);
  if (id === "services") renderServicesTab(c);
  if (id === "photos")   renderPhotosTab(c);
};

window.doLogout = async () => { await sb.auth.signOut(); renderAuth(); };

/* ═══════════════════════════════════════════════════════════
   TAB 1 — DANE SALONU (inline, pełna szerokość)
═══════════════════════════════════════════════════════════ */
function renderSalonForm(container) {
  const s = currentSalon ?? {};
  const hours = s.opening_hours
    ? (typeof s.opening_hours === "string" ? s.opening_hours : (s.opening_hours.text ?? JSON.stringify(s.opening_hours, null, 2)))
    : "";

  container.innerHTML = `
    <div style="max-width:720px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;flex-wrap:wrap;gap:.75rem">
        <h2 style="font-size:1.15rem">${currentSalon ? "Dane salonu" : "Dodaj swój salon"}</h2>
        ${currentSalon ? `<button onclick="confirmDeleteSalon()" class="bk-btn" style="background:#fee2e2;color:#dc2626;border:1.5px solid #fca5a5;font-size:.8rem;padding:.35rem .85rem">🗑 Usuń salon</button>` : ""}
      </div>

      <!-- SEKCJA: Podstawowe -->
      ${section("Podstawowe informacje", `
        <div class="fg-2">
          <div class="fc">
            <label class="bk-label">Nazwa salonu *</label>
            <input id="sf-name" class="bk-input" value="${BK.esc(s.name ?? "")}" placeholder="Studio Urody Ewa">
          </div>
          <div class="fc">
            <label class="bk-label">Tagline</label>
            <input id="sf-tagline" class="bk-input" value="${BK.esc(s.tagline ?? "")}" placeholder="Twoje piękno, nasza pasja">
          </div>
          <div class="fc fc-full">
            <label class="bk-label">Opis</label>
            <textarea id="sf-desc" class="bk-input" rows="4" style="resize:vertical">${BK.esc(s.description ?? "")}</textarea>
          </div>
          <div class="fc">
            <label class="bk-label">Status</label>
            <select id="sf-status" class="bk-input">
              <option value="active" ${(s.status ?? "draft") === "active" ? "selected" : ""}>Aktywny (widoczny)</option>
              <option value="draft"  ${s.status === "draft"  ? "selected" : ""}>Szkic (ukryty)</option>
              <option value="paused" ${s.status === "paused" ? "selected" : ""}>Wstrzymany</option>
            </select>
          </div>
        </div>
      `)}

      <!-- SEKCJA: Adres -->
      ${section("Adres", `
        <div class="fg-2">
          <div class="fc">
            <label class="bk-label">Miasto *</label>
            <input id="sf-city" class="bk-input" value="${BK.esc(s.city ?? "")}" placeholder="Warszawa">
          </div>
          <div class="fc">
            <label class="bk-label">Ulica i numer</label>
            <input id="sf-street" class="bk-input" value="${BK.esc(s.street ?? "")}" placeholder="Marszałkowska 10">
          </div>
          <div class="fc">
            <label class="bk-label">Kod pocztowy</label>
            <input id="sf-postal" class="bk-input" value="${BK.esc(s.postal_code ?? "")}" placeholder="00-001">
          </div>
          <div class="fc">
            <label class="bk-label">Województwo</label>
            <select id="sf-voi" class="bk-input">
              ${["","dolnośląskie","kujawsko-pomorskie","lubelskie","lubuskie","łódzkie","małopolskie",
                 "mazowieckie","opolskie","podkarpackie","podlaskie","pomorskie","śląskie",
                 "świętokrzyskie","warmińsko-mazurskie","wielkopolskie","zachodniopomorskie"]
                .map(v => `<option ${(s.voivodeship ?? "") === v ? "selected" : ""}>${v}</option>`).join("")}
            </select>
          </div>
        </div>
      `)}

      <!-- SEKCJA: Kontakt -->
      ${section("Kontakt", `
        <div class="fg-2">
          <div class="fc">
            <label class="bk-label">Telefon</label>
            <input id="sf-phone" class="bk-input" value="${BK.esc(s.phone ?? "")}" placeholder="+48 600 000 000">
          </div>
          <div class="fc">
            <label class="bk-label">Email</label>
            <input id="sf-email" type="email" class="bk-input" value="${BK.esc(s.email_contact ?? "")}" placeholder="salon@email.pl">
          </div>
          <div class="fc fc-full">
            <label class="bk-label">Strona WWW</label>
            <input id="sf-www" class="bk-input" value="${BK.esc(s.website ?? "")}" placeholder="https://twojsalon.pl">
          </div>
        </div>
      `)}

      <!-- SEKCJA: Social media -->
      ${section("Social media", `
        <div class="fg-2">
          <div class="fc">
            <label class="bk-label">Instagram</label>
            <input id="sf-ig" class="bk-input" value="${BK.esc(s.instagram_url ?? "")}" placeholder="https://instagram.com/...">
          </div>
          <div class="fc">
            <label class="bk-label">Facebook</label>
            <input id="sf-fb" class="bk-input" value="${BK.esc(s.facebook_url ?? "")}" placeholder="https://facebook.com/...">
          </div>
          <div class="fc">
            <label class="bk-label">TikTok</label>
            <input id="sf-tt" class="bk-input" value="${BK.esc(s.tiktok_url ?? "")}" placeholder="https://tiktok.com/@...">
          </div>
        </div>
      `)}

      <!-- SEKCJA: Dane firmowe -->
      ${section("Dane firmowe", `
        <div class="fg-2">
          <div class="fc">
            <label class="bk-label">NIP</label>
            <input id="sf-nip" class="bk-input" value="${BK.esc(s.nip ?? "")}" placeholder="0000000000">
          </div>
          <div class="fc">
            <label class="bk-label">REGON</label>
            <input id="sf-regon" class="bk-input" value="${BK.esc(s.regon ?? "")}" placeholder="000000000">
          </div>
        </div>
      `)}

      <!-- SEKCJA: Godziny -->
      ${section("Godziny otwarcia", `
        <textarea id="sf-hours" class="bk-input" rows="5" style="resize:vertical;font-size:.875rem;max-width:360px"
          placeholder="Pn–Pt: 9:00–19:00&#10;Sb: 10:00–16:00&#10;Nd: zamknięte">${BK.esc(hours)}</textarea>
        <p style="font-size:.72rem;color:var(--muted);margin-top:.4rem">Wpisz w dowolnym formacie tekstowym.</p>
      `)}

      <!-- ZAPIS -->
      <div style="margin-top:2rem;padding-top:1.5rem;border-top:1px solid var(--border)">
        <button onclick="saveSalon()" class="bk-btn bk-btn-primary" id="btn-save-salon" style="min-width:180px">
          💾 ${currentSalon ? "Zapisz zmiany" : "Dodaj salon"}
        </button>
      </div>
    </div>

    <style>
      .fg-2{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
      .fc{display:flex;flex-direction:column;gap:.3rem}
      .fc-full{grid-column:1/-1}
      @media(max-width:560px){.fg-2{grid-template-columns:1fr}.fc-full{grid-column:1}}
    </style>`;
}

function section(title, content) {
  return `
    <div style="margin-bottom:1.75rem">
      <h3 style="font-size:.75rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:.85rem;padding-bottom:.5rem;border-bottom:1px solid var(--border)">${title}</h3>
      ${content}
    </div>`;
}

window.saveSalon = async () => {
  const name = document.getElementById("sf-name").value.trim();
  const city = document.getElementById("sf-city").value.trim();
  if (!name || !city) { BK.toast("Wypełnij nazwę i miasto", "error"); return; }

  const hoursRaw = document.getElementById("sf-hours").value.trim();
  let opening_hours = null;
  if (hoursRaw) {
    try { opening_hours = JSON.parse(hoursRaw); }
    catch { opening_hours = { text: hoursRaw }; }
  }

  const payload = {
    owner_id: currentUser.id, name, slug: BK.slug(name),
    tagline:       document.getElementById("sf-tagline").value.trim() || null,
    description:   document.getElementById("sf-desc").value.trim()    || null,
    city,
    street:        document.getElementById("sf-street").value.trim()  || null,
    postal_code:   document.getElementById("sf-postal").value.trim()  || null,
    voivodeship:   document.getElementById("sf-voi").value            || null,
    phone:         document.getElementById("sf-phone").value.trim()   || null,
    email_contact: document.getElementById("sf-email").value.trim()   || null,
    website:       document.getElementById("sf-www").value.trim()     || null,
    instagram_url: document.getElementById("sf-ig").value.trim()      || null,
    facebook_url:  document.getElementById("sf-fb").value.trim()      || null,
    tiktok_url:    document.getElementById("sf-tt").value.trim()      || null,
    nip:           document.getElementById("sf-nip").value.trim()     || null,
    regon:         document.getElementById("sf-regon").value.trim()   || null,
    opening_hours,
    status:        document.getElementById("sf-status").value,
  };

  const btn = document.getElementById("btn-save-salon");
  btn.disabled = true; btn.textContent = "Zapisywanie...";

  let error;
  if (currentSalon) {
    ({ error } = await sb.from("salons").update(payload).eq("id", currentSalon.id));
    if (!error) currentSalon = { ...currentSalon, ...payload };
  } else {
    const res = await sb.from("salons").insert(payload).select().single();
    error = res.error;
    if (!error) currentSalon = res.data;
  }

  btn.disabled = false; btn.textContent = `💾 ${currentSalon ? "Zapisz zmiany" : "Dodaj salon"}`;
  if (error) { BK.toast("Błąd: " + error.message, "error"); return; }
  BK.toast("Salon zapisany ✓", "success");
};

window.confirmDeleteSalon = () => {
  BK.modal(`
    <h3 style="margin-bottom:.75rem;color:#dc2626">Usuń salon</h3>
    <p style="font-size:.875rem;color:var(--muted);margin-bottom:1.5rem">Tej operacji nie można cofnąć.</p>
    <div style="display:flex;gap:.75rem">
      <button onclick="deleteSalon()" class="bk-btn" style="background:#dc2626;color:#fff">Tak, usuń</button>
      <button onclick="this.closest('.bk-modal-bg').remove()" class="bk-btn bk-btn-outline">Anuluj</button>
    </div>`);
};

window.deleteSalon = async () => {
  if (!currentSalon) return;
  const { error } = await sb.from("salons").delete().eq("id", currentSalon.id);
  if (error) { BK.toast("Błąd: " + error.message, "error"); return; }
  document.querySelector(".bk-modal-bg")?.remove();
  currentSalon = null; services = []; photos = [];
  BK.toast("Salon usunięty", "info");
  renderSalonForm(document.getElementById("panel-content"));
};

/* ═══════════════════════════════════════════════════════════
   TAB 2 — ZABIEGI (lista inline, formularz w modalu — krótki)
═══════════════════════════════════════════════════════════ */
function renderServicesTab(container) {
  if (!currentSalon) {
    container.innerHTML = `<div class="bk-empty"><h3>Najpierw dodaj salon</h3></div>`;
    return;
  }
  container.innerHTML = `
    <div style="max-width:700px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;flex-wrap:wrap;gap:.75rem">
        <h2 style="font-size:1.15rem">Zabiegi i usługi</h2>
        <button onclick="openServiceModal(null)" class="bk-btn bk-btn-primary" style="font-size:.875rem">+ Dodaj zabieg</button>
      </div>
      <div id="services-list"></div>
    </div>`;
  renderServicesList();
}

function renderServicesList() {
  const list = document.getElementById("services-list");
  if (!list) return;
  if (!services.length) {
    list.innerHTML = `<div class="bk-empty"><h3>Brak zabiegów</h3><p>Dodaj pierwszy zabieg.</p></div>`;
    return;
  }
  list.innerHTML = services.map(svc => {
    const price = svc.price_from
      ? (svc.price_to && svc.price_to !== svc.price_from ? `${svc.price_from}–${svc.price_to} zł` : `${svc.price_from} zł`)
      : "";
    return `
      <div class="bk-card" style="padding:1rem 1.25rem;display:flex;align-items:center;gap:1rem;margin-bottom:.65rem;flex-wrap:wrap">
        <div style="flex:1;min-width:160px">
          <p style="font-weight:700;font-size:.95rem">${BK.esc(svc.service_name)}</p>
          ${!svc.is_available ? `<span style="font-size:.7rem;color:#dc2626;font-weight:700">niedostępny</span>` : ""}
        </div>
        <div style="display:flex;gap:1rem;font-size:.85rem;color:var(--muted)">
          ${svc.duration_min ? `<span>⏱ ${svc.duration_min} min</span>` : ""}
          ${price             ? `<span style="font-weight:700;color:var(--navy)">💰 ${price}</span>` : ""}
        </div>
        <div style="display:flex;gap:.5rem">
          <button onclick="openServiceModal('${svc.id}')" class="bk-btn bk-btn-outline" style="padding:.35rem .75rem;font-size:.8rem">Edytuj</button>
          <button onclick="deleteService('${svc.id}')" class="bk-btn" style="background:#fee2e2;color:#dc2626;border:1.5px solid #fca5a5;padding:.35rem .75rem;font-size:.8rem">Usuń</button>
        </div>
      </div>`;
  }).join("");
}

window.openServiceModal = (id) => {
  const svc = id ? services.find(s => s.id === id) : null;
  BK.modal(`
    <h3 style="margin-bottom:1.25rem">${svc ? "Edytuj zabieg" : "Nowy zabieg"}</h3>
    <div style="display:grid;gap:.85rem">
      <div>
        <label class="bk-label">Nazwa zabiegu *</label>
        <input id="sv-name" class="bk-input" value="${BK.esc(svc?.service_name ?? "")}" placeholder="Manicure hybrydowy">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.75rem">
        <div>
          <label class="bk-label">Cena od (zł)</label>
          <input id="sv-pfrom" type="number" min="0" step="0.01" class="bk-input" value="${svc?.price_from ?? ""}">
        </div>
        <div>
          <label class="bk-label">Cena do (zł)</label>
          <input id="sv-pto" type="number" min="0" step="0.01" class="bk-input" value="${svc?.price_to ?? ""}">
        </div>
        <div>
          <label class="bk-label">Czas (min)</label>
          <input id="sv-dur" type="number" min="0" class="bk-input" value="${svc?.duration_min ?? ""}">
        </div>
      </div>
      <div>
        <label class="bk-label">Dostępność</label>
        <select id="sv-avail" class="bk-input">
          <option value="true"  ${(svc?.is_available ?? true)  ? "selected" : ""}>Dostępny</option>
          <option value="false" ${!(svc?.is_available ?? true) ? "selected" : ""}>Niedostępny</option>
        </select>
      </div>
    </div>
    <div style="margin-top:1.25rem;display:flex;gap:.75rem">
      <button onclick="saveService('${id ?? ""}')" class="bk-btn bk-btn-primary" id="btn-svc-save">
        💾 ${svc ? "Zapisz" : "Dodaj"}
      </button>
      <button onclick="this.closest('.bk-modal-bg').remove()" class="bk-btn bk-btn-outline">Anuluj</button>
    </div>`);
};

window.saveService = async (id) => {
  const name = document.getElementById("sv-name").value.trim();
  if (!name) { BK.toast("Podaj nazwę zabiegu", "error"); return; }
  const payload = {
    salon_id: currentSalon.id, service_name: name,
    price_from:   parseFloat(document.getElementById("sv-pfrom").value) || null,
    price_to:     parseFloat(document.getElementById("sv-pto").value)   || null,
    duration_min: parseInt(document.getElementById("sv-dur").value)     || null,
    is_available: document.getElementById("sv-avail").value === "true",
  };
  const btn = document.getElementById("btn-svc-save");
  btn.disabled = true; btn.textContent = "Zapisuję...";
  let error, data;
  if (id) {
    ({ error, data } = await sb.from("salon_services").update(payload).eq("id", id).select().single());
  } else {
    ({ error, data } = await sb.from("salon_services").insert(payload).select().single());
  }
  if (error) { BK.toast("Błąd: " + error.message, "error"); btn.disabled = false; btn.textContent = "💾 Zapisz"; return; }
  if (id) { services = services.map(s => s.id === id ? data : s); } else { services.push(data); }
  document.querySelector(".bk-modal-bg")?.remove();
  BK.toast("Zabieg zapisany ✓", "success");
  renderServicesList();
};

window.deleteService = async (id) => {
  if (!confirm("Usunąć zabieg?")) return;
  const { error } = await sb.from("salon_services").delete().eq("id", id);
  if (error) { BK.toast("Błąd: " + error.message, "error"); return; }
  services = services.filter(s => s.id !== id);
  BK.toast("Zabieg usunięty", "info");
  renderServicesList();
};

/* ═══════════════════════════════════════════════════════════
   TAB 3 — ZDJĘCIA (inline grid)
═══════════════════════════════════════════════════════════ */
function renderPhotosTab(container) {
  if (!currentSalon) {
    container.innerHTML = `<div class="bk-empty"><h3>Najpierw dodaj salon</h3></div>`;
    return;
  }
  container.innerHTML = `
    <div style="max-width:800px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;flex-wrap:wrap;gap:.75rem">
        <h2 style="font-size:1.15rem">Zdjęcia salonu</h2>
        <label class="bk-btn bk-btn-primary" style="cursor:pointer;font-size:.875rem">
          📤 Dodaj zdjęcia
          <input type="file" accept="image/*" multiple style="display:none" onchange="uploadPhotos(this)">
        </label>
      </div>
      <p style="font-size:.8rem;color:var(--muted);margin-bottom:1.25rem">
        Zaznacz „Okładka" przy zdjęciu wyświetlanym na liście salonów. Max 5 MB, formaty: JPG, PNG, WebP.
      </p>
      <div id="upload-bar" style="display:none;margin-bottom:1rem"></div>
      <div id="photos-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:1rem"></div>
    </div>`;
  renderPhotosGrid();
}

function renderPhotosGrid() {
  const grid = document.getElementById("photos-grid");
  if (!grid) return;
  if (!photos.length) {
    grid.innerHTML = `<div class="bk-empty" style="grid-column:1/-1"><h3>Brak zdjęć</h3><p>Dodaj pierwsze zdjęcie.</p></div>`;
    return;
  }
  const sorted = [...photos].sort((a, b) => (b.is_cover - a.is_cover) || (a.sort_order - b.sort_order));
  grid.innerHTML = sorted.map(p => `
    <div class="bk-card" style="overflow:hidden">
      <img src="${BK.esc(p.url)}" alt="Zdjęcie salonu" loading="lazy"
        style="width:100%;height:150px;object-fit:cover;display:block">
      <div style="padding:.6rem .75rem;display:flex;align-items:center;justify-content:space-between;gap:.5rem">
        <label style="display:flex;align-items:center;gap:.35rem;font-size:.75rem;font-weight:700;cursor:pointer;color:${p.is_cover ? "var(--v)" : "var(--muted)"}">
          <input type="radio" name="cover-photo" ${p.is_cover ? "checked" : ""} onchange="setCover('${p.id}')">
          Okładka
        </label>
        <button onclick="deletePhoto('${p.id}')"
          style="background:none;border:none;color:#dc2626;cursor:pointer;font-size:1.3rem;line-height:1" title="Usuń">×</button>
      </div>
    </div>`).join("");
}

window.uploadPhotos = async (input) => {
  const files = Array.from(input.files);
  if (!files.length) return;
  const bar = document.getElementById("upload-bar");
  bar.style.display = "block";
  bar.innerHTML = `<div class="bk-card" style="padding:.75rem 1rem;font-size:.85rem">Przesyłanie ${files.length} pliku/-ów...</div>`;

  for (const file of files) {
    if (file.size > 5 * 1024 * 1024) { BK.toast(`${file.name} > 5 MB`, "error"); continue; }
    const ext  = file.name.split(".").pop().toLowerCase();
    const path = `${currentSalon.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: upErr } = await sb.storage.from("salon-photos").upload(path, file, { upsert: false });
    if (upErr) { BK.toast("Błąd uploadu: " + upErr.message, "error"); continue; }
    const { data: urlData } = sb.storage.from("salon-photos").getPublicUrl(path);
    const { data: rec, error: dbErr } = await sb.from("salon_photos")
      .insert({ salon_id: currentSalon.id, url: urlData.publicUrl, storage_path: path, is_cover: photos.length === 0, sort_order: photos.length })
      .select().single();
    if (dbErr) { BK.toast("Błąd zapisu: " + dbErr.message, "error"); continue; }
    photos.push(rec);
  }
  bar.style.display = "none";
  input.value = "";
  BK.toast("Zdjęcia przesłane ✓", "success");
  renderPhotosGrid();
};

window.setCover = async (id) => {
  await sb.from("salon_photos").update({ is_cover: false }).eq("salon_id", currentSalon.id);
  await sb.from("salon_photos").update({ is_cover: true  }).eq("id", id);
  photos = photos.map(p => ({ ...p, is_cover: p.id === id }));
  BK.toast("Okładka ustawiona ✓", "success");
};

window.deletePhoto = async (id) => {
  if (!confirm("Usunąć to zdjęcie?")) return;
  const photo = photos.find(p => p.id === id);
  if (photo?.storage_path) await sb.storage.from("salon-photos").remove([photo.storage_path]);
  const { error } = await sb.from("salon_photos").delete().eq("id", id);
  if (error) { BK.toast("Błąd: " + error.message, "error"); return; }
  photos = photos.filter(p => p.id !== id);
  if (photo?.is_cover && photos.length) {
    await sb.from("salon_photos").update({ is_cover: true }).eq("id", photos[0].id);
    photos[0].is_cover = true;
  }
  BK.toast("Zdjęcie usunięte", "info");
  renderPhotosGrid();
};

})();
