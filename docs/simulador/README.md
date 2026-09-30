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

## Reglas para la fase 4 (la página)

- Una cifra con `verificado: false` nunca se etiqueta «Fuente»: sale como «Supuesto» (`etiquetaDe`).
- Si pasó la `proximaActualizacion` de una cifra, la etiqueta lo dice (`porActualizar`).
- El impuesto de registro de Bolívar es un supuesto hasta confirmarlo con la Gobernación.
- Mi Casa Ya y la cobertura FRECH quedan apagadas: `disponible: false`.
- La página no pide datos personales para mostrar un resultado.

## Mantenerlo al día

- **Una vez al año:** salario mínimo, UVT, topes VIS y VIP, y tarifas notariales y de registro (resoluciones de febrero).
- **Cada mes:** inflación (DANE) y tasas de crédito de vivienda.
- **Automatizable, como la TRM:**
  - la UVR, con el SDMX del Banco de la República;
  - las tasas, con los microdatos de la Superfinanciera en datos.gov.co (`qzsc-9esp`).
