# El motor del simulador de compra de vivienda

30-sep-2026. Fase 3 del plan de los prompts de Luciano (leads y simulador). Es solo el motor: la página `/simulador` llega en la fase 4. Nada de esto se ve todavía en el sitio.

## Qué hay

| Archivo | Qué calcula |
|---|---|
| `src/lib/simulador/financiero.ts` | Tasa mensual, cuota fija, leasing con opción de compra, tabla de amortización con seguros y abonos, crédito en UVR y sus escenarios de inflación |
| `src/lib/simulador/compra.ts` | Cuota inicial en obra, ingreso requerido e indicador legal, gastos de escritura y registro, límites legales y de mercado |
| `src/lib/simulador/cartera.ts` | Capacidad de compra, «Proyectos que te alcanzan» y «¿Qué mover para que te alcance?» |
| `src/lib/simulador/inversion.ts` | Renta corta y tradicional, beneficio tributario, sensibilidad a la TRM, arrendar o comprar |
| `src/lib/simulador/simular.ts` | Un escenario completo para el tablero, la línea de tiempo «Tu camino a la escritura», pruebas de estrés y escenarios comparados |
| `src/lib/simulador/config.ts` | La forma de la configuración, su validación y las etiquetas «Fuente», «Supuesto» y «Tu dato» |
| `src/data/simulador.config.json` | Los valores vigentes, cada uno con fuente, enlace, fecha, tipo y si está verificado |

Todo es puro y sin dependencias. Los avisos de los límites salen como código y números, no como texto, para escribirlos en español o en inglés.

## Pruebas

```
npm test
```

Corre con el `node --test` del propio Node, sin instalar nada (Node 22.18 o más nuevo, por la lectura de TypeScript). Son 57 pruebas:

- los once casos de la sección 11 del prompt, cada uno dentro de ±$1.000;
- los mismos casos con la regla vigente del 40 %;
- propiedades: el capital pagado suma el monto financiado, el saldo termina en cero (o en la opción de compra), el ingreso requerido nunca es menor que cuota ÷ límite;
- que cada cifra de la configuración diga de dónde sale;
- que un escenario completo se calcule en menos de 16 ms.

## Lo que corrige al prompt

La verificación del 30-sep-2026 está en el vault: `research/cifras-del-simulador-de-vivienda-verificadas-el-30-sep-2026`. Cambia cinco cosas del prompt:

1. **La primera cuota puede llegar al 40 % del ingreso familiar, también en No VIS.** Decreto 583 de 2025. El prompt usaba el 30 % anterior. Por eso las pruebas corren dos veces: con la regla del prompt, para comprobar la aritmética de sus casos, y con la vigente.
2. **Los 30 años de plazo máximo no son legales.** La ley fija un mínimo de 5 años (Ley 2079 de 2021); el máximo de 30 es lo que ofrecen hoy las entidades.
3. **El 14,71 % es el promedio de todo el crédito de vivienda**, no de No VIS en pesos. Queda sin verificar y sale como «Supuesto».
4. **El descuento VIS del 50 % es solo en registro.** En notaría la compraventa VIS tiene tarifa única y la hipoteca VIS paga el 40 % o el 10 % de la tarifa.
5. **Los datos de Airbtics son 56 % y US$86**, de febrero de 2025 a enero de 2026.

Y dos definiciones que los casos de prueba dejaban implícitas: T5c y T7 usan leasing con opción de compra del 0 %, y T7 no resta seguros.

## La página (fase 4, 30-sep-2026)

En producción desde el 1-oct-2026: el #50 se fusionó después del #46, con el OK de Rafael.

`/simulador` y `/en/mortgage-calculator`: `src/components/paginas/PaginaSimulador.tsx` arma la página (portada, simulador, guía y preguntas, con sus datos estructurados) y `src/components/simulador/` es el simulador, que corre entero en el navegador.

| Archivo | Qué hace |
|---|---|
| `Simulador.tsx` | Estado, inicio rápido, frase con cifras que se tocan, pestañas y tablero |
| `Pestanas.tsx` | Compra, financiación, gastos, beneficios, inversión y escenarios |
| `Alcanzan.tsx` | «Proyectos que te alcanzan» y «¿Qué mover para que te alcance?» |
| `Graficas.tsx` | «Tu camino a la escritura», composición por año y tabla de amortización |
| `Acciones.tsx` | WhatsApp, enlace, plan en PDF y precalificación (a `/api/consulta`) |
| `Campos.tsx` | Campos, chips y la etiqueta de cada cifra (Fuente, Supuesto, Tu dato) |
| `textos.ts` | Los textos en español y en inglés, y las fuentes de la configuración en inglés |
| `cartera.ts` | La cartera, armada en el build desde `src/data` (precio publicable y corte) |
| `enlace.ts` | El escenario en la dirección de la página, después del «#» |

Reglas:

- Una cifra con `verificado: false` nunca se etiqueta «Fuente»: sale como «Supuesto» (`etiquetaDe`). Si pasó su `proximaActualizacion`, la etiqueta lo dice (`porActualizar`).
- La etiqueta muestra `notaPublica`, nunca `nota`: `nota` es para quien mantiene la configuración.
- El resultado nunca se esconde detrás de un formulario. Los datos de contacto se piden solo para el plan en PDF y para «Quiero ayuda con mi crédito», con la casilla de autorización (Ley 1581) y el mismo texto de `ContactForm` (versión `2026-09-18`).
- El escenario (con el ingreso y los ahorros) va después del «#» de la dirección: no llega al servidor. En la consulta solo va lo que no es personal: `?p=slug` desde el botón «Simular cuota» de cada proyecto e inmueble, y las UTM.
- Para que el escenario tampoco llegue a la analítica (GA4 directo desde el 1-oct-2026, `docs/analitica/README.md`):
  - todo formulario del simulador lleva `action` explícito;
  - todo enlace saliente cuyo texto lleve el escenario (WhatsApp) llama a `sinClicSalienteDeGA4` en su `onClick`.

  GA4 manda la dirección sin el «#», pero el destino de un formulario sin `action` y el enlace de un clic saliente van completos (probado con `gtag.js` el 1-oct).
- La analítica recibe rangos, nunca cifras exactas. `generate_lead` es el evento que GTM convierte en «Lead»; `simulator_pdf_lead` y `simulator_prequal_lead` miden el embudo y no se deben mapear a «Lead» (se contaría dos veces).
- La renta corta solo se calcula para inmuebles con `rentaCorta` en `src/data` (hoy, Doral Suite y Doral Suites 320, según su constructor). Los demás usan renta tradicional.
- Los meses a la entrega de un proyecto en obra sin fecha publicada son el supuesto `mesesEntregaSupuesto`, marcado.
- El impuesto de registro de Bolívar es un supuesto hasta confirmarlo con la Gobernación.
- Mi Casa Ya y la cobertura FRECH quedan apagadas: `disponible: false`.
- Una fuente o nota nueva en la configuración necesita su traducción en `FUENTES_EN` (`textos.ts`); sin ella, la página en inglés la muestra en español.

## Mantenerlo al día

- **Una vez al año:** salario mínimo, UVT, topes VIS y VIP, y tarifas notariales y de registro (resoluciones de febrero).
- **Cada mes:** inflación (DANE) y tasas de crédito de vivienda.
- **Automatizable, como la TRM:**
  - la UVR, con el SDMX del Banco de la República;
  - las tasas, con los microdatos de la Superfinanciera en datos.gov.co (`qzsc-9esp`).
