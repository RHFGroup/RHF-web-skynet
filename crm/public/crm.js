// El CRM funciona sin este script: solo agrega comodidades.
//  - Pide confirmación en los botones con data-confirmar.
//  - Evita el doble envío de un formulario.
(function () {
  "use strict";
  document.addEventListener(
    "submit",
    function (e) {
      var form = e.target;
      if (!(form instanceof HTMLFormElement)) return;
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
})();
