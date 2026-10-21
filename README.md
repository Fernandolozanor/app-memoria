# 🧠 Memoria Viva — Ejercicios para la Mente

Aplicación web interactiva de **estimulación cognitiva y entrenamiento de la memoria**, diseñada especialmente para **personas mayores y personas con deterioro cognitivo leve**. 

Creada con foco en la **accesibilidad, cariño y sencillez**, ofrece una experiencia relajada, sin estrés ni temporizadores agresivos, con retroalimentación sonora alegre y locuciones de voz humana con pausas naturales.

---

## 🌸 Características principales

- **10 actividades cognitivas completas**:
  1. 🥖 **La Compra**: Estimulación de memoria a corto plazo recordando alimentos cotidianos de la cesta.
  2. ✨ **Parejas**: Juego de memoria visual emparejando cartas boca abajo.
  3. 📖 **Refranes**: Memoria semántica y lenguaje completando refranes y dichos populares de siempre.
  4. 🔍 **Buscar Objeto**: Atención y agudeza visual localizando el elemento diferente en rondas progresivas (6, 9 y 12 tarjetas).
  5. ❓ **El Intruso**: Categorización semántica y lógica identificando el elemento que no encaja en la familia.
  6. 🏠 **¿Dónde Estaba?**: Memoria espacial sobre un tablero fijo de 9 cartas con aparición y posición 100% aleatorias (3, 4 y 5 tarjetas volteadas).
  7. 🎹 **El Piano**: Memoria secuencial auditiva y visual reproduciendo secuencias musicales de colores con notas reales afinadas.
  8. 📋 **Primero y Después**: Razonamiento y secuenciación lógica ordenando tareas de la vida diaria (hacer la cama, preparar una infusión, la compra, etc.).
  9. 👥 **Caras y Nombres**: Memoria asociativa relacionando retratos diversos con sus nombres y aficiones.
  10. 🪙 **Las Monedas**: Habilidad numérica y cálculo con monedas de Euro reales (1€, 2€, 50c, 20c, 10c, 5c) sumando importes exactos.

- **Diseño 100% accesible (Zero-Scroll)**:
  - Ajuste en pantalla completa (`100dvh`) en cualquier teléfono móvil, tablet o PC sin desplazamiento vertical no deseado.
  - Tipografías grandes de alta legibilidad y botones táctiles amplios con bordes de alto contraste.
  - Sin cuenta atrás ni penalizaciones negativas.

- **Locución de voz natural y cálida (Web Speech API)**:
  - Pausas reales de respiración entre frases y signos de puntuación.
  - Entonación afectuosa y tranquila pensada para personas mayores.
  - Selector interactivo de voz en la cabecera para elegir la voz preferida instalada en el dispositivo (Laura, Helena, Google, etc.).
  - Pronunciación natural de precios y monedas (*"1 euro con 50 céntimos"*).

- **Efectos sonoros y celebración (Web Audio API & Confetti)**:
  - Melodías de notas de piano generadas por osciladores matemáticos.
  - Jingle alegre al completar actividades con animación de confeti.

---

## 🛠️ Tecnologías utilizadas

- **React 19**
- **TypeScript**
- **Vite**
- **Tailwind CSS v4**
- **Lucide Icons**
- **Canvas-Confetti**

---

## 🚀 Instalación y ejecución local

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/memoria-viva.git

# 2. Entrar a la carpeta del proyecto
cd memoria-viva

# 3. Instalar las dependencias
npm install

# 4. Iniciar el servidor de desarrollo
npm run dev
```

Abre en tu navegador `http://localhost:5173` para disfrutar de la aplicación.

---

## 📦 Compilación para producción

```bash
npm run build
```

Genera la carpeta `dist/` optimizada y lista para desplegar en plataformas como GitHub Pages, Vercel o Netlify.
