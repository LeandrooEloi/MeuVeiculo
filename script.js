const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

let vehicles = [];

const el = (sel, root = document) => root.querySelector(sel);
const els = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function onlyDigits(s) {
  return (s || "").replace(/\D/g, "");
}

function buildWhatsAppLink({ phoneDigits, message }) {
  const phone = onlyDigits(phoneDigits);
  const text = encodeURIComponent(message || "");
  return `https://wa.me/${phone}?text=${text}`;
}

/* Scroll suave (âncoras) */
function setupSmoothAnchors() {
  const links = els('a[href^="#"]');
  links.forEach(a => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href || href === "#") return;
      const target = el(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" }); // [web:26]
      closeMobileMenu();
    });
  });
}

/* Menu mobile */
const btnMenu = el("#btnMenu");
const mobileMenu = el("#mobileMenu");

function openMobileMenu() {
  mobileMenu.hidden = false;
  btnMenu.setAttribute("aria-expanded", "true");
  btnMenu.setAttribute("aria-label", "Fechar menu");
  btnMenu.querySelector(".material-symbols-outlined").textContent = "close";
}
function closeMobileMenu() {
  mobileMenu.hidden = true;
  btnMenu.setAttribute("aria-expanded", "false");
  btnMenu.setAttribute("aria-label", "Abrir menu");
  btnMenu.querySelector(".material-symbols-outlined").textContent = "menu";
}
function toggleMobileMenu() {
  const isOpen = !mobileMenu.hidden;
  if (isOpen) closeMobileMenu();
  else openMobileMenu();
}

/* Render Estoque */
const grid = el("#inventoryGrid");
const resultsCount = el("#resultsCount");
const activeFilters = el("#activeFilters");

function vehicleMeta(v) {
  const kmLabel = `${Number(v.km).toLocaleString("pt-BR")} km`;
  return `${v.ano} • ${kmLabel} • ${v.cambio}`;
}
function badgeClass(v) {
  return v.badgeType === "offer" ? "badge offer" : "badge";
}
function makeWhatsVehicle(v) {
  return buildWhatsAppLink({
    phoneDigits: "5599999999999",
    message: `Olá! Tenho interesse no ${v.marca} ${v.modelo} (${v.ano}). Ainda está disponível?`
  });
}

function renderVehicles(list) {
  grid.innerHTML = "";

  if (!list.length) {
    grid.innerHTML = `
      <div class="pill" style="justify-content:center; padding:14px 16px;">
        Nenhum veículo encontrado com esses filtros.
      </div>
    `;
    resultsCount.textContent = `0 veículos`;
    return;
  }

  const frag = document.createDocumentFragment();

  list.forEach(v => {
    const card = document.createElement("article");
    card.className = "card";

    // se a img não existir, pelo menos não quebra o layout
    const safeImg = v.img || "assets/vehicles/placeholder.jpg";

    card.innerHTML = `
      <div class="card-media">
        <img src="${safeImg}" alt="Foto do ${v.marca} ${v.modelo}" loading="lazy">
        <span class="${badgeClass(v)}">${v.badge || "Disponível"}</span>
      </div>

      <div class="card-body">
        <div class="card-title">${v.marca} ${v.modelo}</div>
        <div class="card-meta">${vehicleMeta(v)}</div>
        <div class="card-price">${BRL.format(Number(v.preco) || 0)}</div>

        <div class="card-actions">
          <button class="btn btn-ghost" type="button" data-details="${v.id}">Ver detalhes</button>
          <a class="btn btn-outline" href="${makeWhatsVehicle(v)}" target="_blank" rel="noreferrer" aria-label="Chamar no WhatsApp">
            <span class="material-symbols-outlined" aria-hidden="true">chat</span>
            WhatsApp
          </a>
        </div>
      </div>
    `;
    frag.appendChild(card);
  });

  grid.appendChild(frag);
  resultsCount.textContent = `${list.length} veículo${list.length > 1 ? "s" : ""}`;
}

/* Filtros */
const searchForm = el("#searchForm");
const searchHint = el("#searchHint");
const btnLimpar = el("#btnLimparFiltros");

function readFilters() {
  const marca = el("#fMarca").value.trim();
  const modelo = el("#fModelo").value.trim().toLowerCase();
  const ano = el("#fAno").value.trim();
  const preco = el("#fPreco").value.trim();

  return {
    marca,
    modelo,
    ano: ano ? Number(ano) : null,
    preco: preco ? Number(preco) : null
  };
}

function describeFilters(f) {
  const parts = [];
  if (f.marca) parts.push(`Marca: ${f.marca}`);
  if (f.modelo) parts.push(`Modelo contém: "${f.modelo}"`);
  if (f.ano) parts.push(`Ano: ${f.ano}`);
  if (f.preco) parts.push(`Preço até: ${BRL.format(f.preco)}`);
  return parts.length ? parts.join(" • ") : "Sem filtros aplicados";
}

function applyFilters() {
  const f = readFilters();

  const filtered = vehicles.filter(v => {
    if (f.marca && v.marca !== f.marca) return false;
    if (f.modelo) {
      const full = `${v.marca} ${v.modelo}`.toLowerCase();
      if (!full.includes(f.modelo)) return false;
    }
    if (f.ano && Number(v.ano) !== f.ano) return false;
    if (f.preco && Number(v.preco) > f.preco) return false;
    return true;
  });

  activeFilters.textContent = describeFilters(f);
  renderVehicles(filtered);

  el("#estoque").scrollIntoView({ behavior: "smooth", block: "start" }); // [web:26]
}

function clearFilters() {
  el("#fMarca").value = "";
  el("#fModelo").value = "";
  el("#fAno").value = "";
  el("#fPreco").value = "";
  searchHint.textContent = "Filtros limpos. Mostrando todos os veículos.";
  activeFilters.textContent = "Sem filtros aplicados";
  renderVehicles(vehicles);
}

/* Modal */
const modal = el("#vehicleModal");
const modalImg = el("#modalImg");
const modalTitle = el("#modalTitle");
const modalMeta = el("#modalMeta");
const modalPrice = el("#modalPrice");
const modalBadge = el("#modalBadge");
const modalWhats = el("#modalWhats");

function openModal(vehicleId) {
  const v = vehicles.find(x => x.id === vehicleId);
  if (!v) return;

  modalImg.src = v.img || "assets/vehicles/placeholder.jpg";
  modalTitle.textContent = `${v.marca} ${v.modelo}`;
  modalMeta.textContent = vehicleMeta(v);
  modalPrice.textContent = BRL.format(Number(v.preco) || 0);
  modalBadge.textContent = v.badge || "Disponível";
  modalBadge.className = v.badgeType === "offer" ? "badge offer" : "badge";
  modalWhats.href = makeWhatsVehicle(v);

  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
function closeModal() {
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}
function setupModalEvents() {
  modal.addEventListener("click", (e) => {
    const close = e.target.closest("[data-close-modal]");
    if (close) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.getAttribute("aria-hidden") === "false") {
      closeModal();
    }
  });

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-details]");
    if (!btn) return;
    openModal(btn.getAttribute("data-details"));
  });
}

/* Form contato + newsletter */
const contactForm = el("#contactForm");
const formNote = el("#formNote");
const newsletterForm = el("#newsletterForm");
const newsNote = el("#newsNote");

function maskWhatsApp(input) {
  const digits = onlyDigits(input.value).slice(0, 11);
  let out = digits;
  if (digits.length >= 2) out = `(${digits.slice(0,2)}) ${digits.slice(2)}`;
  if (digits.length >= 7) out = `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
  input.value = out;
}

function setupForms() {
  const whats = el("#cWhats");
  whats.addEventListener("input", () => maskWhatsApp(whats));

  contactForm.addEventListener("submit", (e) => {
    e.preventDefault(); // [web:21][web:22]
    const nome = el("#cNome").value.trim();
    const phone = el("#cWhats").value.trim();
    const email = el("#cEmail").value.trim();
    const msg = el("#cMsg").value.trim();

    if (!nome || !phone || !email || !msg) {
      formNote.textContent = "Preencha todos os campos para enviar.";
      return;
    }

    formNote.textContent = "Mensagem enviada (demo). Em um projeto real, isso iria para seu backend.";
    contactForm.reset();
  });

  newsletterForm.addEventListener("submit", (e) => {
    e.preventDefault(); // [web:21][web:22]
    const email = newsletterForm.elements.newsEmail.value.trim();
    if (!email) {
      newsNote.textContent = "Digite seu e-mail.";
      return;
    }
    newsNote.textContent = "Inscrição registrada (demo).";
    newsletterForm.reset();
  });
}

/* CTAs */
function setupCTAs() {
  const btnWhatsFooter = el("#btnWhatsFooter");
  btnWhatsFooter.href = buildWhatsAppLink({
    phoneDigits: "5599999999999",
    message: "Olá! Vim pelo site meuVeiculo e quero falar com um consultor."
  });

  const btnAnunciar = el("#btnAnunciar");
  const btnAnunciarMobile = el("#btnAnunciarMobile");

  function anunciar() {
    el("#contato").scrollIntoView({ behavior: "smooth", block: "start" }); // [web:26]
    formNote.textContent = "Conte pra gente os dados do veículo (marca, modelo, ano, km e valor).";
  }

  btnAnunciar.addEventListener("click", anunciar);
  if (btnAnunciarMobile) btnAnunciarMobile.addEventListener("click", anunciar);

  btnLimpar.addEventListener("click", clearFilters);
}

/* Carregar JSON */
async function loadVehicles() {
  try {
    const response = await fetch("./data/vehicles.json"); // [web:36]
    if (!response.ok) throw new Error(`Erro ao carregar JSON: ${response.status}`);
    const data = await response.json(); // [web:41]
    vehicles = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error(err);
    vehicles = [];
  }
}

/* Init */
async function init() {
  btnMenu.addEventListener("click", toggleMobileMenu);
  setupSmoothAnchors();
  setupModalEvents();
  setupForms();
  setupCTAs();

  await loadVehicles();
  renderVehicles(vehicles);
  activeFilters.textContent = "Sem filtros aplicados";
  resultsCount.textContent = `${vehicles.length} veículos`;

  searchForm.addEventListener("submit", (e) => {
    e.preventDefault(); // [web:21][web:22]
    searchHint.textContent = "Aplicando filtros...";
    applyFilters();
    searchHint.textContent = "";
  });
}

init();
