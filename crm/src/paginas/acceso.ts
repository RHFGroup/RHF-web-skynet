/**
 * La página de acceso: pedir el código por Telegram y escribirlo.
 */
import { html, type Html } from "../html";
import { VERSION_ESTATICOS } from "./comun";

export function paginaAcceso(opciones: { paso: "inicio" | "codigo"; error?: string; vistaPrevia?: boolean }): Html {
  const cuerpo =
    opciones.paso === "codigo"
      ? html`<form class="tarjeta acceso" method="post" action="/acceso/entrar">
  <h1>Escribe el código</h1>
  <p>Te lo mandé por Telegram, en el chat con el bot de Skynet. Vence en 5 minutos.</p>
  ${opciones.error ? html`<p class="error" role="alert">${opciones.error}</p>` : ""}
  <label class="campo" for="codigo"><span>Código de 6 números</span>
  <input id="codigo" name="codigo" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9 ]*" maxlength="7" required autofocus></label>
  <button class="boton" type="submit">Entrar</button>
</form>
<form class="acceso-otra" method="post" action="/acceso/codigo"><button class="enlace" type="submit">Mandarme otro código</button></form>`
      : html`<form class="tarjeta acceso" method="post" action="/acceso/codigo">
  <h1>CRM de RHF</h1>
  <p>Para entrar te mando un código a Telegram, al chat con el bot de Skynet.</p>
  ${opciones.error ? html`<p class="error" role="alert">${opciones.error}</p>` : ""}
  <button class="boton" type="submit">Mandarme el código</button>
</form>`;

  return html`<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="same-origin">
<meta name="theme-color" content="#1F2A3D">
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
