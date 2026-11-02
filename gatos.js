// ---------- Ajustes (puedes cambiarlos) ----------
const MAX_GATOS = 12;     // cantidad máxima de gatitos
const VEL_MIN = 0.05;     // velocidad mínima (fracción de la pista por segundo)
const VEL_MAX = 0.13;     // velocidad máxima; más alta = carrera más corta

// Colores del pelaje: [claro, oscuro]
const COLORES = [
  ["#ffb3d1", "#e68fb4"],
  ["#a8dcf7", "#7cbfe6"],
  ["#ffd98a", "#e8b95a"],
  ["#c9b6f2", "#a691dc"],
  ["#a7e8c3", "#7fcfa2"],
  ["#ffb38a", "#e8915f"],
  ["#e0e0e0", "#bdbdbd"],
  ["#f5e1c8", "#d9bd98"],
  ["#ff9ec7", "#e873a7"],
  ["#c7e59b", "#a2c96f"],
  ["#f7a8a8", "#e07d7d"],
  ["#8fe0d6", "#62c4b8"]
];

// Dibujo del gatito corriendo hacia la derecha
const SVG_GATO = `
<svg viewBox="0 0 110 76" aria-hidden="true">
  <path class="cola" d="M22 44 C2 46 0 18 16 14" fill="none" stroke="var(--pelaje)" stroke-width="8" stroke-linecap="round"/>
  <rect class="pata p1" x="30" y="50" width="9" height="20" rx="4.5" fill="var(--pelaje-oscuro)"/>
  <rect class="pata p2" x="44" y="50" width="9" height="20" rx="4.5" fill="var(--pelaje)"/>
  <rect class="pata p3" x="68" y="50" width="9" height="20" rx="4.5" fill="var(--pelaje-oscuro)"/>
  <rect class="pata p4" x="80" y="50" width="9" height="20" rx="4.5" fill="var(--pelaje)"/>
  <ellipse cx="55" cy="46" rx="36" ry="17" fill="var(--pelaje)"/>
  <circle cx="90" cy="32" r="16" fill="var(--pelaje)"/>
  <polygon points="78,22 80,5 91,17" fill="var(--pelaje)"/>
  <polygon points="92,17 104,6 104,24" fill="var(--pelaje)"/>
  <polygon points="81,19 82,10 88,17" fill="#ffb3d1"/>
  <circle cx="85" cy="29" r="2.6" fill="#3b2a35"/>
  <circle cx="96" cy="29" r="2.6" fill="#3b2a35"/>
  <polygon points="89,34 94,34 91.5,37.5" fill="#ff7eb3"/>
  <path d="M86 40 Q91.5 43 97 40" fill="none" stroke="#3b2a35" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M80 37 L70 35 M80 40 L70 41 M103 37 L109 35 M103 40 L109 41" stroke="#3b2a35" stroke-width="1.2" stroke-linecap="round"/>
</svg>`;

// ---------- Elementos de la página ----------
const formulario = document.getElementById("formulario");
const entrada = document.getElementById("nombre");
const aviso = document.getElementById("aviso");
const contador = document.getElementById("contador");
const lista = document.getElementById("lista");
const pista = document.getElementById("pista");
const vacio = document.getElementById("vacio");
const cuenta = document.getElementById("cuenta");
const btnEmpezar = document.getElementById("btn-empezar");
const btnVaciar = document.getElementById("btn-vaciar");
const ganadorCaja = document.getElementById("ganador");
const ganadorNombre = document.getElementById("ganador-nombre");
const btnOtra = document.getElementById("btn-otra");
const btnQuitarGanador = document.getElementById("btn-quitar-ganador");
const btnCerrarGanador = document.getElementById("btn-cerrar-ganador");

// ---------- Estado ----------
let gatos = [];           // cada gatito: { nombre, colores, pos, vel, velObjetivo, cambio, carril, gatoEl, chip }
let estado = "espera";    // espera | cuenta | corriendo | fin
let ultimoTiempo = 0;
let ganadora = null;
let siguienteColor = 0;

// ---------- Agregar y quitar gatitos ----------
function mostrarAviso(texto) {
  aviso.textContent = texto;
}

function agregarGato(nombre) {
  const colores = COLORES[siguienteColor % COLORES.length];
  siguienteColor++;

  // Carril en la pista
  const carril = document.createElement("div");
  carril.className = "carril nuevo";

  const etiqueta = document.createElement("span");
  etiqueta.className = "etiqueta";
  etiqueta.textContent = nombre;
  etiqueta.style.setProperty("--color", colores[0]);

  const recorrido = document.createElement("div");
  recorrido.className = "recorrido";

  const meta = document.createElement("span");
  meta.className = "meta";

  const gatoEl = document.createElement("div");
  gatoEl.className = "gato";
  gatoEl.innerHTML = SVG_GATO;
  gatoEl.style.setProperty("--pelaje", colores[0]);
  gatoEl.style.setProperty("--pelaje-oscuro", colores[1]);

  recorrido.append(meta, gatoEl);
  carril.append(etiqueta, recorrido);
  pista.appendChild(carril);

  // Nombre en la lista
  const chip = document.createElement("li");
  chip.className = "chip";
  chip.style.setProperty("--color", colores[0]);

  const punto = document.createElement("span");
  punto.className = "punto";

  const textoChip = document.createElement("span");
  textoChip.textContent = nombre;

  const quitar = document.createElement("button");
  quitar.type = "button";
  quitar.textContent = "✕";
  quitar.setAttribute("aria-label", "Quitar a " + nombre);

  chip.append(punto, textoChip, quitar);
  lista.appendChild(chip);

  const gato = {
    nombre,
    colores,
    pos: 0,
    vel: 0,
    velObjetivo: 0,
    cambio: 0,
    carril,
    gatoEl,
    chip
  };

  quitar.addEventListener("click", () => quitarGato(gato));
  gatos.push(gato);
}

function quitarGato(gato) {
  if (estado === "cuenta" || estado === "corriendo") return;
  gato.carril.remove();
  gato.chip.remove();
  gatos = gatos.filter((g) => g !== gato);
  volverAEspera();
  actualizarControles();
}

function vaciar() {
  if (estado === "cuenta" || estado === "corriendo") return;
  gatos.forEach((g) => {
    g.carril.remove();
    g.chip.remove();
  });
  gatos = [];
  siguienteColor = 0;
  volverAEspera();
  actualizarControles();
}

formulario.addEventListener("submit", (e) => {
  e.preventDefault();
  if (estado === "cuenta" || estado === "corriendo") return;

  // Se pueden escribir varios nombres separados por coma
  const nombres = entrada.value.split(",").map((n) => n.trim()).filter(Boolean);

  if (!nombres.length) {
    mostrarAviso("Escribe un nombre primero 🐾");
    return;
  }

  volverAEspera();
  let mensaje = "";

  nombres.forEach((nombre) => {
    if (gatos.length >= MAX_GATOS) {
      mensaje = "Ya hay " + MAX_GATOS + " gatitos, ¡es el máximo!";
      return;
    }
    if (gatos.some((g) => g.nombre.toLowerCase() === nombre.toLowerCase())) {
      mensaje = "“" + nombre + "” ya está en la pista";
      return;
    }
    agregarGato(nombre);
  });

  mostrarAviso(mensaje);
  entrada.value = "";
  entrada.focus();
  actualizarControles();
});

// ---------- Controles ----------
function actualizarControles() {
  const ocupado = estado === "cuenta" || estado === "corriendo";

  btnEmpezar.disabled = ocupado || gatos.length < 2;
  btnVaciar.disabled = ocupado || gatos.length === 0;
  entrada.disabled = ocupado;
  formulario.querySelector("button").disabled = ocupado;
  lista.querySelectorAll("button").forEach((b) => { b.disabled = ocupado; });
  btnEmpezar.textContent = estado === "fin" ? "🔁 Correr otra vez" : "🏁 ¡Empezar carrera!";

  if (gatos.length === 0) contador.textContent = "Todavía no hay gatitos";
  else if (gatos.length === 1) contador.textContent = "1 gatito (necesitas al menos 2 para correr)";
  else contador.textContent = gatos.length + " gatitos listos para correr";

  vacio.hidden = gatos.length > 0;
}

// Coloca a todos en la salida
function reiniciarPosiciones() {
  gatos.forEach((g) => {
    g.pos = 0;
    g.vel = 0;
    g.velObjetivo = 0;
    g.cambio = 0;
    g.gatoEl.style.setProperty("--pos", 0);
    g.carril.classList.remove("ganadora");
  });
  ganadora = null;
}

function volverAEspera() {
  if (estado === "fin") {
    estado = "espera";
    reiniciarPosiciones();
    ganadorCaja.classList.add("oculto");
  }
}

// ---------- La carrera ----------
function cuentaRegresiva(pasos, alEmpezar) {
  let i = 0;

  const mostrar = () => {
    cuenta.textContent = pasos[i];
    cuenta.classList.remove("visible");
    void cuenta.offsetWidth;
    cuenta.classList.add("visible");

    if (i === pasos.length - 1) {
      alEmpezar();
      setTimeout(() => cuenta.classList.remove("visible"), 900);
      return;
    }
    i++;
    setTimeout(mostrar, 800);
  };

  mostrar();
}

function empezar() {
  if ((estado !== "espera" && estado !== "fin") || gatos.length < 2) return;

  ganadorCaja.classList.add("oculto");
  reiniciarPosiciones();
  estado = "cuenta";
  actualizarControles();

  cuentaRegresiva(["3", "2", "1", "¡YA!"], () => {
    estado = "corriendo";
    pista.classList.add("corriendo");
    ultimoTiempo = performance.now();
    requestAnimationFrame(paso);
  });
}

function paso(tiempo) {
  if (estado !== "corriendo") return;

  const dt = Math.min((tiempo - ultimoTiempo) / 1000, 0.05);
  ultimoTiempo = tiempo;

  gatos.forEach((g) => {
    // Cada cierto tiempo el gatito elige una velocidad nueva, al azar
    g.cambio -= dt;
    if (g.cambio <= 0) {
      g.velObjetivo = VEL_MIN + Math.random() * (VEL_MAX - VEL_MIN);
      g.cambio = 0.4 + Math.random() * 0.8;
    }
    g.vel += (g.velObjetivo - g.vel) * Math.min(1, dt * 4);   // acelera y frena suave
    g.pos += g.vel * dt;
    g.gatoEl.style.setProperty("--pos", Math.min(1, g.pos));
  });

  // ¿Alguien cruzó la meta? Gana el que se pasó más lejos
  const llegaron = gatos.filter((g) => g.pos >= 1);
  if (llegaron.length) {
    terminar(llegaron.sort((a, b) => b.pos - a.pos)[0]);
    return;
  }

  requestAnimationFrame(paso);
}

function terminar(gato) {
  estado = "fin";
  pista.classList.remove("corriendo");
  ganadora = gato;
  gato.carril.classList.add("ganadora");
  ganadorNombre.textContent = gato.nombre;
  actualizarControles();
  lluviaDeConfeti();

  // Un momento para ver al ganador cruzar la meta
  setTimeout(() => {
    if (estado === "fin") ganadorCaja.classList.remove("oculto");
  }, 700);
}

function lluviaDeConfeti() {
  const signos = ["⭐"];

  for (let i = 0; i < 50; i++) {
    const c = document.createElement("span");
    c.className = "confeti";
    c.textContent = signos[Math.floor(Math.random() * signos.length)];
    c.style.left = Math.random() * 100 + "vw";
    c.style.fontSize = 18 + Math.random() * 22 + "px";
    c.style.animationDuration = 2.5 + Math.random() * 2.5 + "s";
    c.style.animationDelay = Math.random() + "s";
    c.addEventListener("animationend", () => c.remove());
    document.body.appendChild(c);
  }
}

// ---------- Botones ----------
btnEmpezar.addEventListener("click", empezar);
btnVaciar.addEventListener("click", vaciar);
btnOtra.addEventListener("click", empezar);

btnQuitarGanador.addEventListener("click", () => {
  if (ganadora) quitarGato(ganadora);
  ganadorCaja.classList.add("oculto");
});

btnCerrarGanador.addEventListener("click", () => {
  ganadorCaja.classList.add("oculto");
});

actualizarControles();
