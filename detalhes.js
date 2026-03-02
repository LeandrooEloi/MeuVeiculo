const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const el = (sel, root = document) => root.querySelector(sel);

function onlyDigits(s) {
  return (s || "").replace(/\D/g, "");
}

function buildWhatsAppLink({ phoneDigits, message }) {
  const phone = onlyDigits(phoneDigits);
  const text = encodeURIComponent(message || "");
  return `https://wa.me/${phone}?text=${text}`;
}

function vehicleMeta(v) {
  const kmLabel = `${Number(v.km).toLocaleString("pt-BR")} km`;
  return `${v.ano} • ${kmLabel} • ${v.cambio}`;
}

async function loadVehicles() {
  const response = await fetch("./data/vehicles.json"); // [web:36]
  if (!response.ok) throw new Error(`Erro ao carregar JSON: ${response.status}`);
  return await response.json(); // [web:41]
}

function renderNotFound(root) {
  root.innerHTML = `
    <div class="card" style="padding:18px;">
      <h2 style="font-size:22px; letter-spacing:-0.03em; margin-bottom:10px;">Veículo não encontrado</h2>
      <p class="muted" style="margin-bottom:14px;">O link pode estar incorreto ou o veículo foi removido do estoque.</p>
      <a class="btn btn-primary" href="./index.html#estoque">Ver estoque</a>
    </div>
  `;
}

function renderDetails(root, v) {
  const safeImg = v.img || "assets/vehicles/placeholder.jpg";
  const badgeClass = v.badgeType === "offer" ? "badge offer" : "badge";

  const whats = buildWhatsAppLink({
    phoneDigits: "5599999999999",
    message: `Olá! Tenho interesse no ${v.marca} ${v.modelo} (${v.ano}). Ainda está disponível?`
  });

  root.innerHTML = `
    <div class="card" style="overflow:hidden;">
      <div class="card-media" style="aspect-ratio: 16/9;">
        <img src="${safeImg}" alt="Foto do ${v.marca} ${v.modelo}">
        <span class="${badgeClass}">${v.badge || "Disponível"}</span>
      </div>

      <div class="card-body" style="padding:18px;">
        <div class="section-head" style="margin-bottom:10px;">
          <div>
            <span class="kicker">Detalhes</span>
            <h2 style="margin-top:6px;">${v.marca} ${v.modelo}</h2>
            <p class="muted" style="margin-top:8px;">${vehicleMeta(v)}</p>
          </div>

          <div style="text-align:right;">
            <div class="pill">Código: ${v.id}</div>
            <div class="card-price" style="margin-top:10px;">${BRL.format(Number(v.preco) || 0)}</div>
          </div>
        </div>

        <div class="cards-3" style="grid-template-columns: 1fr; margin-top:14px;">
          <div class="feature-card" style="align-items:center;">
            <div class="feature-icon"><span class="material-symbols-outlined" aria-hidden="true">info</span></div>
            <div>
              <h3 style="margin:0; font-size:16px;">Informações rápidas</h3>
              <p style="margin-top:6px;">Ano: <strong>${v.ano}</strong> • KM: <strong>${Number(v.km).toLocaleString("pt-BR")}</strong> • Câmbio: <strong>${v.cambio}</strong></p>
            </div>
          </div>
        </div>

        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:16px;">
          <a class="btn btn-primary" href="${whats}" target="_blank" rel="noreferrer">
            <span class="material-symbols-outlined" aria-hidden="true">chat</span>
            Falar no WhatsApp
          </a>
          <a class="btn btn-ghost" href="./index.html#estoque">Ver mais veículos</a>
        </div>

        <p class="muted" style="margin-top:14px;">
          Esse layout é básico e lê os dados do arquivo <code>data/vehicles.json</code>. Depois dá pra evoluir para API/Firestore.
        </p>
      </div>
    </div>
  `;
}

async function init() {
  const root = el("#detailRoot");

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id"); // [web:42]

  if (!id) {
    renderNotFound(root);
    return;
  }

  try {
    const data = await loadVehicles();
    const vehicles = Array.isArray(data) ? data : [];
    const v = vehicles.find(x => x.id === id);
    if (!v) renderNotFound(root);
    else renderDetails(root, v);
  } catch (e) {
    console.error(e);
    root.innerHTML = `
      <div class="card" style="padding:18px;">
        <h2 style="font-size:22px; letter-spacing:-0.03em; margin-bottom:10px;">Erro ao carregar dados</h2>
        <p class="muted" style="margin-bottom:14px;">Confira se você está rodando com um servidor (Live Server) e se o arquivo JSON existe.</p>
        <a class="btn btn-primary" href="./index.html#estoque">Voltar</a>
      </div>
    `;
  }
}

init();
