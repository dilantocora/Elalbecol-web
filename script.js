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
  })
  .catch(error => console.log("Error cargando productos:", error));

// ===============================
// MOSTRAR PRODUCTOS
// ===============================
function mostrarProductos(lista) {
  contenedor.innerHTML = "";

  lista.forEach(producto => {
    const card = document.createElement("div");

    // clase automática agotado
    card.className =
      producto.estado === "agotado"
        ? "producto agotado"
        : "producto";

    // ===============================
    // IMÁGENES (OPCIONAL MAX 3)
    // ===============================
    const imagenes = (producto.imagenes || [])
      .filter(img => img && img.trim() !== "")
      .slice(0, 3);

    let indexImagen = 0;

    const imagenInicial =
      imagenes.length > 0
        ? imagenes[0]
        : "/imagenes/placeholder.jpg";

    // ===============================
    // BOTÓN SEGÚN ESTADO
    // ===============================
    const botonHTML =
      producto.estado === "agotado"
        ? `<span class="btn-comprar-ahora" style="opacity:.5;pointer-events:none;">Agotado</span>`
        : `<a href="#" class="btn-comprar-ahora">Comprar</a>`;

    // ===============================
    // ETIQUETA OPCIONAL
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
      <img class="producto-img"
           src="${imagenInicial}"
           alt="${producto.nombre}">
      <h3>${producto.nombre}</h3>
      <p>${producto.precio}</p>
      ${botonHTML}
    `;

    contenedor.appendChild(card);

    // ===============================
    // SLIDER IMÁGENES TIPO INSTAGRAM
    // ===============================
    const imgElement = card.querySelector(".producto-img");
    if (!imgElement) return;

    let dotsContainer = null;

    if (imagenes.length > 1) {
      // crear puntitos
      dotsContainer = document.createElement("div");
      dotsContainer.className = "slider-dots";

      imagenes.forEach((_, i) => {
        const dot = document.createElement("span");
        dot.className = i === 0 ? "dot active" : "dot";
        dot.addEventListener("click", () => {
          indexImagen = i;
          imgElement.src = imagenes[indexImagen];
          actualizarDots();
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

    if (imagenes.length > 1) {
      // hover PC
      card.addEventListener("mouseenter", () => {
        indexImagen = (indexImagen + 1) % imagenes.length;
        imgElement.src = imagenes[indexImagen];
        actualizarDots();
      });

      card.addEventListener("mouseleave", () => {
        indexImagen = 0;
        imgElement.src = imagenes[0];
        actualizarDots();
      });

      // click móvil
      imgElement.addEventListener("click", () => {
        indexImagen = (indexImagen + 1) % imagenes.length;
        imgElement.src = imagenes[indexImagen];
        actualizarDots();
      });
    }

    // ===============================
    // WHATSAPP
    // ===============================
    if (producto.estado !== "agotado") {
      const btn = card.querySelector(".btn-comprar-ahora");
      if (btn) {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          const numero = producto.whatsapp || "573043099414";
          const mensaje = encodeURIComponent(
            `Hola! estoy interesado en este producto: ${producto.nombre}`
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
// FILTRAR POR CATEGORIA
// ===============================
function filtrar(categoria) {
  const filtrados = productosData.filter(producto =>
    producto.categoria === categoria
  );
  mostrarProductos(filtrados);
}

// ===============================
// MOSTRAR TODOS
// ===============================
function mostrarTodos() {
  mostrarProductos(productosData);
}