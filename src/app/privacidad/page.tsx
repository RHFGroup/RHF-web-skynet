import type { Metadata } from "next";
import LegalPage, { Seccion, RESPONSABLE } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Política de Tratamiento de Datos Personales — RHF",
  description:
    "Cómo recogemos, usamos, protegemos y eliminamos los datos personales de quienes nos escriben, conforme a la Ley 1581 de 2012.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://rhfliving.com/privacidad" },
};

export default function Privacidad() {
  return (
    <LegalPage
      titulo="Política de Tratamiento de Datos Personales"
      bajada="Si nos escribes por WhatsApp, por el chat de esta página, por Instagram o por Facebook, o si dejas tus datos en una feria, quedamos con información tuya. Aquí decimos qué hacemos con ella, por cuánto tiempo, y cómo pedir que la borremos."
    >
      <Seccion titulo="1. Quién responde por tus datos">
        <p>
          El responsable del tratamiento es{" "}
          <strong>{RESPONSABLE.nombreLegal}</strong>, persona natural
          identificada con cédula de ciudadanía, quien actúa bajo el nombre
          comercial <strong>{RESPONSABLE.nombreComercial}</strong>.
        </p>
        <p>
          Domicilio: {RESPONSABLE.direccion}. Correo electrónico:{" "}
          <a href={`mailto:${RESPONSABLE.correo}`} className="underline">
            {RESPONSABLE.correo}
          </a>
          . Teléfono y WhatsApp: {RESPONSABLE.telefono}.
        </p>
        <p>
          Él mismo atiende las consultas y los reclamos sobre datos personales.
          No hay intermediarios ni áreas internas: escribes al correo o al
          WhatsApp de arriba y te responde directamente.
        </p>
      </Seccion>

      <Seccion titulo="2. Qué datos recogemos y por dónde">
        <p>
          Recogemos lo que tú nos entregas al contactarnos: nombre, número de
          teléfono, correo electrónico, el nombre de perfil con el que escribes
          en redes, y el contenido de la conversación —qué proyecto te
          interesa, qué presupuesto manejas, si buscas vivienda o inversión, en
          qué plazo—. En algunos casos, cuando avanzas hacia una compra,
          recogemos además los datos de identificación que exige el proceso de
          vinculación del constructor.
        </p>
        <p>Los canales por los que entran esos datos son cinco:</p>
        <ul className="ml-5 list-disc space-y-2">
          <li>
            <strong>El formulario de esta página.</strong> Guardamos lo que
            escribes —nombre, el teléfono o correo por el que quieres que te
            contactemos, el proyecto que te interesa y tu mensaje— junto con la
            constancia de tu autorización: la fecha y hora del envío, la
            versión del texto que aceptaste, tu dirección IP y el navegador
            desde el que enviaste. Esa constancia existe por una razón: la ley
            nos exige poder demostrar que tu autorización fue previa, expresa e
            informada, y sin ella guardar tus datos sería peor que no
            guardarlos. Al enviar también se abre WhatsApp con tu mensaje ya
            escrito, para que la conversación empiece por donde te respondemos.
          </li>
          <li>
            <strong>WhatsApp Business.</strong> Cuando nos escribes, recibimos
            tu número, tu nombre de perfil y los mensajes que envías.
          </li>
          <li>
            <strong>El chat de esta página.</strong> Lo atiende un asistente
            automatizado que responde con información pública de nuestra
            cartera y que traslada la conversación a un asesor cuando hace
            falta.
          </li>
          <li>
            <strong>Instagram y Facebook.</strong> Mensajes directos y
            comentarios en nuestros perfiles.
          </li>
          <li>
            <strong>Ferias y eventos presenciales.</strong> Los formularios en
            papel que diligencias en el punto de atención.
          </li>
        </ul>
        <p>
          No recogemos datos sensibles —salud, origen étnico, orientación
          sexual, convicciones políticas o religiosas, datos biométricos— ni te
          los vamos a pedir. Si llegas a incluirlos por tu cuenta en un
          mensaje, no los usamos para nada y los eliminamos.
        </p>
      </Seccion>

      <Seccion titulo="3. Para qué los usamos">
        <p>
          Tus datos se usan para responderte, entender qué buscas y mostrarte
          las opciones de nuestra cartera que encajan; para coordinar visitas,
          citas y el trámite de separación o compra con el constructor
          correspondiente; para enviarte información sobre proyectos,
          disponibilidad y precios cuando has aceptado recibirla; y para llevar
          el registro interno de la gestión comercial.
        </p>
        <p>
          El envío de mensajes promocionales por WhatsApp requiere tu
          autorización previa y expresa. Puedes retirarla en cualquier momento
          respondiendo <em>BAJA</em> a cualquiera de esos mensajes, y dejamos de
          enviártelos. Eso no afecta las conversaciones que tú inicies ni las
          respuestas a lo que nos preguntes.
        </p>
        <p>
          No vendemos tus datos, no los cedemos a terceros para su propia
          publicidad, y no los usamos para una finalidad distinta de las que
          acabas de leer.
        </p>
      </Seccion>

      <Seccion titulo="4. Con quién los compartimos">
        <p>
          Compartimos datos únicamente con quienes hacen falta para atenderte:
          el constructor o promotor del proyecto que te interesa, cuando
          avanzas hacia una separación o una compra y esa entidad necesita tus
          datos para vincularte; y los proveedores tecnológicos que operan
          nuestros canales, que actúan como encargados del tratamiento y no
          pueden usar tu información para fines propios.
        </p>
        <p>
          Esos proveedores son Meta Platforms —que opera WhatsApp Business
          Platform, Instagram y Facebook—, el proveedor de infraestructura que
          aloja esta página y el canal de atención, y las herramientas de
          correo y de gestión comercial que usamos. Algunos de ellos procesan
          información fuera de Colombia, lo que constituye una transferencia
          internacional; al aceptar esta política autorizas esa transferencia
          en los términos de los Arts. 26 y 27 de la Ley 1581 de 2012.
        </p>
        <p>
          También entregamos información cuando una autoridad judicial o
          administrativa la requiere en ejercicio de sus funciones.
        </p>
      </Seccion>
      <Seccion titulo="5. Tus derechos">
        <p>
          El Art. 8 de la Ley 1581 de 2012 te reconoce derechos que no dependen
          de nuestra buena voluntad. Puedes conocer qué datos tuyos tenemos y
          para qué los usamos, sin costo. Puedes pedir que corrijamos los que
          estén incompletos, desactualizados o equivocados. Puedes revocar la
          autorización que diste y pedir que eliminemos tus datos. Puedes
          exigir prueba de la autorización que otorgaste. Y puedes presentar
          queja ante la Superintendencia de Industria y Comercio si
          consideramos mal tu reclamo o no te respondemos.
        </p>
        <p>
          Hay un límite que conviene decir de frente: la supresión no procede
          cuando exista un deber legal o contractual de conservar el dato. Si
          firmaste una separación o una promesa, los registros de esa
          operación se conservan por el término que impone la ley comercial y
          tributaria, aunque nos pidas borrarlos.
        </p>
      </Seccion>

      <Seccion titulo="6. Cómo ejercer esos derechos">
        <p>
          Escribe a{" "}
          <a href={`mailto:${RESPONSABLE.correo}`} className="underline">
            {RESPONSABLE.correo}
          </a>{" "}
          o al WhatsApp {RESPONSABLE.telefono}, indicando tu nombre, un dato de
          contacto para responderte y qué quieres: consultar, corregir,
          actualizar o suprimir. No necesitas abogado ni formato especial.
        </p>
        <p>
          Las <strong>consultas</strong> se atienden en un máximo de diez días
          hábiles, prorrogables por cinco más si no alcanzamos, avisándote la
          razón y la nueva fecha (Art. 14 de la Ley 1581 de 2012). Los{" "}
          <strong>reclamos</strong> —cuando consideras que un dato debe
          corregirse, actualizarse o suprimirse— se atienden en quince días
          hábiles, prorrogables por ocho más bajo la misma regla (Art. 15).
          Mientras el reclamo esté en trámite, el dato queda marcado como
          &laquo;reclamo en trámite&raquo;.
        </p>
        <p>
          Presentar el reclamo ante nosotros es requisito previo para acudir a
          la Superintendencia de Industria y Comercio (Art. 16). Por eso
          conviene empezar aquí: es más rápido y casi siempre se resuelve sin
          llegar allá.
        </p>
      </Seccion>

      <Seccion id="supresion" titulo="7. Cómo pedir que borremos tus datos">
        <p>
          Si quieres que eliminemos toda la información que tenemos sobre ti,
          envía un mensaje al WhatsApp {RESPONSABLE.telefono} o un correo a{" "}
          <a href={`mailto:${RESPONSABLE.correo}`} className="underline">
            {RESPONSABLE.correo}
          </a>{" "}
          con el asunto <strong>&laquo;Eliminación de datos&raquo;</strong>,
          indicando el número de teléfono, el correo o el perfil de red social
          desde el que nos contactaste, para poder identificar tu registro.
        </p>
        <p>
          Dentro de los quince días hábiles siguientes eliminamos tus datos de
          nuestras bases y de las herramientas de gestión comercial, y te
          confirmamos por el mismo canal que lo hicimos. Se conserva
          únicamente lo que un deber legal o contractual nos obligue a
          conservar, y en ese caso te decimos qué queda y por qué.
        </p>
        <p>
          La conversación que exista en la aplicación de WhatsApp de tu propio
          teléfono es tuya y la borras tú; nosotros eliminamos la copia que
          está de nuestro lado.
        </p>
      </Seccion>

      <Seccion titulo="8. Menores de edad">
        <p>
          Esta página y nuestros canales de atención están dirigidos a personas
          mayores de edad con capacidad para contratar. No recogemos
          conscientemente datos de menores. Si detectamos que un dato
          corresponde a un menor, lo eliminamos.
        </p>
      </Seccion>

      <Seccion titulo="9. Seguridad y conservación">
        <p>
          Aplicamos las medidas técnicas y administrativas razonables para que
          tus datos no se pierdan ni queden al alcance de quien no debe verlos:
          acceso restringido a quien atiende la gestión comercial, canales
          cifrados y proveedores con controles de seguridad propios. Ninguna
          medida es infalible, y no vamos a prometer lo contrario.
        </p>
        <p>
          Conservamos tus datos mientras dure la relación comercial y, después,
          por el tiempo necesario para atender obligaciones legales o
          reclamaciones. Cumplido ese plazo, se eliminan.
        </p>
        <p>
          Para las consultas que llegan por el formulario de esta página el
          plazo es concreto: <strong>dos años contados desde nuestro último
          contacto contigo</strong>. Ese es el tiempo en que una decisión
          inmobiliaria sigue viva y en que tu consulta todavía nos sirve para
          responderte bien. Cumplidos los dos años se eliminan, y si nos lo
          pides antes las eliminamos antes —basta con escribirnos, como explica
          el punto 7—.
        </p>
        <p>
          Esas consultas se guardan en una base de datos alojada en la
          infraestructura de Cloudflare, cifrada en reposo. El formulario solo
          puede escribir en ella; la lectura la hace el responsable desde sus
          propias credenciales, y no está expuesta en la página.
        </p>
      </Seccion>

      <Seccion titulo="10. Vigencia y cambios">
        <p>
          Esta política rige desde la fecha indicada al inicio y por el tiempo
          en que se mantengan las bases de datos que administramos. Si la
          modificamos, publicamos la nueva versión en esta misma dirección con
          su fecha; cuando el cambio afecte la finalidad del tratamiento, te
          lo informamos por el canal que usas con nosotros y pedimos
          autorización otra vez.
        </p>
        <p className="text-sm text-marino/60">
          Marco aplicable: Ley 1581 de 2012, Decreto 1074 de 2015 (que compiló
          el Decreto 1377 de 2013) y Circular Externa 002 de 2015 de la
          Superintendencia de Industria y Comercio. El responsable es persona
          natural y, conforme al Decreto 090 de 2018, no está obligado a
          registrar sus bases de datos en el Registro Nacional de Bases de
          Datos.
        </p>
      </Seccion>
    </LegalPage>
  );
}
