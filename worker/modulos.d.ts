// Los recursos del CRM que wrangler embebe como módulos (ver "rules" en
// wrangler.jsonc y worker/crm-recursos.ts).
declare module "*.css" {
  const texto: string;
  export default texto;
}
declare module "*/crm/public/crm.js" {
  const texto: string;
  export default texto;
}
declare module "*.woff2" {
  const datos: ArrayBuffer;
  export default datos;
}
