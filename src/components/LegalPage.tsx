import Link from "next/link";
import type { ReactNode } from "react";

export const RESPONSABLE = {
  nombreLegal: "Medardo Rafael Hernández Franco",
  nombreComercial: "Rafael Hernández Franco · Asesor Inmobiliario",
  // TODO(Rafael): reemplazar por la dirección comercial de atención.
  // El Art. 2.2.2.25.3.1 del Decreto 1074 de 2015 exige dirección física.
  direccion: "Cartagena de Indias, Bolívar, Colombia",
  correo: "rafaelhf.realestate@gmail.com",
  telefono: "+57 300 841 2677",
  sitio: "rhfliving.com",
};

export const VIGENCIA = "14 de septiembre de 2026";

export default function LegalPage({
  titulo,
  bajada,
  children,
}: {
  titulo: string;
  bajada: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-marfil text-marino">
      <div className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
        <Link
          href="/"
          className="text-sm font-medium tracking-wide text-cuero hover:underline"
        >
          ← Volver a rhfliving.com
        </Link>

        <h1 className="mt-8 font-serif text-4xl leading-tight sm:text-5xl">
          {titulo}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-marino/80">{bajada}</p>
        <p className="mt-6 border-t border-marino/15 pt-6 text-sm text-marino/60">
          Vigente desde el {VIGENCIA}. Esta versión reemplaza cualquier
          publicación anterior.
        </p>

        <article className="legal-body mt-10 space-y-8">{children}</article>

        <footer className="mt-16 border-t border-marino/15 pt-8 text-sm text-marino/60">
          <p>
            {RESPONSABLE.nombreLegal} — {RESPONSABLE.nombreComercial}.{" "}
            {RESPONSABLE.direccion}. {RESPONSABLE.correo} ·{" "}
            {RESPONSABLE.telefono}.
          </p>
          <p className="mt-3">
            <Link href="/privacidad" className="hover:underline">
              Política de tratamiento de datos
            </Link>{" "}
            ·{" "}
            <Link href="/terminos" className="hover:underline">
              Términos de uso
            </Link>
          </p>
        </footer>
      </div>
    </main>
  );
}

export function Seccion({
  id,
  titulo,
  children,
}: {
  id?: string;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-serif text-2xl leading-snug sm:text-3xl">{titulo}</h2>
      <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-marino/85">
        {children}
      </div>
    </section>
  );
}
