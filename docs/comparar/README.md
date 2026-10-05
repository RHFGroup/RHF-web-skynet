# El comparador de la cartera (`/comparar` y `/en/compare`)

5-oct-2026. Es la fase 5 del plan de los prompts de Luciano: «`/comparar`». Rafael lo pidió como un «Simulador Evaluador de Proyectos»: dos opciones lado a lado, un puntaje según el perfil del cliente y el factor que inclina la balanza.

## Las decisiones de Rafael (5-oct-2026)

| Pregunta | Respuesta |
|---|---|
| ¿Dónde vive? | En rhfliving.com, en `/comparar` |
| ¿Cómo entra el retorno o la plusvalía? | **Solo lo verificado.** No hay ROI, flujo de caja ni valorización: ninguna de esas cifras tiene hoy una fuente por proyecto |
| ¿Qué entra en el selector? | Dos selectores: uno para los proyectos y otro para las entregas inmediatas |

## El tablero «Versus» (5-oct-2026, segunda versión)

Rafael pidió combinar el comparador con un formato «Versus»: radar de 8 ejes, una tabla de «Mayores diferencias» y dos conclusiones, más corto y con mejores animaciones. Decidió tres cosas:

- **Los ejes:** los 8 criterios con dato, con sus nombres donde aplican: Precio de entrada, Plazo y entrega y Amenidades. ROI, ubicación, diseño, sustentabilidad y esquema de pagos no entran, porque no tienen fuente por proyecto.
- **El tema:** oscuro con la marca. La opción A va en azul neón (`#4cc9ff`) y la B en camel brillante (`#e8c48a`).
- **El orden:** el Versus va arriba y el resto (donas, escenarios, matriz y plazo) queda en «Ver el detalle completo».

Va en `src/components/comparar/Versus.tsx`:

- **Radar en SVG.** Crece desde el centro al entrar en pantalla y cambia con resorte. Al tocar o enfocar un eje, muestra las dos cifras.
- **«Mayores diferencias».** Hasta 6 métricas, ordenadas por lo contundente de la diferencia, con badges de ventaja como «−$213,5 M», «+1 alcoba» o «Entrega inmediata».
- **Las conclusiones.** Una para «Para invertir» y otra para «Para vivir», con el ganador y el criterio que más pesa.
- **Debajo de la tabla, los datos del 2.16.1 de cada opción:** precio con corte, área con etiqueta y ubicación. Así el precio nunca sale suelto, aunque el detalle esté plegado.

Con movimiento reducido, nada se anima.

## Los dos grupos

Las opciones salen de `src/data/proyectos.ts` y `src/data/inmuebles.ts` (`src/components/comparar/opciones.ts`). No se escriben a mano.

- **Sobre planos y en construcción:** los proyectos en lanzamiento o en obra, y los apartamentos en construcción.
- **Entrega inmediata:** los proyectos de entrega inmediata y los apartamentos terminados.

Un proyecto o un inmueble nuevo en la capa de datos entra solo, en el grupo que le toca por su estado.

## El puntaje

Lo calcula `src/lib/comparar/evaluar.ts`, que es puro y tiene sus pruebas (`npm test`).

| Criterio | Cómo se puntúa (0 a 100) | Invertir | Vivir | Las dos |
|---|---|---|---|---|
| Precio de entrada | El precio desde publicable. El menor de los dos vale 100; el otro, en proporción | 30 | 10 | 20 |
| Cuándo lo usas | Entrega inmediata 100 · fecha publicada 60 · sin fecha 25 | 25 | 10 | 15 |
| Renta corta documentada | 100 con fuente escrita · 0 sin ella | 25 | — | 10 |
| Alcobas | La opción más grande. La mayor vale 100 | — | 25 | 15 |
| Espacio exterior propio | Lote o patio 100 · terraza 70 · balcón 40 | — | 15 | 10 |
| Parqueadero | Privado o de uso exclusivo 100 · sin precisar 70 · comunal 40 | — | 15 | 10 |
| Zonas comunes | Las que lista la fuente. La que más tiene vale 100 | — | 15 | 10 |
| Información documentada | Cinco datos de 20: precio publicable, ubicación exacta, área sin contradicciones, entrega y parqueadero | 20 | 10 | 10 |

- **Sin dato, cuenta cero** para esa opción, y la página lo dice («Sin dato»). La falta de información también pesa en una decisión.
- **Un criterio sin dato en las dos** sale de la cuenta, y los demás se reparten su peso.
- **El factor decisivo** es el criterio que más puntos le saca la ganadora a la otra. El **contrapeso** es el que más pesa a favor de la que pierde. Nunca se presenta como decisivo un criterio que favorece a la que pierde.
- **Los escenarios** usan solo sus criterios. «Invertir»: precio, entrega, renta corta e información. «Vivir»: alcobas, exterior, parqueadero y zonas comunes.

## Lo que la página calcula con las reglas vigentes

Salen de `src/data/simulador.config.json`, las mismas cifras del simulador:

- **Cuota inicial mínima con crédito:** el 30 % del precio desde, porque el tope No VIS es el 70 % (Decreto 1077 de 2015, art. 2.1.11.1, lit. a). Todos los precios de la cartera están por encima del tope VIS.
- **Ingreso del hogar que pide el banco:** la primera cuota no puede pasar del 40 % (Decreto 583 de 2025). Es crédito en pesos a 20 años, con la tasa `tasaNoVISPesos` y sin seguros.
- **Precio por m² de la opción base:** el precio desde dividido entre el área de esa tipología. Solo sale si el área es una sola cifra y las fuentes del proyecto no se contradicen en el área. Lleva siempre la etiqueta literal de la fuente.

## Lo que no hace, a propósito

- **No proyecta renta, retorno ni valorización.** «Se va a valorizar un X %» es frase prohibida, y lo que se publica obliga (Ley 1480, arts. 29 y 30). Para quien quiera hacer la cuenta de renta corta con sus supuestos, el enlace lleva al simulador (`/simulador?p=slug`).
- **No califica la ubicación.** Muestra la ubicación publicada con su fuente.
- **No pide datos personales.** La elección queda en el «#» (`#g=planos&a=…&b=…&perfil=…`). La consulta solo lleva `?p=slug`, que es el enlace que ponen las fichas de proyecto e inmueble.

## Analítica

Van a `dataLayer`, como el resto del sitio, solo con cookies aceptadas:

- `comparator_view` (`entrada`);
- `comparator_change` (`grupo`, `opcion_a`, `opcion_b`, `perfil`).

No llevan datos personales.

## Las gráficas

Están en `src/components/comparar/Graficas.tsx`, en canvas y SVG propios, sin librerías nuevas. Toman la idea de cuatro componentes de 21st.dev que pasó Rafael, no su código:

- **dither-donut-chart** → `DonaDither`: el puntaje en un anillo con trama Bayer de 4×4, con resorte;
- **stacked-diverging-bar** → `BarrasDivergentes`;
- **area-chart-2** → `AreaPlazo`: el ingreso requerido de 5 a 30 años;
- **value-columns** → `Columnas`.

Con movimiento reducido (sistema o preferencia del pie, `src/lib/motion.ts`), nada se anima.

## Si cambia un dato

- **Un precio, un corte o una tipología:** se cambia en `proyectos.ts` o `inmuebles.ts`. El comparador lo toma en el próximo build.
- **Un peso o una regla de puntaje:** se cambia en `evaluar.ts`, junto con esta tabla, la de `textos.ts` y las pruebas.
