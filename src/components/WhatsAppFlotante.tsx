"use client";

/**
 * El botón flotante de WhatsApp, con la foto de Rafael (prompt 5).
 *
 * Una cara vende más que un logo verde: el que escribe sabe a quién le
 * escribe. Va encima del botón del chat del agente, sin tocarlo (misma
 * posición que el botón verde de antes). Al pasar el cursor dice «Escríbele a
 * Rafael».
 *
 * Aparece cuando la portada sale de la pantalla (`trasDe`): la portada ya
 * tiene sus botones, y así el flotante no tapa la leyenda de los proyectos
 * de la home ni las flechas de la galería de cada proyecto. En las páginas de
 * proyecto va solo en escritorio: en el teléfono, la barra de abajo ya trae
 * «Agendar visita».
 */
import { useEffect, useState } from "react";
import { IconoWhatsApp } from "@/components/Iconos";
import { enlaceWhatsApp, SALUDO_WHATSAPP } from "@/data/contacto";
import "@/styles/whatsapp-flotante.css";

export default function WhatsAppFlotante({
  trasDe,
  soloEscritorio = false,
  mensaje = SALUDO_WHATSAPP,
}: {
  /** Selector de la portada: el botón aparece cuando ella sale de la pantalla. */
  trasDe?: string;
  soloEscritorio?: boolean;
  mensaje?: string;
}) {
  const [visible, setVisible] = useState(!trasDe);

  useEffect(() => {
    if (!trasDe) return;
    const portada = document.querySelector(trasDe);
    if (!portada || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setVisible(e.intersectionRatio < 0.35), {
      threshold: [0, 0.35, 0.7, 1],
    });
    io.observe(portada);
    return () => io.disconnect();
  }, [trasDe]);

  return (
    <a
      className={"wa-flotante" + (visible ? " visible" : "") + (soloEscritorio ? " solo-escritorio" : "")}
      href={enlaceWhatsApp(mensaje)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbele a Rafael por WhatsApp"
      aria-hidden={visible ? undefined : true}
      tabIndex={visible ? undefined : -1}
    >
      <img src="/rafael/avatar-128.jpg" alt="" width={60} height={60} loading="lazy" decoding="async" />
      <span className="wa-flotante-insignia" aria-hidden="true">
        <IconoWhatsApp size={13} />
      </span>
      <span className="wa-flotante-globo" aria-hidden="true">
        Escríbele a Rafael
      </span>
    </a>
  );
}
