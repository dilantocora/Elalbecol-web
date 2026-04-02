// ===============================
// VARIABLES GLOBALES
// ===============================
let productosData = [];
const contenedor = document.getElementById("lista-productos");


// ===============================
// CARGAR PRODUCTOS DESDE JSON
// ===============================
fetch("productos.json")
  .then(response => response.json())
  .then(data => {
    productosData = data;
    mostrarProductos(productosData);

    setTimeout(irAProductoDesdeURL, 300);
  })
  .catch(error => console.log("Error cargando productos:", error));


// ===============================
// MOSTRAR PRODUCTOS
// ===============================
function mostrarProductos(lista) {

  contenedor.innerHTML = "";

  lista.forEach(producto => {

    const card = document.createElement("div");

    /* ✅ USAMOS ID NUMÉRICO (YA NO NOMBRE) */
    card.id = "producto-" + producto.id;

    card.className =
      producto.estado === "agotado"
        ? "producto agotado"
        : "producto";

    // ===============================
    // IMÁGENES
    // ===============================
    const imagenes = (producto.imagenes || [])
      .filter(img => img && img.trim() !== "");

    let indexImagen = 0;

    const imagenInicial =
      imagenes.length > 0
        ? imagenes[0]
        : "/imagenes/placeholder.jpg";

    // ===============================
    // BOTÓN
    // ===============================
    const botonHTML =
      producto.estado === "agotado"
        ? `<span class="btn-comprar-ahora" style="opacity:.5;pointer-events:none;">Agotado</span>`
        : `<a href="#" class="btn-comprar-ahora">Comprar</a>`;

    // ===============================
    // ETIQUETA
    // ===============================
    let etiquetaHTML = "";
    if (producto.etiqueta) {
      etiquetaHTML = `
        <span class="etiqueta ${producto.etiqueta}">
          ${producto.etiqueta.toUpperCase()}
        </span>`;
    }

    // ===============================
    // HTML CARD
    // ===============================
    card.innerHTML = `
      ${etiquetaHTML}
      <div class="img-wrapper">
        <img class="producto-img"
             src="${imagenInicial}"
             alt="${producto.nombre}">
      </div>
      <h3>${producto.nombre}</h3>
      <p>${producto.precio}</p>
      ${botonHTML}
    `;

    contenedor.appendChild(card);

    const imgElement = card.querySelector(".producto-img");

    // ===============================
    // DOTS INSTAGRAM
    // ===============================
    let dotsContainer = null;

    if (imagenes.length > 1) {
      dotsContainer = document.createElement("div");
      dotsContainer.className = "slider-dots";

      imagenes.forEach((_, i) => {
        const dot = document.createElement("span");
        dot.className = i === 0 ? "dot active" : "dot";

        dot.addEventListener("click", (e) => {
          e.stopPropagation();
          indexImagen = i;
          cambiarImagen();
        });

        dotsContainer.appendChild(dot);
      });

      card.appendChild(dotsContainer);
    }

    function actualizarDots() {
      if (!dotsContainer) return;

      Array.from(dotsContainer.children).forEach((dot, i) => {
        dot.classList.toggle("active", i === indexImagen);
      });
    }

    function cambiarImagen() {
      imgElement.style.transition = "opacity .35s ease";
      imgElement.style.opacity = "0";

      setTimeout(() => {
        imgElement.src = imagenes[indexImagen];
        imgElement.style.opacity = "1";
        actualizarDots();
      }, 180);
    }

    // ===============================
    // CLICK TARJETA → ACTUALIZA URL
    // ===============================
    card.addEventListener("click", (e) => {
      if (!e.target.classList.contains("btn-comprar-ahora")) {
        history.replaceState(null, "", "#producto-" + producto.id);
      }
    });

    // ===============================
    // CLICK IMAGEN (MÓVIL)
    // ===============================
    if (imagenes.length > 1) {
      imgElement.addEventListener("click", () => {
        indexImagen = (indexImagen + 1) % imagenes.length;
        cambiarImagen();
      });
    }

    // ===============================
    // HOVER PC (FLUIDO)
    // ===============================
    let hoverInterval;

    if (imagenes.length > 1) {
      card.addEventListener("mouseenter", () => {

        hoverInterval = setInterval(() => {
          indexImagen = (indexImagen + 1) % imagenes.length;
          cambiarImagen();
        }, 1400);

      });

      card.addEventListener("mouseleave", () => {
        clearInterval(hoverInterval);
        indexImagen = 0;
        cambiarImagen();
      });
    }

    // ===============================
    // SWIPE INSTAGRAM (MÓVIL)
    // ===============================
    let startX = 0;

    imgElement.addEventListener("touchstart", e => {
      startX = e.touches[0].clientX;
    });

    imgElement.addEventListener("touchend", e => {

      const endX = e.changedTouches[0].clientX;
      const diff = startX - endX;

      if (Math.abs(diff) > 40) {
        if (diff > 0) {
          indexImagen = (indexImagen + 1) % imagenes.length;
        } else {
          indexImagen =
            (indexImagen - 1 + imagenes.length) % imagenes.length;
        }
        cambiarImagen();
      }
    });

    // ===============================
    // WHATSAPP + LINK EXACTO
    // ===============================
    if (producto.estado !== "agotado") {

      const btn = card.querySelector(".btn-comprar-ahora");

      if (btn) {
        btn.addEventListener("click", (e) => {

          e.preventDefault();

          const numero = producto.whatsapp || "573204883897";

          const productoURL =
            window.location.origin +
            "/#producto-" +
            producto.id;

          const mensaje = encodeURIComponent(
            `Hola! me interesa este producto:\n\n${producto.nombre}\n${productoURL}`
          );

          window.open(
            `https://wa.me/${numero}?text=${mensaje}`,
            "_blank"
          );
        });
      }
    }

  });
}


// ===============================
// IR A PRODUCTO DESDE URL
// ===============================
function irAProductoDesdeURL() {

  const hash = window.location.hash.replace("#", "");
  if (!hash) return;

  const producto = document.getElementById(hash);

  if (producto) {

    producto.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

    producto.classList.add("producto-highlight");

    setTimeout(() => {
      producto.classList.remove("producto-highlight");
    }, 2500);
  }
}


// ===============================
// DETECTAR CAMBIO DE HASH
// ===============================
window.addEventListener("hashchange", irAProductoDesdeURL);


// ===============================
// FILTROS
// ===============================
function filtrar(categoria) {
  const filtrados = productosData.filter(
    producto => producto.categoria === categoria
  );
  mostrarProductos(filtrados);
}

function mostrarTodos() {
  mostrarProductos(productosData);
}