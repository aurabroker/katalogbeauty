/* ================================================================
   BeautyKatalog · job-panel-app.js  v2.0
   Panel ogłoszeń pracy — formularze inline (nie modal)
================================================================ */
(function () {
"use strict";

const { sb, BK } = window;

let currentUser = null;
let myJobs      = [];
let editingId   = null; // null = nowe, string = edycja

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
      <p style="font-size:.85rem;color:var(--muted);margin-bottom:1.75rem">Zaloguj się lub utwórz konto, aby dodawać ogłoszenia.</p>
      <div style="display:flex;gap:.5rem;margin-bottom:1.5rem">
        <button onclick="showAuthTab('login')" id="tab-login"
          style="flex:1;padding:.5rem;border:none;background:var(--v);color:#fff;border-radius:.5rem;font-weight:700;font-size:.875rem;cursor:pointer">Logowanie</button>
        <button onclick="showAuthTab('register')" id="tab-register"
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
      <p style="margin-top:1.5rem;font-size:.8rem;text-align:center">
        <a href="jobs.html" style="color:var(--v)">← Lista ogłoszeń</a>
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
  if (!email || pass.length < 8) { BK.toast("Email i hasło min. 8 znaków", "error"); return; }
  btn.disabled = true; btn.textContent = "Tworzenie konta...";
  const { error } = await sb.auth.signUp({ email, password: pass });
  if (error) { BK.toast(error.message, "error"); btn.disabled = false; btn.textContent = "Utwórz konto"; return; }
  BK.toast("Sprawdź email — potwierdź rejestrację", "success", 6000);
  btn.disabled = false; btn.textContent = "Utwórz konto";
};

window.doReset = async () => {
  const email = document.getElementById("l-email")?.value.trim();
  if (!email) { BK.toast("Wpisz email powyżej", "error"); return; }
  await sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.href });
  BK.toast("Link resetowania wysłany", "success");
};

/* ═══════════════════════════════════════════════════════════
   LOAD
═══════════════════════════════════════════════════════════ */
async function loadMyJobs() {
  const { data } = await sb
    .from("job_listings")
    .select("*")
    .eq("owner_id", currentUser.id)
    .order("created_at", { ascending: false });
  myJobs = data ?? [];
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
        <a href="jobs.html" class="bk-btn bk-btn-outline" style="font-size:.8rem;padding:.4rem .9rem">← Ogłoszenia</a>
        <button onclick="doLogout()" class="bk-btn bk-btn-outline" style="font-size:.8rem;padding:.4rem .9rem">Wyloguj</button>
      </div>
    </div>

    <!-- DWIE KOLUMNY: lista + formularz -->
    <div id="panel-body" style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;align-items:start">
      <div id="jobs-list-col"></div>
      <div id="job-form-col"></div>
    </div>

    <style>
      @media(max-width:700px){
        #panel-body{grid-template-columns:1fr !important}
        #job-form-col{order:-1}
      }
    </style>

    <footer class="bk-footer" style="margin-top:3rem;background:transparent;color:var(--muted)">© 2026 BeautyKatalog</footer>`;
  document.body.appendChild(main);

  renderJobsList();
  showJobForm(null); // pusty formularz nowego ogłoszenia
}

window.doLogout = async () => { await sb.auth.signOut(); renderAuth(); };

/* ═══════════════════════════════════════════════════════════
   LISTA (lewa kolumna)
═══════════════════════════════════════════════════════════ */
function renderJobsList() {
  const col = document.getElementById("jobs-list-col");
  if (!col) return;

  const statusLabel = { active: "✅ Aktywne", draft: "📝 Szkic", closed: "🔒 Zamknięte" };
  const typeLabel   = { hiring: "💼 Zatrudnię", looking: "🙋 Szukam pracy" };
  const typeColor   = { hiring: "var(--v)", looking: "#0891b2" };

  col.innerHTML = `
    <h2 style="font-size:1rem;margin-bottom:1rem;color:var(--muted);text-transform:uppercase;font-size:.75rem;letter-spacing:.08em;font-weight:800">Twoje ogłoszenia</h2>
    ${!myJobs.length
      ? `<p style="font-size:.875rem;color:var(--muted)">Brak ogłoszeń — wypełnij formularz obok.</p>`
      : myJobs.map(j => `
        <div class="bk-card" style="padding:1rem;margin-bottom:.65rem;cursor:pointer;transition:.15s;border:2px solid ${editingId === j.id ? "var(--v)" : "var(--border)"}"
          onclick="showJobForm('${j.id}')"
          onmouseover="this.style.borderColor='var(--v)'" onmouseout="this.style.borderColor='${editingId === j.id ? "var(--v)" : "var(--border)"}'">
          <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.3rem;flex-wrap:wrap">
            <span style="font-size:.68rem;font-weight:800;color:${typeColor[j.type]}">${typeLabel[j.type]}</span>
            <span style="font-size:.68rem;color:var(--muted)">${statusLabel[j.status]}</span>
          </div>
          <p style="font-weight:700;font-size:.9rem;margin-bottom:.15rem">${BK.esc(j.title)}</p>
          <p style="font-size:.78rem;color:var(--muted)">📍 ${BK.esc(j.city)}</p>
          <div style="margin-top:.65rem;display:flex;gap:.4rem">
            <button onclick="event.stopPropagation();showJobForm('${j.id}')" class="bk-btn bk-btn-outline" style="padding:.3rem .65rem;font-size:.75rem">Edytuj</button>
            <button onclick="event.stopPropagation();deleteJob('${j.id}')" class="bk-btn" style="background:#fee2e2;color:#dc2626;border:1.5px solid #fca5a5;padding:.3rem .65rem;font-size:.75rem">Usuń</button>
          </div>
        </div>`).join("")}`;
}

/* ═══════════════════════════════════════════════════════════
   FORMULARZ INLINE (prawa kolumna)
═══════════════════════════════════════════════════════════ */
function showJobForm(id) {
  editingId = id;
  renderJobsList(); // odśwież podświetlenie aktywnej karty

  const j   = id ? myJobs.find(x => x.id === id) : null;
  const col = document.getElementById("job-form-col");
  if (!col) return;

  const voivodeships = ["","dolnośląskie","kujawsko-pomorskie","lubelskie","lubuskie","łódzkie",
    "małopolskie","mazowieckie","opolskie","podkarpackie","podlaskie","pomorskie","śląskie",
    "świętokrzyskie","warmińsko-mazurskie","wielkopolskie","zachodniopomorskie"];

  col.innerHTML = `
    <div style="position:sticky;top:80px">
      <h2 style="font-size:.75rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:1.25rem">
        ${j ? "Edytujesz ogłoszenie" : "Nowe ogłoszenie"}
      </h2>

      <div class="bk-card" style="padding:1.5rem;display:grid;gap:1rem">

        <!-- Typ -->
        <div>
          <label class="bk-label">Typ ogłoszenia *</label>
          <div style="display:flex;gap:.5rem">
            <button id="btn-type-hiring"  onclick="selectType('hiring')"
              style="flex:1;padding:.55rem;border:1.5px solid var(--border);border-radius:.6rem;font-weight:700;font-size:.85rem;cursor:pointer;
              background:${(!j || j.type==='hiring') ? 'var(--v)' : '#fff'};
              color:${(!j || j.type==='hiring') ? '#fff' : 'var(--muted)'}">💼 Zatrudnię</button>
            <button id="btn-type-looking" onclick="selectType('looking')"
              style="flex:1;padding:.55rem;border:1.5px solid var(--border);border-radius:.6rem;font-weight:700;font-size:.85rem;cursor:pointer;
              background:${j?.type==='looking' ? '#0891b2' : '#fff'};
              color:${j?.type==='looking' ? '#fff' : 'var(--muted)'}">🙋 Szukam pracy</button>
          </div>
          <input type="hidden" id="jf-type" value="${j?.type ?? "hiring"}">
        </div>

        <!-- Stanowisko -->
        <div>
          <label class="bk-label">Stanowisko *</label>
          <input id="jf-title" class="bk-input" value="${BK.esc(j?.title ?? "")}"
            placeholder="Fryzjer, Kosmetolog, Wizażysta...">
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
          <label class="bk-label">Opis</label>
          <textarea id="jf-desc" class="bk-input" rows="4" style="resize:vertical"
            placeholder="Wymagania, warunki, zakres obowiązków...">${BK.esc(j?.description ?? "")}</textarea>
        </div>

        <!-- Wynagrodzenie -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">
          <div>
            <label class="bk-label">Wynagrodzenie od (zł)</label>
            <input id="jf-sal-from" type="number" min="0" class="bk-input" value="${j?.salary_from ?? ""}" placeholder="4000">
          </div>
          <div>
            <label class="bk-label">Wynagrodzenie do (zł)</label>
            <input id="jf-sal-to" type="number" min="0" class="bk-input" value="${j?.salary_to ?? ""}" placeholder="7000">
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
            <label class="bk-label">Telefon</label>
            <input id="jf-phone" type="tel" class="bk-input" value="${BK.esc(j?.phone ?? "")}" placeholder="+48 600 000 000">
          </div>
          <div>
            <label class="bk-label">Email</label>
            <input id="jf-email" type="email" class="bk-input" value="${BK.esc(j?.email ?? "")}" placeholder="kontakt@email.pl">
          </div>
        </div>
        <p style="font-size:.72rem;color:var(--muted);margin-top:-.5rem">Podaj przynajmniej jedno z pól kontaktowych.</p>

        <!-- Status -->
        <div>
          <label class="bk-label">Status</label>
          <select id="jf-status" class="bk-input">
            <option value="active" ${(j?.status ?? "active") === "active" ? "selected" : ""}>Aktywne (widoczne)</option>
            <option value="draft"  ${j?.status === "draft"  ? "selected" : ""}>Szkic (ukryte)</option>
            <option value="closed" ${j?.status === "closed" ? "selected" : ""}>Zamknięte</option>
          </select>
        </div>

        <!-- Przyciski -->
        <div style="display:flex;gap:.65rem;flex-wrap:wrap;padding-top:.25rem;border-top:1px solid var(--border)">
          <button onclick="saveJob()" class="bk-btn bk-btn-primary" id="btn-job-save" style="flex:1">
            💾 ${j ? "Zapisz zmiany" : "Opublikuj ogłoszenie"}
          </button>
          ${j ? `<button onclick="cancelEdit()" class="bk-btn bk-btn-outline">Anuluj</button>` : ""}
        </div>
      </div>
    </div>`;
}

window.selectType = (type) => {
  document.getElementById("jf-type").value = type;
  const bh = document.getElementById("btn-type-hiring");
  const bl = document.getElementById("btn-type-looking");
  bh.style.background = type === "hiring"  ? "var(--v)"   : "#fff";
  bh.style.color      = type === "hiring"  ? "#fff"       : "var(--muted)";
  bl.style.background = type === "looking" ? "#0891b2"    : "#fff";
  bl.style.color      = type === "looking" ? "#fff"       : "var(--muted)";
};

window.cancelEdit = () => {
  editingId = null;
  renderJobsList();
  showJobForm(null);
};

/* ═══════════════════════════════════════════════════════════
   ZAPIS
═══════════════════════════════════════════════════════════ */
window.saveJob = async () => {
  const title = document.getElementById("jf-title").value.trim();
  const city  = document.getElementById("jf-city").value.trim();
  const phone = document.getElementById("jf-phone").value.trim();
  const email = document.getElementById("jf-email").value.trim();

  if (!title || !city) { BK.toast("Wypełnij stanowisko i miasto", "error"); return; }
  if (!phone && !email) { BK.toast("Podaj telefon lub email", "error"); return; }

  const payload = {
    owner_id:    currentUser.id,
    type:        document.getElementById("jf-type").value,
    title, city,
    voivodeship: document.getElementById("jf-voi").value        || null,
    description: document.getElementById("jf-desc").value.trim()|| null,
    salary_from: parseFloat(document.getElementById("jf-sal-from").value) || null,
    salary_to:   parseFloat(document.getElementById("jf-sal-to").value)   || null,
    employment:  document.getElementById("jf-emp").value         || null,
    phone:       phone || null,
    email:       email || null,
    status:      document.getElementById("jf-status").value,
  };

  const btn = document.getElementById("btn-job-save");
  btn.disabled = true; btn.textContent = "Zapisuję...";

  let error, data;
  if (editingId) {
    ({ error, data } = await sb.from("job_listings").update(payload).eq("id", editingId).select().single());
  } else {
    ({ error, data } = await sb.from("job_listings").insert(payload).select().single());
  }

  if (error) {
    BK.toast("Błąd: " + error.message, "error");
    btn.disabled = false; btn.textContent = "💾 Zapisz";
    return;
  }

  if (editingId) {
    myJobs = myJobs.map(j => j.id === editingId ? data : j);
  } else {
    myJobs.unshift(data);
  }

  BK.toast(editingId ? "Ogłoszenie zaktualizowane ✓" : "Ogłoszenie opublikowane ✓", "success");
  editingId = null;
  renderJobsList();
  showJobForm(null);
};

/* ═══════════════════════════════════════════════════════════
   USUŃ
═══════════════════════════════════════════════════════════ */
window.deleteJob = async (id) => {
  if (!confirm("Usunąć to ogłoszenie?")) return;
  const { error } = await sb.from("job_listings").delete().eq("id", id);
  if (error) { BK.toast("Błąd: " + error.message, "error"); return; }
  myJobs = myJobs.filter(j => j.id !== id);
  if (editingId === id) { editingId = null; showJobForm(null); }
  BK.toast("Ogłoszenie usunięte", "info");
  renderJobsList();
};

})();
