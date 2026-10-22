import { useState, useEffect, useRef } from 'react'
import { sound } from '../services/sound'
import { speech } from '../services/speech'
import { SuccessCelebration } from '../components/SuccessCelebration'
import { pickRandom, STEP_ORDER_VOICES } from '../services/voiceFeedback'

interface Props {
  onComplete: () => void
  onExit: () => void
}

interface RoutineTask {
  id: string
  title: string
  steps: { id: number; text: string; icon: string; order: number }[]
}

const STORAGE_KEY = 'memoria_viva_recent_step_order'

function getRecentTaskIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveRecentTaskIds(newIds: string[]) {
  try {
    const current = getRecentTaskIds()
    // Keep last 15 task IDs to avoid repeating across multiple games
    const combined = Array.from(new Set([...newIds, ...current])).slice(0, 15)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(combined))
  } catch {
    // Ignore storage errors
  }
}

// POOL 1: 15 diverse 3-step tasks (Round 1)
const TASKS_3_STEPS: RoutineTask[] = [
  {
    id: 'cafe-3',
    title: 'Hacer una taza de café',
    steps: [
      { id: 1, text: 'Poner el café y el agua en la cafetera', icon: '☕', order: 1 },
      { id: 2, text: 'Ponerla al fuego para calentarla', icon: '🔥', order: 2 },
      { id: 3, text: 'Servir en la taza y disfrutar', icon: '😋', order: 3 },
    ],
  },
  {
    id: 'dientes-3',
    title: 'Lavarse los dientes',
    steps: [
      { id: 1, text: 'Poner pasta en el cepillo', icon: '🪥', order: 1 },
      { id: 2, text: 'Cepillarse bien los dientes', icon: '🦷', order: 2 },
      { id: 3, text: 'Enjuagarse la boca con agua limpia', icon: '💧', order: 3 },
    ],
  },
  {
    id: 'platano-3',
    title: 'Comer un plátano',
    steps: [
      { id: 1, text: 'Coger el plátano del frutero', icon: '🍌', order: 1 },
      { id: 2, text: 'Quitarle la piel con las manos', icon: '👐', order: 2 },
      { id: 3, text: 'Comerlo a bocados ricos', icon: '😋', order: 3 },
    ],
  },
  {
    id: 'regar-3',
    title: 'Regar una maceta con flores',
    steps: [
      { id: 1, text: 'Llenar la regadera con agua', icon: '🚿', order: 1 },
      { id: 2, text: 'Echar agua en la tierra de la planta', icon: '🪴', order: 2 },
      { id: 3, text: 'Ver cómo florece bonita', icon: '🌸', order: 3 },
    ],
  },
  {
    id: 'postal-3',
    title: 'Escribir y enviar una postal',
    steps: [
      { id: 1, text: 'Escribir un saludo cariñoso', icon: '✍️', order: 1 },
      { id: 2, text: 'Meter la postal dentro del sobre', icon: '✉️', order: 2 },
      { id: 3, text: 'Echar la carta al buzón de correos', icon: '📮', order: 3 },
    ],
  },
  {
    id: 'naranja-3',
    title: 'Pelar y saborear una naranja',
    steps: [
      { id: 1, text: 'Coger una naranja fresca', icon: '🍊', order: 1 },
      { id: 2, text: 'Pelar la cáscara poco a poco', icon: '🔪', order: 2 },
      { id: 3, text: 'Comer los gajos jugosos', icon: '😋', order: 3 },
    ],
  },
  {
    id: 'zapatos-3',
    title: 'Ponerse los zapatos',
    steps: [
      { id: 1, text: 'Ponerse primero los calcetines', icon: '🧦', order: 1 },
      { id: 2, text: 'Meter los pies en los zapatos', icon: '👞', order: 2 },
      { id: 3, text: 'Atar los cordones con cuidado', icon: '👟', order: 3 },
    ],
  },
  {
    id: 'radio-3',
    title: 'Escuchar la radio',
    steps: [
      { id: 1, text: 'Acercarse al aparato de radio', icon: '📻', order: 1 },
      { id: 2, text: 'Pulsar el botón de encendido', icon: '🔘', order: 2 },
      { id: 3, text: 'Escuchar las noticias o la música', icon: '🎵', order: 3 },
    ],
  },
  {
    id: 'manos-3',
    title: 'Lavarse las manos',
    steps: [
      { id: 1, text: 'Mojarse las manos y enjabonarse', icon: '🧼', order: 1 },
      { id: 2, text: 'Frotar bien entre los dedos', icon: '👐', order: 2 },
      { id: 3, text: 'Secarse con la toalla limpia', icon: '🧺', order: 3 },
    ],
  },
  {
    id: 'yogur-3',
    title: 'Comer un yogur',
    steps: [
      { id: 1, text: 'Sacar el yogur del frigorífico', icon: '🍶', order: 1 },
      { id: 2, text: 'Quitar la tapa con cuidado', icon: '🥄', order: 2 },
      { id: 3, text: 'Comerlo despacio con la cuchara', icon: '😋', order: 3 },
    ],
  },
  {
    id: 'buzon-3',
    title: 'Recoger las cartas del buzón',
    steps: [
      { id: 1, text: 'Bajar al portal con la llave', icon: '🗝️', order: 1 },
      { id: 2, text: 'Abrir el buzón de la pared', icon: '📬', order: 2 },
      { id: 3, text: 'Subir las cartas a casa', icon: '✉️', order: 3 },
    ],
  },
  {
    id: 'noche-3',
    title: 'Cerrar la casa antes de dormir',
    steps: [
      { id: 1, text: 'Apagar las luces de la casa', icon: '💡', order: 1 },
      { id: 2, text: 'Echar la llave a la puerta', icon: '🚪', order: 2 },
      { id: 3, text: 'Meterse en la cama a descansar', icon: '🛏️', order: 3 },
    ],
  },
  {
    id: 'agua-3',
    title: 'Servirse un vaso de agua',
    steps: [
      { id: 1, text: 'Coger la botella de la mesa', icon: '🧴', order: 1 },
      { id: 2, text: 'Girar el tapón para abrirla', icon: '🔄', order: 2 },
      { id: 3, text: 'Llenar el vaso de agua fresca', icon: '🥛', order: 3 },
    ],
  },
  {
    id: 'barrer-3',
    title: 'Barrer el suelo',
    steps: [
      { id: 1, text: 'Coger la escoba y el recogedor', icon: '🧹', order: 1 },
      { id: 2, text: 'Juntar el polvo en un montón', icon: '🏠', order: 2 },
      { id: 3, text: 'Tirar la suciedad a la papelera', icon: '🗑️', order: 3 },
    ],
  },
  {
    id: 'periodico-3',
    title: 'Leer el periódico matinal',
    steps: [
      { id: 1, text: 'Abrir el periódico en la mesa', icon: '📰', order: 1 },
      { id: 2, text: 'Ponerse las gafas de leer', icon: '👓', order: 2 },
      { id: 3, text: 'Leer las noticias con calma', icon: '☕', order: 3 },
    ],
  },
]

// POOL 2: 15 diverse 4-step tasks (Round 2)
const TASKS_4_STEPS: RoutineTask[] = [
  {
    id: 'tostada-4',
    title: 'Hacer una tostada con aceite y tomate',
    steps: [
      { id: 1, text: 'Cortar una rebanada de pan crujiente', icon: '🥖', order: 1 },
      { id: 2, text: 'Poner el pan en la tostadora', icon: '🍞', order: 2 },
      { id: 3, text: 'Untar tomate y un chorrito de aceite', icon: '🍅', order: 3 },
      { id: 4, text: 'Disfrutar del desayuno en la mesa', icon: '😋', order: 4 },
    ],
  },
  {
    id: 'platos-4',
    title: 'Lavar los platos a mano',
    steps: [
      { id: 1, text: 'Poner jabón en el estropajo', icon: '🧼', order: 1 },
      { id: 2, text: 'Frotar bien el plato con espuma', icon: '🍽️', order: 2 },
      { id: 3, text: 'Aclarar con agua limpia', icon: '💧', order: 3 },
      { id: 4, text: 'Secar con el paño de cocina', icon: '🧺', order: 4 },
    ],
  },
  {
    id: 'ensalada-4',
    title: 'Preparar una ensalada fresca',
    steps: [
      { id: 1, text: 'Lavar la lechuga y el tomate', icon: '🥬', order: 1 },
      { id: 2, text: 'Cortar todo en trozos en el bol', icon: '🔪', order: 2 },
      { id: 3, text: 'Aliñar con aceite, vinagre y sal', icon: '🧂', order: 3 },
      { id: 4, text: 'Mezclar bien y servir en la mesa', icon: '🥗', order: 4 },
    ],
  },
  {
    id: 'cama-4',
    title: 'Hacer la cama por la mañana',
    steps: [
      { id: 1, text: 'Estirar bien la sábana con las manos', icon: '🛏️', order: 1 },
      { id: 2, text: 'Colocar la colcha o manta lisa', icon: '🛋️', order: 2 },
      { id: 3, text: 'Sacudir y colocar la almohada', icon: '🛌', order: 3 },
      { id: 4, text: 'Dejar el dormitorio bien recogido', icon: '✨', order: 4 },
    ],
  },
  {
    id: 'lavadora-4',
    title: 'Poner la lavadora',
    steps: [
      { id: 1, text: 'Meter la ropa sucia en el tambor', icon: '👕', order: 1 },
      { id: 2, text: 'Echar el detergente en el cajetín', icon: '🧴', order: 2 },
      { id: 3, text: 'Cerrar la puerta y pulsar inicio', icon: '🔘', order: 3 },
      { id: 4, text: 'Tender la colada limpia al sol', icon: '☀️', order: 4 },
    ],
  },
  {
    id: 'infusion-4',
    title: 'Tomar una infusión de manzanilla',
    steps: [
      { id: 1, text: 'Poner agua a hervir en el cazo', icon: '🫖', order: 1 },
      { id: 2, text: 'Meter la bolsita de infusión en la taza', icon: '☕', order: 2 },
      { id: 3, text: 'Dejar reposar tres minutos', icon: '⏳', order: 3 },
      { id: 4, text: 'Endulzar con una cucharadita de miel', icon: '🍯', order: 4 },
    ],
  },
  {
    id: 'perro-4',
    title: 'Asear al perro con cariño',
    steps: [
      { id: 1, text: 'Preparar agua tibia y champú suave', icon: '🛁', order: 1 },
      { id: 2, text: 'Enjabonar el pelaje con suavidad', icon: '🐕', order: 2 },
      { id: 3, text: 'Aclarar con abundante agua', icon: '🚿', order: 3 },
      { id: 4, text: 'Secarlo bien con una toalla grande', icon: '🧺', order: 4 },
    ],
  },
  {
    id: 'planchar-4',
    title: 'Planchar una camisa',
    steps: [
      { id: 1, text: 'Abrir la tabla de planchar', icon: '🪵', order: 1 },
      { id: 2, text: 'Llenar la plancha con un poco de agua', icon: '💧', order: 2 },
      { id: 3, text: 'Pasar la plancha tibia por la tela', icon: '👔', order: 3 },
      { id: 4, text: 'Colgar la camisa en una percha', icon: '🪝', order: 4 },
    ],
  },
  {
    id: 'huevos-4',
    title: 'Cocer unos huevos duros',
    steps: [
      { id: 1, text: 'Poner agua en un cazo al fuego', icon: '🫖', order: 1 },
      { id: 2, text: 'Meter los huevos con una cuchara', icon: '🥚', order: 2 },
      { id: 3, text: 'Dejar hervir diez minutos', icon: '⏱️', order: 3 },
      { id: 4, text: 'Enfriar con agua y pelar la cáscara', icon: '🍽️', order: 4 },
    ],
  },
  {
    id: 'panaderia-4',
    title: 'Comprar pan en la panadería',
    steps: [
      { id: 1, text: 'Coger la bolsa de tela y las monedas', icon: '🪙', order: 1 },
      { id: 2, text: 'Caminar hasta la panadería del barrio', icon: '🚶', order: 2 },
      { id: 3, text: 'Pedir la barra de pan caliente', icon: '🥖', order: 3 },
      { id: 4, text: 'Regresar a casa con el pan crujiente', icon: '🏠', order: 4 },
    ],
  },
  {
    id: 'arreglarse-4',
    title: 'Arreglarse para salir',
    steps: [
      { id: 1, text: 'Lavarse la cara y peinarse el pelo', icon: '🪮', order: 1 },
      { id: 2, text: 'Ponerse ropa limpia y cómoda', icon: '👕', order: 2 },
      { id: 3, text: 'Ponerse el reloj en la muñeca', icon: '⏰', order: 3 },
      { id: 4, text: 'Echarse unas gotitas de colonia', icon: '🌸', order: 4 },
    ],
  },
  {
    id: 'medicina-4',
    title: 'Tomar la pastilla del día',
    steps: [
      { id: 1, text: 'Mirar el pastillero semanal', icon: '📋', order: 1 },
      { id: 2, text: 'Sacar la pastilla que corresponde', icon: '💊', order: 2 },
      { id: 3, text: 'Llenar un vaso con agua', icon: '🥛', order: 3 },
      { id: 4, text: 'Tomar la pastilla con el agua', icon: '💧', order: 4 },
    ],
  },
  {
    id: 'polvo-4',
    title: 'Limpiar el polvo de los muebles',
    steps: [
      { id: 1, text: 'Coger un paño suave o plumero', icon: '🪶', order: 1 },
      { id: 2, text: 'Retirar los adornos con cuidado', icon: '🖼️', order: 2 },
      { id: 3, text: 'Pasar el paño por toda la superficie', icon: '🪑', order: 3 },
      { id: 4, text: 'Volver a colocar las cosas en su sitio', icon: '✨', order: 4 },
    ],
  },
  {
    id: 'compra-4',
    title: 'Guardar la compra del mercado',
    steps: [
      { id: 1, text: 'Sacar los paquetes de las bolsas', icon: '🛍️', order: 1 },
      { id: 2, text: 'Colocar la fruta fresca en el frutero', icon: '🍎', order: 2 },
      { id: 3, text: 'Meter la leche y el queso en la nevera', icon: '🧀', order: 3 },
      { id: 4, text: 'Plegar las bolsas para la próxima vez', icon: '🧺', order: 4 },
    ],
  },
  {
    id: 'zumo-4',
    title: 'Hacer zumo de naranja natural',
    steps: [
      { id: 1, text: 'Cortar las naranjas por la mitad', icon: '🍊', order: 1 },
      { id: 2, text: 'Colocar la mitad sobre el exprimidor', icon: '🍋', order: 2 },
      { id: 3, text: 'Apretar para sacar todo el zumo', icon: '🧃', order: 3 },
      { id: 4, text: 'Servir en un vaso y beber recién hecho', icon: '😋', order: 4 },
    ],
  },
]

// POOL 3: 15 diverse 5-step tasks (Round 3)
const TASKS_5_STEPS: RoutineTask[] = [
  {
    id: 'tortilla-5',
    title: 'Preparar una tortilla francesa',
    steps: [
      { id: 1, text: 'Sacar los huevos de la huevera', icon: '🥚', order: 1 },
      { id: 2, text: 'Cascar y batir los huevos en el plato', icon: '🥣', order: 2 },
      { id: 3, text: 'Echar una pizca de sal', icon: '🧂', order: 3 },
      { id: 4, text: 'Cuajar en la sartén caliente', icon: '🍳', order: 4 },
      { id: 5, text: 'Servir la tortilla doradita en el plato', icon: '🍽️', order: 5 },
    ],
  },
  {
    id: 'paseo-5',
    title: 'Salir a pasear abrigado',
    steps: [
      { id: 1, text: 'Ponerse unos zapatos cómodos', icon: '👟', order: 1 },
      { id: 2, text: 'Ponerse la chaqueta o abrigo', icon: '🧥', order: 2 },
      { id: 3, text: 'Coger las llaves de casa y el bastón', icon: '🗝️', order: 3 },
      { id: 4, text: 'Abrir la puerta y salir a la calle', icon: '🚪', order: 4 },
      { id: 5, text: 'Disfrutar del paseo y del aire fresco', icon: '🌳', order: 5 },
    ],
  },
  {
    id: 'planta-5',
    title: 'Plantar una flor en una maceta',
    steps: [
      { id: 1, text: 'Coger una maceta limpia', icon: '🪴', order: 1 },
      { id: 2, text: 'Echar tierra fértil hasta la mitad', icon: '🪨', order: 2 },
      { id: 3, text: 'Colocar la planta en el centro', icon: '🌱', order: 3 },
      { id: 4, text: 'Cubrir con más tierra alrededor', icon: '🧤', order: 4 },
      { id: 5, text: 'Regar suavemente con agua', icon: '💧', order: 5 },
    ],
  },
  {
    id: 'mesa-5',
    title: 'Poner la mesa para comer',
    steps: [
      { id: 1, text: 'Extender el mantel sobre la mesa', icon: '🏁', order: 1 },
      { id: 2, text: 'Poner los platos llanos y hondos', icon: '🍽️', order: 2 },
      { id: 3, text: 'Colocar los tenedores y cucharas', icon: '🍴', order: 3 },
      { id: 4, text: 'Poner los vasos y la jarra de agua', icon: '🥛', order: 4 },
      { id: 5, text: 'Sentarse a comer con alegría', icon: '😋', order: 5 },
    ],
  },
  {
    id: 'sopa-5',
    title: 'Preparar una sopa casera caliente',
    steps: [
      { id: 1, text: 'Poner el caldo a calentar en la olla', icon: '🍲', order: 1 },
      { id: 2, text: 'Esperar a que empiece a hervir', icon: '🔥', order: 2 },
      { id: 3, text: 'Echar un puñado de fideos finos', icon: '🍜', order: 3 },
      { id: 4, text: 'Dejar cocer removiendo con la cuchara', icon: '🥄', order: 4 },
      { id: 5, text: 'Servir la sopa bien calentita', icon: '🥣', order: 5 },
    ],
  },
  {
    id: 'super-5',
    title: 'Hacer la compra en el supermercado',
    steps: [
      { id: 1, text: 'Escribir la lista en un papel', icon: '📝', order: 1 },
      { id: 2, text: 'Coger el carrito de la compra', icon: '🛒', order: 2 },
      { id: 3, text: 'Elegir los alimentos de las estanterías', icon: '🧺', order: 3 },
      { id: 4, text: 'Pasar por caja y pagar la cuenta', icon: '💶', order: 4 },
      { id: 5, text: 'Guardar todo en las bolsas y volver a casa', icon: '🏠', order: 5 },
    ],
  },
  {
    id: 'bano-5',
    title: 'Preparar un baño relajante',
    steps: [
      { id: 1, text: 'Comprobar que el agua sale tibia', icon: '🚿', order: 1 },
      { id: 2, text: 'Llenar la bañera o abrir la ducha', icon: '🛁', order: 2 },
      { id: 3, text: 'Dejar una toalla limpia a mano', icon: '🧺', order: 3 },
      { id: 4, text: 'Enjabonarse con calma y aclarar bien', icon: '🧼', order: 4 },
      { id: 5, text: 'Secarse despacio y ponerse ropa limpia', icon: '🧖', order: 5 },
    ],
  },
  {
    id: 'bizcocho-5',
    title: 'Hacer un bizcocho casero',
    steps: [
      { id: 1, text: 'Mezclar harina, huevos, yogur y azúcar', icon: '🥣', order: 1 },
      { id: 2, text: 'Remover hasta que no queden grumos', icon: '🥄', order: 2 },
      { id: 3, text: 'Untar el molde con mantequilla', icon: '🧈', order: 3 },
      { id: 4, text: 'Hornear hasta que quede doradito', icon: '🥧', order: 4 },
      { id: 5, text: 'Dejar enfriar y espolvorear canela', icon: '😋', order: 5 },
    ],
  },
  {
    id: 'jardin-5',
    title: 'Cuidar las plantas de la terraza',
    steps: [
      { id: 1, text: 'Ponerse los guantes de jardinería', icon: '🧤', order: 1 },
      { id: 2, text: 'Quitar las hojas secas con las manos', icon: '🍂', order: 2 },
      { id: 3, text: 'Remover la tierra de las macetas', icon: '🪴', order: 3 },
      { id: 4, text: 'Regar cada planta con la regadera', icon: '🚿', order: 4 },
      { id: 5, text: 'Barrer las hojas caídas del suelo', icon: '✨', order: 5 },
    ],
  },
  {
    id: 'merienda-5',
    title: 'Organizar una merienda con visitas',
    steps: [
      { id: 1, text: 'Poner unas tazas bonitas en la mesa', icon: '☕', order: 1 },
      { id: 2, text: 'Sacar una bandeja con pastas y galletas', icon: '🍪', order: 2 },
      { id: 3, text: 'Calentar el café con leche recién hecho', icon: '🫖', order: 3 },
      { id: 4, text: 'Abrir la puerta y recibir las visitas', icon: '🚪', order: 4 },
      { id: 5, text: 'Conversar alegremente merendando', icon: '🍰', order: 5 },
    ],
  },
  {
    id: 'lavavajillas-5',
    title: 'Poner y recoger el lavavajillas',
    steps: [
      { id: 1, text: 'Quitar restos de comida de los platos', icon: '🗑️', order: 1 },
      { id: 2, text: 'Colocar platos y vasos en las bandejas', icon: '🍽️', order: 2 },
      { id: 3, text: 'Meter la pastilla de detergente', icon: '🧼', order: 3 },
      { id: 4, text: 'Pulsar el botón de inicio del lavado', icon: '🔘', order: 4 },
      { id: 5, text: 'Guardar toda la vajilla limpia en el armario', icon: '🪑', order: 5 },
    ],
  },
  {
    id: 'caldo-5',
    title: 'Cocinar un caldo de verduras',
    steps: [
      { id: 1, text: 'Pelar y trocear zanahorias y puerro', icon: '🥕', order: 1 },
      { id: 2, text: 'Llenar una olla grande con agua', icon: '🫖', order: 2 },
      { id: 3, text: 'Meter las verduras y una pizca de sal', icon: '🧂', order: 3 },
      { id: 4, text: 'Cocer a fuego lento durante una hora', icon: '🔥', order: 4 },
      { id: 5, text: 'Colar el caldo sabroso para la cena', icon: '🥣', order: 5 },
    ],
  },
  {
    id: 'boton-5',
    title: 'Coser un botón a una camisa',
    steps: [
      { id: 1, text: 'Enhebrar el hilo en la aguja', icon: '🪡', order: 1 },
      { id: 2, text: 'Colocar el botón en su posición', icon: '🔘', order: 2 },
      { id: 3, text: 'Pasar la aguja varias veces por los agujeros', icon: '🧵', order: 3 },
      { id: 4, text: 'Hacer un nudo fuerte y cortar el hilo', icon: '✂️', order: 4 },
      { id: 5, text: 'Comprobar que la camisa abrocha bien', icon: '👔', order: 5 },
    ],
  },
  {
    id: 'macedonia-5',
    title: 'Preparar una macedonia de frutas',
    steps: [
      { id: 1, text: 'Pelar manzanas, plátanos y naranjas', icon: '🍊', order: 1 },
      { id: 2, text: 'Cortar la fruta en trocitos pequeños', icon: '🔪', order: 2 },
      { id: 3, text: 'Echar todos los trozos en una fuente', icon: '🥣', order: 3 },
      { id: 4, text: 'Regar con un chorrito de zumo de naranja', icon: '🍋', order: 4 },
      { id: 5, text: 'Dejar enfriar en la nevera antes de comer', icon: '😋', order: 5 },
    ],
  },
  {
    id: 'reciclar-5',
    title: 'Bajar la basura y reciclar',
    steps: [
      { id: 1, text: 'Atar bien las bolsas de basura', icon: '🗑️', order: 1 },
      { id: 2, text: 'Separar el papel y los envases', icon: '♻️', order: 2 },
      { id: 3, text: 'Bajar a la calle abrigado', icon: '🚶', order: 3 },
      { id: 4, text: 'Meter cada bolsa en su contenedor', icon: '🛢️', order: 4 },
      { id: 5, text: 'Subir a casa y lavarse las manos con jabón', icon: '🧼', order: 5 },
    ],
  },
]

// Pick a task from pool prioritizing tasks not played recently
function pickNonRecentTask(pool: RoutineTask[], recentIds: string[]): RoutineTask {
  const fresh = pool.filter((t) => !recentIds.includes(t.id))
  const candidatePool = fresh.length > 0 ? fresh : pool
  return candidatePool[Math.floor(Math.random() * candidatePool.length)]
}

function selectSessionTasks(): RoutineTask[] {
  const recentIds = getRecentTaskIds()
  const task1 = pickNonRecentTask(TASKS_3_STEPS, recentIds)
  const task2 = pickNonRecentTask(TASKS_4_STEPS, recentIds)
  const task3 = pickNonRecentTask(TASKS_5_STEPS, recentIds)

  // Persist the chosen task IDs to localStorage
  saveRecentTaskIds([task1.id, task2.id, task3.id])

  return [task1, task2, task3]
}

export function StepOrder({ onComplete, onExit }: Props) {
  const [roundIdx, setRoundIdx] = useState(0) // 0: 3 steps, 1: 4 steps, 2: 5 steps
  const [selectedTasks, setSelectedTasks] = useState<RoutineTask[]>(selectSessionTasks)
  const [currentStepTarget, setCurrentStepTarget] = useState(1)
  const [orderedStepIds, setOrderedStepIds] = useState<number[]>([])
  const [displaySteps, setDisplaySteps] = useState<RoutineTask['steps']>([])
  const [feedback, setFeedback] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const isAdvancingRef = useRef(false)

  // Configure steps and speech whenever roundIdx or selectedTasks change
  useEffect(() => {
    const task = selectedTasks[roundIdx]
    if (!task) return

    isAdvancingRef.current = false
    const shuffled = [...task.steps].sort(() => 0.5 - Math.random())
    setDisplaySteps(shuffled)
    setOrderedStepIds([])
    setCurrentStepTarget(1)
    setFeedback('')
    setIsSuccess(false)

    const timer = setTimeout(() => {
      const introVoice = pickRandom(STEP_ORDER_VOICES.firstStep)(task.title)
      speech.speak(introVoice)
    }, 250)

    return () => {
      clearTimeout(timer)
      speech.stop()
    }
  }, [roundIdx, selectedTasks])

  const initGame = () => {
    const freshTasks = selectSessionTasks()
    setSelectedTasks(freshTasks)
    setRoundIdx(0)
    setIsSuccess(false)
  }

  const currentTask = selectedTasks[roundIdx] || selectedTasks[0]

  const handleStepClick = (step: RoutineTask['steps'][0]) => {
    if (!currentTask || isAdvancingRef.current) return
    sound.playTap()

    if (step.order === currentStepTarget) {
      sound.playSuccess()
      const newOrdered = [...orderedStepIds, step.id]
      setOrderedStepIds(newOrdered)
      const nextTarget = currentStepTarget + 1
      setCurrentStepTarget(nextTarget)

      if (nextTarget > currentTask.steps.length) {
        // Finished current task
        isAdvancingRef.current = true
        setFeedback('¡Muy bien!')

        let hasAdv = false
        const advance = () => {
          if (hasAdv) return
          hasAdv = true
          setTimeout(() => {
            if (roundIdx + 1 < selectedTasks.length) {
              setRoundIdx((prev) => prev + 1)
            } else {
              setIsSuccess(true)
              onComplete()
            }
          }, 500)
        }

        const completedVoice = pickRandom(STEP_ORDER_VOICES.completed)
        const completedDuration = speech.estimateDurationMs(completedVoice)
        speech.speak(completedVoice, advance)
        setTimeout(advance, completedDuration + 2500)
      } else {
        const nextPrompt = pickRandom(STEP_ORDER_VOICES.nextStep)(nextTarget)
        setFeedback(nextPrompt)
        speech.speak(nextPrompt)
      }
    } else {
      sound.playGentleRetry()
      const wrongMsg = pickRandom(STEP_ORDER_VOICES.wrong)
      setFeedback(wrongMsg)
      speech.speak(wrongMsg)
    }
  }

  if (!currentTask) return null

  const promptText =
    currentStepTarget === 1
      ? '¿Qué hacemos PRIMERO?'
      : currentStepTarget === currentTask.steps.length
      ? '¿Qué hacemos AL FINAL?'
      : '¿Qué hacemos DESPUÉS?'

  return (
    <div className="flex-1 flex flex-col justify-between w-full max-w-2xl mx-auto overflow-hidden h-full">
      {/* Top bar */}
      <div className="flex items-center justify-center bg-white rounded-2xl sm:rounded-3xl p-2 sm:p-3.5 border-2 sm:border-3 border-cyan-300 mb-1.5 sm:mb-3 shadow-xs shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="font-black text-stone-900 text-base sm:text-2xl">Ronda:</span>
          <span className="px-3 sm:px-4 py-1 sm:py-1.5 bg-cyan-100 text-cyan-950 font-black rounded-xl sm:rounded-2xl text-base sm:text-2xl">
            {roundIdx + 1} de 3 ({currentTask.steps.length} pasos)
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between bg-white border-3 sm:border-4 border-cyan-400 rounded-2xl sm:rounded-3xl p-2.5 sm:p-7 shadow-md text-center min-h-0 overflow-hidden">
        <div className="shrink-0">
          <h3 className="text-lg sm:text-2xl font-black text-cyan-950 mb-0.5 sm:mb-2 leading-tight break-words">
            {currentTask.title}
          </h3>

          <div className="bg-cyan-50 border-2 sm:border-3 border-cyan-300 rounded-xl sm:rounded-2xl p-1.5 sm:p-3 my-1 sm:my-2">
            <p className="font-black text-cyan-950 text-lg sm:text-2xl">
              {promptText}
            </p>
          </div>
        </div>

        {feedback && (
          <div className="p-1.5 sm:p-3 rounded-xl sm:rounded-2xl bg-amber-100 border-2 border-amber-400 text-amber-950 font-black text-sm sm:text-xl mb-1 sm:mb-3 animate-in fade-in shrink-0">
            {feedback}
          </div>
        )}

        {/* Steps buttons - Flexible list filling available height */}
        <div className="flex flex-col gap-2 sm:gap-3 w-full flex-1 min-h-0 justify-between">
          {displaySteps.map((step) => {
            const isCompleted = orderedStepIds.includes(step.id)

            return (
              <button
                key={step.id}
                disabled={isCompleted}
                onClick={() => handleStepClick(step)}
                className={`w-full p-3 sm:p-5 rounded-2xl sm:rounded-3xl border-3 sm:border-4 flex items-center gap-3 sm:gap-5 text-left font-black transition-all flex-1 min-h-0 ${
                  isCompleted
                    ? 'bg-emerald-100 border-emerald-500 opacity-60 cursor-default ring-2 ring-emerald-300'
                    : 'bg-stone-50 hover:bg-cyan-50 border-stone-300 hover:border-cyan-500 shadow-xs sm:shadow-md active:scale-[0.98] cursor-pointer'
                }`}
                aria-label={`${step.text} ${isCompleted ? '(completado)' : ''}`}
              >
                <span className="text-4xl sm:text-6xl shrink-0 leading-none" aria-hidden="true">
                  {step.icon}
                </span>
                <span className="flex-1 text-stone-950 font-black text-base sm:text-2xl leading-snug">
                  {step.text}
                </span>
                {isCompleted && (
                  <span className="text-emerald-800 font-black text-base sm:text-xl shrink-0">
                    ✓ Hecho
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {isSuccess && (
        <SuccessCelebration
          title="¡Completado!"
          message="Has superado las tres rondas de 3, 4 y 5 pasos con gran organización."
          onRestart={initGame}
          onHome={onExit}
        />
      )}
    </div>
  )
}
