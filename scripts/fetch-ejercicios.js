/**
 * fetch-ejercicios.js
 * Descarga ejercicios de wger.de (API pública, sin API key) y genera
 * ejercicios-scraped.json en la raíz del proyecto.
 *
 * Requisitos: Node.js 18+ (usa fetch nativo, sin dependencias externas)
 *
 * Uso básico:
 *   node scripts/fetch-ejercicios.js
 *
 * Importar directamente al backend (necesita token JWT de admin):
 *   node scripts/fetch-ejercicios.js --import http://localhost:8080 TU_JWT_TOKEN
 *
 * Limitar número de ejercicios por categoría:
 *   node scripts/fetch-ejercicios.js --limit 10
 */

'use strict';

const fs   = require('node:fs');
const path = require('node:path');

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN
// ─────────────────────────────────────────────────────────────────────────────

const WGER_BASE = 'https://wger.de/api/v2';
const OUT_FILE  = path.join(__dirname, '..', 'ejercicios-scraped.json');
const DELAY_MS  = 400; // pausa entre peticiones (ser respetuoso con el servidor)

// IDs de categoría en wger.de:
// 8=Arms, 9=Legs, 10=Abs, 11=Chest, 12=Back, 13=Shoulders, 14=Calves
const CATEGORIAS = [
  { id: 11, nombre: 'Pecho',       tipo: 'FUERZA',   limit: 20 },
  { id: 12, nombre: 'Espalda',     tipo: 'FUERZA',   limit: 25 },
  { id: 13, nombre: 'Hombros',     tipo: 'FUERZA',   limit: 18 },
  { id: 8,  nombre: 'Brazos',      tipo: 'FUERZA',   limit: 25 },
  { id: 9,  nombre: 'Piernas',     tipo: 'FUERZA',   limit: 25 },
  { id: 10, nombre: 'Abdominales', tipo: 'FUERZA',   limit: 20 },
  { id: 14, nombre: 'Gemelos',     tipo: 'FUERZA',   limit: 15 },
];

// ─────────────────────────────────────────────────────────────────────────────
// DICCIONARIOS DE TRADUCCIÓN
// ─────────────────────────────────────────────────────────────────────────────

// Nombres de músculos (wger devuelve name_en en inglés científico)
const MUSCULOS_ES = {
  'biceps brachii':                'Bíceps',
  'triceps brachii':               'Tríceps',
  'anterior deltoid':              'Deltoides anterior',
  'posterior deltoid':             'Deltoides posterior',
  'medial deltoid':                'Deltoides medio',
  'deltoid':                       'Deltoides',
  'pectoralis major':              'Pecho',
  'pectoralis minor':              'Pectoral menor',
  'latissimus dorsi':              'Dorsal ancho',
  'trapezius':                     'Trapecio',
  'rhomboids':                     'Romboides',
  'serratus anterior':             'Serrato anterior',
  'infraspinatus':                 'Infraespinoso',
  'supraspinatus':                 'Supraespinoso',
  'teres major':                   'Redondo mayor',
  'teres minor':                   'Redondo menor',
  'erector spinae':                'Erector espinal',
  'quadriceps femoris':            'Cuádriceps',
  'rectus femoris':                'Cuádriceps',
  'vastus lateralis':              'Cuádriceps',
  'vastus medialis':               'Cuádriceps',
  'biceps femoris':                'Isquiotibiales',
  'hamstrings':                    'Isquiotibiales',
  'gluteus maximus':               'Glúteo mayor',
  'gluteus medius':                'Glúteo medio',
  'gluteus minimus':               'Glúteo menor',
  'gastrocnemius':                 'Gemelos',
  'soleus':                        'Sóleo',
  'tibialis anterior':             'Tibial anterior',
  'iliopsoas':                     'Psoas',
  'adductor longus':               'Aductor largo',
  'adductor brevis':               'Aductor corto',
  'rectus abdominis':              'Recto abdominal',
  'obliquus externus abdominis':   'Oblicuos',
  'obliques':                      'Oblicuos',
  'transversus abdominis':         'Transverso abdominal',
  'brachialis':                    'Braquial',
  'brachioradialis':               'Braquiorradial',
  'coracobrachialis':              'Coracobraquial',
  'subscapularis':                 'Subescapular',
  'levator scapulae':              'Elevador escápula',
  'tensor fasciae latae':          'Tensor fascia lata',
  'sartorius':                     'Sartorio',
  'quadratus lumborum':            'Cuadrado lumbar',
};

// IDs de equipo en wger.de → español
const EQUIPO_ID = {
  1:  'Barra',
  2:  'Barra EZ',
  3:  'Mancuernas',
  4:  'Esterilla',
  5:  'Pelota suiza',
  6:  'Barra de dominadas',
  7:  'Discos',
  8:  'Banda elástica',
  9:  'Kettlebell',
  10: 'Polea',
  11: 'Máquina',
  12: 'Peso corporal',
};

// Traducción de nombres: pares [inglés, español] ordenados de más específico a menos
// El orden importa — frases compuestas primero para evitar traducciones parciales
const PALABRAS_CLAVE = [
  ['barbell squat',          'sentadilla con barra'],
  ['dumbbell squat',         'sentadilla con mancuernas'],
  ['goblet squat',           'sentadilla goblet'],
  ['sumo squat',             'sentadilla sumo'],
  ['front squat',            'sentadilla frontal'],
  ['jump squat',             'sentadilla con salto'],
  ['overhead squat',         'sentadilla overhead'],
  ['bench press',            'press de banca'],
  ['chest press',            'press de pecho'],
  ['shoulder press',         'press de hombros'],
  ['overhead press',         'press sobre cabeza'],
  ['incline press',          'press inclinado'],
  ['decline press',          'press declinado'],
  ['leg press',              'press de pierna'],
  ['arnold press',           'press arnold'],
  ['romanian deadlift',      'peso muerto rumano'],
  ['sumo deadlift',          'peso muerto sumo'],
  ['stiff-leg deadlift',     'peso muerto piernas rígidas'],
  ['single-leg deadlift',    'peso muerto a una pierna'],
  ['lat pulldown',           'jalón al pecho'],
  ['face pull',              'jalón a la cara'],
  ['cable row',              'remo en polea'],
  ['barbell row',            'remo con barra'],
  ['dumbbell row',           'remo con mancuerna'],
  ['bent-over row',          'remo inclinado'],
  ['seated row',             'remo sentado'],
  ['upright row',            'remo al mentón'],
  ['t-bar row',              'remo en T'],
  ['bicep curl',             'curl de bíceps'],
  ['biceps curl',            'curl de bíceps'],
  ['hammer curl',            'curl martillo'],
  ['preacher curl',          'curl en predicador'],
  ['concentration curl',     'curl concentrado'],
  ['reverse curl',           'curl inverso'],
  ['zottman curl',           'curl zottman'],
  ['triceps pushdown',       'extensión de tríceps en polea'],
  ['tricep extension',       'extensión de tríceps'],
  ['skull crusher',          'rompecráneos'],
  ['overhead extension',     'extensión sobre cabeza'],
  ['lateral raise',          'elevación lateral'],
  ['front raise',            'elevación frontal'],
  ['reverse fly',            'apertura inversa'],
  ['chest fly',              'apertura de pecho'],
  ['cable fly',              'apertura en polea'],
  ['pec deck',               'apertura en máquina'],
  ['leg curl',               'curl femoral'],
  ['leg extension',          'extensión de cuádriceps'],
  ['calf raise',             'elevación de gemelos'],
  ['seated calf',            'gemelos sentado'],
  ['hip thrust',             'empuje de cadera'],
  ['glute bridge',           'puente de glúteos'],
  ['good morning',           'buenos días'],
  ['back extension',         'extensión de espalda'],
  ['hyperextension',         'hiperextensión'],
  ['pull-up',                'dominada'],
  ['chin-up',                'dominada supina'],
  ['muscle-up',              'muscle-up'],
  ['push-up',                'flexión'],
  ['pike push-up',           'flexión en pica'],
  ['diamond push-up',        'flexión diamante'],
  ['dip',                    'fondos'],
  ['tricep dip',             'fondos para tríceps'],
  ['plank',                  'plancha'],
  ['side plank',             'plancha lateral'],
  ['crunch',                 'crunch'],
  ['cable crunch',           'crunch en polea'],
  ['sit-up',                 'abdominal'],
  ['leg raise',              'elevación de piernas'],
  ['hanging leg raise',      'elevación de piernas colgado'],
  ['russian twist',          'giro ruso'],
  ['mountain climber',       'escalador'],
  ['burpee',                 'burpee'],
  ['lunge',                  'zancada'],
  ['walking lunge',          'zancada caminando'],
  ['reverse lunge',          'zancada inversa'],
  ['split squat',            'sentadilla búlgara'],
  ['bulgarian split',        'sentadilla búlgara'],
  ['step-up',                'subida a banco'],
  ['box jump',               'salto a cajón'],
  ['deadlift',               'peso muerto'],
  ['squat',                  'sentadilla'],
  ['row',                    'remo'],
  ['curl',                   'curl'],
  ['press',                  'press'],
  ['raise',                  'elevación'],
  ['fly',                    'apertura'],
  ['flye',                   'apertura'],
  ['extension',              'extensión'],
  ['shrug',                  'encogimiento de hombros'],
  ['pullover',               'pullover'],
  ['kickback',               'patada de tríceps'],
  ['clean',                  'cargada'],
  ['snatch',                 'arrancada'],
  ['jerk',                   'envión'],
  ['thruster',               'thruster'],
  ['turkish get-up',         'levantamiento turco'],
  ['barbell',                'con barra'],
  ['dumbbell',               'con mancuerna'],
  ['cable',                  'en polea'],
  ['machine',                'en máquina'],
  ['incline',                'inclinado'],
  ['decline',                'declinado'],
  ['seated',                 'sentado'],
  ['standing',               'de pie'],
  ['lying',                  'tumbado'],
  ['close-grip',             'agarre estrecho'],
  ['wide-grip',              'agarre amplio'],
  ['reverse-grip',           'agarre inverso'],
  ['single-arm',             'un brazo'],
  ['one-arm',                'un brazo'],
];

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIONES AUXILIARES
// ─────────────────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchJSON(url) {
  const res = await fetch(url, {
    headers: {
      'Accept':     'application/json',
      'User-Agent': 'Strive-Fitness-App/1.0 (educational project)',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} al pedir ${url}`);
  return res.json();
}

/** Aplica diccionario de palabras clave para traducir el nombre del ejercicio */
const ESCAPED_HYPHEN = String.raw`\-`;

function traducirNombre(nombreEN) {
  if (!nombreEN) return nombreEN;
  let s = nombreEN.toLowerCase();
  for (const [en, es] of PALABRAS_CLAVE) {
    const escaped = en.replaceAll('-', ESCAPED_HYPHEN);
    s = s.replaceAll(new RegExp(String.raw`\b${escaped}\b`, 'g'), es);
  }
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Devuelve true si el nombre parece estar en un idioma distinto al inglés/español.
 * wger.de incluye ejercicios en alemán, holandés, etc. aunque se filtre por language=2.
 * Detecta caracteres fuera del rango latino-español y palabras claramente no latinas.
 */
function estaEnIdiomaExtranjero(nombre) {
  if (!nombre) return true;
  // Caracteres completamente ajenos al español/inglés (cirílico, árabe, CJK, etc.)
  if (/[Ѐ-ӿ؀-ۿ一-鿿]/.test(nombre)) return true;
  // Patrones de palabras típicamente holandesas/alemanas que no son nombres de ejercicios
  const patronesExtranjerosObvios = /\b(de|het|een|voor|met|op|aan|bij|van|uit|ij|oe|aa)\b/i;
  if (patronesExtranjerosObvios.test(nombre) && !/\b(de pie|con|en|para)\b/i.test(nombre)) return true;
  return false;
}

/**
 * Devuelve true si la traducción resultó en un nombre mezclado (inglés + español)
 * que indica que el diccionario sólo tradujo parte del nombre.
 * Ejemplo: "Wide flexión", "Con mancuerna rear zancada"
 */
const PALABRAS_INGLESAS = new Set([
  'with', 'using', 'and', 'from', 'into',
  'wide', 'rear', 'high', 'low', 'upper', 'lower', 'inner', 'outer',
  'flat', 'bent', 'straight', 'alternate', 'alternating', 'slow', 'fast',
  'full', 'partial', 'double', 'triple', 'forward', 'backward',
  'arm', 'leg', 'chest', 'back', 'shoulder', 'hip', 'knee', 'foot', 'hand',
  'grip', 'bench', 'floor', 'wall', 'ball', 'rope', 'band', 'ring',
  'rack', 'dumbbell', 'barbell', 'weight', 'plate', 'kettlebell',
  'foam', 'roller', 'pull', 'push', 'lift', 'hold', 'walk', 'run',
  'jump', 'swing', 'twist', 'rotation', 'abduction', 'adduction',
  'flexion', 'elevation', 'external', 'internal', 'decline', 'overhead',
  'close', 'narrow', 'supine', 'prone', 'lying',
]);

function tieneTraduccionMezclada(titulo) {
  return titulo.toLowerCase().split(/\W+/).some(w => PALABRAS_INGLESAS.has(w));
}

/** Traduce un objeto músculo de wger (que tiene name y name_en) */
function traducirMusculo(m) {
  if (!m) return null;
  const en = (m.name_en || '').toLowerCase().trim();
  return MUSCULOS_ES[en] || MUSCULOS_ES[(m.name || '').toLowerCase()] || m.name || null;
}

/**
 * Infiere dificultad a partir del nombre en inglés y los IDs de equipo.
 * wger.de no tiene campo de dificultad, así que lo inferimos con heurística.
 */
function inferirDificultad(nombreEN, equipmentIds) {
  const n = (nombreEN || '').toLowerCase();
  // Movimientos olímpicos o de alta complejidad → AVANZADO
  if (/\b(clean|snatch|jerk|muscle.up|planche|handstand|turkish get.up|power clean|hang clean|thruster)\b/.test(n)) {
    return 'AVANZADO';
  }
  // Solo peso corporal → PRINCIPIANTE si es un movimiento básico conocido
  const soloPesoCorporal = equipmentIds.length === 0
    || (equipmentIds.length === 1 && equipmentIds[0] === 12)
    || (equipmentIds.length === 1 && equipmentIds[0] === 4); // esterilla
  if (soloPesoCorporal) return 'PRINCIPIANTE';
  return 'INTERMEDIO';
}

/** Genera una descripción en español cuando wger no proporciona una */
function generarDescripcion(nombre, musculos, categoriaNombre, equipoNombres) {
  const m = musculos.length > 0 ? musculos.join(', ') : categoriaNombre.toLowerCase();
  const e = equipoNombres.length > 0 ? equipoNombres.join(' y ') : 'peso corporal';
  return `Ejercicio de ${categoriaNombre.toLowerCase()} que trabaja principalmente ${m}. Se realiza con ${e}.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAPEO PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

function mapearEjercicio(item, categoriaNombre, tipoDefault) {
  // ── Nombre ──────────────────────────────────────────────────────────────────
  // wger devuelve traducciones en el campo `translations` con language=2 (inglés) y 6 (español)
  const transES = item.translations?.find(t => t.language === 6 && t.name?.trim());
  const transEN = item.translations?.find(t => t.language === 2 && t.name?.trim());
  const nombreEN = transEN?.name?.trim() || item.name?.trim() || '';
  if (!nombreEN) return null;

  const title = transES?.name?.trim() || traducirNombre(nombreEN);
  if (!title) return null;

  // Descartar si el nombre fuente no está en inglés (puede ser holandés/alemán en wger)
  if (estaEnIdiomaExtranjero(nombreEN)) return null;
  // Descartar traducciones parciales (solo cuando usamos nuestro diccionario, no la traducción oficial de wger)
  if (!transES && tieneTraduccionMezclada(title)) return null;

  // ── Descripción ─────────────────────────────────────────────────────────────
  let description = transES?.description || transEN?.description || '';
  description = description
    .replace(/<[^>]*>/g, ' ')   // quitar HTML
    .replace(/&[a-z]+;/g, ' ') // quitar entidades HTML
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1200);

  // ── Músculos ─────────────────────────────────────────────────────────────────
  const todosLosMusculos = [...(item.muscles || []), ...(item.muscles_secondary || [])];
  const muscleGroups = [...new Set(
    todosLosMusculos.map(traducirMusculo).filter(Boolean)
  )];
  if (!muscleGroups.length) muscleGroups.push(categoriaNombre);

  // ── Equipo ───────────────────────────────────────────────────────────────────
  const equipmentIds   = (item.equipment || []).map(e => e.id);
  const equipmentNames = equipmentIds.map(id => EQUIPO_ID[id]).filter(Boolean);

  // ── Descripción generada si wger no tiene ninguna ────────────────────────────
  if (!description) {
    description = generarDescripcion(title, muscleGroups, categoriaNombre, equipmentNames);
  }

  // ── Tipo de ejercicio ─────────────────────────────────────────────────────────
  const type = (item.category?.name || '').toLowerCase() === 'cardio' ? 'CARDIO' : tipoDefault;

  // ── Imagen ────────────────────────────────────────────────────────────────────
  const imageUrl = item.images?.length > 0
    ? `https://wger.de${item.images[0].image}`
    : null;

  // ── Dificultad (inferida) ─────────────────────────────────────────────────────
  const difficulty = inferirDificultad(nombreEN, equipmentIds);

  return {
    title,
    description,
    imageUrl,
    type,
    difficulty,
    muscleGroups,
    // _meta se elimina en la salida final; sólo para depuración interna
    _meta: { wgerId: item.id, originalName: nombreEN, equipment: equipmentNames },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// FETCH POR CATEGORÍA
// ─────────────────────────────────────────────────────────────────────────────

async function fetchCategoria(cat) {
  const resultado = [];
  // language=2 filtra para mostrar solo ejercicios con traducción al inglés
  let url = `${WGER_BASE}/exerciseinfo/?format=json&category=${cat.id}&language=2&limit=50&offset=0`;

  while (url && resultado.length < cat.limit) {
    const data = await fetchJSON(url);
    for (const item of data.results) {
      if (resultado.length >= cat.limit) break;
      const mapped = mapearEjercicio(item, cat.nombre, cat.tipo);
      if (mapped) resultado.push(mapped);
    }
    url = (data.next && resultado.length < cat.limit) ? data.next : null;
    if (url) await sleep(DELAY_MS);
  }
  return resultado;
}

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTACIÓN DIRECTA AL BACKEND (OPCIONAL)
// ─────────────────────────────────────────────────────────────────────────────

async function importarAlBackend(ejercicios, backendUrl, token) {
  console.log(`\nImportando ${ejercicios.length} ejercicios a ${backendUrl}...`);
  let creados = 0, duplicados = 0, errores = 0;

  for (const ej of ejercicios) {
    const payload = {
      title:        ej.title,
      description:  ej.description,
      imageUrl:     ej.imageUrl,
      type:         ej.type,
      difficulty:   ej.difficulty,
      muscleGroups: ej.muscleGroups,
    };
    try {
      const res = await fetch(`${backendUrl}/api/exercises`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if      (res.status === 201) creados++;
      else if (res.status === 409) duplicados++;  // título duplicado, se omite
      else {
        errores++;
        const body = await res.text();
        console.warn(`  WARN ${res.status} "${ej.title}": ${body.slice(0, 120)}`);
      }
    } catch (e) {
      errores++;
      console.warn(`  ERROR "${ej.title}": ${e.message}`);
    }
    await sleep(80);
  }

  const linea = '─'.repeat(50);
  console.log(`\n${linea}`);
  console.log(`  Importación completada`);
  console.log(`  ✓ Creados:     ${creados}`);
  console.log(`  ~ Duplicados:  ${duplicados}`);
  console.log(`  ✗ Errores:     ${errores}`);
  console.log(linea);
}

// ─────────────────────────────────────────────────────────────────────────────
// PUNTO DE ENTRADA
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  // --limit <n>  ajusta cuántos ejercicios por categoría
  const limitIdx = args.indexOf('--limit');
  if (limitIdx !== -1) {
    const n = Number.parseInt(args[limitIdx + 1], 10);
    if (!Number.isNaN(n) && n > 0) CATEGORIAS.forEach(c => (c.limit = n));
  }

  // --import <backendUrl> <jwtToken>  importa al backend tras guardar el JSON
  const importIdx = args.indexOf('--import');
  const doImport  = importIdx !== -1;
  const backendUrl = doImport ? args[importIdx + 1] : null;
  const token      = doImport ? args[importIdx + 2] : null;

  if (doImport && (!backendUrl || !token)) {
    console.error('Error: --import requiere <backendUrl> y <jwtToken>');
    console.error('  Ejemplo: node scripts/fetch-ejercicios.js --import http://localhost:8080 eyJhbGci...');
    process.exit(1);
  }

  const sepAncho = '═'.repeat(50);
  console.log(`\n╔${sepAncho}╗`);
  console.log(`║       Strive — Fetch de Ejercicios            ║`);
  console.log(`║       Fuente: wger.de REST API (gratuita)     ║`);
  console.log(`╚${sepAncho}╝\n`);

  const todos = [];

  for (const cat of CATEGORIAS) {
    process.stdout.write(`  [${cat.nombre.padEnd(12)}] Descargando (límite ${cat.limit})... `);
    try {
      const lote = await fetchCategoria(cat);
      todos.push(...lote);
      console.log(`${lote.length} ✓`);
    } catch (e) {
      console.log(`ERROR: ${e.message}`);
    }
    await sleep(DELAY_MS);
  }

  // Deduplicar por título (normalizado)
  const vistos = new Set();
  const unicos = todos.filter(e => {
    const key = e.title.toLowerCase().trim();
    if (vistos.has(key)) return false;
    vistos.add(key);
    return true;
  });

  // Eliminar _meta del JSON de salida
  const salida = unicos.map(({ _meta, ...rest }) => rest);

  fs.writeFileSync(OUT_FILE, JSON.stringify(salida, null, 2), 'utf8');

  console.log(`\n╔${sepAncho}╗`);
  console.log(`║  ${salida.length} ejercicios únicos guardados`);
  console.log(`║  Archivo: ejercicios-scraped.json`);
  console.log(`╚${sepAncho}╝`);

  // Mostrar un ejercicio de muestra
  if (salida.length > 0) {
    console.log('\nEjemplo de objeto generado:');
    console.log(JSON.stringify(salida[Math.floor(salida.length / 2)], null, 2));
  }

  if (doImport) {
    await importarAlBackend(unicos, backendUrl, token);
  }
}

main().catch(err => {
  console.error('\nError fatal:', err.message);
  process.exit(1);
});
