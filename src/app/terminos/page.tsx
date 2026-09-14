import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { Seccion, RESPONSABLE } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Términos de uso — RHF",
  description:
    "Condiciones bajo las cuales se publica la información de rhfliving.com y se atienden los canales de contacto.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://rhfliving.com/terminos" },
};

export default function Terminos() {
  return (
    <LegalPage
      titulo="Términos de uso"
      bajada="Condiciones bajo las cuales publicamos la información de esta página y atendemos los canales de contacto. Al usar el sitio o escribirnos por cualquiera de ellos, las aceptas."
    >
      <Seccion titulo="1. Quién opera este sitio">
        <p>
          {RESPONSABLE.sitio} lo opera{" "}
          <strong>{RESPONSABLE.nombreLegal}</strong>, persona natural que actúa
          bajo el nombre comercial{" "}
          <strong>{RESPONSABLE.nombreComercial}</strong>, con domicilio en{" "}
          {RESPONSABLE.direccion} y contacto en{" "}
          <a href={`mailto:${RESPONSABLE.correo}`} className="underline">
            {RESPONSABLE.correo}
          </a>{" "}
          y {RESPONSABLE.telefono}.
        </p>
      </Seccion>

      <Seccion titulo="2. Soy asesor, no soy el constructor">
        <p>
          Comercializo proyectos inmobiliarios de terceros en calidad de asesor
          independiente. No soy el propietario, el constructor ni el promotor
          de los proyectos que aparecen en esta página, y no administro los
          recursos de quienes compran. La relación contractual de compra se
          celebra siempre entre el comprador y la entidad constructora o
          promotora del proyecto, bajo los documentos que esa entidad emite.
        </p>
        <p>
          Mi trabajo es mostrarte las opciones, explicarte las diferencias y
          acompañarte en el proceso. Las obligaciones de entrega, el
          cumplimiento del cronograma de obra, las especificaciones técnicas y
          las garantías del inmueble corresponden al constructor, no a mí.
        </p>
      </Seccion>

      <Seccion titulo="3. La información publicada no es una oferta comercial">
        <p>
          Los precios, áreas, tipologías, plazos y disponibilidad que aparecen
          en esta página corresponden a la fecha indicada en cada proyecto y
          los suministra el constructor. Pueden cambiar sin previo aviso y no
          constituyen oferta comercial vinculante en los términos del Art. 845
          del Código de Comercio. Cualquier condición se confirma con el asesor
          y se formaliza en los documentos del constructor.
        </p>
        <p>
          Las imágenes, renders y recorridos son ilustrativos. No reproducen
          necesariamente acabados, mobiliario, vegetación ni entorno
          definitivos.
        </p>
        <p>
          La publicidad de proyectos de vivienda está sujeta a los requisitos
          de información de la Circular Única de la Superintendencia de
          Industria y Comercio. La información completa de cada proyecto
          —dirección exacta, estrato, área privada construida, fecha de
          entrega, matrícula inmobiliaria, reglamento de propiedad horizontal y
          esquema de manejo de recursos— está disponible para consulta directa,
          y conviene revisarla antes de comprometer dinero.
        </p>
      </Seccion>

      <Seccion titulo="4. Los canales de contacto">
        <p>
          Atendemos por WhatsApp, por el chat de esta página, por Instagram y
          por Facebook. El chat de la página y el canal de WhatsApp pueden ser
          atendidos por un asistente automatizado que responde con información
          pública de la cartera; cuando la consulta lo amerita, la conversación
          pasa a un asesor.
        </p>
        <p>
          Ese asistente puede equivocarse. Nada de lo que responda constituye
          asesoría jurídica, financiera o tributaria, ni compromete
          condiciones comerciales. Lo que vale es lo que quede por escrito en
          los documentos del constructor.
        </p>
        <p>
          El tratamiento de los datos personales que entregas por esos canales
          se rige por nuestra{" "}
          <Link href="/privacidad" className="underline">
            Política de Tratamiento de Datos Personales
          </Link>
          .
        </p>
      </Seccion>

      <Seccion titulo="5. Propiedad intelectual">
        <p>
          Los textos, el diseño, la marca RHF, el logotipo y el material
          gráfico propio de esta página están protegidos por la Ley 23 de 1982
          y la Decisión 486 de la Comunidad Andina. Puedes consultarlos y
          compartir enlaces. No puedes reproducirlos, modificarlos ni usarlos
          con fines comerciales sin autorización escrita.
        </p>
        <p>
          Los renders, planos y material de cada proyecto pertenecen a sus
          respectivos constructores y se publican con su autorización para
          fines de comercialización.
        </p>
      </Seccion>

      <Seccion titulo="6. Disponibilidad del sitio">
        <p>
          Procuramos que la página esté disponible y actualizada, sin
          garantizar operación ininterrumpida ni ausencia de errores. Podemos
          modificar, suspender o retirar contenidos en cualquier momento,
          incluidos proyectos que dejen de estar en comercialización.
        </p>
      </Seccion>

      <Seccion titulo="7. Ley aplicable">
        <p>
          Estos términos se rigen por la ley colombiana. Cualquier controversia
          se somete a los jueces de Cartagena de Indias, sin perjuicio de las
          acciones de protección al consumidor ante la Superintendencia de
          Industria y Comercio previstas en la Ley 1480 de 2011.
        </p>
      </Seccion>

      <Seccion titulo="8. Cambios">
        <p>
          Podemos actualizar estos términos. La versión vigente es siempre la
          publicada en esta dirección, con la fecha indicada al inicio.
        </p>
      </Seccion>
    </LegalPage>
  );
}
