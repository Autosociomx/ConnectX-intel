const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// 1. Inicializa Firebase de forma inteligente y resiliente
function initializeFirebaseAdmin() {
  // Intento de inicialización por Variables de Entorno o Google Cloud ADC
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.K_SERVICE) {
    try {
      admin.initializeApp();
      console.log("☁ Inicializado Firebase Admin con credenciales por defecto de Google Cloud.");
      return admin.firestore();
    } catch (e) {
      console.warn("⚠️ No se pudo inicializar con ADC, probando métodos alternativos...");
    }
  }

  // Comprobar si existe un archivo de configuración local del applet
  const configPath = path.join(__dirname, 'firebase-applet-config.json');
  const serviceAccountKeyPath = path.join(__dirname, 'serviceAccountKey.json');

  if (fs.existsSync(serviceAccountKeyPath)) {
    try {
      const serviceAccount = require(serviceAccountKeyPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseId: process.env.FIRESTORE_DATABASE_ID || "default"
      });
      console.log("🔑 Inicializado Firebase Admin usando serviceAccountKey.json.");
      return admin.firestore();
    } catch (e) {
      console.error("❌ Error al cargar serviceAccountKey.json:", e);
    }
  }

  if (fs.existsSync(configPath)) {
    try {
      const appletConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      // Para entornos locales de desarrollo con el emulador o sandbox
      process.env.GCLOUD_PROJECT = appletConfig.projectId;
      admin.initializeApp({
        projectId: appletConfig.projectId,
        databaseId: appletConfig.firestoreDatabaseId
      });
      console.log(`📡 Inicializado Firebase Admin apuntando al proyecto: ${appletConfig.projectId} (DB: ${appletConfig.firestoreDatabaseId})`);
      return admin.firestore();
    } catch (e) {
      console.error("❌ Error al cargar firebase-applet-config.json para inicialización:", e);
    }
  }

  // Intento fallback básico listo para usar
  try {
    admin.initializeApp();
    return admin.firestore();
  } catch (error) {
    console.error("❌ Error Crítico: No se pudo encontrar serviceAccountKey.json ni configuraciones de entorno válidas.");
    console.log("\n👉 Para ejecutar localmente, descarga el archivo JSON de tu Cuenta de Servicio desde Google Cloud/Firebase Console y colócalo como 'serviceAccountKey.json' en este directorio.\n");
    process.exit(1);
  }
}

const db = initializeFirebaseAdmin();

// 2. Simulación / Lote de Prospectos de México (Automotriz, Salud, Alimentos, Logística)
const prospectosObtenidos = [
  {
    nombre: "Clínica San Juan",
    telefono: "+523111112233",
    direccion: "Av. México, Tepic, Nayarit",
    categoria: "Salud",
    subcategoria: "Consultorio Médico"
  },
  {
    nombre: "Refaccionaria Express El Sol",
    telefono: "+523114445566",
    direccion: "Colonia Menchaca, Tepic, Nayarit",
    categoria: "Automotriz",
    subcategoria: "Refaccionaria"
  },
  {
    nombre: "Distribuidora de Alimentos del Pacífico",
    telefono: "+525599887766",
    direccion: "Central de Abastos, Iztapalapa, CDMX",
    categoria: "Alimentos y Bebidas",
    subcategoria: "Distribuidora Mayorista"
  },
  {
    nombre: "Taller Mecánico Especializado El Norte",
    telefono: "+528112233445",
    direccion: "Av. Universidad, San Nicolás de los Garza, Nuevo León",
    categoria: "Automotriz",
    subcategoria: "Taller Mecánico"
  }
];

async function importarDatos() {
  const batch = db.batch();
  const coleccionRef = db.collection('prospectos');

  console.log(`⌛ Iniciando importación masiva de ${prospectosObtenidos.length} prospectos mexicanos...`);

  prospectosObtenidos.forEach((prospecto) => {
    // Generamos un ID único estructurado para trazabilidad
    const uniqueId = `PROSP_MX_${Math.floor(100000 + Math.random() * 900000)}`;
    const nuevoDocRef = coleccionRef.doc(uniqueId); 
    
    const estructurado = {
      id_prospecto: uniqueId,
      informacion_general: {
        nombre_comercial: prospecto.nombre,
        contacto: { 
          telefono: prospecto.telefono, 
          email: `${prospecto.nombre.toLowerCase().replace(/\s+/g, '')}@gmail.com`, 
          sitio_web: `https://facebook.com/${prospecto.nombre.toLowerCase().replace(/\s+/g, '')}` 
        },
        ubicacion: { 
          direccion_completa: prospecto.direccion,
          geolocalizacion: {
            latitud: 19.4326, // Fallback CDMX / Ajustable
            longitud: -99.1332
          }
        }
      },
      segmentacion: {
        categoria_maestra: prospecto.categoria,
        subcategoria: prospecto.subcategoria,
        tamano_estimado: "Mediano"
      },
      analisis_ia: {
        estado_procesamiento: "pendiente", // Clave para ser analizado por la Cloud Function
        dolores_detectados: [],
        hook_sugerido: "",
        nivel_prioridad_venta: "Media"
      },
      control: {
        fecha_captura: new Date().toISOString(),
        fuente_origen: "Importacion_Masiva_ConnectX",
        asignado_a_campana: "Autosocio_Afiliados_2026"
      }
    };

    batch.set(nuevoDocRef, estructurado);
  });

  await batch.commit();
  console.log(`🚀 ¡ÉXITO! ${prospectosObtenidos.length} prospectos estructurados inyectados con estado 'pendiente'.`);
  console.log(`🤖 La Cloud Function escuchará estos documentos para enriquecerlos con IA.`);
}

importarDatos().catch(err => {
  console.error("❌ Error fatal al ejecutar carga en lote (Batch):", err);
});
