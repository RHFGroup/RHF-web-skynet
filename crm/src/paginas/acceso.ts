/**
 * La página de acceso: la clave.
 */
import { html, type Html } from "../html";
import { VERSION_ESTATICOS } from "./comun";

export function paginaAcceso(opciones: { hayClave: boolean; error?: string; vistaPrevia?: boolean }): Html {
  const cuerpo = opciones.hayClave
    ? html`<form class="tarjeta acceso" method="post" action="/acceso">
  <p class="marca marca--acceso"><span class="marca-rhf">RHF</span><span class="marca-crm">CRM</span></p>
  <h1>Entrar</h1>
  ${opciones.error ? html`<p class="error" role="alert">${opciones.error}</p>` : ""}
  <label class="campo" for="clave"><span>Clave</span>
  <input id="clave" name="clave" type="password" autocomplete="current-password" maxlength="200" required autofocus></label>
  <button class="boton" type="submit">Entrar</button>
</form>`
    : html`<div class="tarjeta acceso">
  <p class="marca marca--acceso"><span class="marca-rhf">RHF</span><span class="marca-crm">CRM</span></p>
  <h1>Entrar</h1>
  <p>La clave del CRM todavía no está configurada.</p>
</div>`;

  return html`<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="strict-origin">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="#0a0f1a">
<link rel="icon" href="data:,">
<title>Entrar · CRM RHF</title>
<link rel="stylesheet" href="/crm.css?v=${VERSION_ESTATICOS}">
</head>
<body class="pagina-acceso">
${opciones.vistaPrevia ? html`<p class="banda-prueba">Vista previa: base de pruebas</p>` : ""}
<main class="contenido">
${cuerpo}
</main>
</body>
</html>`;
}
