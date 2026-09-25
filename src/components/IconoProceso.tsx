import {
  IconoCalendario,
  IconoConversacion,
  IconoDestello,
  IconoDocumento,
  IconoEdificio,
  IconoEscudo,
  IconoLlave,
  IconoPin,
} from "@/components/Iconos";
import type { Icono } from "@/data/proceso";
import { MODO_REVISION } from "@/lib/revision";
// Las marcas de propuesta tienen su estilo aquí: cualquier página que las use lo trae.
import "@/styles/proceso.css";

/** El ícono de un servicio o de un paso, por su nombre en proceso.ts. */
export default function IconoProceso({ icono, size = 24 }: { icono: Icono; size?: number }) {
  switch (icono) {
    case "documento":
      return <IconoDocumento size={size} />;
    case "escudo":
      return <IconoEscudo size={size} />;
    case "llave":
      return <IconoLlave size={size} />;
    case "conversacion":
      return <IconoConversacion size={size} />;
    case "pin":
      return <IconoPin size={size} />;
    case "calendario":
      return <IconoCalendario size={size} />;
    case "edificio":
      return <IconoEdificio size={size} />;
    default:
      return <IconoDestello size={size} />;
  }
}

/** La marca de lo propuesto. Solo existe en las vistas previas. */
export function EtiquetaPropuesta({ confirmado, nota }: { confirmado: boolean; nota?: string }) {
  if (confirmado) return null;
  return (
    <span className="propuesta" title={nota}>
      Propuesta · por confirmar{nota ? ` · ${nota}` : ""}
    </span>
  );
}

/**
 * Una sola marca para toda una sección propuesta (pedido de Rafael del
 * 25-sep-2026: un solo «por confirmar» por sección, no uno por tarjeta).
 * Solo existe en las vistas previas y solo si algo de la sección falta
 * confirmar.
 */
export function AvisoPropuesta({ pendiente, nota }: { pendiente: boolean; nota?: string }) {
  if (!pendiente || !MODO_REVISION) return null;
  return (
    <p className="propuesta propuesta-seccion">
      Propuesta · por confirmar{nota ? ` — ${nota}` : ""}
    </p>
  );
}
