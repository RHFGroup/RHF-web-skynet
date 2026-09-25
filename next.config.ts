import type { NextConfig } from "next";

// Export estático: el sitio no usa funciones de servidor, así que `next build`
// genera HTML/JS/CSS en `out/`, que el Worker de Cloudflare sirve como assets
// (ver wrangler.jsonc).
//
// Modo revisión (src/lib/revision.ts): las vistas previas de las ramas
// muestran lo propuesto que Rafael todavía no confirmó, con su etiqueta. El
// build de master no. Workers Builds pone el nombre de la rama en
// WORKERS_CI_BRANCH; en local se activa con MODO_REVISION=1.
const rama = process.env.WORKERS_CI_BRANCH ?? "";
const modoRevision = process.env.MODO_REVISION === "1" || (rama !== "" && rama !== "master");

const nextConfig: NextConfig = {
  output: "export",
  env: {
    NEXT_PUBLIC_MODO_REVISION: modoRevision ? "1" : "",
  },
};

export default nextConfig;
