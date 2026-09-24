/**
 * Íconos lineales propios, sin librería.
 *
 * El sitio no usa lucide ni otra colección: estos trazos son nuestros, a 24 px
 * y 1,5 de grosor, y toman el color del texto (`currentColor`) para que el CSS
 * los pinte en camel. Todos van con `aria-hidden`: el texto de al lado dice lo
 * mismo, el ícono solo acompaña.
 */
import type { ReactNode, SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 20, children, ...rest }: Props & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconoCama = (p: Props) => (
  <Svg {...p}>
    <path d="M2.5 18V7M2.5 14h19v4M21.5 14v-1.5a3 3 0 0 0-3-3h-7.5V14M5.5 11.5h2.5" />
  </Svg>
);

export const IconoBano = (p: Props) => (
  <Svg {...p}>
    <path d="M3.5 12h17v2.5a4.5 4.5 0 0 1-4.5 4.5H8a4.5 4.5 0 0 1-4.5-4.5zM6 12V6.5a2 2 0 0 1 4 0M7.5 21l.8-2M16.5 21l-.8-2" />
  </Svg>
);

export const IconoArea = (p: Props) => (
  <Svg {...p}>
    <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />
  </Svg>
);

export const IconoEscudo = (p: Props) => (
  <Svg {...p}>
    <path d="M12 3l7 3v5c0 4.6-3 8.3-7 10-4-1.7-7-5.4-7-10V6z" />
    <path d="M9 12l2 2 4-4.5" />
  </Svg>
);

export const IconoFlecha = (p: Props) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

export const IconoFlechaIzq = (p: Props) => (
  <Svg {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Svg>
);

export const IconoCalendario = (p: Props) => (
  <Svg {...p}>
    <path d="M4 6.5h16V20H4zM4 10.5h16M8.5 3.5v5M15.5 3.5v5" />
  </Svg>
);

export const IconoOlas = (p: Props) => (
  <Svg {...p}>
    <path d="M2 10c1.7 0 1.7-1.5 3.3-1.5S7 10 8.7 10s1.7-1.5 3.3-1.5 1.7 1.5 3.3 1.5 1.7-1.5 3.4-1.5S20.3 10 22 10M2 15c1.7 0 1.7-1.5 3.3-1.5S7 15 8.7 15s1.7-1.5 3.3-1.5 1.7 1.5 3.3 1.5 1.7-1.5 3.4-1.5S20.3 15 22 15" />
  </Svg>
);

export const IconoPesa = (p: Props) => (
  <Svg {...p}>
    <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />
  </Svg>
);

export const IconoCancha = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 3.5v17M3.5 12h17" />
  </Svg>
);

export const IconoPortatil = (p: Props) => (
  <Svg {...p}>
    <path d="M4.5 6h15v10h-15zM2.5 19h19" />
  </Svg>
);

export const IconoCorazon = (p: Props) => (
  <Svg {...p}>
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
  </Svg>
);

export const IconoCopa = (p: Props) => (
  <Svg {...p}>
    <path d="M8 3.5h8l-1 6.5a3 3 0 0 1-6 0zM12 13v6M8.5 20.5h7" />
  </Svg>
);

export const IconoHoja = (p: Props) => (
  <Svg {...p}>
    <path d="M5 19C5 11 10 5 20 5c0 10-6 15-14 15M5 19c3-4 6-7 10-9" />
  </Svg>
);

export const IconoAuto = (p: Props) => (
  <Svg {...p}>
    <path d="M3.5 16h17v3h-17zM5.5 16l1.8-5.5a1.5 1.5 0 0 1 1.4-1h6.6a1.5 1.5 0 0 1 1.4 1l1.8 5.5M7 19v1.5M17 19v1.5" />
  </Svg>
);

export const IconoEdificio = (p: Props) => (
  <Svg {...p}>
    <path d="M5 21V4h9v17M14 9h5v12M3 21h18M8 8h3M8 12h3M8 16h3" />
  </Svg>
);

export const IconoLlave = (p: Props) => (
  <Svg {...p}>
    <circle cx="8" cy="12" r="4" />
    <path d="M12 12h9M17.5 12v3M20.5 12v2" />
  </Svg>
);

export const IconoDestello = (p: Props) => (
  <Svg {...p}>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
  </Svg>
);

export const IconoPin = (p: Props) => (
  <Svg {...p}>
    <path d="M12 21s-6-5.3-6-11a6 6 0 0 1 12 0c0 5.7-6 11-6 11z" />
    <circle cx="12" cy="10" r="2" />
  </Svg>
);

export const IconoCapas = (p: Props) => (
  <Svg {...p}>
    <path d="M12 4l9 5-9 5-9-5zM3 14l9 5 9-5" />
  </Svg>
);

export const IconoDocumento = (p: Props) => (
  <Svg {...p}>
    <path d="M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6" />
  </Svg>
);

export const IconoConversacion = (p: Props) => (
  <Svg {...p}>
    <path d="M4 5h16v10H9l-5 4z" />
  </Svg>
);

/** El logo de WhatsApp, relleno: es una marca, no un trazo. */
export const IconoWhatsApp = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.742.324 1.322.52 1.774.645.745.237 1.422.203 1.957.123.595-.089 1.832-.748 2.09-1.471.258-.723.258-1.342.183-1.472-.074-.131-.272-.213-.57-.362m-5.436 6.868h-.004a9.68 9.68 0 01-4.93-1.88l-.354-.21-3.665.96.978-3.57-.232-.37a9.68 9.68 0 01-1.483-5.128c0-5.35 4.352-9.703 9.703-9.703a9.63 9.63 0 016.86 2.843 9.63 9.63 0 012.843 6.86c0 5.35-4.352 9.703-9.703 9.703h-.005z" />
  </svg>
);

/**
 * El ícono de una amenidad, por su nombre. Si ninguna palabra coincide, va
 * el destello: mejor un ícono neutro que uno que diga otra cosa.
 */
export function IconoAmenidad({ nombre, size }: { nombre: string; size?: number }) {
  const n = nombre.toLowerCase();
  if (/piscina|jacuzzi|lago|solárium|solarium/.test(n)) return <IconoOlas size={size} />;
  if (/gimnasio/.test(n)) return <IconoPesa size={size} />;
  if (/cancha|golf/.test(n)) return <IconoCancha size={size} />;
  if (/cowork/.test(n)) return <IconoPortatil size={size} />;
  if (/infantil|pet|mascota/.test(n)) return <IconoCorazon size={size} />;
  if (/salón|salon|social|bbq|club/.test(n)) return <IconoCopa size={size} />;
  if (/verde|sender|boulevard|meditación|meditacion|jard/.test(n)) return <IconoHoja size={size} />;
  if (/cerrado|seguridad/.test(n)) return <IconoEscudo size={size} />;
  if (/parqueadero/.test(n)) return <IconoAuto size={size} />;
  if (/torre|ascensor|edificio/.test(n)) return <IconoEdificio size={size} />;
  if (/renta/.test(n)) return <IconoLlave size={size} />;
  if (/ampliación|ampliacion|estructura/.test(n)) return <IconoCapas size={size} />;
  if (/aeropuerto|zona norte|mall|comercial/.test(n)) return <IconoPin size={size} />;
  return <IconoDestello size={size} />;
}
