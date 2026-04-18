/* ================================================================
   BeautyKatalog · job-panel-app.js  v1.0
   Panel ogłoszeniodawcy: auth + CRUD ogłoszeń pracy
================================================================ */
(function () {
"use strict";

const { sb, BK } = window;

let currentUser = null;
let myJobs      = [];

/* ── BOOT ──────────────────────────────────────────────────── */
BK.nav("jobs");

(async () => {
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    currentUser = session.user;
    await loadMyJobs();
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
  BK.nav("jobs");

  const wrap = document.createElement("main");
  wrap.className = "bk-container";
  wrap.style.cssText = "max-width:440px;padding-top:4rem;padding-bottom:4rem";
  wrap.innerHTML = `
    <div class="bk-card" style="padding:2rem">
      <h1 style="font-size:1.4rem;margin-bottom:.25rem">Panel ogłoszeń</h1>
      <p style="font-size:.85rem;color:var(--muted);margin-bottom:1.75rem">
        Zaloguj się lub utwórz konto, aby dodawać ogłoszenia o pracę.
      </p>

      <div style="display:flex;gap:.5rem;margin-bottom:1.5rem">
        <button onclick="showAuthTab('login')" id="tab-login"
          style="flex:1;padding:.5rem;border:none;background:var(--v);color:#fff;border-radius:.5rem;font-weight:700;font-size:.875rem;cursor:pointer">
          Logowanie
        </button>
        <button onclick="showAuthTab('register')" id="tab-register"
          style="flex:1;padding:.5rem;border:none;background:var(--vl);color:var(--v);border-radius:.5rem;font-weight:700;font-size:.875rem;cursor:pointer">
          Rejestracja
        </button>
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
          <a href="#" onclick="doReset();return false" style="color:var(--v)">Zapomniałem/am hasła</a>
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

      <p style="margin-top:1.5rem;font-size:.8rem;text-align:center;color:var(--muted)">
        <a href="jobs.html" style="color:var(--v)">← Wróć do listy ogłoszeń</a>
      </p>
    </div>`;
  document.body.appendChild(wrap);
}

window.showAuthTab = (tab) => {
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
  await loadMyJobs();
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

window.doReset = async () => {
  const email = document.getElementById("l-email").value.trim();
  if (!email) { BK.toast("Wpisz email powyżej", "error"); return; }
  await sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.href });
  BK.toast("Link resetowania wysłany", "success");
};

/* ═══════════════════════════════════════════════════════════
   LOAD
═══════════════════════════════════════════════════════════ */
async function loadMyJobs() {
  const { data, error } = await sb
    .from("job_listings")
    .select("*")
    .eq("owner_id", currentUser.id)
    .order("created_at", { ascending: false });
  if (!error) myJobs = data ?? [];
}

/* ═══════════════════════════════════════════════════════════
   PANEL SHELL
═══════════════════════════════════════════════════════════ */
function renderPanel() {
  document.body.innerHTML = "";
  BK.nav("jobs");

  const main = document.createElement("main");
  main.className = "bk-container";
  main.style.cssText = "padding-top:2rem;padding-bottom:4rem;max-width:860px";
  main.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;margin-bottom:2rem">
      <div>
        <h1 style="font-size:1.4rem;margin-bottom:.15rem">Moje ogłoszenia</h1>
        <p style="font-size:.8rem;color:var(--muted)">${BK.esc(currentUser.email)}</p>
      </div>
      <div style="display:flex;gap:.6rem;flex-wrap:wrap">
        <a href="jobs.html" class="bk-btn bk-btn-outline" style="font-size:.8rem;padding:.4rem .9rem">← Lista ogłoszeń</a>
        <button onclick="doLogout()" class="bk-btn bk-btn-outline" style="font-size:.8rem;padding:.4rem .9rem">Wyloguj</button>
      </div>
    </div>

    <div style="margin-bottom:1.5rem">
      <button onclick="openJobModal(null)" class="bk-btn bk-btn-primary">+ Dodaj ogłoszenie</button>
    </div>

    <div id="jobs-list"></div>
    <footer class="bk-footer" style="margin-top:3rem;background:transparent;color:var(--muted)">© 2026 BeautyKatalog</footer>`;
  document.body.appendChild(main);
  renderJobsList();
}

window.doLogout = async () => {
  await sb.auth.signOut();
  renderAuth();
};

/* ═══════════════════════════════════════════════════════════
   LISTA MOICH OGŁOSZEŃ
═══════════════════════════════════════════════════════════ */
function renderJobsList() {
  const list = document.getElementById("jobs-list");
  if (!list) return;

  if (!myJobs.length) {
    list.innerHTML = `
      <div class="bk-empty">
        <h3>Brak ogłoszeń</h3>
        <p>Kliknij „+ Dodaj ogłoszenie" aby opublikować swoje pierwsze ogłoszenie.</p>
      </div>`;
    return;
  }

  const statusLabel = { active: "✅ Aktywne", draft: "📝 Szkic", closed: "🔒 Zamknięte" };
  const typeLabel   = { hiring: "💼 Zatrudnię", looking: "🙋 Szukam pracy" };

  list.innerHTML = myJobs.map(j => `
    <div class="bk-card" style="padding:1.1rem 1.25rem;display:flex;align-items:flex-start;gap:1rem;margin-bottom:.75rem;flex-wrap:wrap">
      <div style="flex:1;min-width:180px">
        <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.25rem;flex-wrap:wrap">
          <span style="font-size:.7rem;font-weight:800;color:${j.type === "hiring" ? "var(--v)" : "#0891b2"}">${typeLabel[j.type]}</span>
          <span style="font-size:.7rem;color:var(--muted)">${statusLabel[j.status] ?? j.status}</span>
        </div>
        <p style="font-weight:700;font-size:.95rem;margin-bottom:.2rem">${BK.esc(j.title)}</p>
        <p style="font-size:.8rem;color:var(--muted)">📍 ${BK.esc(j.city)}${j.voivodeship ? `, ${BK.esc(j.voivodeship)}` : ""}</p>
      </div>
      <div style="display:flex;gap:.5rem;flex-shrink:0;align-self:center">
        <button onclick="openJobModal('${j.id}')" class="bk-btn bk-btn-outline" style="padding:.35rem .75rem;font-size:.8rem">Edytuj</button>
        <button onclick="deleteJob('${j.id}')" class="bk-btn" style="background:#fee2e2;color:#dc2626;border:1.5px solid #fca5a5;padding:.35rem .75rem;font-size:.8rem">Usuń</button>
      </div>
    </div>`).join("");
}

/* ═══════════════════════════════════════════════════════════
   MODAL DODAJ / EDYTUJ
═══════════════════════════════════════════════════════════ */
window.openJobModal = (id) => {
  const j = id ? myJobs.find(x => x.id === id) : null;

  const voivodeships = ["","dolnośląskie","kujawsko-pomorskie","lubelskie","lubuskie","łódzkie",
    "małopolskie","mazowieckie","opolskie","podkarpackie","podlaskie","pomorskie","śląskie",
    "świętokrzyskie","warmińsko-mazurskie","wielkopolskie","zachodniopomorskie"];

  BK.modal(`
    <h3 style="margin-bottom:1.25rem">${j ? "Edytuj ogłoszenie" : "Nowe ogłoszenie"}</h3>
    <div style="display:grid;gap:.9rem">

      <!-- Typ -->
      <div>
        <label class="bk-label">Typ ogłoszenia *</label>
        <div style="display:flex;gap:.5rem">
          <button id="btn-type-hiring"  onclick="selectType('hiring')"
            style="flex:1;padding:.55rem;border:1.5px solid var(--border);border-radius:.6rem;font-weight:700;font-size:.85rem;cursor:pointer;background:${(!j || j.type === "hiring") ? "var(--v)" : "#fff"};color:${(!j || j.type === "hiring") ? "#fff" : "var(--muted)"}">
            💼 Zatrudnię
          </button>
          <button id="btn-type-looking" onclick="selectType('looking')"
            style="flex:1;padding:.55rem;border:1.5px solid var(--border);border-radius:.6rem;font-weight:700;font-size:.85rem;cursor:pointer;background:${j?.type === "looking" ? "#0891b2" : "#fff"};color:${j?.type === "looking" ? "#fff" : "var(--muted)"}">
            🙋 Szukam pracy
          </button>
        </div>
        <input type="hidden" id="jf-type" value="${j?.type ?? "hiring"}">
      </div>

      <!-- Stanowisko -->
      <div>
        <label class="bk-label">Stanowisko / Tytuł ogłoszenia *</label>
        <input id="jf-title" class="bk-input" value="${BK.esc(j?.title ?? "")}"
          placeholder="Np. Fryzjer z doświadczeniem, Kosmetolog, Wizażysta">
      </div>

      <!-- Lokalizacja -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">
        <div>
          <label class="bk-label">Miasto *</label>
          <input id="jf-city" class="bk-input" value="${BK.esc(j?.city ?? "")}" placeholder="Warszawa">
        </div>
        <div>
          <label class="bk-label">Województwo</label>
          <select id="jf-voi" class="bk-input">
            ${voivodeships.map(v => `<option ${(j?.voivodeship ?? "") === v ? "selected" : ""}>${v}</option>`).join("")}
          </select>
        </div>
      </div>

      <!-- Opis -->
      <div>
        <label class="bk-label">Opis ogłoszenia</label>
        <textarea id="jf-desc" class="bk-input" rows="4" style="resize:vertical"
          placeholder="Opisz wymagania, oferowane warunki, zakres obowiązków...">${BK.esc(j?.description ?? "")}</textarea>
      </div>

      <!-- Wynagrodzenie -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">
        <div>
          <label class="bk-label">Wynagrodzenie od (zł)</label>
          <input id="jf-sal-from" type="number" min="0" class="bk-input" value="${j?.salary_from ?? ""}" placeholder="4000">
        </div>
        <div>
          <label class="bk-label">Wynagrodzenie do (zł)</label>
          <input id="jf-sal-to" type="number" min="0" class="bk-input" value="${j?.salary_to ?? ""}" placeholder="6000">
        </div>
      </div>

      <!-- Forma zatrudnienia -->
      <div>
        <label class="bk-label">Forma zatrudnienia</label>
        <select id="jf-emp" class="bk-input">
          <option value="">— nie podaję —</option>
          <option value="uop"      ${j?.employment === "uop"      ? "selected" : ""}>Umowa o pracę</option>
          <option value="b2b"      ${j?.employment === "b2b"      ? "selected" : ""}>B2B</option>
          <option value="zlecenie" ${j?.employment === "zlecenie" ? "selected" : ""}>Umowa zlecenie</option>
          <option value="dowolna"  ${j?.employment === "dowolna"  ? "selected" : ""}>Dowolna</option>
        </select>
      </div>

      <!-- Kontakt -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">
        <div>
          <label class="bk-label">Telefon kontaktowy</label>
          <input id="jf-phone" type="tel" class="bk-input" value="${BK.esc(j?.phone ?? "")}" placeholder="+48 600 000 000">
        </div>
        <div>
          <label class="bk-label">Email kontaktowy</label>
          <input id="jf-email" type="email" class="bk-input" value="${BK.esc(j?.email ?? "")}" placeholder="kontakt@email.pl">
        </div>
      </div>
      <p style="font-size:.72rem;color:var(--muted);margin-top:-.5rem">Podaj przynajmniej jeden sposób kontaktu — telefon lub email.</p>

      <!-- Status -->
      <div>
        <label class="bk-label">Status</label>
        <select id="jf-status" class="bk-input">
          <option value="active" ${(j?.status ?? "active") === "active" ? "selected" : ""}>Aktywne (widoczne publicznie)</option>
          <option value="draft"  ${j?.status === "draft"  ? "selected" : ""}>Szkic (ukryte)</option>
          <option value="closed" ${j?.status === "closed" ? "selected" : ""}>Zamknięte</option>
        </select>
      </div>
    </div>

    <div style="margin-top:1.25rem;display:flex;gap:.75rem;flex-wrap:wrap">
      <button onclick="saveJob('${id ?? ""}')" class="bk-btn bk-btn-primary" id="btn-job-save">
        💾 ${j ? "Zapisz zmiany" : "Opublikuj ogłoszenie"}
      </button>
      <button onclick="this.closest('.bk-modal-bg').remove()" class="bk-btn bk-btn-outline">Anuluj</button>
    </div>`);
};

/* Przełącznik Zatrudnię / Szukam */
window.selectType = (type) => {
  document.getElementById("jf-type").value = type;
  const bh = document.getElementById("btn-type-hiring");
  const bl = document.getElementById("btn-type-looking");
  bh.style.background = type === "hiring"  ? "var(--v)"   : "#fff";
  bh.style.color      = type === "hiring"  ? "#fff"       : "var(--muted)";
  bl.style.background = type === "looking" ? "#0891b2"    : "#fff";
  bl.style.color      = type === "looking" ? "#fff"       : "var(--muted)";
};

/* ── ZAPIS ──────────────────────────────────────────────────── */
window.saveJob = async (id) => {
  const title = document.getElementById("jf-title").value.trim();
  const city  = document.getElementById("jf-city").value.trim();
  const phone = document.getElementById("jf-phone").value.trim();
  const email = document.getElementById("jf-email").value.trim();

  if (!title || !city) { BK.toast("Wypełnij stanowisko i miasto", "error"); return; }
  if (!phone && !email) { BK.toast("Podaj telefon lub email kontaktowy", "error"); return; }

  const payload = {
    owner_id:    currentUser.id,
    type:        document.getElementById("jf-type").value,
    title,
    city,
    voivodeship: document.getElementById("jf-voi").value   || null,
    description: document.getElementById("jf-desc").value.trim() || null,
    salary_from: parseFloat(document.getElementById("jf-sal-from").value) || null,
    salary_to:   parseFloat(document.getElementById("jf-sal-to").value)   || null,
    employment:  document.getElementById("jf-emp").value   || null,
    phone:       phone || null,
    email:       email || null,
    status:      document.getElementById("jf-status").value,
  };

  const btn = document.getElementById("btn-job-save");
  btn.disabled = true; btn.textContent = "Zapisuję...";

  let error, data;
  if (id) {
    ({ error, data } = await sb.from("job_listings").update(payload).eq("id", id).select().single());
  } else {
    ({ error, data } = await sb.from("job_listings").insert(payload).select().single());
  }

  if (error) {
    BK.toast("Błąd: " + error.message, "error");
    btn.disabled = false; btn.textContent = "💾 Zapisz";
    return;
  }

  if (id) { myJobs = myJobs.map(j => j.id === id ? data : j); }
  else    { myJobs.unshift(data); }

  document.querySelector(".bk-modal-bg")?.remove();
  BK.toast(id ? "Ogłoszenie zaktualizowane ✓" : "Ogłoszenie opublikowane ✓", "success");
  renderJobsList();
};

/* ── USUŃ ───────────────────────────────────────────────────── */
window.deleteJob = async (id) => {
  if (!confirm("Usunąć to ogłoszenie?")) return;
  const { error } = await sb.from("job_listings").delete().eq("id", id);
  if (error) { BK.toast("Błąd: " + error.message, "error"); return; }
  myJobs = myJobs.filter(j => j.id !== id);
  BK.toast("Ogłoszenie usunięte", "info");
  renderJobsList();
};

})();
