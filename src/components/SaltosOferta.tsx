/**
 * Los dos saltos del bloque de la oferta: «Proyectos» y «Apartamentos».
 *
 * 25-sep-2026 (pedido de Rafael, ya publicada la home nueva): «Proyectos que
 * asesoramos» y «Apartamentos terminados y en construcción» van juntos, en un
 * mismo bloque. Arriba de cada uno, estos dos saltos dicen que hay dos listas
 * y llevan de una a la otra de un toque; el de la lista en la que uno está va
 * marcado. Si no hay apartamentos, no se pinta nada.
 */
type Props = {
  activo: "proyectos" | "apartamentos";
  proyectos: number;
  apartamentos: number;
};

export default function SaltosOferta({ activo, proyectos, apartamentos }: Props) {
  if (apartamentos === 0) return null;
  const saltos = [
    { id: "proyectos", href: "#cartera", texto: "Proyectos", n: proyectos },
    { id: "apartamentos", href: "#inmuebles", texto: "Apartamentos", n: apartamentos },
  ] as const;
  return (
    <nav className="oferta-saltos" aria-label="Proyectos y apartamentos">
      {saltos.map((s) => (
        <a
          key={s.id}
          href={s.href}
          className={s.id === activo ? "activo" : undefined}
          aria-current={s.id === activo ? "true" : undefined}
        >
          {s.texto} <span>{s.n}</span>
        </a>
      ))}
    </nav>
  );
}
