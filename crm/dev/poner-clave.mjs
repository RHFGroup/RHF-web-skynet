// Guarda la clave del CRM (o su ruta secreta) como secreto del Worker del sitio,
// sin que nadie la vea (6-oct-2026).
//
//   node crm/dev/poner-clave.mjs clave   → pide la clave en un cuadro del Mac, dos veces
//   node crm/dev/poner-clave.mjs ruta    → genera una ruta secreta al azar (/r/…) y la muestra
//
// Se corre en el Mac, desde la carpeta del repo, con wrangler ya logueado.
//
// La clave:
//  - se escribe en un cuadro de macOS con el texto oculto: no pasa por la
//    Terminal, ni por los registros, ni por Claude;
//  - no se guarda en ninguna parte: se guarda su huella PBKDF2-SHA256 (el mismo
//    formato que verifica crm/src/clave.ts) en el secreto CRM_CLAVE;
//  - la huella le llega a wrangler por la entrada estándar, nunca en la línea
//    de comandos.
//
// Usa `wrangler versions secret put`: crea una versión nueva con el secreto,
// pero no la publica. El próximo deploy (el merge a master) lo lleva. Nunca
// cambies secretos por el panel de Cloudflare: publica la última versión
// subida, que puede ser una vista previa.
import { spawnSync } from "node:child_process";
import { pbkdf2Sync, randomBytes, randomInt } from "node:crypto";

/** Las mismas que crm/src/clave.ts (ITERACIONES). */
const ITERACIONES = 20_000;
const MINIMO = 10;

function b64url(buf) {
  return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Un cuadro de macOS con el texto oculto. Devuelve lo escrito, o null si cancela. */
function pedirOculto(mensaje) {
  const script = `display dialog ${JSON.stringify(mensaje)} default answer "" with hidden answer with title "CRM de RHF" buttons {"Cancelar", "Guardar"} default button "Guardar" cancel button "Cancelar"
text returned of result`;
  const r = spawnSync("osascript", ["-e", script], { encoding: "utf8" });
  if (r.status !== 0) return null;
  return r.stdout.replace(/\n$/, "");
}

function avisar(mensaje) {
  spawnSync("osascript", ["-e", `display dialog ${JSON.stringify(mensaje)} with title "CRM de RHF" buttons {"Listo"} default button "Listo"`]);
}

/** Guarda un secreto en el Worker del sitio sin publicar nada. El valor va por la entrada estándar. */
function guardarSecreto(nombre, valor) {
  const r = spawnSync("npx", ["wrangler", "versions", "secret", "put", nombre, "--message", `CRM: ${nombre}`], {
    input: valor,
    encoding: "utf8",
    env: { ...process.env, CI: "1" },
  });
  // Lo que imprime wrangler no trae el valor; igual se muestra solo la última línea.
  const ultima = `${r.stdout ?? ""}${r.stderr ?? ""}`.trim().split("\n").filter(Boolean).at(-1) ?? "";
  return { ok: r.status === 0, detalle: ultima.slice(0, 200) };
}

const modo = process.argv[2];

if (modo === "clave") {
  const clave = pedirOculto(`Escribe la clave nueva del CRM (al menos ${MINIMO} caracteres).`);
  if (clave === null) process.exit(1);
  if ([...clave].length < MINIMO) {
    avisar(`La clave tiene que tener al menos ${MINIMO} caracteres. No se guardó nada.`);
    process.exit(1);
  }
  const otra = pedirOculto("Escríbela otra vez, para confirmar.");
  if (otra === null) process.exit(1);
  if (otra.normalize("NFC") !== clave.normalize("NFC")) {
    avisar("Las dos claves no coinciden. No se guardó nada.");
    process.exit(1);
  }
  const sal = randomBytes(16);
  const hash = pbkdf2Sync(Buffer.from(clave.normalize("NFC"), "utf8"), sal, ITERACIONES, 32, "sha256");
  const r = guardarSecreto("CRM_CLAVE", `pbkdf2-sha256$${ITERACIONES}$${b64url(sal)}$${b64url(hash)}`);
  if (!r.ok) {
    avisar("No se pudo guardar la clave en Cloudflare. No cambió nada.");
    console.error(`No se pudo guardar CRM_CLAVE: ${r.detalle}`);
    process.exit(1);
  }
  avisar("Listo: la clave quedó guardada en Cloudflare. Entra en funcionamiento con el próximo deploy.");
  console.log("CRM_CLAVE guardada (sin publicar).");
} else if (modo === "ruta") {
  const letras = "abcdefghijkmnpqrstuvwxyz23456789";
  let ruta = "/r/";
  for (let i = 0; i < 20; i++) ruta += letras[randomInt(letras.length)];
  const r = guardarSecreto("CRM_RUTA", ruta);
  if (!r.ok) {
    console.error(`No se pudo guardar CRM_RUTA: ${r.detalle}`);
    process.exit(1);
  }
  console.log(`CRM_RUTA guardada (sin publicar): https://rhfliving.com${ruta}`);
} else {
  console.error("Uso: node crm/dev/poner-clave.mjs clave | ruta");
  process.exit(2);
}
