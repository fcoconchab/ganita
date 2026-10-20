# Prompt de investigación: técnicas de cálculo mental que faltan

Copia todo lo que está bajo la línea y pégalo en una herramienta de investigación profunda (por ejemplo, Research en Claude). El resultado se usa para ampliar `src/content/techniques.json`.

---

## Contexto

Estoy construyendo **Ganita**, una app para iPhone que entrena cálculo mental desde cero hasta nivel de "calculadora humana". Es para mí primero, y después quizás para estudiantes de pruebas (PAES en Chile, GMAT, GRE, CAT de India) y profesionales de finanzas. No busco competir en campeonatos: busco calcular rápido y bien en la vida diaria, en entrevistas y en reuniones de negocios, incluso con millones, y poder hacer demostraciones que impresionen.

Ya tengo un catálogo de 122 técnicas en 15 ramas. Las ramas clasifican por mecanismo, los niveles van de N1 (fundamentos) a N5 (élite), y las escuelas (Védicas, Trachtenberg, Benjamin, Handley, Soroban, etc.) son etiquetas.

## Lo que ya está cubierto

- FUN Fundamentos: Tablas del 1 al 9; Tablas del 11 al 19; Complementos a 10 y a 100; Cuadrados del 1 al 32; Cubos del 1 al 10 y sus terminaciones; Recíprocos 1/2 a 1/20; Potencias de 2 hasta 2²⁰; Primos y factorizaciones engañosas; Logaritmos de 2, 3 y 7; Múltiplos ancla; Constantes útiles; Ternas pitagóricas
- MEM Memoria y representación: Decir los parciales en voz alta; Bloques de 3 dígitos; Notación rápida de ceros; Código fonético (Major System); Chisanbop (ábaco de dedos); Soroban y Anzan (ábaco mental); Flash Anzan
- MAG Magnitudes y números grandes: Escalera de nombres; Mantisa y potencia por separado; Dividir magnitudes; Per cápita y por unidad; Puntos base sobre montos grandes
- SUM Suma y resta: Izquierda a derecha; Agrupar decenas redondas; Compensación; Complemento: todos de 9, el último de 10; Contar hacia arriba; Base de referencia para listas; Suma por columnas con anticipación
- MUL Multiplicación: ×5, ×25, ×125; ×11 y ×101; ×9, ×99, ×999; Distributiva de izquierda a derecha; Compensación (método de resta); Factorización; Doblar y dividir; Diferencia de cuadrados; Base cercana (Nikhilam); Base de referencia (50, 200, 30…); Decenas iguales, unidades que suman 10; Decenas iguales (caso general); Multiplicación cruzada (Urdhva Tiryagbhyam); Reglas por dígito de Trachtenberg; Método general UT (unidades + decenas); 3 × 3 dígitos con parciales guardados; 8 × 8 dígitos; ×15 y ×1,5; Close-together (Benjamin)
- POT Cuadrados y potencias: Cuadrados terminados en 5; Arriba-abajo: (n+d)(n−d) + d²; Cuadrados cerca de 50; Cuadrados cerca de 100; Cuadrados de 3 y 4 dígitos; Dúplex (Dwandwa Yoga); Cubos por binomio; 3 dígitos terminados en 5; Último dígito de potencias
- DIV División y fracciones: División corta de izquierda a derecha; Por factores y cancelando; ÷5, ÷25, ÷125; Divisor terminado en 5; Reglas de divisibilidad; Fracción ↔ decimal ↔ %; ÷9 por sumas acumuladas; Séptimos cíclicos; División Flag (Dhvajanka); 1/19, 1/29… (Ekadhikena); Comparar fracciones en cruz
- RAI Raíces: Raíz de un cuadrado perfecto; Raíz cúbica de un cubo perfecto; Raíz quinta de una potencia perfecta; Linealización; Iteración de Newton; Raíz no exacta cifra a cifra; Raíces altas de números enormes
- LOG Logaritmos y exponenciales: Logaritmos por descomposición; Cifras de una potencia; ln y eˣ; Raíz n-ésima por logaritmos
- CAL Calendario: Doomsday (Conway); Código del año "Odd + 11"; Método de códigos
- EST Estimación: Dos cifras significativas; Redondeo compensado; Notación científica; 2¹⁰ ≈ 10³; Problemas de Fermi; (1 + x)ⁿ ≈ 1 + nx; Interpolación lineal
- VER Verificación: Último dígito; Cantidad de dígitos; Prueba del 9; Prueba del 11; Segunda vía; Adivinar el dígito escondido
- FIN Finanzas y negocio: Bloques de 10%, 5% y 1%; x% de y = y% de x; Cambios sucesivos: a + b + ab; Reglas del 72, 114 y 144; P/E ↔ rendimiento; Perpetuidad y Gordon; Tasa mensual ↔ anual; Crecimiento compuesto binomial; Tasa continua: ln(1 + r) ≈ r − r²/2; Margen vs markup; Subir y bajar no es simétrico; Rentabilidad anualizada; Rentabilidad real (Fisher)
- CHI Chile: UF, IVA y pesos: Agregar IVA (19%); Sacar el IVA; Propina y cuenta dividida; UF → pesos; Pesos → dólares; UF → dólares
- PRU Pruebas: PAES, GMAT, GRE: Fracciones ↔ decimales con múltiplos; Cancelar antes de multiplicar; Descartar alternativas; Promedio por desviaciones; Velocidad media (armónica); Porcentaje de un porcentaje

## Qué necesito

1. **Técnicas que no están en la lista.** Revisa como mínimo:
   - Los 16 sutras y 13 sub-sutras de Bharati Krishna Tirtha (*Vedic Mathematics*, 1965), con todas sus aplicaciones: división, ecuaciones, fracciones, cuadrados, cubos, raíces y verificación.
   - Las reglas completas del sistema Trachtenberg (×2 a ×12, división, suma con verificación, raíces).
   - Arthur Benjamin, *Secrets of Mental Math* (y su curso), Bill Handley, *Speed Mathematics*, Scott Flansburg y Shakuntala Devi.
   - Métodos de calculadores históricos (Wim Klein, Gert Mittring, Alexis Lemaire, Alberto Coto, Aaryan Shukla) y cómo entrenan los campeones del Mental Calculation World Cup.
   - Técnicas del soroban japonés y del ábaco chino (suanpan), incluidas resta, multiplicación, división y raíces en el ábaco.
   - Atajos de "speed maths" de India para exámenes (CAT, IBPS, SSC), que es donde se concentra la mayor cantidad de trucos publicados.
   - Atajos para GMAT, GRE y PAES (Matemática M1 y M2).
   - Cálculo mental aplicado a finanzas: valor presente, anualidades, cuotas de crédito, TIR aproximada, duración, múltiplos y conversión de tasas.
   - Trucos de "mentalismo matemático" para shows (cuadrados mágicos personalizados, raíces de potencias perfectas, calendario, adivinar números).
2. **Para cada técnica nueva**, entrega una fila con: nombre, rama (una de las 15 de arriba, o propón una nueva si de verdad no calza), nivel N1 a N5, explicación en una línea, **un ejemplo numérico resuelto**, escuela u origen, fuente concreta (libro con capítulo, o URL) y si sirve como show.
3. **Variantes que no agregan nada:** si una técnica es la misma que una de la lista con otro nombre, dilo en una tabla aparte ("X = Y con otro nombre"), en vez de listarla como nueva.
4. **Ciencia del aprendizaje aplicada a la aritmética:** qué dice la evidencia sobre fluidez de hechos aritméticos, práctica de recuperación, repaso espaciado, intercalado, efecto de la presión de tiempo y ansiedad matemática. Quiero saber qué tamaño de efecto tiene cada uno y cómo se implementa en una app (umbrales de tiempo de respuesta, intervalos de repaso, largo ideal de sesión). Cita estudios.
5. **Competencia:** apps de cálculo mental existentes (por ejemplo Elevate, Math Workout, Mental Math Pro, apps de soroban, Brilliant). Para cada una: qué enseñan, cómo retienen lo aprendido, qué hacen bien en diseño y qué les falta.

## Formato de entrega

- Tabla 1: técnicas nuevas (columnas del punto 2), ordenadas por rama.
- Tabla 2: duplicados con otro nombre.
- Sección 3: evidencia de aprendizaje con recomendaciones concretas para la app.
- Sección 4: comparación de apps.
- Marca con [verificar] todo ejemplo que no hayas podido comprobar con la fuente. Prefiero vacíos declarados a datos inventados.
- Escribe en español.
