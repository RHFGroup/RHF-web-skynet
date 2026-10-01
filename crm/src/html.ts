/**
 * HTML con escape automático.
 *
 * Todo lo que se interpola en `html\`…\`` se escapa, salvo lo que ya es `Html`
 * (otra plantilla, o `crudo()` para el poco HTML fijo que escribe el código).
 * Así lo que escribe un lead —su nombre, su mensaje— nunca se vuelve código en
 * la página del CRM: el texto de un lead es un dato, no una instrucción.
 */

export class Html {
  readonly valor: string;
  constructor(valor: string) {
    this.valor = valor;
  }
  toString(): string {
    return this.valor;
  }
}

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function esc(v: unknown): string {
  return String(v).replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

function render(v: unknown): string {
  if (v === null || v === undefined || v === false) return "";
  if (v instanceof Html) return v.valor;
  if (Array.isArray(v)) return v.map(render).join("");
  return esc(v);
}

export function html(partes: TemplateStringsArray, ...valores: unknown[]): Html {
  let s = partes[0];
  for (let i = 0; i < valores.length; i++) s += render(valores[i]) + partes[i + 1];
  return new Html(s);
}

/** HTML que escribe el código, nunca lo que viene de un lead. */
export function crudo(s: string): Html {
  return new Html(s);
}
