// El CRM funciona sin este script: solo agrega comodidades.
//  - Pide confirmación en los botones con data-confirmar.
//  - Evita el doble envío de un formulario.
//  - Muestra el motivo de pérdida solo cuando la etapa lo pide.
//  - Anota el intento de contacto al tocar WhatsApp, Llamar o Correo (SLA).
//  - El embudo: arrastrar y soltar tarjetas entre etapas (mouse, o el dedo
//    dejándolo apretado), sin recargar la página.
//  - El detalle de las gráficas al pasar el mouse, tocar o enfocar.
//
// Lo que manda con fetch() lleva el token anti-CSRF de la página y la
// cabecera X-CRM (ver esAccionDeScript en crm/src/seguridad.ts).
(function () {
  "use strict";

  function meta(nombre) {
    var m = document.querySelector('meta[name="' + nombre + '"]');
    return m ? m.getAttribute("content") || "" : "";
  }
  var csrf = meta("crm-csrf");
  var ruta = meta("crm-ruta");

  // ── Avisos cortos ────────────────────────────────────────────────────
  var temporizadorToast = null;
  function toast(texto, error) {
    var t = document.querySelector(".toast");
    if (!t) return;
    t.textContent = texto;
    t.classList.toggle("toast--error", !!error);
    t.hidden = false;
    clearTimeout(temporizadorToast);
    temporizadorToast = setTimeout(function () {
      t.hidden = true;
    }, error ? 5000 : 2600);
  }

  function enviar(url, datos) {
    var f = new FormData();
    f.append("_csrf", csrf);
    Object.keys(datos).forEach(function (k) {
      if (datos[k] !== undefined && datos[k] !== null) f.append(k, datos[k]);
    });
    return fetch(url, {
      method: "POST",
      body: f,
      credentials: "same-origin",
      headers: { "X-CRM": "1" },
      keepalive: true,
    }).then(
      function (r) {
        return r.json().then(
          function (j) {
            return j;
          },
          function () {
            return { ok: false, error: "respuesta" };
          },
        );
      },
      function () {
        return { ok: false, error: "red" };
      },
    );
  }

  // ── Formularios: confirmación y doble envío ──────────────────────────
  document.addEventListener(
    "submit",
    function (e) {
      var form = e.target;
      if (!(form instanceof HTMLFormElement) || form.method === "dialog") return;
      var boton = e.submitter || form.querySelector("button[type=submit]");
      var pregunta = boton && boton.getAttribute("data-confirmar");
      if (pregunta && !window.confirm(pregunta)) {
        e.preventDefault();
        return;
      }
      if (form.dataset.enviando === "1") {
        e.preventDefault();
        return;
      }
      form.dataset.enviando = "1";
      if (boton) boton.setAttribute("aria-busy", "true");
      // Si el navegador vuelve atrás desde el caché, el formulario se puede usar de nuevo.
      window.addEventListener("pageshow", function () {
        form.dataset.enviando = "";
        if (boton) boton.removeAttribute("aria-busy");
      });
    },
    true,
  );

  // El motivo de pérdida aparece solo cuando la etapa elegida lo pide.
  document.querySelectorAll("[data-etapas-con-motivo]").forEach(function (caja) {
    var etapas = caja.getAttribute("data-etapas-con-motivo").split(",");
    var etapa = caja.querySelector("select[name=etapa]");
    var motivo = caja.querySelector("select[name=motivo]");
    if (!etapa || !motivo) return;
    var campo = motivo.closest("label");
    function ajustar() {
      var pide = etapas.indexOf(etapa.value) >= 0;
      if (campo) campo.hidden = !pide;
      motivo.required = pide;
    }
    etapa.addEventListener("change", ajustar);
    ajustar();
  });

  // ── El intento de contacto (SLA) ─────────────────────────────────────
  var arrastreHecho = false;
  document.addEventListener(
    "click",
    function (e) {
      if (arrastreHecho && kanban && kanban.contains(e.target)) {
        // El clic que llega al soltar una tarjeta no abre nada. Solo dentro
        // del embudo: el diálogo del motivo (afuera) responde de inmediato.
        e.preventDefault();
        e.stopPropagation();
        arrastreHecho = false;
        return;
      }
      var a = e.target.closest ? e.target.closest("a[data-intento]") : null;
      if (!a || !csrf || !ruta) return;
      var id = a.getAttribute("data-contacto");
      if (!/^\d+$/.test(id || "")) return;
      // No se detiene el enlace: WhatsApp, el teléfono o el correo se abren igual.
      enviar(ruta + "/contacto/" + id + "/intento", { via: a.getAttribute("data-intento") }).then(function (j) {
        if (j.ok) toast("Quedó anotado el intento de contacto.");
      });
    },
    true,
  );

  // ── El embudo: arrastrar y soltar ────────────────────────────────────
  var kanban = document.querySelector(".kanban");
  if (kanban && csrf) iniciarKanban(kanban);

  function iniciarKanban(k) {
    var estado = null;
    var dialogo = document.getElementById("dialogo-motivo");
    var desplazamiento = null;

    function tarjetaDe(el) {
      return el && el.closest ? el.closest(".tarjeta-lead") : null;
    }
    function esControl(el) {
      return !!(el.closest && el.closest("button, select, input, textarea, summary, details, label, .acciones-rapidas"));
    }
    function nombreEtapa(columna) {
      var h = columna.querySelector(".columna-cabeza h2");
      return h ? h.textContent.trim() : "";
    }

    function preparar(t, x, y, tipo) {
      var r = t.getBoundingClientRect();
      estado = { tarjeta: t, x0: x, y0: y, dx: x - r.left, dy: y - r.top, ancho: r.width, tipo: tipo, activo: false, columna: null };
      if (tipo === "touch") {
        estado.temporizador = setTimeout(function () {
          if (estado && !estado.activo) activar(x, y);
        }, 380);
      }
    }

    function activar(x, y) {
      var t = estado.tarjeta;
      estado.activo = true;
      estado.origen = t.closest(".columna");
      estado.siguiente = t.nextElementSibling;
      var f = t.cloneNode(true);
      f.querySelectorAll("[id]").forEach(function (n) {
        n.removeAttribute("id");
      });
      f.querySelectorAll("details").forEach(function (n) {
        n.remove();
      });
      f.classList.add("tarjeta-lead--fantasma");
      f.setAttribute("aria-hidden", "true");
      f.style.width = estado.ancho + "px";
      f.style.left = "0px";
      f.style.top = "0px";
      document.body.appendChild(f);
      estado.fantasma = f;
      t.classList.add("tarjeta-lead--arrastrando");
      k.classList.add("kanban--arrastrando");
      if (navigator.vibrate) navigator.vibrate(12);
      mover(x, y);
      desplazar();
    }

    function columnaEn(x, y) {
      var el = document.elementFromPoint(x, y);
      return el && el.closest ? el.closest(".columna") : null;
    }

    function mover(x, y) {
      estado.x = x;
      estado.y = y;
      estado.fantasma.style.transform = "translate(" + (x - estado.dx) + "px," + (y - estado.dy) + "px)";
      var c = columnaEn(x, y);
      if (c !== estado.columna) {
        if (estado.columna) estado.columna.classList.remove("columna--destino");
        if (c && c !== estado.origen) c.classList.add("columna--destino");
        estado.columna = c;
      }
    }

    // Cerca de los bordes, el embudo y la página se desplazan solos.
    function desplazar() {
      if (!estado || !estado.activo) return;
      var r = k.getBoundingClientRect();
      var margen = 48;
      if (estado.x < r.left + margen) k.scrollLeft -= 14;
      else if (estado.x > r.right - margen) k.scrollLeft += 14;
      if (estado.y < 90) window.scrollBy(0, -12);
      else if (estado.y > window.innerHeight - 110) window.scrollBy(0, 12);
      desplazamiento = requestAnimationFrame(desplazar);
    }

    function limpiar() {
      if (!estado) return;
      clearTimeout(estado.temporizador);
      cancelAnimationFrame(desplazamiento);
      if (estado.fantasma) estado.fantasma.remove();
      if (estado.columna) estado.columna.classList.remove("columna--destino");
      estado.tarjeta.classList.remove("tarjeta-lead--arrastrando");
      k.classList.remove("kanban--arrastrando");
      estado = null;
    }

    function actualizarConteos() {
      k.querySelectorAll(".columna").forEach(function (c) {
        var n = c.querySelectorAll(".tarjeta-lead").length;
        var b = c.querySelector("[data-cuenta]");
        if (b) b.textContent = String(n);
        var vacia = c.querySelector(".columna-vacia");
        if (vacia) vacia.hidden = n > 0;
      });
    }

    function soltar() {
      if (!estado) return;
      if (!estado.activo) {
        limpiar();
        return;
      }
      arrastreHecho = true;
      setTimeout(function () {
        arrastreHecho = false;
      }, 400);
      var t = estado.tarjeta;
      var destino = estado.columna;
      var origen = estado.origen;
      var siguiente = estado.siguiente;
      limpiar();
      if (!destino || destino === origen) return;
      var cuerpo = destino.querySelector(".columna-cuerpo");
      cuerpo.insertBefore(t, cuerpo.firstChild);
      actualizarConteos();
      var volver = function () {
        var c = origen.querySelector(".columna-cuerpo");
        c.insertBefore(t, siguiente && siguiente.parentNode === c ? siguiente : c.querySelector(".columna-vacia"));
        actualizarConteos();
      };
      var etapa = destino.getAttribute("data-etapa");
      if (destino.hasAttribute("data-pide-motivo") && dialogo && dialogo.showModal) {
        pedirMotivo(nombreEtapa(destino), function (motivo) {
          if (motivo) guardar(t, etapa, motivo, nombreEtapa(destino), volver);
          else volver();
        });
      } else {
        guardar(t, etapa, null, nombreEtapa(destino), volver);
      }
    }

    function pedirMotivo(nombre, listo) {
      var select = dialogo.querySelector("select[name=motivo]");
      var etiqueta = dialogo.querySelector("[data-destino]");
      if (etiqueta) etiqueta.textContent = nombre;
      select.value = "";
      dialogo.returnValue = "";
      dialogo.addEventListener(
        "close",
        function () {
          listo(dialogo.returnValue === "confirmar" ? select.value : null);
        },
        { once: true },
      );
      dialogo.showModal();
    }

    function guardar(t, etapa, motivo, nombre, volver) {
      var form = t.querySelector('form[action$="/etapa"]');
      if (!form) return volver();
      t.setAttribute("aria-busy", "true");
      enviar(form.action, { etapa: etapa, motivo: motivo || "", volver: k.getAttribute("data-volver") || "/embudo" }).then(function (j) {
        t.removeAttribute("aria-busy");
        if (j.ok) {
          t.setAttribute("data-etapa", etapa);
          var sel = form.querySelector("select[name=etapa]");
          if (sel) sel.value = etapa;
          var dias = t.querySelector(".dias");
          if (dias) {
            dias.textContent = "Hoy en esta etapa";
            dias.classList.remove("dias--estancada");
          }
          t.classList.remove("tarjeta-lead--recien");
          void t.offsetWidth;
          t.classList.add("tarjeta-lead--recien");
          toast("Movido a " + nombre + ".");
        } else {
          volver();
          toast(j.error === "motivo" ? "Falta el motivo: no se movió." : "No se pudo mover. Revisa la conexión y vuelve a intentarlo.", true);
        }
      });
    }

    // Mouse: se arrastra después de moverlo 6 px.
    k.addEventListener("mousedown", function (e) {
      if (e.button !== 0) return;
      var t = tarjetaDe(e.target);
      if (!t || esControl(e.target)) return;
      e.preventDefault();
      preparar(t, e.clientX, e.clientY, "mouse");
    });
    document.addEventListener("mousemove", function (e) {
      if (!estado || estado.tipo !== "mouse") return;
      if (!estado.activo) {
        if (Math.abs(e.clientX - estado.x0) + Math.abs(e.clientY - estado.y0) > 6) activar(e.clientX, e.clientY);
        return;
      }
      mover(e.clientX, e.clientY);
    });
    document.addEventListener("mouseup", function () {
      if (estado && estado.tipo === "mouse") soltar();
    });

    // Dedo: se arrastra después de dejarlo apretado; si se mueve antes, es
    // un desplazamiento normal de la página.
    k.addEventListener(
      "touchstart",
      function (e) {
        if (e.touches.length !== 1) return;
        var t = tarjetaDe(e.target);
        if (!t || esControl(e.target)) return;
        var p = e.touches[0];
        preparar(t, p.clientX, p.clientY, "touch");
      },
      { passive: true },
    );
    document.addEventListener(
      "touchmove",
      function (e) {
        if (!estado || estado.tipo !== "touch") return;
        var p = e.touches[0];
        if (!estado.activo) {
          if (Math.abs(p.clientX - estado.x0) + Math.abs(p.clientY - estado.y0) > 10) limpiar();
          return;
        }
        e.preventDefault();
        mover(p.clientX, p.clientY);
      },
      { passive: false },
    );
    document.addEventListener("touchend", function (e) {
      if (!estado || estado.tipo !== "touch") return;
      if (estado.activo) e.preventDefault();
      soltar();
    });
    document.addEventListener("touchcancel", limpiar);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && estado) limpiar();
    });
    // Que el menú del dedo apretado no tape el arrastre.
    k.addEventListener("contextmenu", function (e) {
      if (tarjetaDe(e.target)) e.preventDefault();
    });
  }

  // ── El detalle de las gráficas ───────────────────────────────────────
  var tip = null;
  function mostrarTip(el, x, y) {
    var texto = el.getAttribute("data-tip");
    if (!texto) return;
    if (!tip) {
      tip = document.createElement("div");
      tip.className = "tooltip";
      tip.setAttribute("role", "tooltip");
      document.body.appendChild(tip);
    }
    tip.textContent = texto;
    tip.hidden = false;
    var r = tip.getBoundingClientRect();
    var izq = Math.min(Math.max(8, x + 14), window.innerWidth - r.width - 8);
    var arriba = y - r.height - 12 < 8 ? y + 18 : y - r.height - 12;
    tip.style.left = izq + "px";
    tip.style.top = arriba + "px";
  }
  function ocultarTip() {
    if (tip) tip.hidden = true;
  }
  document.addEventListener("mousemove", function (e) {
    var el = e.target.closest ? e.target.closest("[data-tip]") : null;
    if (el) mostrarTip(el, e.clientX, e.clientY);
    else ocultarTip();
  });
  document.addEventListener("focusin", function (e) {
    var el = e.target.closest ? e.target.closest("[data-tip]") : null;
    if (!el) return ocultarTip();
    var r = el.getBoundingClientRect();
    mostrarTip(el, r.left + r.width / 2, r.top);
  });
  document.addEventListener("focusout", ocultarTip);
  document.addEventListener("touchstart", function (e) {
    var el = e.target.closest ? e.target.closest("[data-tip]") : null;
    if (!el || (e.target.closest && e.target.closest(".kanban"))) return ocultarTip();
    var p = e.touches[0];
    mostrarTip(el, p.clientX, p.clientY);
  }, { passive: true });
  window.addEventListener("scroll", ocultarTip, { passive: true });

  // La conversación con la IA en la ficha arranca en el último mensaje.
  document.querySelectorAll(".conversacion--ficha").forEach(function (c) {
    c.scrollTop = c.scrollHeight;
  });
})();
