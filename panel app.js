/* ================================================================
   BeautyKatalog · panel-app.js  v1.0
   Panel właściciela: auth, dane salonu, zabiegi, zdjęcia
================================================================ */
(function () {
"use strict";

const { sb, BK } = window;

/* ── STATE ─────────────────────────────────────────────────── */
let currentUser  = null;
let currentSalon = null;   // rekord z tabeli `salons`
let services     = [];     // salon_services
let photos       = [];     // salon_photos

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

sb.auth.onAuthStateChange((_event, session) => {
  currentUser = session?.user ?? null;
  if (!currentUser) { renderAuth(); }
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

      <div style="display:flex;gap:.5rem;margin-bottom:1.5rem" id="auth-tabs">
        <button onclick="showTab('login')" id="tab-login"
          style="flex:1;padding:.5rem;border:none;background:var(--v);color:#fff;border-radius:.5rem;font-weight:700;font-size:.875rem;cursor:pointer">
          Logowanie
        </button>
        <button onclick="showTab('register')" id="tab-register"
          style="flex:1;padding:.5rem;border:none;background:var(--vl);color:var(--v);border-radius:.5rem;font-weight:700;font-size:.875rem;cursor:pointer">
          Rejestracja
        </button>
      </div>

      <!-- LOGIN -->
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

      <!-- REGISTER -->
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
    </div>
    <footer class="bk-footer" style="margin-top:2rem;background:transparent;color:var(--muted)">
      © 2026 BeautyKatalog
    </footer>`;
  document.body.appendChild(wrap);
}

window.showTab = (tab) => {
  document.getElementById("form-login").style.display    = tab === "login"    ? "" : "none";
  document.getElementById("form-register").style.display = tab === "register" ? "" : "none";
  document.getElementById("tab-login").style.background    = tab === "login"    ? "var(--v)"  : "var(--vl)";
  document.getElementById("tab-login").style.color         = tab === "login"    ? "#fff"      : "var(--v)";
  document.getElementById("tab-register").style.background = tab === "register" ? "var(--v)"  : "var(--vl)";
  document.getElementById("tab-register").style.color      = tab === "register" ? "#fff"      : "var(--v)";
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
  const email = document.getElementById("l-email").value.trim();
  if (!email) { BK.toast("Wpisz email w polu powyżej", "error"); return; }
  await sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.href });
  BK.toast("Link do resetowania hasła wysłany na email", "success");
};

/* ═══════════════════════════════════════════════════════════
   LOAD DATA
═══════════════════════════════════════════════════════════ */
async function loadSalon() {
  // Sprawdź czy właściciel ma już salon
  const { data } = await sb
    .from("salons")
    .select("*,salon_services(*),salon_photos(*)")
    .eq("owner_id", currentUser.id)
    .maybeSingle();
  if (data) {
    currentSalon = data;
    services     = data.salon_services ?? [];
    photos       = data.salon_photos   ?? [];
  } else {
    currentSalon = null;
    services     = [];
    photos       = [];
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
    <!-- Topbar -->
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;margin-bottom:2rem">
      <div>
        <h1 style="font-size:1.5rem;margin-bottom:.15rem">Panel właściciela</h1>
        <p style="font-size:.8rem;color:var(--muted)">${BK.esc(currentUser.email)}</p>
      </div>
      <button onclick="doLogout()" class="bk-btn bk-btn-outline" style="font-size:.8rem;padding:.4rem .9rem">Wyloguj</button>
    </div>

    <!-- TABS -->
    <div style="display:flex;gap:.25rem;border-bottom:2px solid var(--border);margin-bottom:1.75rem;overflow-x:auto;scrollbar-width:none" id="panel-tabs"></div>

    <!-- CONTENT -->
    <div id="panel-content"></div>

    <footer class="bk-footer" style="margin-top:3rem;background:transparent;color:var(--muted)">© 2026 BeautyKatalog</footer>`;
  document.body.appendChild(main);

  buildTabs();
  switchTab("salon");
}

/* ── TABS ──────────────────────────────────────────────────── */
const TABS = [
  { id: "salon",    label: "📋 Dane salonu" },
  { id: "services", label: "✂️ Zabiegi"     },
  { id: "photos",   label: "📷 Zdjęcia"     },
];

function buildTabs() {
  const bar = document.getElementById("panel-tabs");
  bar.innerHTML = TABS.map(t => `
    <button id="ptab-${t.id}" onclick="switchTab('${t.id}')"
      style="padding:.5rem 1.1rem;border:none;background:none;font-weight:700;font-size:.85rem;color:var(--muted);cursor:pointer;border-bottom:2px solid transparent;white-space:nowrap;margin-bottom:-2px;transition:.15s">
      ${t.label}
    </button>`).join("");
}

window.switchTab = (id) => {
  TABS.forEach(t => {
    const btn = document.getElementById(`ptab-${t.id}`);
    btn.style.color        = t.id === id ? "var(--v)"   : "var(--muted)";
    btn.style.borderBottom = t.id === id ? "2px solid var(--v)" : "2px solid transparent";
  });
  const content = document.getElementById("panel-content");
  if (id === "salon")    renderSalonTab(content);
  if (id === "services") renderServicesTab(content);
  if (id === "photos")   renderPhotosTab(content);
};

window.doLogout = async () => {
  await sb.auth.signOut();
  renderAuth();
};

/* ═══════════════════════════════════════════════════════════
   TAB 1 — DANE SALONU
═══════════════════════════════════════════════════════════ */
function renderSalonTab(container) {
  const s = currentSalon ?? {};
  container.innerHTML = `
    <div class="bk-card" style="padding:1.75rem;max-width:680px">
      <h2 style="font-size:1.1rem;margin-bottom:1.5rem">${currentSalon ? "Edytuj dane salonu" : "Dodaj swój salon"}</h2>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem" id="salon-form-grid">
        <div style="grid-column:1/-1">
          <label class="bk-label">Nazwa salonu *</label>
          <input id="sf-name" class="bk-input" value="${BK.esc(s.name ?? "")}" placeholder="Np. Studio Urody Ewa">
        </div>
        <div style="grid-column:1/-1">
          <label class="bk-label">Tagline (krótki opis)</label>
          <input id="sf-tagline" class="bk-input" value="${BK.esc(s.tagline ?? "")}" placeholder="Np. Twoje piękno, nasza pasja">
        </div>
        <div style="grid-column:1/-1">
          <label class="bk-label">Opis (kilka zdań)</label>
          <textarea id="sf-desc" class="bk-input" rows="3" style="resize:vertical">${BK.esc(s.description ?? "")}</textarea>
        </div>

        <div>
          <label class="bk-label">Miasto *</label>
          <input id="sf-city" class="bk-input" value="${BK.esc(s.city ?? "")}" placeholder="Np. Warszawa">
        </div>
        <div>
          <label class="bk-label">Ulica i numer</label>
          <input id="sf-street" class="bk-input" value="${BK.esc(s.street ?? "")}" placeholder="Np. Marszałkowska 10">
        </div>

        <div>
          <label class="bk-label">Telefon</label>
          <input id="sf-phone" class="bk-input" value="${BK.esc(s.phone ?? "")}" placeholder="+48 600 000 000">
        </div>
        <div>
          <label class="bk-label">Email kontaktowy</label>
          <input id="sf-email" type="email" class="bk-input" value="${BK.esc(s.email ?? "")}" placeholder="salon@email.pl">
        </div>
        <div style="grid-column:1/-1">
          <label class="bk-label">Strona WWW</label>
          <input id="sf-www" class="bk-input" value="${BK.esc(s.website ?? "")}" placeholder="https://twojsalon.pl">
        </div>

        <!-- Geolokalizacja -->
        <div style="grid-column:1/-1;padding:1rem;background:var(--vl);border-radius:.75rem">
          <p style="font-size:.8rem;font-weight:700;color:var(--vd);margin-bottom:.75rem">📍 Geolokalizacja (dla mapy)</p>
          <div style="display:flex;gap:.75rem;flex-wrap:wrap;align-items:flex-end">
            <div style="flex:1;min-width:120px">
              <label class="bk-label">Szerokość (lat)</label>
              <input id="sf-lat" class="bk-input" value="${s.lat ?? ""}" placeholder="52.2297">
            </div>
            <div style="flex:1;min-width:120px">
              <label class="bk-label">Długość (lng)</label>
              <input id="sf-lng" class="bk-input" value="${s.lng ?? ""}" placeholder="21.0122">
            </div>
            <button onclick="geocode()" class="bk-btn bk-btn-outline" style="flex-shrink:0;white-space:nowrap" id="btn-geo">
              🔍 Znajdź adres
            </button>
          </div>
          <p style="font-size:.72rem;color:var(--muted);margin-top:.5rem">Wpisz miasto i ulicę powyżej, potem kliknij „Znajdź adres" — uzupełnimy lat/lng automatycznie.</p>
        </div>

        <!-- Godziny otwarcia -->
        <div style="grid-column:1/-1">
          <label class="bk-label">Godziny otwarcia</label>
          <textarea id="sf-hours" class="bk-input" rows="3" style="resize:vertical;font-size:.8rem" placeholder="Np.
Pn–Pt: 9:00–19:00
Sb: 10:00–16:00
Nd: zamknięte">${BK.esc(s.opening_hours ?? "")}</textarea>
        </div>

        <div style="grid-column:1/-1">
          <label class="bk-label">Status</label>
          <select id="sf-status" class="bk-input" style="width:auto">
            <option value="active"  ${(s.status ?? "active") === "active"  ? "selected" : ""}>Aktywny (widoczny w katalogu)</option>
            <option value="draft"   ${s.status === "draft"   ? "selected" : ""}>Szkic (ukryty)</option>
            <option value="paused"  ${s.status === "paused"  ? "selected" : ""}>Wstrzymany</option>
          </select>
        </div>
      </div>

      <div style="margin-top:1.5rem;display:flex;gap:.75rem;flex-wrap:wrap">
        <button onclick="saveSalon()" class="bk-btn bk-btn-primary" id="btn-save-salon">
          💾 ${currentSalon ? "Zapisz zmiany" : "Dodaj salon"}
        </button>
        ${currentSalon ? `<button onclick="confirmDeleteSalon()" class="bk-btn" style="background:#fee2e2;color:#dc2626;border:1.5px solid #fca5a5">🗑 Usuń salon</button>` : ""}
      </div>
    </div>`;
}

window.geocode = async () => {
  const city   = document.getElementById("sf-city").value.trim();
  const street = document.getElementById("sf-street").value.trim();
  const query  = [street, city, "Poland"].filter(Boolean).join(", ");
  const btn    = document.getElementById("btn-geo");
  btn.disabled = true; btn.textContent = "Szukam...";
  try {
    const res  = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`, {
      headers: { "Accept-Language": "pl", "User-Agent": "BeautyKatalog/1.0" }
    });
    const data = await res.json();
    if (!data.length) { BK.toast("Nie znaleziono adresu — sprawdź miasto i ulicę", "error"); return; }
    document.getElementById("sf-lat").value = parseFloat(data[0].lat).toFixed(6);
    document.getElementById("sf-lng").value = parseFloat(data[0].lon).toFixed(6);
    BK.toast("Geolokalizacja uzupełniona ✓", "success");
  } catch { BK.toast("Błąd połączenia z Nominatim", "error"); }
  finally { btn.disabled = false; btn.textContent = "🔍 Znajdź adres"; }
};

window.saveSalon = async () => {
  const name = document.getElementById("sf-name").value.trim();
  const city = document.getElementById("sf-city").value.trim();
  if (!name || !city) { BK.toast("Wypełnij nazwę i miasto", "error"); return; }

  const payload = {
    owner_id:      currentUser.id,
    name,
    slug:          BK.slug(name),
    tagline:       document.getElementById("sf-tagline").value.trim() || null,
    description:   document.getElementById("sf-desc").value.trim()    || null,
    city,
    street:        document.getElementById("sf-street").value.trim()  || null,
    phone:         document.getElementById("sf-phone").value.trim()   || null,
    email:         document.getElementById("sf-email").value.trim()   || null,
    website:       document.getElementById("sf-www").value.trim()     || null,
    opening_hours: document.getElementById("sf-hours").value.trim()   || null,
    status:        document.getElementById("sf-status").value,
    lat:           parseFloat(document.getElementById("sf-lat").value) || null,
    lng:           parseFloat(document.getElementById("sf-lng").value) || null,
  };

  const btn = document.getElementById("btn-save-salon");
  btn.disabled = true; btn.textContent = "Zapisywanie...";

  let error;
  if (currentSalon) {
    ({ error } = await sb.from("salons").update(payload).eq("id", currentSalon.id));
  } else {
    const res = await sb.from("salons").insert(payload).select().single();
    error = res.error;
    if (!error) currentSalon = res.data;
  }

  btn.disabled = false; btn.textContent = `💾 ${currentSalon ? "Zapisz zmiany" : "Dodaj salon"}`;

  if (error) { BK.toast("Błąd zapisu: " + error.message, "error"); return; }
  BK.toast("Salon zapisany ✓", "success");
  renderSalonTab(document.getElementById("panel-content"));
};

window.confirmDeleteSalon = () => {
  const bg = BK.modal(`
    <h3 style="margin-bottom:.75rem;color:#dc2626">Usuń salon</h3>
    <p style="font-size:.875rem;color:var(--muted);margin-bottom:1.5rem">Tej operacji nie można cofnąć. Usuniętych zostanie też wszystkich zabiegów i zdjęć.</p>
    <div style="display:flex;gap:.75rem;flex-wrap:wrap">
      <button onclick="deleteSalon()" class="bk-btn" style="background:#dc2626;color:#fff">Tak, usuń</button>
      <button onclick="this.closest('.bk-modal-bg').remove()" class="bk-btn bk-btn-outline">Anuluj</button>
    </div>`);
  window._deleteSalonModal = bg;
};

window.deleteSalon = async () => {
  if (!currentSalon) return;
  const { error } = await sb.from("salons").delete().eq("id", currentSalon.id);
  if (error) { BK.toast("Błąd: " + error.message, "error"); return; }
  window._deleteSalonModal?.remove();
  currentSalon = null; services = []; photos = [];
  BK.toast("Salon usunięty", "info");
  renderSalonTab(document.getElementById("panel-content"));
};

/* ═══════════════════════════════════════════════════════════
   TAB 2 — ZABIEGI
═══════════════════════════════════════════════════════════ */
function renderServicesTab(container) {
  if (!currentSalon) {
    container.innerHTML = `<div class="bk-empty"><h3>Najpierw dodaj salon</h3><p>Uzupełnij dane salonu w zakładce „Dane salonu".</p></div>`;
    return;
  }

  container.innerHTML = `
    <div style="max-width:760px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;flex-wrap:wrap;gap:.75rem">
        <h2 style="font-size:1.1rem">Zabiegi i usługi</h2>
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
    list.innerHTML = `<div class="bk-empty"><h3>Brak zabiegów</h3><p>Dodaj pierwszy zabieg klikając przycisk powyżej.</p></div>`;
    return;
  }
  list.innerHTML = services.map(svc => `
    <div class="bk-card" style="padding:1rem 1.25rem;display:flex;align-items:center;gap:1rem;margin-bottom:.75rem;flex-wrap:wrap">
      <div style="flex:1;min-width:180px">
        <p style="font-weight:700;font-size:.95rem">${BK.esc(svc.name)}</p>
        ${svc.category ? `<span class="bk-badge" style="margin-top:.2rem">${BK.esc(svc.category)}</span>` : ""}
      </div>
      <div style="display:flex;gap:1.25rem;font-size:.85rem;color:var(--muted);flex-shrink:0">
        ${svc.duration_min ? `<span>⏱ ${svc.duration_min} min</span>` : ""}
        ${svc.price       ? `<span style="font-weight:700;color:var(--navy)">💰 ${svc.price} zł</span>` : ""}
      </div>
      <div style="display:flex;gap:.5rem;flex-shrink:0">
        <button onclick="openServiceModal('${svc.id}')" class="bk-btn bk-btn-outline" style="padding:.35rem .75rem;font-size:.8rem">Edytuj</button>
        <button onclick="deleteService('${svc.id}')" class="bk-btn" style="background:#fee2e2;color:#dc2626;border:1.5px solid #fca5a5;padding:.35rem .75rem;font-size:.8rem">Usuń</button>
      </div>
    </div>`).join("");
}

window.openServiceModal = (id) => {
  const svc = id ? services.find(s => s.id === id) : null;
  BK.modal(`
    <h3 style="margin-bottom:1.25rem">${svc ? "Edytuj zabieg" : "Nowy zabieg"}</h3>
    <div style="display:grid;gap:.85rem">
      <div>
        <label class="bk-label">Nazwa zabiegu *</label>
        <input id="sv-name" class="bk-input" value="${BK.esc(svc?.name ?? "")}" placeholder="Np. Manicure hybrydowy">
      </div>
      <div>
        <label class="bk-label">Kategoria</label>
        <select id="sv-cat" class="bk-input">
          ${["Paznokcie","Twarz","Ciało","Włosy","Rzęsy i brwi","Podologia","Masaż","Inne"].map(c =>
            `<option ${svc?.category === c ? "selected" : ""}>${c}</option>`).join("")}
        </select>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">
        <div>
          <label class="bk-label">Czas (minuty)</label>
          <input id="sv-dur" type="number" min="0" class="bk-input" value="${svc?.duration_min ?? ""}" placeholder="60">
        </div>
        <div>
          <label class="bk-label">Cena (zł)</label>
          <input id="sv-price" type="number" min="0" step="0.01" class="bk-input" value="${svc?.price ?? ""}" placeholder="150">
        </div>
      </div>
      <div>
        <label class="bk-label">Opis (opcjonalnie)</label>
        <textarea id="sv-desc" class="bk-input" rows="2" style="resize:vertical" placeholder="Krótki opis zabiegu...">${BK.esc(svc?.description ?? "")}</textarea>
      </div>
    </div>
    <div style="margin-top:1.25rem;display:flex;gap:.75rem;flex-wrap:wrap">
      <button onclick="saveService('${id ?? ""}')" class="bk-btn bk-btn-primary" id="btn-svc-save">
        💾 ${svc ? "Zapisz" : "Dodaj zabieg"}
      </button>
      <button onclick="this.closest('.bk-modal-bg').remove()" class="bk-btn bk-btn-outline">Anuluj</button>
    </div>`);
};

window.saveService = async (id) => {
  const name = document.getElementById("sv-name").value.trim();
  if (!name) { BK.toast("Podaj nazwę zabiegu", "error"); return; }
  const payload = {
    salon_id:     currentSalon.id,
    name,
    category:     document.getElementById("sv-cat").value   || null,
    duration_min: parseInt(document.getElementById("sv-dur").value)   || null,
    price:        parseFloat(document.getElementById("sv-price").value) || null,
    description:  document.getElementById("sv-desc").value.trim()     || null,
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
  if (id) { services = services.map(s => s.id === id ? data : s); }
  else    { services.push(data); }
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
   TAB 3 — ZDJĘCIA
═══════════════════════════════════════════════════════════ */
function renderPhotosTab(container) {
  if (!currentSalon) {
    container.innerHTML = `<div class="bk-empty"><h3>Najpierw dodaj salon</h3></div>`;
    return;
  }
  container.innerHTML = `
    <div style="max-width:800px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;flex-wrap:wrap;gap:.75rem">
        <h2 style="font-size:1.1rem">Zdjęcia salonu</h2>
        <label class="bk-btn bk-btn-primary" style="cursor:pointer;font-size:.875rem">
          📤 Dodaj zdjęcia
          <input type="file" accept="image/*" multiple style="display:none" onchange="uploadPhotos(this)">
        </label>
      </div>
      <p style="font-size:.8rem;color:var(--muted);margin-bottom:1.25rem">Pierwsze zdjęcie oznaczone jako „okładka" będzie wyświetlane na liście salonów. Max. 5 MB na plik, formaty: JPG, PNG, WebP.</p>
      <div id="photos-upload-progress" style="display:none;margin-bottom:1rem"></div>
      <div id="photos-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem"></div>
    </div>`;
  renderPhotosGrid();
}

function renderPhotosGrid() {
  const grid = document.getElementById("photos-grid");
  if (!grid) return;
  if (!photos.length) {
    grid.innerHTML = `<div class="bk-empty" style="grid-column:1/-1"><h3>Brak zdjęć</h3><p>Dodaj pierwsze zdjęcie salonu.</p></div>`;
    return;
  }
  grid.innerHTML = photos.map(p => `
    <div class="bk-card" style="overflow:hidden;position:relative">
      <img src="${BK.esc(p.url)}" alt="Zdjęcie salonu" loading="lazy"
        style="width:100%;height:160px;object-fit:cover;display:block">
      <div style="padding:.6rem .75rem;display:flex;align-items:center;justify-content:space-between;gap:.5rem">
        <label style="display:flex;align-items:center;gap:.35rem;font-size:.75rem;font-weight:700;cursor:pointer;color:${p.is_cover ? "var(--v)" : "var(--muted)"}">
          <input type="radio" name="cover-photo" ${p.is_cover ? "checked" : ""} onchange="setCover('${p.id}')">
          Okładka
        </label>
        <button onclick="deletePhoto('${p.id}','${BK.esc(p.url)}')"
          style="background:none;border:none;color:#dc2626;cursor:pointer;font-size:1.2rem;line-height:1" title="Usuń">×</button>
      </div>
    </div>`).join("");
}

window.uploadPhotos = async (input) => {
  const files = Array.from(input.files);
  if (!files.length) return;
  const MAX = 5 * 1024 * 1024;
  const bar = document.getElementById("photos-upload-progress");
  bar.style.display = "block";
  bar.innerHTML = `<div class="bk-card" style="padding:.75rem 1rem;font-size:.85rem">Przesyłanie ${files.length} pliku/-ów...</div>`;

  for (const file of files) {
    if (file.size > MAX) { BK.toast(`${file.name} przekracza limit 5 MB`, "error"); continue; }
    const ext  = file.name.split(".").pop().toLowerCase();
    const path = `${currentSalon.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: upErr } = await sb.storage.from("salon-photos").upload(path, file, { upsert: false });
    if (upErr) { BK.toast("Błąd uploadu: " + upErr.message, "error"); continue; }
    const { data: urlData } = sb.storage.from("salon-photos").getPublicUrl(path);
    const isFirst = photos.length === 0;
    const { data: rec, error: dbErr } = await sb.from("salon_photos")
      .insert({ salon_id: currentSalon.id, url: urlData.publicUrl, storage_path: path, is_cover: isFirst })
      .select().single();
    if (dbErr) { BK.toast("Błąd zapisu do bazy: " + dbErr.message, "error"); continue; }
    photos.push(rec);
  }

  bar.style.display = "none";
  input.value = "";
  BK.toast("Zdjęcia przesłane ✓", "success");
  renderPhotosGrid();
};

window.setCover = async (id) => {
  // Zdejmij okładkę ze wszystkich, ustaw na wybranym
  await sb.from("salon_photos").update({ is_cover: false }).eq("salon_id", currentSalon.id);
  await sb.from("salon_photos").update({ is_cover: true  }).eq("id", id);
  photos = photos.map(p => ({ ...p, is_cover: p.id === id }));
  BK.toast("Okładka ustawiona ✓", "success");
};

window.deletePhoto = async (id, url) => {
  if (!confirm("Usunąć to zdjęcie?")) return;
  const photo = photos.find(p => p.id === id);
  if (photo?.storage_path) {
    await sb.storage.from("salon-photos").remove([photo.storage_path]);
  }
  const { error } = await sb.from("salon_photos").delete().eq("id", id);
  if (error) { BK.toast("Błąd: " + error.message, "error"); return; }
  photos = photos.filter(p => p.id !== id);
  // Jeśli usunięto okładkę → ustaw pierwszą
  if (photo?.is_cover && photos.length) {
    await sb.from("salon_photos").update({ is_cover: true }).eq("id", photos[0].id);
    photos[0].is_cover = true;
  }
  BK.toast("Zdjęcie usunięte", "info");
  renderPhotosGrid();
};

})();
