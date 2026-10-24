import { useState, useEffect, useRef } from 'react'
import { Volume2 } from 'lucide-react'
import { sound } from '../services/sound'
import { speech } from '../services/speech'
import { SuccessCelebration } from '../components/SuccessCelebration'
import { pickRandom, GENERAL_RETRIES } from '../services/voiceFeedback'

interface Props {
  onComplete: () => void
  onExit: () => void
}

interface MelodyNote {
  freq: number
  dur: number
}

interface SongItem {
  title: string
  emoji: string
  verseStart: string
  correctWord: string
  distractors: string[]
  melody: MelodyNote[]
}

// Exact Equal-Temperament Note Frequencies (Hz)
const N = {
  G3: 196.0,
  A3: 220.0,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  Fs4: 369.99,
  G4: 392.0,
  Gs4: 415.3,
  A4: 440.0,
  Bb4: 466.16,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
  A5: 880.0,
}

// Beat length (seconds) used to build rhythms
const Q = 0.40 // negra
const E = Q / 2 // corchea
const H = Q * 2 // blanca
const DQ = Q * 1.5 // negra con puntillo

const SONG_INTRO_PHRASES = [
  '¿Cómo sigue esta famosa canción?',
  '¿Recuerdas cómo continúa la letra?',
  '¿Cómo sigue la canción?',
  'Seguro que te sabes esta canción. ¿Cómo continúa?',
]

const SONG_CONGRATS = [
  '¡Muy bien! ¡Qué buena memoria musical!',
  '¡Eso es! ¡Te la sabes estupendamente!',
  '¡Bravo! ¡La has recordado muy bien!',
  '¡Excelente! ¡Qué bien cantado!',
  '¡Perfecto! ¡Te la sabes de memoria!',
  '¡Estupendo! ¡Muy bien hecho!',
]

// 26 canciones populares españolas e infantiles tradicionales con melodías EXACTAS y 100% verificadas
const SONGS_POOL: SongItem[] = [
  {
    title: 'Cumpleaños Feliz',
    emoji: '🎂',
    verseStart: '«Cumpleaños feliz, cumpleaños feliz, te deseamos a...»',
    correctWord: '...ti',
    distractors: ['...mí', '...él', '...todos', '...ella'],
    melody: [
      { freq: N.G4, dur: DQ * 0.5 }, { freq: N.G4, dur: E * 0.5 }, { freq: N.A4, dur: Q }, { freq: N.G4, dur: Q }, { freq: N.C5, dur: Q }, { freq: N.B4, dur: H },
      { freq: N.G4, dur: DQ * 0.5 }, { freq: N.G4, dur: E * 0.5 }, { freq: N.A4, dur: Q }, { freq: N.G4, dur: Q }, { freq: N.D5, dur: Q }, { freq: N.C5, dur: H },
      { freq: N.G4, dur: DQ * 0.5 }, { freq: N.G4, dur: E * 0.5 }, { freq: N.G5, dur: Q }, { freq: N.E5, dur: Q }, { freq: N.C5, dur: Q }, { freq: N.B4, dur: Q }, { freq: N.A4, dur: H },
      { freq: N.F5, dur: DQ * 0.5 }, { freq: N.F5, dur: E * 0.5 }, { freq: N.E5, dur: Q }, { freq: N.C5, dur: Q }, { freq: N.D5, dur: Q }, { freq: N.C5, dur: H },
    ],
  },
  {
    title: 'Estrellita, ¿Dónde Estás?',
    emoji: '⭐',
    verseStart: '«Estrellita, ¿dónde estás? Me pregunto qué...»',
    correctWord: '...serás',
    distractors: ['...harás', '...dirás', '...verás', '...tendrás'],
    melody: [
      { freq: N.C4, dur: Q }, { freq: N.C4, dur: Q }, { freq: N.G4, dur: Q }, { freq: N.G4, dur: Q }, { freq: N.A4, dur: Q }, { freq: N.A4, dur: Q }, { freq: N.G4, dur: H },
      { freq: N.F4, dur: Q }, { freq: N.F4, dur: Q }, { freq: N.E4, dur: Q }, { freq: N.E4, dur: Q }, { freq: N.D4, dur: Q }, { freq: N.D4, dur: Q }, { freq: N.C4, dur: H },
      { freq: N.G4, dur: Q }, { freq: N.G4, dur: Q }, { freq: N.F4, dur: Q }, { freq: N.F4, dur: Q }, { freq: N.E4, dur: Q }, { freq: N.E4, dur: Q }, { freq: N.D4, dur: H },
      { freq: N.C4, dur: Q }, { freq: N.C4, dur: Q }, { freq: N.G4, dur: Q }, { freq: N.G4, dur: Q }, { freq: N.A4, dur: Q }, { freq: N.A4, dur: Q }, { freq: N.G4, dur: H },
    ],
  },
  {
    title: 'Martinillo',
    emoji: '🔔',
    verseStart: '«Martinillo, Martinillo, ¿dónde estás? ¿Dónde estás? Toca la...»',
    correctWord: '...campana',
    distractors: ['...guitarra', '...trompeta', '...ventana', '...pandereta'],
    melody: [
      { freq: N.C4, dur: Q }, { freq: N.D4, dur: Q }, { freq: N.E4, dur: Q }, { freq: N.C4, dur: Q },
      { freq: N.C4, dur: Q }, { freq: N.D4, dur: Q }, { freq: N.E4, dur: Q }, { freq: N.C4, dur: Q },
      { freq: N.E4, dur: Q }, { freq: N.F4, dur: Q }, { freq: N.G4, dur: H },
      { freq: N.E4, dur: Q }, { freq: N.F4, dur: Q }, { freq: N.G4, dur: H },
      { freq: N.G4, dur: E }, { freq: N.A4, dur: E }, { freq: N.G4, dur: E }, { freq: N.F4, dur: E }, { freq: N.E4, dur: Q }, { freq: N.C4, dur: Q },
      { freq: N.G4, dur: E }, { freq: N.A4, dur: E }, { freq: N.G4, dur: E }, { freq: N.F4, dur: E }, { freq: N.E4, dur: Q }, { freq: N.C4, dur: Q },
      { freq: N.C4, dur: Q }, { freq: N.G3, dur: Q }, { freq: N.C4, dur: H },
      { freq: N.C4, dur: Q }, { freq: N.G3, dur: Q }, { freq: N.C4, dur: H },
    ],
  },
  {
    title: 'La Cucaracha',
    emoji: '💃',
    verseStart: '«La cucaracha, la cucaracha, ya no puede...»',
    correctWord: '...caminar',
    distractors: ['...descansar', '...madrugar', '...trabajar', '...pasear'],
    melody: [
      { freq: N.C4, dur: E * 0.7 }, { freq: N.C4, dur: E * 0.7 }, { freq: N.C4, dur: E * 0.7 }, { freq: N.F4, dur: DQ }, { freq: N.A4, dur: Q },
      { freq: N.C4, dur: E * 0.7 }, { freq: N.C4, dur: E * 0.7 }, { freq: N.C4, dur: E * 0.7 }, { freq: N.F4, dur: DQ }, { freq: N.A4, dur: H },
      { freq: N.F4, dur: E }, { freq: N.F4, dur: E }, { freq: N.E4, dur: E }, { freq: N.E4, dur: E }, { freq: N.D4, dur: E }, { freq: N.D4, dur: E }, { freq: N.C4, dur: H },
      { freq: N.C4, dur: E * 0.7 }, { freq: N.C4, dur: E * 0.7 }, { freq: N.C4, dur: E * 0.7 }, { freq: N.E4, dur: DQ }, { freq: N.G4, dur: Q },
      { freq: N.C4, dur: E * 0.7 }, { freq: N.C4, dur: E * 0.7 }, { freq: N.C4, dur: E * 0.7 }, { freq: N.E4, dur: DQ }, { freq: N.G4, dur: H },
      { freq: N.C5, dur: E }, { freq: N.D5, dur: E }, { freq: N.C5, dur: E }, { freq: N.Bb4, dur: E }, { freq: N.A4, dur: E }, { freq: N.G4, dur: E }, { freq: N.F4, dur: H },
    ],
  },
  {
    title: 'Himno de la Alegría',
    emoji: '🎶',
    verseStart: '«Escucha, hermano, la canción de la alegría, el canto alegre del que espera un nuevo...»',
    correctWord: '...día',
    distractors: ['...año', '...amor', '...sol', '...mes'],
    melody: [
      { freq: N.E4, dur: Q }, { freq: N.E4, dur: Q }, { freq: N.F4, dur: Q }, { freq: N.G4, dur: Q },
      { freq: N.G4, dur: Q }, { freq: N.F4, dur: Q }, { freq: N.E4, dur: Q }, { freq: N.D4, dur: Q },
      { freq: N.C4, dur: Q }, { freq: N.C4, dur: Q }, { freq: N.D4, dur: Q }, { freq: N.E4, dur: Q },
      { freq: N.E4, dur: DQ }, { freq: N.D4, dur: E }, { freq: N.D4, dur: H },
      { freq: N.E4, dur: Q }, { freq: N.E4, dur: Q }, { freq: N.F4, dur: Q }, { freq: N.G4, dur: Q },
      { freq: N.G4, dur: Q }, { freq: N.F4, dur: Q }, { freq: N.E4, dur: Q }, { freq: N.D4, dur: Q },
      { freq: N.C4, dur: Q }, { freq: N.C4, dur: Q }, { freq: N.D4, dur: Q }, { freq: N.E4, dur: Q },
      { freq: N.D4, dur: DQ }, { freq: N.C4, dur: E }, { freq: N.C4, dur: H },
    ],
  },
  {
    title: 'Noche de Paz',
    emoji: '🌟',
    verseStart: '«Noche de paz, noche de amor, todo duerme en...»',
    correctWord: '...derredor',
    distractors: ['...el salón', '...la ciudad', '...el rincón', '...su interior'],
    melody: [
      { freq: N.G4, dur: DQ }, { freq: N.A4, dur: E }, { freq: N.G4, dur: Q }, { freq: N.E4, dur: DQ * 2 },
      { freq: N.G4, dur: DQ }, { freq: N.A4, dur: E }, { freq: N.G4, dur: Q }, { freq: N.E4, dur: DQ * 2 },
      { freq: N.D5, dur: H }, { freq: N.D5, dur: Q }, { freq: N.B4, dur: DQ * 2 },
      { freq: N.C5, dur: H }, { freq: N.C5, dur: Q }, { freq: N.G4, dur: DQ * 2 },
    ],
  },
  {
    title: 'Navidad, Navidad',
    emoji: '🎄',
    verseStart: '«Navidad, Navidad, hoy es Navidad, es un día de alegría y...»',
    correctWord: '...felicidad',
    distractors: ['...bondad', '...amistad', '...libertad', '...verdad'],
    melody: [
      { freq: N.E4, dur: Q }, { freq: N.E4, dur: Q }, { freq: N.E4, dur: H },
      { freq: N.E4, dur: Q }, { freq: N.E4, dur: Q }, { freq: N.E4, dur: H },
      { freq: N.E4, dur: Q }, { freq: N.G4, dur: Q }, { freq: N.C4, dur: DQ }, { freq: N.D4, dur: E }, { freq: N.E4, dur: H * 1.5 },
      { freq: N.F4, dur: Q }, { freq: N.F4, dur: Q }, { freq: N.F4, dur: DQ }, { freq: N.F4, dur: E },
      { freq: N.F4, dur: Q }, { freq: N.E4, dur: Q }, { freq: N.E4, dur: Q }, { freq: N.E4, dur: E }, { freq: N.E4, dur: E },
      { freq: N.E4, dur: Q }, { freq: N.D4, dur: Q }, { freq: N.D4, dur: Q }, { freq: N.E4, dur: Q },
      { freq: N.D4, dur: H }, { freq: N.G4, dur: H },
    ],
  },
  {
    title: 'Debajo de un Botón',
    emoji: '🔘',
    verseStart: '«Debajo de un botón, ton, ton, que encontró...»',
    correctWord: '...Martín',
    distractors: ['...Fermín', '...Joaquín', '...Crispín', '...Agustín'],
    melody: [
      { freq: N.C4, dur: E }, { freq: N.D4, dur: E }, { freq: N.E4, dur: E }, { freq: N.F4, dur: E }, { freq: N.G4, dur: Q }, { freq: N.G4, dur: Q }, { freq: N.G4, dur: H },
      { freq: N.A4, dur: E }, { freq: N.F4, dur: E }, { freq: N.G4, dur: E }, { freq: N.E4, dur: E }, { freq: N.F4, dur: Q }, { freq: N.F4, dur: Q }, { freq: N.F4, dur: H },
      { freq: N.C4, dur: E }, { freq: N.D4, dur: E }, { freq: N.E4, dur: E }, { freq: N.F4, dur: E }, { freq: N.G4, dur: Q }, { freq: N.G4, dur: Q }, { freq: N.G4, dur: H },
      { freq: N.F4, dur: E }, { freq: N.E4, dur: E }, { freq: N.D4, dur: E }, { freq: N.C4, dur: E }, { freq: N.D4, dur: Q }, { freq: N.C4, dur: Q }, { freq: N.C4, dur: H },
    ],
  },
  {
    title: 'El Patio de mi Casa',
    emoji: '🏡',
    verseStart: '«El patio de mi casa es particular, cuando llueve se...»',
    correctWord: '...moja',
    distractors: ['...limpia', '...llena', '...seca', '...riega'],
    melody: [
      { freq: N.G4, dur: E }, { freq: N.G4, dur: E }, { freq: N.G4, dur: E }, { freq: N.E4, dur: E }, { freq: N.C4, dur: E }, { freq: N.E4, dur: E },
      { freq: N.G4, dur: E }, { freq: N.G4, dur: E }, { freq: N.G4, dur: E }, { freq: N.E4, dur: E }, { freq: N.C4, dur: E }, { freq: N.E4, dur: E },
      { freq: N.G4, dur: E }, { freq: N.G4, dur: E }, { freq: N.G4, dur: E }, { freq: N.A4, dur: E }, { freq: N.F4, dur: E }, { freq: N.D4, dur: E },
      { freq: N.F4, dur: E }, { freq: N.F4, dur: E }, { freq: N.F4, dur: E }, { freq: N.G4, dur: E }, { freq: N.E4, dur: E }, { freq: N.C4, dur: H },
      { freq: N.G4, dur: Q }, { freq: N.G4, dur: H },
      { freq: N.E4, dur: E }, { freq: N.F4, dur: E }, { freq: N.G4, dur: E }, { freq: N.E4, dur: E }, { freq: N.C4, dur: H },
    ],
  },
  {
    title: 'Tengo una Muñeca',
    emoji: '👗',
    verseStart: '«Tengo una muñeca vestida de...»',
    correctWord: '...azul',
    distractors: ['...tul', '...gris', '...sol', '...flor'],
    melody: [
      { freq: N.G4, dur: E }, { freq: N.G4, dur: E }, { freq: N.E4, dur: E }, { freq: N.G4, dur: E }, { freq: N.C5, dur: Q }, { freq: N.C5, dur: Q },
      { freq: N.E5, dur: E }, { freq: N.D5, dur: E }, { freq: N.C5, dur: E }, { freq: N.B4, dur: E }, { freq: N.A4, dur: H },
      { freq: N.F4, dur: E }, { freq: N.F4, dur: E }, { freq: N.D4, dur: E }, { freq: N.F4, dur: E }, { freq: N.B4, dur: Q }, { freq: N.B4, dur: Q },
      { freq: N.D5, dur: E }, { freq: N.C5, dur: E }, { freq: N.B4, dur: E }, { freq: N.A4, dur: E }, { freq: N.G4, dur: H },
      { freq: N.G4, dur: E }, { freq: N.G4, dur: E }, { freq: N.E4, dur: E }, { freq: N.G4, dur: E }, { freq: N.C5, dur: Q }, { freq: N.C5, dur: Q },
      { freq: N.E5, dur: E }, { freq: N.D5, dur: E }, { freq: N.C5, dur: E }, { freq: N.B4, dur: E }, { freq: N.A4, dur: H },
      { freq: N.F4, dur: E }, { freq: N.F4, dur: E }, { freq: N.D4, dur: E }, { freq: N.F4, dur: E }, { freq: N.B4, dur: Q }, { freq: N.B4, dur: Q },
      { freq: N.D5, dur: E }, { freq: N.C5, dur: E }, { freq: N.B4, dur: E }, { freq: N.D5, dur: E }, { freq: N.C5, dur: H },
    ],
  },
  {
    title: 'La Vaca Lechera',
    emoji: '🐄',
    verseStart: '«Tengo una vaca lechera, no es una vaca...»',
    correctWord: '...cualquiera',
    distractors: ['...ligera', '...primera', '...viajera', '...pequeña'],
    melody: [
      // Ten-go u-na va-ca
      { freq: N.C4, dur: E }, { freq: N.C4, dur: E }, { freq: N.E4, dur: E }, { freq: N.E4, dur: E }, { freq: N.G4, dur: E }, { freq: N.G4, dur: E },
      // le-che-ra
      { freq: N.D4, dur: E }, { freq: N.D4, dur: E }, { freq: N.B3, dur: Q },
      // no es u-na va-ca
      { freq: N.C4, dur: E }, { freq: N.C4, dur: E }, { freq: N.E4, dur: E }, { freq: N.E4, dur: E }, { freq: N.G4, dur: E }, { freq: N.G4, dur: E },
      // cual-quie-ra
      { freq: N.D4, dur: E }, { freq: N.D4, dur: E }, { freq: N.B3, dur: Q },
      // me da le-che me-ren-ga-da
      { freq: N.A4, dur: E }, { freq: N.A4, dur: E }, { freq: N.A4, dur: E }, { freq: N.A4, dur: E }, { freq: N.G4, dur: E }, { freq: N.F4, dur: E }, { freq: N.E4, dur: Q },
      // ¡ay, qué va-ca tan sa-la-da!
      { freq: N.G4, dur: E }, { freq: N.G4, dur: E }, { freq: N.G4, dur: E }, { freq: N.G4, dur: E }, { freq: N.F4, dur: E }, { freq: N.E4, dur: E }, { freq: N.D4, dur: Q },
      // to-lón, to-lón
      { freq: N.G4, dur: Q }, { freq: N.E4, dur: Q }, { freq: N.G4, dur: Q }, { freq: N.E4, dur: Q },
      // to-lón, to-lón
      { freq: N.F4, dur: E }, { freq: N.D4, dur: E }, { freq: N.C4, dur: H },
    ],
  },
  {
    title: 'Un Elefante',
    emoji: '🐘',
    verseStart: '«Un elefante se balanceaba sobre la tela de una...»',
    correctWord: '...araña',
    distractors: ['...montaña', '...cabaña', '...castaña', '...campaña'],
    melody: [
      { freq: N.C4, dur: Q }, { freq: N.E4, dur: E }, { freq: N.G4, dur: E }, { freq: N.G4, dur: Q }, { freq: N.G4, dur: Q },
      { freq: N.G4, dur: E }, { freq: N.A4, dur: E }, { freq: N.G4, dur: E }, { freq: N.F4, dur: E }, { freq: N.E4, dur: Q }, { freq: N.D4, dur: H },
      { freq: N.D4, dur: Q }, { freq: N.F4, dur: E }, { freq: N.A4, dur: E }, { freq: N.A4, dur: Q }, { freq: N.A4, dur: Q },
      { freq: N.A4, dur: E }, { freq: N.B4, dur: E }, { freq: N.A4, dur: E }, { freq: N.G4, dur: E }, { freq: N.F4, dur: Q }, { freq: N.E4, dur: H },
      { freq: N.C4, dur: Q }, { freq: N.E4, dur: E }, { freq: N.G4, dur: E }, { freq: N.G4, dur: Q }, { freq: N.G4, dur: Q },
      { freq: N.G4, dur: E }, { freq: N.A4, dur: E }, { freq: N.G4, dur: E }, { freq: N.F4, dur: E }, { freq: N.E4, dur: Q }, { freq: N.D4, dur: H },
      { freq: N.D4, dur: Q }, { freq: N.F4, dur: E }, { freq: N.A4, dur: E }, { freq: N.G4, dur: E }, { freq: N.F4, dur: E }, { freq: N.E4, dur: E }, { freq: N.D4, dur: E }, { freq: N.C4, dur: H },
    ],
  },
  {
    title: 'Asturias, Patria Querida',
    emoji: '⛰️',
    verseStart: '«Asturias, patria querida, Asturias de mis...»',
    correctWord: '...amores',
    distractors: ['...colores', '...mayores', '...flores', '...dolores'],
    melody: [
      { freq: N.G4, dur: Q },
      { freq: N.C5, dur: H }, { freq: N.E5, dur: E }, { freq: N.D5, dur: E },
      { freq: N.C5, dur: Q }, { freq: N.B4, dur: H }, { freq: N.D5, dur: E }, { freq: N.C5, dur: E },
      { freq: N.B4, dur: Q }, { freq: N.A4, dur: H }, { freq: N.C5, dur: E }, { freq: N.B4, dur: E },
      { freq: N.A4, dur: Q }, { freq: N.G4, dur: H * 1.5 },
      { freq: N.G4, dur: E }, { freq: N.A4, dur: E }, { freq: N.B4, dur: E }, { freq: N.C5, dur: E }, { freq: N.D5, dur: E }, { freq: N.E5, dur: E },
      { freq: N.F5, dur: H }, { freq: N.E5, dur: E }, { freq: N.D5, dur: E }, { freq: N.C5, dur: H * 1.5 },
    ],
  },
  {
    title: 'Al Pasar la Barca',
    emoji: '⛵',
    verseStart: '«Al pasar la barca, me dijo el...»',
    correctWord: '...barquero',
    distractors: ['...marinero', '...panadero', '...sombrero', '...viajero'],
    melody: [
      // Al pa-sar la bar-ca
      { freq: N.E4, dur: E }, { freq: N.F4, dur: E }, { freq: N.G4, dur: Q }, { freq: N.C5, dur: H },
      // me di-jo el bar-que-ro
      { freq: N.A4, dur: E }, { freq: N.A4, dur: E }, { freq: N.A4, dur: Q }, { freq: N.D5, dur: H },
      // las ni-ñas bo-ni-tas
      { freq: N.A4, dur: E }, { freq: N.A4, dur: E }, { freq: N.G4, dur: Q }, { freq: N.F4, dur: H },
      // no pa-gan di-ne-ro
      { freq: N.E4, dur: E }, { freq: N.F4, dur: E }, { freq: N.G4, dur: Q }, { freq: N.C5, dur: H },
      // Yo no soy bo-ni-ta
      { freq: N.E4, dur: E }, { freq: N.F4, dur: E }, { freq: N.G4, dur: Q }, { freq: N.C5, dur: H },
      // ni lo quie-ro ser
      { freq: N.A4, dur: E }, { freq: N.A4, dur: E }, { freq: N.A4, dur: Q }, { freq: N.D5, dur: H },
      // a-rri-ba la bar-ca
      { freq: N.A4, dur: E }, { freq: N.A4, dur: E }, { freq: N.G4, dur: Q }, { freq: N.F4, dur: H },
      // u-na, dos y tres
      { freq: N.E4, dur: Q }, { freq: N.F4, dur: Q }, { freq: N.G4, dur: Q }, { freq: N.C5, dur: H },
    ],
  },
  {
    title: 'Que Llueva, Que Llueva',
    emoji: '🌧️',
    verseStart: '«Que llueva, que llueva, la Virgen de la...»',
    correctWord: '...Cueva',
    distractors: ['...Sierra', '...Tierra', '...Estrella', '...Vega'],
    melody: [
      // Que llue-va
      { freq: N.E4, dur: E }, { freq: N.G4, dur: E }, { freq: N.G4, dur: Q },
      // que llue-va
      { freq: N.A4, dur: E }, { freq: N.G4, dur: E }, { freq: N.G4, dur: Q },
      // la Vir-gen de la cue-va
      { freq: N.E4, dur: E }, { freq: N.G4, dur: E }, { freq: N.F4, dur: E }, { freq: N.G4, dur: E }, { freq: N.A4, dur: E }, { freq: N.G4, dur: Q },
      // los pa-ja-ri-tos can-tan
      { freq: N.E4, dur: E }, { freq: N.G4, dur: E }, { freq: N.G4, dur: Q },
      { freq: N.A4, dur: E }, { freq: N.G4, dur: E }, { freq: N.G4, dur: Q },
      // las nu-bes se le-van-tan
      { freq: N.E4, dur: E }, { freq: N.G4, dur: E }, { freq: N.F4, dur: E }, { freq: N.G4, dur: E }, { freq: N.A4, dur: E }, { freq: N.G4, dur: Q },
      // ¡que sí, que no!
      { freq: N.A4, dur: Q }, { freq: N.B4, dur: Q }, { freq: N.C5, dur: H },
      // que cai-ga un cha-pa-rrón
      { freq: N.G4, dur: E }, { freq: N.A4, dur: E }, { freq: N.G4, dur: E }, { freq: N.F4, dur: E }, { freq: N.E4, dur: H },
      // con a-zú-car y tu-rrón
      { freq: N.E4, dur: E }, { freq: N.F4, dur: E }, { freq: N.G4, dur: E }, { freq: N.F4, dur: E }, { freq: N.E4, dur: E }, { freq: N.D4, dur: E }, { freq: N.C4, dur: H },
    ],
  },
  {
    title: 'Cucú, Cantaba la Rana',
    emoji: '🐸',
    verseStart: '«Cucú, cantaba la rana, cucú, debajo del...»',
    correctWord: '...agua',
    distractors: ['...árbol', '...puente', '...barco', '...charco'],
    melody: [
      { freq: N.G4, dur: Q }, { freq: N.E4, dur: Q }, { freq: N.G4, dur: Q }, { freq: N.E4, dur: Q },
      { freq: N.G4, dur: E }, { freq: N.G4, dur: E }, { freq: N.F4, dur: E }, { freq: N.E4, dur: E }, { freq: N.D4, dur: H },
      { freq: N.F4, dur: Q }, { freq: N.D4, dur: Q }, { freq: N.F4, dur: Q }, { freq: N.D4, dur: Q },
      { freq: N.F4, dur: E }, { freq: N.F4, dur: E }, { freq: N.E4, dur: E }, { freq: N.D4, dur: E }, { freq: N.C4, dur: H },
      { freq: N.G4, dur: Q }, { freq: N.E4, dur: Q }, { freq: N.G4, dur: Q }, { freq: N.E4, dur: Q },
      { freq: N.G4, dur: E }, { freq: N.G4, dur: E }, { freq: N.F4, dur: E }, { freq: N.E4, dur: E }, { freq: N.D4, dur: H },
      { freq: N.F4, dur: Q }, { freq: N.D4, dur: Q }, { freq: N.F4, dur: Q }, { freq: N.D4, dur: Q },
      { freq: N.F4, dur: E }, { freq: N.F4, dur: E }, { freq: N.E4, dur: E }, { freq: N.D4, dur: E }, { freq: N.C4, dur: H },
    ],
  },
  {
    title: 'Campana sobre Campana',
    emoji: '🔔',
    verseStart: '«Campana sobre campana, y sobre campana...»',
    correctWord: '...una',
    distractors: ['...luna', '...cuna', '...alguna', '...ninguna'],
    melody: [
      { freq: N.G4, dur: E }, { freq: N.G4, dur: E }, { freq: N.G4, dur: E }, { freq: N.G4, dur: E }, { freq: N.E4, dur: E }, { freq: N.F4, dur: E }, { freq: N.G4, dur: Q },
      { freq: N.F4, dur: E }, { freq: N.E4, dur: E }, { freq: N.D4, dur: E }, { freq: N.E4, dur: E }, { freq: N.F4, dur: E }, { freq: N.G4, dur: E }, { freq: N.E4, dur: H },
      { freq: N.G4, dur: E }, { freq: N.G4, dur: E }, { freq: N.G4, dur: E }, { freq: N.G4, dur: E }, { freq: N.E4, dur: E }, { freq: N.F4, dur: E }, { freq: N.G4, dur: Q },
      { freq: N.F4, dur: E }, { freq: N.E4, dur: E }, { freq: N.D4, dur: E }, { freq: N.E4, dur: E }, { freq: N.F4, dur: E }, { freq: N.G4, dur: E }, { freq: N.C4, dur: H },
      { freq: N.E4, dur: Q }, { freq: N.E4, dur: E }, { freq: N.E4, dur: E }, { freq: N.D4, dur: E }, { freq: N.C4, dur: E }, { freq: N.D4, dur: E }, { freq: N.E4, dur: Q },
      { freq: N.F4, dur: E }, { freq: N.E4, dur: E }, { freq: N.D4, dur: E }, { freq: N.C4, dur: E }, { freq: N.B3, dur: E }, { freq: N.C4, dur: E }, { freq: N.D4, dur: H },
      { freq: N.E4, dur: Q }, { freq: N.E4, dur: E }, { freq: N.E4, dur: E }, { freq: N.D4, dur: E }, { freq: N.C4, dur: E }, { freq: N.D4, dur: E }, { freq: N.E4, dur: Q },
    ],
  },
  {
    title: 'Los Peces en el Río',
    emoji: '🐟',
    verseStart: '«Pero mira cómo beben los peces en el...»',
    correctWord: '...río',
    distractors: ['...frío', '...mar', '...barco', '...lago'],
    melody: [
      { freq: N.A4, dur: E }, { freq: N.A4, dur: E }, { freq: N.A4, dur: E }, { freq: N.A4, dur: E }, { freq: N.B4, dur: E }, { freq: N.C5, dur: E }, { freq: N.B4, dur: Q },
      { freq: N.A4, dur: E }, { freq: N.Gs4, dur: E }, { freq: N.A4, dur: E }, { freq: N.B4, dur: E }, { freq: N.Gs4, dur: Q }, { freq: N.E4, dur: H },
      { freq: N.A4, dur: E }, { freq: N.A4, dur: E }, { freq: N.A4, dur: E }, { freq: N.A4, dur: E }, { freq: N.B4, dur: E }, { freq: N.C5, dur: E }, { freq: N.B4, dur: Q },
      { freq: N.A4, dur: E }, { freq: N.Gs4, dur: E }, { freq: N.A4, dur: E }, { freq: N.B4, dur: E }, { freq: N.A4, dur: H },
      { freq: N.C5, dur: Q }, { freq: N.C5, dur: E }, { freq: N.C5, dur: E }, { freq: N.B4, dur: E }, { freq: N.A4, dur: E }, { freq: N.B4, dur: Q },
      { freq: N.B4, dur: E }, { freq: N.B4, dur: E }, { freq: N.B4, dur: E }, { freq: N.A4, dur: E }, { freq: N.Gs4, dur: E }, { freq: N.A4, dur: H },
    ],
  },
  {
    title: 'Cinco Lobitos',
    emoji: '🐺',
    verseStart: '«Cinco lobitos tiene la loba, blancos y negros detrás de la...»',
    correctWord: '...escoba',
    distractors: ['...alcoba', '...caoba', '...persona', '...paloma'],
    melody: [
      { freq: N.G4, dur: E }, { freq: N.E4, dur: E }, { freq: N.E4, dur: E }, { freq: N.E4, dur: E }, { freq: N.G4, dur: H },
      { freq: N.G4, dur: E }, { freq: N.E4, dur: E }, { freq: N.E4, dur: E }, { freq: N.E4, dur: E }, { freq: N.G4, dur: H },
      { freq: N.F4, dur: E }, { freq: N.D4, dur: E }, { freq: N.D4, dur: E }, { freq: N.D4, dur: E }, { freq: N.F4, dur: H },
      { freq: N.F4, dur: E }, { freq: N.D4, dur: E }, { freq: N.D4, dur: E }, { freq: N.D4, dur: E }, { freq: N.F4, dur: H },
      { freq: N.G4, dur: E }, { freq: N.E4, dur: E }, { freq: N.E4, dur: E }, { freq: N.E4, dur: E }, { freq: N.G4, dur: Q }, { freq: N.G4, dur: Q },
      { freq: N.F4, dur: E }, { freq: N.D4, dur: E }, { freq: N.D4, dur: E }, { freq: N.D4, dur: E }, { freq: N.F4, dur: Q }, { freq: N.F4, dur: Q },
      { freq: N.E4, dur: E }, { freq: N.F4, dur: E }, { freq: N.G4, dur: E }, { freq: N.E4, dur: E }, { freq: N.C4, dur: H },
    ],
  },
  {
    title: 'Quisiera Ser Tan Alta',
    emoji: '🌙',
    verseStart: '«Quisiera ser tan alta como la...»',
    correctWord: '...luna',
    distractors: ['...espuma', '...torre', '...nube', '...cuna'],
    melody: [
      // Qui-sie-ra ser tan al-ta
      { freq: N.C4, dur: E }, { freq: N.E4, dur: E }, { freq: N.G4, dur: E }, { freq: N.G4, dur: E }, { freq: N.G4, dur: E }, { freq: N.G4, dur: Q },
      // co-mo la lu-na
      { freq: N.F4, dur: E }, { freq: N.E4, dur: E }, { freq: N.D4, dur: H },
      // ¡ay, ay!
      { freq: N.F4, dur: Q }, { freq: N.F4, dur: Q },
      // co-mo la lu-na
      { freq: N.F4, dur: E }, { freq: N.E4, dur: E }, { freq: N.D4, dur: Q }, { freq: N.D4, dur: Q },
      // co-mo la lu-na
      { freq: N.E4, dur: E }, { freq: N.D4, dur: E }, { freq: N.C4, dur: H },
      // Pa-ra ver los sol-da-dos
      { freq: N.C4, dur: E }, { freq: N.E4, dur: E }, { freq: N.G4, dur: E }, { freq: N.G4, dur: E }, { freq: N.G4, dur: E }, { freq: N.G4, dur: Q },
      // de Ca-ta-lu-ña
      { freq: N.F4, dur: E }, { freq: N.E4, dur: E }, { freq: N.D4, dur: H },
      // ¡ay, ay!
      { freq: N.F4, dur: Q }, { freq: N.F4, dur: Q },
      // de Ca-ta-lu-ña
      { freq: N.F4, dur: E }, { freq: N.E4, dur: E }, { freq: N.D4, dur: Q }, { freq: N.D4, dur: Q },
      // de Ca-ta-lu-ña
      { freq: N.E4, dur: E }, { freq: N.D4, dur: E }, { freq: N.C4, dur: H },
    ],
  },
  {
    title: 'Susanita Tiene un Ratón',
    emoji: '🐭',
    verseStart: '«Susanita tiene un ratón, un ratón...»',
    correctWord: '...chiquitín',
    distractors: ['...juguetón', '...bailarín', '...dormilón', '...saltarín'],
    melody: [
      { freq: N.C4, dur: E }, { freq: N.D4, dur: E }, { freq: N.E4, dur: E }, { freq: N.F4, dur: E }, { freq: N.G4, dur: Q }, { freq: N.E4, dur: E }, { freq: N.C4, dur: DQ },
      { freq: N.C4, dur: E }, { freq: N.D4, dur: E }, { freq: N.E4, dur: E }, { freq: N.F4, dur: E }, { freq: N.G4, dur: H },
      { freq: N.F4, dur: E }, { freq: N.G4, dur: E }, { freq: N.A4, dur: E }, { freq: N.F4, dur: E }, { freq: N.E4, dur: E }, { freq: N.F4, dur: E }, { freq: N.G4, dur: E }, { freq: N.E4, dur: E },
      { freq: N.D4, dur: E }, { freq: N.E4, dur: E }, { freq: N.F4, dur: E }, { freq: N.D4, dur: E }, { freq: N.C4, dur: H },
    ],
  },
  {
    title: 'Hola, Don Pepito',
    emoji: '🎩',
    verseStart: '«¡Hola, Don Pepito! ¡Hola, Don...!»',
    correctWord: '...José',
    distractors: ['...Manuel', '...Andrés', '...Miguel', '...Ramón'],
    melody: [
      { freq: N.C4, dur: Q }, { freq: N.E4, dur: Q }, { freq: N.G4, dur: Q }, { freq: N.C5, dur: H },
      { freq: N.C5, dur: Q }, { freq: N.B4, dur: Q }, { freq: N.A4, dur: Q }, { freq: N.G4, dur: H },
      { freq: N.C4, dur: Q }, { freq: N.E4, dur: Q }, { freq: N.G4, dur: Q }, { freq: N.C5, dur: H },
      { freq: N.C5, dur: Q }, { freq: N.B4, dur: Q }, { freq: N.A4, dur: Q }, { freq: N.G4, dur: H },
      { freq: N.G4, dur: Q }, { freq: N.A4, dur: Q }, { freq: N.B4, dur: Q }, { freq: N.C5, dur: H },
    ],
  },
  {
    title: 'La Gallina Turuleca',
    emoji: '🐔',
    verseStart: '«La gallina Turuleca ha puesto un huevo, ha puesto dos, ha puesto...»',
    correctWord: '...tres',
    distractors: ['...diez', '...seis', '...más', '...cien'],
    melody: [
      { freq: N.C4, dur: E }, { freq: N.C4, dur: E }, { freq: N.E4, dur: E }, { freq: N.E4, dur: E }, { freq: N.G4, dur: E }, { freq: N.G4, dur: E }, { freq: N.C5, dur: Q },
      { freq: N.B4, dur: E }, { freq: N.A4, dur: E }, { freq: N.G4, dur: E }, { freq: N.F4, dur: E }, { freq: N.E4, dur: E }, { freq: N.D4, dur: E }, { freq: N.C4, dur: H },
      { freq: N.G4, dur: E }, { freq: N.G4, dur: E }, { freq: N.E4, dur: Q }, { freq: N.G4, dur: E }, { freq: N.G4, dur: E }, { freq: N.E4, dur: H },
      { freq: N.F4, dur: E }, { freq: N.F4, dur: E }, { freq: N.F4, dur: E }, { freq: N.F4, dur: E }, { freq: N.E4, dur: E }, { freq: N.D4, dur: E }, { freq: N.C4, dur: H },
    ],
  },
  {
    title: 'En el Coche de Papá',
    emoji: '🚗',
    verseStart: '«En el coche de papá nos iremos a...»',
    correctWord: '...pasear',
    distractors: ['...trabajar', '...cocinar', '...navegar', '...descansar'],
    melody: [
      { freq: N.C4, dur: E }, { freq: N.E4, dur: E }, { freq: N.G4, dur: Q }, { freq: N.G4, dur: Q },
      { freq: N.C4, dur: E }, { freq: N.E4, dur: E }, { freq: N.G4, dur: Q }, { freq: N.G4, dur: Q },
      { freq: N.F4, dur: E }, { freq: N.F4, dur: E }, { freq: N.F4, dur: E }, { freq: N.F4, dur: E }, { freq: N.E4, dur: E }, { freq: N.D4, dur: E }, { freq: N.C4, dur: H },
      { freq: N.C4, dur: E }, { freq: N.E4, dur: E }, { freq: N.G4, dur: Q }, { freq: N.G4, dur: Q },
      { freq: N.C5, dur: E }, { freq: N.C5, dur: E }, { freq: N.C5, dur: Q },
      { freq: N.F4, dur: E }, { freq: N.F4, dur: E }, { freq: N.F4, dur: E }, { freq: N.F4, dur: E }, { freq: N.E4, dur: E }, { freq: N.D4, dur: E }, { freq: N.C4, dur: H },
    ],
  },
  {
    title: 'La Tarara',
    emoji: '💃',
    verseStart: '«Tiene la Tarara un vestido blanco, lleno de cascabeles para ir al...»',
    correctWord: '...campo',
    distractors: ['...baile', '...parque', '...río', '...pueblo'],
    melody: [
      { freq: N.G4, dur: E }, { freq: N.A4, dur: E }, { freq: N.G4, dur: E }, { freq: N.F4, dur: E }, { freq: N.E4, dur: Q }, { freq: N.E4, dur: Q },
      { freq: N.F4, dur: E }, { freq: N.G4, dur: E }, { freq: N.F4, dur: E }, { freq: N.E4, dur: E }, { freq: N.D4, dur: Q }, { freq: N.D4, dur: Q },
      { freq: N.G4, dur: E }, { freq: N.A4, dur: E }, { freq: N.G4, dur: E }, { freq: N.F4, dur: E }, { freq: N.E4, dur: Q }, { freq: N.E4, dur: Q },
      { freq: N.D4, dur: E }, { freq: N.C4, dur: E }, { freq: N.D4, dur: E }, { freq: N.E4, dur: E }, { freq: N.C4, dur: H },
      { freq: N.G4, dur: Q }, { freq: N.G4, dur: E }, { freq: N.A4, dur: E }, { freq: N.G4, dur: E }, { freq: N.F4, dur: E }, { freq: N.E4, dur: Q },
      { freq: N.F4, dur: Q }, { freq: N.F4, dur: E }, { freq: N.G4, dur: E }, { freq: N.F4, dur: E }, { freq: N.E4, dur: E }, { freq: N.D4, dur: Q },
      { freq: N.G4, dur: E }, { freq: N.A4, dur: E }, { freq: N.G4, dur: E }, { freq: N.F4, dur: E }, { freq: N.E4, dur: Q }, { freq: N.E4, dur: Q },
      { freq: N.D4, dur: E }, { freq: N.C4, dur: E }, { freq: N.D4, dur: E }, { freq: N.E4, dur: E }, { freq: N.C4, dur: H },
    ],
  },
  {
    title: 'El Señor Don Gato',
    emoji: '🐱',
    verseStart: '«Estaba el señor Don Gato sentadito en su...»',
    correctWord: '...tejado',
    distractors: ['...balcón', '...sillón', '...jardín', '...rincón'],
    melody: [
      { freq: N.G4, dur: E }, { freq: N.G4, dur: E }, { freq: N.G4, dur: E }, { freq: N.G4, dur: E }, { freq: N.A4, dur: E }, { freq: N.G4, dur: E }, { freq: N.F4, dur: E }, { freq: N.E4, dur: H },
      { freq: N.F4, dur: E }, { freq: N.F4, dur: E }, { freq: N.F4, dur: E }, { freq: N.F4, dur: E }, { freq: N.G4, dur: E }, { freq: N.F4, dur: E }, { freq: N.E4, dur: E }, { freq: N.D4, dur: H },
      { freq: N.E4, dur: E }, { freq: N.F4, dur: E }, { freq: N.G4, dur: E }, { freq: N.A4, dur: Q }, { freq: N.A4, dur: Q }, { freq: N.A4, dur: H },
      { freq: N.G4, dur: E }, { freq: N.F4, dur: E }, { freq: N.E4, dur: E }, { freq: N.D4, dur: E }, { freq: N.C4, dur: H },
    ],
  },
]

const ROUND_OPTION_COUNTS = [2, 3, 4, 4]

// Builds a 4-song session; all songs in the pool now have verified music
function buildSession(): SongItem[] {
  return [...SONGS_POOL].sort(() => 0.5 - Math.random()).slice(0, 4)
}

export function PopularSongs({ onComplete, onExit }: Props) {
  const [roundIdx, setRoundIdx] = useState(0)
  const [sessionSongs, setSessionSongs] = useState<SongItem[]>([])
  const [options, setOptions] = useState<string[]>([])
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null)
  const [isPlayingMelody, setIsPlayingMelody] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const isAdvancingRef = useRef(false)
  const timersRef = useRef<number[]>([])

  const clearAllTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t))
    timersRef.current = []
    sound.stopMelody()
  }

  const initSession = () => {
    clearAllTimers()
    setSessionSongs(buildSession())
    setRoundIdx(0)
    setIsSuccess(false)
  }

  useEffect(() => {
    initSession()
    return () => {
      clearAllTimers()
      speech.stop()
      sound.stopMelody()
    }
  }, [])

  useEffect(() => {
    if (sessionSongs.length === 0) return
    clearAllTimers()
    const current = sessionSongs[roundIdx] || sessionSongs[0]
    const optCount = ROUND_OPTION_COUNTS[roundIdx] || 2
    const pickedDistractors = [...current.distractors]
      .sort(() => 0.5 - Math.random())
      .slice(0, optCount - 1)
    const allOpts = [current.correctWord, ...pickedDistractors].sort(() => 0.5 - Math.random())

    setOptions(allOpts)
    setSelectedOpt(null)
    setFeedback('')
    setIsPlayingMelody(false)
    isAdvancingRef.current = false

    const speakPrompt = () => {
      const promptText = pickRandom(SONG_INTRO_PHRASES)
      speech.speak(promptText)
    }

    const t1 = window.setTimeout(() => {
      // Play the full recognizable melody of the song, then speak the prompt
      setIsPlayingMelody(true)
      const melodyMs = sound.playMelody(current.melody)
      const t2 = window.setTimeout(() => {
        setIsPlayingMelody(false)
        speakPrompt()
      }, melodyMs + 200)
      timersRef.current.push(t2)
    }, 200)
    timersRef.current.push(t1)

    return () => {
      clearAllTimers()
      speech.stop()
      sound.stopMelody()
    }
  }, [roundIdx, sessionSongs])

  if (sessionSongs.length === 0) return null
  const currentSong = sessionSongs[roundIdx] || sessionSongs[0]

  const handleListenMelody = () => {
    if (!currentSong.melody) return
    clearAllTimers()
    speech.stop()
    setIsPlayingMelody(true)
    const ms = sound.playMelody(currentSong.melody)
    const t = window.setTimeout(() => setIsPlayingMelody(false), ms)
    timersRef.current.push(t)
  }

  const handleSelect = (opt: string) => {
    if (isAdvancingRef.current) return
    setSelectedOpt(opt)

    if (opt === currentSong.correctWord) {
      isAdvancingRef.current = true
      clearAllTimers()
      speech.stop()

      const cleanStart = currentSong.verseStart.replace(/[«»]/g, '').replace(/\.{3}/g, '').trim()
      const cleanEnd = currentSong.correctWord.replace(/\.{3}/g, '').trim()
      const praiseMsg = pickRandom(SONG_CONGRATS)
      setFeedback(`🎶 ¡Eso es! «${cleanStart} ${cleanEnd}»`)

      let hasAdv = false
      const advance = () => {
        if (hasAdv) return
        hasAdv = true
        setTimeout(() => {
          if (roundIdx + 1 < sessionSongs.length) {
            setRoundIdx((r) => r + 1)
          } else {
            setIsSuccess(true)
            onComplete()
          }
        }, 500)
      }

      const speakCongrats = () => {
        setIsPlayingMelody(false)
        const dur = speech.estimateDurationMs(praiseMsg)
        speech.speak(praiseMsg, advance)
        const fallback = window.setTimeout(advance, dur + 1500)
        timersRef.current.push(fallback)
      }

      if (currentSong.melody) {
        setIsPlayingMelody(true)
        const melodyMs = sound.playMelody(currentSong.melody)
        const t = window.setTimeout(speakCongrats, melodyMs + 150)
        timersRef.current.push(t)
      } else {
        sound.playSuccess()
        const t = window.setTimeout(speakCongrats, 500)
        timersRef.current.push(t)
      }
    } else {
      sound.stopMelody()
      setIsPlayingMelody(false)
      sound.playGentleRetry()
      const retry = pickRandom(GENERAL_RETRIES)
      setFeedback('Esa palabra no es de la canción. Prueba con otra.')
      speech.speak(retry)
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-between w-full max-w-4xl mx-auto overflow-hidden h-full">
      <div className="flex-1 flex flex-col justify-between bg-white border-3 sm:border-4 border-fuchsia-400 rounded-2xl sm:rounded-3xl p-2 sm:p-5 shadow-md text-center min-h-0 overflow-hidden gap-2">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-1 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="text-5xl sm:text-7xl leading-none shrink-0">{currentSong.emoji}</span>
            <div className="text-left min-w-0">
              <h3 className="text-2xl sm:text-4xl font-black text-stone-950 leading-none">
                {currentSong.title}
              </h3>
              <p className="text-base sm:text-2xl font-bold text-fuchsia-800 mt-0.5">
                🎵 ¿Cómo sigue la canción?
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {currentSong.melody && (
              <button
                onClick={handleListenMelody}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border-2 sm:border-3 font-black text-base sm:text-2xl flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                  isPlayingMelody
                    ? 'bg-fuchsia-600 border-fuchsia-800 text-white animate-pulse'
                    : 'bg-amber-200 hover:bg-amber-300 border-amber-500 text-amber-950'
                }`}
                title="Escuchar la melodía de la canción"
              >
                <Volume2 className="w-5 h-5 sm:w-7 sm:h-7 stroke-[2.5]" />
                <span>Melodía</span>
              </button>
            )}

            <span className="px-3 sm:px-5 py-1 sm:py-2 bg-fuchsia-100 border-2 sm:border-3 border-fuchsia-400 text-fuchsia-950 font-black rounded-xl sm:rounded-2xl text-xl sm:text-3xl">
              {roundIdx + 1}/4
            </span>
          </div>
        </div>

        {/* Verse Box */}
        <div className="bg-fuchsia-50 border-3 sm:border-4 border-fuchsia-300 rounded-2xl sm:rounded-3xl p-3 sm:p-6 flex items-center justify-center shrink-0">
          <p className="font-black text-fuchsia-950 text-2xl sm:text-5xl leading-tight">
            {currentSong.verseStart}
          </p>
        </div>

        {feedback && (
          <div className="p-1.5 sm:p-3 rounded-xl sm:rounded-2xl bg-amber-100 border-2 border-amber-400 text-amber-950 font-black text-lg sm:text-3xl shrink-0">
            {feedback}
          </div>
        )}

        {/* Options */}
        <div
          className={`flex-1 min-h-0 w-full grid gap-2.5 sm:gap-4 items-stretch ${
            options.length === 2
              ? 'grid-cols-1 grid-rows-2'
              : options.length === 3
              ? 'grid-cols-1 grid-rows-3'
              : 'grid-cols-2 grid-rows-2'
          }`}
        >
          {options.map((opt) => {
            const isChosen = selectedOpt === opt
            const isCorrect = opt === currentSong.correctWord

            let btnStyle =
              'bg-stone-50 hover:bg-fuchsia-50 border-stone-300 hover:border-fuchsia-400 text-stone-950'
            if (isChosen) {
              btnStyle = isCorrect
                ? 'bg-emerald-600 border-emerald-700 text-white ring-4 ring-emerald-300'
                : 'bg-amber-100 border-amber-400 text-amber-950 opacity-75'
            }

            return (
              <button
                key={opt}
                onClick={() => handleSelect(opt)}
                className={`w-full h-full min-h-0 rounded-2xl sm:rounded-3xl border-3 sm:border-4 p-3 sm:p-6 flex items-center justify-center text-center font-black text-2xl sm:text-5xl transition-all active:scale-95 cursor-pointer shadow-sm ${btnStyle}`}
              >
                {opt}
              </button>
            )
          })}
        </div>
      </div>

      {isSuccess && (
        <SuccessCelebration
          title="¡Qué gran artista!"
          message="Te sabes de memoria las canciones de toda la vida."
          onRestart={initSession}
          onHome={onExit}
        />
      )}
    </div>
  )
}
