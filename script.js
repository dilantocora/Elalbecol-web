// ===============================
// CONFIGURACIÓN CENTRAL
// ===============================
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_kbtt99t-xfyuu-IhRWdgWrC4bKRM-MMj7RNfFqHxtSqAnUQ9m1tJEMDJb64e-TNQK8hMQVGDfxxd/pub?gid=0&single=true&output=csv";
const WHATSAPP_DEFAULT = "573204883897";
// Hamburguesa
const hamburguesa = document.getElementById('hamburguesa')
const navMenu = document.getElementById('nav-menu')

hamburguesa.addEventListener('click', () => {
  hamburguesa.classList.toggle('activo')
  navMenu.classList.toggle('abierto')
})

// Cierra el menú al hacer clic en un enlace
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    hamburguesa.classList.remove('activo')
    navMenu.classList.remove('abierto')
  })
})
// ===============================
// SANITIZACION — prevenir XSS
// ===============================
function esc(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

let productosData   = [];
let categoriaActual = "todos";
let carrito         = [];

const contenedor  = document.getElementById("lista-productos");
const estadoCarga = document.getElementById("estado-carga");

// Modal tallas
const modalOverlay  = document.getElementById("modal-tallas");
const modalNombre   = document.getElementById("modal-nombre-producto");
const modalPrecio   = document.getElementById("modal-precio-producto");
const modalOpciones = document.getElementById("modal-tallas-opciones");
const modalComprar  = document.getElementById("btn-modal-comprar");
const btnCerrar     = document.getElementById("btn-cerrar-modal");

const modalFormRapido   = document.getElementById("modal-form-rapido");
const modalCampoNombre  = document.getElementById("modal-campo-nombre");
const modalCampoCelular = document.getElementById("modal-campo-celular");
const modalCampoDirecc  = document.getElementById("modal-campo-direccion");

let carritoBtn, carritoBadge, carritoPanel, carritoItems;
let carritoTotal, carritoEnviar, carritoVaciar, carritoOverlay;
let carritoFormulario;
let fichaPanel, fichaOverlay;
let fichaIndexImagen = 0, fichaProductoActual = null;
let tallaSeleccionada   = "";
let productoActualModal = null;
let accionModal         = "";

// ===============================
// PERSISTENCIA DEL CARRITO
// ===============================
function guardarCarrito() {
  try { localStorage.setItem("eacol_carrito", JSON.stringify(carrito)); } catch(e) {}
}

function cargarCarrito() {
  try {
    const guardado = localStorage.getItem("eacol_carrito");
    if (guardado) carrito = JSON.parse(guardado);
  } catch(e) { carrito = []; }
}

// ===============================
// INICIALIZAR CARRITO
// ===============================
function inicializarCarrito() {
  carritoBtn        = document.getElementById("carrito-btn");
  carritoBadge      = document.getElementById("carrito-badge");
  carritoPanel      = document.getElementById("carrito-panel");
  carritoItems      = document.getElementById("carrito-items");
  carritoTotal      = document.getElementById("carrito-total");
  carritoEnviar     = document.getElementById("carrito-enviar");
  carritoVaciar     = document.getElementById("carrito-vaciar");
  carritoOverlay    = document.getElementById("carrito-overlay");
  carritoFormulario = document.getElementById("carrito-formulario");

  if (carritoBtn)     carritoBtn.addEventListener("click", () => {
    carritoPanel.classList.contains("abierto") ? cerrarCarrito() : abrirCarrito();
  });
  if (carritoOverlay) carritoOverlay.addEventListener("click", cerrarCarrito);
  if (carritoEnviar)  carritoEnviar.addEventListener("click", mostrarFormulario);
  if (carritoVaciar)  carritoVaciar.addEventListener("click", () => {
    carrito = [];
    guardarCarrito();
    actualizarBadge();
    renderCarrito();
    cerrarCarrito();
  });

  const btnConfirmar = document.getElementById("btn-confirmar-pedido");
  if (btnConfirmar) btnConfirmar.addEventListener("click", confirmarPedido);
  const btnVolver = document.getElementById("btn-volver-carrito");
  if (btnVolver) btnVolver.addEventListener("click", ocultarFormulario);
}

// ===============================
// INICIALIZAR FICHA PANEL
// ===============================
function inicializarFichaPanel() {
  fichaPanel   = document.getElementById("ficha-panel");
  fichaOverlay = document.getElementById("ficha-overlay");

  if (fichaOverlay) fichaOverlay.addEventListener("click", cerrarFicha);
  const btnCerrarFicha = document.getElementById("btn-cerrar-ficha");
  if (btnCerrarFicha) btnCerrarFicha.addEventListener("click", cerrarFicha);

  const fichaAgregar = document.getElementById("ficha-btn-agregar");
  const fichaComprar = document.getElementById("ficha-btn-comprar");

  if (fichaAgregar) {
    fichaAgregar.addEventListener("click", () => {
      if (!fichaProductoActual) return;
      const producto = fichaProductoActual;
      const tallas   = producto.tallas || [];
      cerrarFicha();
      accionModal = "carrito";
      tallas.length > 0 ? abrirModal(producto, tallas) : agregarAlCarrito(producto, "");
    });
  }

  if (fichaComprar) {
    fichaComprar.addEventListener("click", () => {
      if (!fichaProductoActual) return;
      const producto = fichaProductoActual;
      const tallas   = producto.tallas || [];
      cerrarFicha();
      accionModal = "comprar";
      tallas.length > 0 ? abrirModal(producto, tallas) : agregarYMostrarFormulario(producto, "");
    });
  }

  const prevBtn = document.getElementById("ficha-img-prev");
  const nextBtn = document.getElementById("ficha-img-next");
  if (prevBtn) prevBtn.addEventListener("click", () => moverFichaImagen(-1));
  if (nextBtn) nextBtn.addEventListener("click", () => moverFichaImagen(1));

  const fichaImg = document.getElementById("ficha-imagen-principal");
  if (fichaImg) {
    let startX = 0;
    fichaImg.addEventListener("touchstart", e => { startX = e.touches[0].clientX; });
    fichaImg.addEventListener("touchend", e => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) moverFichaImagen(diff > 0 ? 1 : -1);
    });
  }
}

// ===============================
// ABRIR / CERRAR FICHA
// ===============================
function abrirFicha(producto) {
  fichaProductoActual = producto;
  fichaIndexImagen    = 0;
  const imagenes = (producto.imagenes || []).filter(i => i && i.trim() !== "");
  const tallas   = producto.tallas || [];

  const fichaImg = document.getElementById("ficha-imagen-principal");
  if (fichaImg) { fichaImg.src = imagenes[0] || ""; fichaImg.alt = producto.nombre; fichaImg.style.opacity = "1"; }

  const prevBtn = document.getElementById("ficha-img-prev");
  const nextBtn = document.getElementById("ficha-img-next");
  if (prevBtn) prevBtn.style.display = imagenes.length > 1 ? "flex" : "none";
  if (nextBtn) nextBtn.style.display = imagenes.length > 1 ? "flex" : "none";

  const dotsWrap = document.getElementById("ficha-dots");
  if (dotsWrap) {
    dotsWrap.innerHTML = imagenes.length > 1
      ? imagenes.map((_, i) => `<span class="ficha-dot ${i===0?"active":""}" data-i="${i}"></span>`).join("")
      : "";
    dotsWrap.querySelectorAll(".ficha-dot").forEach(dot => {
      dot.addEventListener("click", () => {
        fichaIndexImagen = parseInt(dot.dataset.i);
        actualizarFichaImagen(imagenes);
      });
    });
  }

  const fichaNombre = document.getElementById("ficha-nombre");
  const fichaPrecio = document.getElementById("ficha-precio");
  const fichaEtiq   = document.getElementById("ficha-etiqueta");
  if (fichaNombre) fichaNombre.textContent = producto.nombre;
  if (fichaPrecio) fichaPrecio.textContent = producto.precio;
  if (fichaEtiq) {
    fichaEtiq.textContent = producto.etiqueta ? producto.etiqueta.toUpperCase() : "";
    fichaEtiq.style.display = producto.etiqueta ? "inline-block" : "none";
  }

  const fichaDesc      = document.getElementById("ficha-descripcion");
  const fichaDescLabel = document.getElementById("ficha-desc-label");
  if (fichaDesc) {
    fichaDesc.textContent   = producto.descripcion || "";
    fichaDesc.style.display = producto.descripcion ? "block" : "none";
    if (fichaDescLabel) fichaDescLabel.style.display = producto.descripcion ? "block" : "none";
  }

  const fichaTallasWrap = document.getElementById("ficha-tallas-wrap");
  const fichaTallas     = document.getElementById("ficha-tallas");
  if (fichaTallas && fichaTallasWrap) {
    if (tallas.length > 0) {
      fichaTallasWrap.style.display = "block";
      fichaTallas.innerHTML = tallas.map(t => `<span class="talla-chip">${esc(t)}</span>`).join("");
    } else {
      fichaTallasWrap.style.display = "none";
    }
  }

  const fichaAgregar = document.getElementById("ficha-btn-agregar");
  const fichaComprar = document.getElementById("ficha-btn-comprar");
  if (producto.estado === "agotado") {
    if (fichaAgregar) { fichaAgregar.disabled = true; fichaAgregar.textContent = "Agotado"; fichaAgregar.style.opacity = ".4"; }
    if (fichaComprar) { fichaComprar.disabled = true; fichaComprar.style.opacity = ".4"; }
  } else {
    if (fichaAgregar) { fichaAgregar.disabled = false; fichaAgregar.textContent = "Agregar al carrito"; fichaAgregar.style.opacity = "1"; }
    if (fichaComprar) { fichaComprar.disabled = false; fichaComprar.style.opacity = "1"; }
  }

  fichaPanel.classList.add("abierto");
  fichaOverlay.style.display   = "block";
  document.body.style.overflow = "hidden";
}

function cerrarFicha() {
  if (!fichaPanel) return;
  fichaPanel.classList.remove("abierto");
  fichaOverlay.style.display   = "none";
  document.body.style.overflow = "";
  fichaProductoActual = null;
}

function moverFichaImagen(delta) {
  if (!fichaProductoActual) return;
  const imagenes = (fichaProductoActual.imagenes || []).filter(i => i && i.trim() !== "");
  if (imagenes.length <= 1) return;
  fichaIndexImagen = (fichaIndexImagen + delta + imagenes.length) % imagenes.length;
  actualizarFichaImagen(imagenes);
}

function actualizarFichaImagen(imagenes) {
  const fichaImg = document.getElementById("ficha-imagen-principal");
  if (!fichaImg) return;
  fichaImg.style.opacity = "0";
  setTimeout(() => { fichaImg.src = imagenes[fichaIndexImagen]; fichaImg.style.opacity = "1"; }, 160);
  document.querySelectorAll(".ficha-dot").forEach((dot, i) => dot.classList.toggle("active", i === fichaIndexImagen));
}

// ===============================
// PRECIO → NÚMERO
// ===============================
function precioANumero(precio) {
  if (!precio) return 0;
  return parseInt(precio.replace(/[^0-9]/g, "")) || 0;
}
function formatearPrecio(numero) {
  return "$" + numero.toLocaleString("es-CO");
}

// ===============================
// PARSEAR CSV
// ===============================
function parsearLineaCSV(linea) {
  const cols = [];
  let actual = "";
  let dentroDeComillas = false;
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (c === '"') { dentroDeComillas = !dentroDeComillas; }
    else if (c === "," && !dentroDeComillas) { cols.push(actual.trim()); actual = ""; }
    else { actual += c; }
  }
  cols.push(actual.trim());
  return cols;
}

function parsearCSV(texto) {
  const lineas = texto.trim().split("\n");
  return lineas.slice(1).map(linea => {
    const cols = parsearLineaCSV(linea);
    return {
      id:          cols[0] || "",
      nombre:      cols[1] || "",
      precio:      cols[2] || "",
      categoria:   cols[3] || "",
      tallas:      cols[4] ? cols[4].split("|").map(t => t.trim()).filter(Boolean) : [],
      etiqueta:    cols[5] || "",
      estado:      cols[6] || "",
      whatsapp:    cols[7] || WHATSAPP_DEFAULT,
      imagenes:    [cols[8], cols[9], cols[10]].filter(img => img && img.trim() !== ""),
      descripcion: cols[11] || ""
    };
  }).filter(p => p.id && p.id.trim() !== "");
}

// ===============================
// CARGAR PRODUCTOS
// ===============================
async function cargarProductos() {
  try {
    const res  = await fetch(SHEET_CSV_URL);
    const text = await res.text();
    productosData = parsearCSV(text);
    estadoCarga.style.display = "none";
    mostrarProductos(productosData);
    setTimeout(irAProductoDesdeURL, 300);
  } catch (err) {
    estadoCarga.textContent = "Error cargando productos. Intenta recargar la página.";
    console.error("Error:", err);
  }
}

// ===============================
// MOSTRAR PRODUCTOS — tarjeta limpia
// ===============================
// ===============================
// CREAR CARD DE PRODUCTO
// ===============================
function crearCard(producto) {
  const card = document.createElement("div");
  card.id        = "producto-" + producto.id;
  card.className = producto.estado === "agotado" ? "producto agotado" : "producto";
  card.style.cursor = "pointer";

  const imagenes      = (producto.imagenes || []).filter(img => img && img.trim() !== "");
  let   indexImagen   = 0;
  const imagenInicial = imagenes.length > 0 ? imagenes[0] : "";

  const imgHTML = imagenInicial
    ? `<img class="producto-img" src="${imagenInicial}" alt="${producto.nombre}" loading="lazy">`
    : `<div class="producto-img sin-imagen"></div>`;

  const etiquetaHTML = producto.etiqueta && producto.etiqueta.trim()
    ? `<span class="etiqueta coleccion">${esc(producto.etiqueta.toUpperCase())}</span>`
    : "";

  card.innerHTML = `
    ${etiquetaHTML}
    <div class="img-wrapper">${imgHTML}</div>
    <div class="card-info">
      <h3>${esc(producto.nombre)}</h3>
      <p class="precio-producto">${esc(producto.precio)}</p>
    </div>
  `;

  const imgElement = card.querySelector(".producto-img");

  let hoverInterval;
  if (imagenes.length > 1 && imgElement) {
    card.addEventListener("mouseenter", () => {
      hoverInterval = setInterval(() => {
        indexImagen = (indexImagen + 1) % imagenes.length;
        imgElement.style.opacity = "0";
        setTimeout(() => { imgElement.src = imagenes[indexImagen]; imgElement.style.opacity = "1"; }, 160);
      }, 1400);
    });
    card.addEventListener("mouseleave", () => {
      clearInterval(hoverInterval);
      indexImagen = 0;
      imgElement.style.opacity = "0";
      setTimeout(() => { imgElement.src = imagenes[0]; imgElement.style.opacity = "1"; }, 160);
    });
  }

  card.addEventListener("click", () => {
    abrirFicha(producto);
    history.replaceState(null, "", "#producto-" + producto.id);
  });

  return card;
}

// ===============================
// CREAR CARRUSEL POR COLECCIÓN
// ===============================
function crearCarrusel(titulo, productos) {
  const seccion = document.createElement("div");
  seccion.className = "coleccion-seccion";

  const header = document.createElement("div");
  header.className = "coleccion-header";
  header.innerHTML = `
    <h3 class="coleccion-titulo">${titulo.toUpperCase()}</h3>
    <div class="carousel-arrows">
      <button class="carousel-arrow carousel-prev" aria-label="Anterior">&#8249;</button>
      <button class="carousel-arrow carousel-next" aria-label="Siguiente">&#8250;</button>
    </div>
  `;

  const track = document.createElement("div");
  track.className = "carousel-track";

  productos.forEach(p => track.appendChild(crearCard(p)));

  seccion.appendChild(header);
  seccion.appendChild(track);

  // Flechas
  const btnPrev = header.querySelector(".carousel-prev");
  const btnNext = header.querySelector(".carousel-next");
  const scrollAmt = () => track.clientWidth;

  btnNext.addEventListener("click", () => track.scrollBy({ left:  scrollAmt(), behavior: "smooth" }));
  btnPrev.addEventListener("click", () => track.scrollBy({ left: -scrollAmt(), behavior: "smooth" }));

  // Actualizar visibilidad de flechas
  function actualizarFlechas() {
    btnPrev.style.opacity = track.scrollLeft <= 10 ? "0.3" : "1";
    btnNext.style.opacity = track.scrollLeft + track.clientWidth >= track.scrollWidth - 10 ? "0.3" : "1";
  }
  track.addEventListener("scroll", actualizarFlechas, { passive: true });
  setTimeout(actualizarFlechas, 100);

  // Touch swipe en el track
  let startX = 0;
  track.addEventListener("touchstart", e => { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener("touchend", e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) track.scrollBy({ left: diff > 0 ? scrollAmt() : -scrollAmt(), behavior: "smooth" });
  });

  return seccion;
}

// ===============================
// MOSTRAR PRODUCTOS — carruseles por colección
// ===============================
function mostrarProductos(lista) {
  contenedor.innerHTML = "";

  if (lista.length === 0) {
    contenedor.innerHTML = '<p style="opacity:0.5;text-align:center;padding:40px;">No hay productos en esta categoría.</p>';
    return;
  }

  // Orden de secciones preferido
  const ORDEN = ["hombre", "mujer", "gorras", "hoodies"];

  // Agrupar por categoría
  const grupos = new Map();
  lista.forEach(p => {
    const key = p.categoria && p.categoria.trim() ? p.categoria.trim() : "otros";
    if (!grupos.has(key)) grupos.set(key, []);
    grupos.get(key).push(p);
  });

  // Si se filtró por categoría específica, mostrar solo ese carrusel
  if (categoriaActual !== "todos") {
    const productos = [...grupos.values()][0] || lista;
    const titulo = categoriaActual.charAt(0).toUpperCase() + categoriaActual.slice(1);
    contenedor.appendChild(crearCarrusel(titulo, productos));
    return;
  }

  // Mostrar en el orden preferido, luego los que no estén en el orden
  const claves = [...grupos.keys()];
  const ordenadas = [
    ...ORDEN.filter(k => grupos.has(k)),
    ...claves.filter(k => !ORDEN.includes(k))
  ];

  ordenadas.forEach(key => {
    const titulo = key.charAt(0).toUpperCase() + key.slice(1);
    contenedor.appendChild(crearCarrusel(titulo, grupos.get(key)));
  });
}

// ===============================
// MODAL DE TALLAS
// ===============================
function abrirModal(producto, tallas) {
  productoActualModal        = producto;
  tallaSeleccionada          = "";
  modalNombre.textContent    = producto.nombre;
  modalPrecio.textContent    = producto.precio;
  modalComprar.textContent   = accionModal === "comprar" ? "Ir a WhatsApp" : "Agregar al carrito";

  if (modalFormRapido) {
    modalFormRapido.style.display = accionModal === "comprar" ? "block" : "none";
    if (modalCampoNombre)  modalCampoNombre.value  = "";
    if (modalCampoCelular) modalCampoCelular.value = "";
    if (modalCampoDirecc)  modalCampoDirecc.value  = "";
  }

  modalOpciones.innerHTML = tallas.map(t => `<button class="talla-btn" data-talla="${esc(t)}">${esc(t)}</button>`).join("");
  modalOpciones.querySelectorAll(".talla-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      modalOpciones.querySelectorAll(".talla-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      tallaSeleccionada          = btn.dataset.talla;
      modalComprar.disabled      = false;
      modalComprar.style.opacity = "1";
    });
  });

  modalComprar.disabled        = true;
  modalComprar.style.opacity   = "0.4";
  modalOverlay.style.display   = "flex";
  document.body.style.overflow = "hidden";
}

function cerrarModal() {
  modalOverlay.style.display   = "none";
  document.body.style.overflow = "";
  productoActualModal = null;
  tallaSeleccionada   = "";
  accionModal         = "";
  if (modalFormRapido) modalFormRapido.style.display = "none";
}

modalComprar.addEventListener("click", () => {
  if (!productoActualModal || !tallaSeleccionada) return;
  if (accionModal === "comprar") {
    const nombre    = modalCampoNombre?.value.trim();
    const celular   = modalCampoCelular?.value.trim();
    const direccion = modalCampoDirecc?.value.trim();
    if (!nombre)                  { resaltarInputModal(modalCampoNombre);  return; }
    if (!validarCelular(celular)) { resaltarInputModal(modalCampoCelular, "10 dígitos, empieza por 3"); return; }
    if (!direccion)               { resaltarInputModal(modalCampoDirecc);  return; }
    const producto = productoActualModal;
    const talla    = tallaSeleccionada ? ` | Talla: ${tallaSeleccionada}` : "";
    const precio   = formatearPrecio(precioANumero(producto.precio));
    const url      = `${window.location.origin}/#producto-${producto.id}`;
    const mensaje  = encodeURIComponent(`Hola! Quiero comprar:\n\n• *${producto.nombre}*${talla} — ${precio}\n   ${url}\n\n*Nombre:* ${nombre}\n*Celular:* ${celular}\n*Dirección:* ${direccion}\n\n¿Está disponible?`);
    window.open(`https://wa.me/${producto.whatsapp || WHATSAPP_DEFAULT}?text=${mensaje}`, "_blank");
    cerrarModal();
  } else {
    agregarAlCarrito(productoActualModal, tallaSeleccionada);
    cerrarModal();
  }
});

function resaltarInputModal(input, mensaje) {
  if (!input) return;
  input.classList.add("error");
  if (mensaje) { const ph = input.placeholder; input.placeholder = mensaje; setTimeout(() => { input.placeholder = ph; }, 3000); }
  input.focus();
  setTimeout(() => input.classList.remove("error"), 3000);
}

btnCerrar.addEventListener("click", cerrarModal);
modalOverlay.addEventListener("click", e => { if (e.target === modalOverlay) cerrarModal(); });

// ===============================
// CARRITO — LÓGICA
// ===============================
function agregarAlCarrito(producto, talla) {
  const key = producto.id + "-" + talla;
  const existente = carrito.find(i => i.key === key);
  if (existente) { existente.cantidad++; }
  else { carrito.push({ key, producto, talla, cantidad: 1 }); }
  guardarCarrito();
  actualizarBadge();
  renderCarrito();
  abrirCarrito();
}

function agregarYMostrarFormulario(producto, talla) {
  const key = producto.id + "-" + talla;
  const existente = carrito.find(i => i.key === key);
  if (existente) { existente.cantidad++; }
  else { carrito.push({ key, producto, talla, cantidad: 1 }); }
  guardarCarrito();
  actualizarBadge();
  renderCarrito();
  abrirCarrito();
  mostrarFormulario();
}

function quitarDelCarrito(key) {
  carrito = carrito.filter(i => i.key !== key);
  guardarCarrito();
  actualizarBadge();
  renderCarrito();
  if (carrito.length === 0) cerrarCarrito();
}

function cambiarCantidad(key, delta) {
  const item = carrito.find(i => i.key === key);
  if (!item) return;
  item.cantidad += delta;
  if (item.cantidad <= 0) { quitarDelCarrito(key); }



  else { guardarCarrito(); actualizarBadge(); renderCarrito(); }
}

function calcularTotal() {
  return carrito.reduce((sum, i) => sum + precioANumero(i.producto.precio) * i.cantidad, 0);
}

function actualizarBadge() {
  if (!carritoBadge) return;
  const total = carrito.reduce((s, i) => s + i.cantidad, 0);
  carritoBadge.textContent   = total;
  carritoBadge.style.display = total > 0 ? "flex" : "none";
}

function renderCarrito() {
  if (!carritoItems) return;
  if (carrito.length === 0) {
    carritoItems.innerHTML = '<p class="carrito-vacio">Tu carrito está vacío</p>';
    if (carritoTotal)  carritoTotal.textContent    = "";
    if (carritoEnviar) carritoEnviar.style.display = "none";
    if (carritoVaciar) carritoVaciar.style.display = "none";
    return;
  }
  carritoItems.innerHTML = carrito.map(item => `
    <div class="carrito-item">
      <div class="carrito-item-info">
        <span class="carrito-item-nombre">${esc(item.producto.nombre)}</span>
        ${item.talla ? `<span class="carrito-item-talla">Talla: ${esc(item.talla)}</span>` : ""}
        <span class="carrito-item-precio">${esc(item.producto.precio)} c/u</span>
      </div>
      <div class="carrito-item-controles">
        <button class="cant-btn" onclick="cambiarCantidad('${esc(item.key)}',-1)">−</button>
        <span class="cant-num">${item.cantidad}</span>
        <button class="cant-btn" onclick="cambiarCantidad('${esc(item.key)}',1)">+</button>
        <button class="quitar-btn" onclick="quitarDelCarrito('${esc(item.key)}')">✕</button>
      </div>
    </div>`).join("");
  const totalItems = carrito.reduce((s, i) => s + i.cantidad, 0);
  if (carritoTotal) carritoTotal.innerHTML = `
    <span class="carrito-total-items">${totalItems} ${totalItems===1?"producto":"productos"}</span>
    <span class="carrito-total-valor">${formatearPrecio(calcularTotal())}</span>`;
  if (carritoEnviar) carritoEnviar.style.display = "block";
  if (carritoVaciar) carritoVaciar.style.display = "block";
}

function mostrarFormulario() {
  if (!carritoFormulario) return;
  carritoItems.style.display      = "none";
  carritoTotal.style.display      = "none";
  carritoEnviar.style.display     = "none";
  carritoVaciar.style.display     = "none";
  carritoFormulario.style.display = "flex";
}

function ocultarFormulario() {
  if (!carritoFormulario) return;
  carritoFormulario.style.display = "none";
  carritoItems.style.display      = "";
  carritoTotal.style.display      = "";
  renderCarrito();
}

function validarCelular(valor) {
  return /^(3\d{9})$/.test(valor.replace(/\s|-/g, ""));
}

function confirmarPedido() {
  const nombre      = document.getElementById("campo-nombre")?.value.trim();
  const celular     = document.getElementById("campo-celular")?.value.trim();
  const direccion   = document.getElementById("campo-direccion")?.value.trim();
  const comentarios = document.getElementById("campo-comentarios")?.value.trim();
  if (!nombre)               { resaltarCampo("campo-nombre");   return; }
  if (!validarCelular(celular)) { resaltarCampo("campo-celular", "Celular inválido — debe ser 10 dígitos empezando por 3"); return; }
  if (!direccion)            { resaltarCampo("campo-direccion"); return; }
  enviarPedidoWhatsApp(nombre, celular, direccion, comentarios);
}

function resaltarCampo(id, mensaje) {
  const campo = document.getElementById(id);
  if (!campo) return;
  campo.style.borderColor = "#9f0000";
  if (mensaje) { campo.placeholder = mensaje; }
  campo.focus();
  setTimeout(() => {
    campo.style.borderColor = "";
    if (id === "campo-celular") campo.placeholder = "Celular";
  }, 3000);
}

function enviarPedidoWhatsApp(nombre, celular, direccion, comentarios) {
  if (carrito.length === 0) return;
  const lineas = carrito.map(item => {
    const talla    = item.talla ? ` | Talla: ${item.talla}` : "";
    const subtotal = formatearPrecio(precioANumero(item.producto.precio) * item.cantidad);
    const url      = `${window.location.origin}/#producto-${item.producto.id}`;
    return `• *${item.producto.nombre}*${talla} x${item.cantidad} — ${subtotal}\n   ${url}`;
  });
  const total           = formatearPrecio(calcularTotal());
  const comentarioTexto = comentarios ? `\n *Comentarios:* ${comentarios}` : "";
  const mensaje = encodeURIComponent(`Hola! Me gustaría hacer un pedido a domicilio \n\n*Nombre:* ${nombre}\n*Celular:* ${celular}\n\n*Dirección:* ${direccion}${comentarioTexto}\n\nCon los siguientes productos:\n\n${lineas.join("\n")}\n\n *Total: ${total}*`);
  window.open(`https://wa.me/${carrito[0].producto.whatsapp || WHATSAPP_DEFAULT}?text=${mensaje}`, "_blank");
  carrito = [];
  guardarCarrito();
  actualizarBadge();
  ocultarFormulario();
  cerrarCarrito();
  ["campo-nombre","campo-celular","campo-direccion","campo-comentarios"].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = "";
  });
}

function abrirCarrito() {
  if (!carritoPanel) return;
  carritoPanel.classList.add("abierto");
  carritoOverlay.style.display = "block";
  document.body.style.overflow = "hidden";
}

function cerrarCarrito() {
  if (!carritoPanel) return;
  carritoPanel.classList.remove("abierto");
  carritoOverlay.style.display = "none";
  document.body.style.overflow = "";
  ocultarFormulario();
}

function filtrar(categoria, btnElement) {
  categoriaActual = categoria;
  document.querySelectorAll(".categorias button").forEach(b => b.classList.remove("activo"));
  if (btnElement) btnElement.classList.add("activo");
  const filtrados = categoria === "todos" ? productosData : productosData.filter(p => p.categoria === categoria);
  mostrarProductos(filtrados);
}

function irAProductoDesdeURL() {
  const hash = window.location.hash.replace("#", "");
  if (!hash) return;
  const el = document.getElementById(hash);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("producto-highlight");
    setTimeout(() => el.classList.remove("producto-highlight"), 2500);
  }
}

window.addEventListener("hashchange", irAProductoDesdeURL);

document.addEventListener("DOMContentLoaded", () => {
  cargarCarrito();
  inicializarCarrito();
  inicializarFichaPanel();
  cargarProductos();
  
});