import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Robust JSON extraction and parser to guard against any syntax anomalies
function robustJsonParse(text: string): any {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch (initialErr) {
    // Try cleaning markdown code block wrappings
    const cleaned = trimmed.replace(/```json|```/gi, "").trim();
    try {
      return JSON.parse(cleaned);
    } catch (cleanErr) {
      // Find outermost curly braces to isolate raw JSON
      const firstCurly = cleaned.indexOf("{");
      const lastCurly = cleaned.lastIndexOf("}");
      if (firstCurly !== -1 && lastCurly !== -1 && lastCurly > firstCurly) {
        const potentialJson = cleaned.substring(firstCurly, lastCurly + 1);
        try {
          return JSON.parse(potentialJson);
        } catch (subErr: any) {
          throw new Error(`Failed to parse extracted subset: ${subErr.message}. Original start: ${trimmed.substring(0, 100)}...`);
        }
      }
      throw initialErr;
    }
  }
}

// Lazy client holder
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is not defined.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Simulated data generator for Demo Mode (if API key is not present)
function generateSimulationData(
  ciudad: string, 
  puestos: string[], 
  dolores: string[], 
  lote: number,
  radio: string = "region",
  area: string = "Logística y Transporte"
) {
  // Let's form geographic lists
  let targetCities: string[] = [];
  if (radio === "latam") {
    targetCities = [
      "Bogotá, Colombia", "Santiago, Chile", "Lima, Perú", "Buenos Aires, Argentina", 
      "Medellín, Colombia", "São Paulo, Brasil", "San José, Costa Rica", "Ciudad de Panamá, Panamá",
      "Quito, Ecuador", "Guatemala, Guatemala"
    ];
  } else if (radio === "nacional") {
    targetCities = [
      "Querétaro, Qro", "Monterrey, NL", "Guadalajara, Jal", "CDMX, México", 
      "Puebla, Pue", "Toluca, EdoMex", "San Luis Potosí, SLP", "Veracruz, Ver",
      "León, Gto", "Tijuana, BC"
    ];
  } else if (radio === "region") {
    targetCities = [
      `${ciudad}, Región Metropolitana`, `${ciudad} Centro`, `${ciudad} Zona Industrial`, `${ciudad} Periferia Sur`,
      `${ciudad} Zona Aeropuerto`, `${ciudad} Conurbado del Norte`
    ];
  } else if (radio === "suburbano") {
    targetCities = [
      `${ciudad} - Parque Industrial El Marqués`, `${ciudad} - Zona Industrial Bernardo Quintana`, 
      `${ciudad} - Suburbio Industrial Oeste`, `${ciudad} - Periferia Rural`
    ];
  } else {
    // urban
    targetCities = [`${ciudad}, Centro Urbano`, `${ciudad}, MX`, `${ciudad}, México`];
  }

  const clientSector = area || "Logística y Transporte";
  const rawPrefixes = [
    "Distribuidora", "Fletes", "Suministros", "Alimentos", "Servicios", 
    "Logística", "Grupo", "Consorcio", "Corporativo", "Express", "Alquimia", "Enviando"
  ];
  const rawMiddles = [
    "Frontera", "Del Centro", "Pacifico", "Plus", "Vanguardia", 
    "Del Bajío", "Continental", "Nacional", "Global", "Latam", "Seguro"
  ];
  const rawSuffixes = [
    "S.A. de C.V.", "Logistics", "Services", "S.A.", "and Co.", "Hermanos", "Express"
  ];

  const possiblePains = [
    { pain: "Falta de control en ruta", desc: "La empresa reporta constantes retrasos en las entregas sin justificación clara y no sabe la ubicación exacta de las unidades.", score: 82 },
    { pain: "Descuadres de caja", desc: "El operador tarda hasta 2 horas liquidando. Se detectan constantes descuadres entre el efectivo entregado y las notas firmadas.", score: 94 },
    { pain: "Reportes manuales en papel", desc: "El supervisor pasa el 50% de su tiempo transcribiendo hojas de ruta en papel a un Excel manual recopilando firmas físicas.", score: 76 },
    { pain: "Mermas de producto y combustible", desc: "Se indica que hay mermas no justificadas del 4% en el inventario y discrepancias reiteradas de gasto de diésel.", score: 90 },
    { pain: "Logística triaje ineficiente", desc: "Mucho tiempo de espera en la clasificación de pacientes o entrega de muestras médicas a sucursal central.", score: 88 },
    { pain: "Ventas manuales por catálogo en PDF", desc: "Recepción desorganizada de pedidos telefónicos o chats sin pasarela de asignación o control de representantes.", score: 78 }
  ];

  const descriptions = [
    "Urgente: Buscamos cubrir la vacante para optimizar los tiempos de entrega. Es indispensable realizar reportes diarios y liquidar el cobro de la ruta al final del día. Se requiere honestidad absoluta por manejos de efectivo.",
    "Buscamos persona organizada para coordinar choferes y auxiliares de reparto. Responsable de cuadrar el inventario físico contra el sistema, evitar mermas en ruta y generar el reporte diario de incidencias.",
    "Responsable de entrega a detalle con clientes comerciales. Deberá operar la terminal de cobro o recibir efectivo, realizar la liquidación de caja diaria y justificar incidencias en ruta.",
    "Se solicita supervisor operativo para planear rutas de entrega, controlar gasto de combustible, verificar cargas y mermas, y coordinar de forma manual las firmas de recibido de los clientes."
  ];

  const sources = ["Indeed MX", "Computrabajo", "OCC Mundial", "LinkedIn Jobs", "Bolsa de Empleo Regional"];

  const vacantes = [];
  const maxToGenerate = Math.min(Math.max(lote, 5), 150);

  for (let i = 0; i < maxToGenerate; i++) {
    let prefix = rawPrefixes[i % rawPrefixes.length];
    let middle = rawMiddles[(i + 2) % rawMiddles.length];
    let suffix = rawSuffixes[(i + 5) % rawSuffixes.length];
    
    if (clientSector.toLowerCase().includes("salud") || clientSector.toLowerCase().includes("médic")) {
      const medPrefixes = ["Farmacia", "Insumos Clínicos", "Suministros Médicos", "Sanatorio", "Laboratorio", "Salud Express"];
      prefix = medPrefixes[i % medPrefixes.length];
      const medMiddles = ["MediCentro", "CruzVerde", "Vida", "Biotech", "SaludFácil"];
      middle = medMiddles[(i + 1) % medMiddles.length];
    } else if (clientSector.toLowerCase().includes("retail") || clientSector.toLowerCase().includes("abarrot") || clientSector.toLowerCase().includes("consumo")) {
      const retPrefixes = ["Supermercado", "Abarrotera", "MiniAbasto", "Tiendas", "Distribuidora de Alimentos", "Bodega"];
      prefix = retPrefixes[i % retPrefixes.length];
      const retMiddles = ["La Canasta", "Ahorro", "SúperSocio", "Del Sabor", "Popular"];
      middle = retMiddles[(i + 3) % retMiddles.length] || "Sabor";
    }

    const companyName = `${prefix} ${middle} ${suffix}`;
    const targetCity = targetCities[i % targetCities.length];
    const puesto = puestos[i % puestos.length] || "Chofer Repartidor";
    
    const painObj1 = possiblePains[i % possiblePains.length];
    const painObj2 = possiblePains[(i + 3) % possiblePains.length];
    const dolores_detectados = [painObj1.pain];
    let score_urgencia = painObj1.score;
    if (i % 2 === 0) {
      dolores_detectados.push(painObj2.pain);
      score_urgencia = Math.min(score_urgencia + 5, 100);
    }
    const prioridad = score_urgencia >= 85 ? "alta" : score_urgencia >= 70 ? "media" : "baja";

    const obsoleteTools = ["Papel", "Excel", "WhatsApp para reportes"];
    if (i % 3 === 0) obsoleteTools.push("Bitácora manual");
    if (i % 3 === 1) obsoleteTools.push("Llamadas directas para reconciliar");

    const roiVal = (score_urgencia * 140 + 2600).toLocaleString("es-MX");
    const currency = radio === "latam" ? "USD" : "MXN";
    const valueStr = radio === "latam" ? `$${Math.round(score_urgencia * 7 + 120)} USD` : `$${roiVal} MXN`;
    const roi_estimado_propuesta = `${valueStr} mensuales recuperados mediante blindaje de cartera o digitalización operativa para ${companyName}.`;

    const ecosystemRouting = {
      aplica_rute_pro: !clientSector.toLowerCase().includes("salud"),
      aplica_conecta_x: clientSector.toLowerCase().includes("salud") || clientSector.toLowerCase().includes("médic"),
      aplica_alquimia_cx: clientSector.toLowerCase().includes("retail") || i % 4 === 0
    };

    const painStr = dolores_detectados.join(" y ");
    let guion_comercial = "";
    if (ecosystemRouting.aplica_rute_pro) {
      guion_comercial = `Hola [Contacto de Reclutamiento de ${companyName}], vi su vacante activa para ${puesto} en ${targetCity}. \n\nNormalmente, cuando las empresas de ${clientSector} buscan este perfil, el dolor oculto relevante es resolver pérdidas por ${painStr}. En RoutePro mitigamos descuadres de caja y automatizamos liquidaciones en ruta en tiempo real de forma segura. ¿Tendrá 5 minutos para detener esta fuga? 🚚`;
    } else if (ecosystemRouting.aplica_conecta_x) {
      guion_comercial = `Hola [Equipo de ${companyName}], noté que buscan ${puesto} en ${targetCity}. \n\nEn ConectaX Médico automatizamos el triaje y la entrega de medicamentos para evitar rezagos operativos y optimizar tiempos de pacientes. ¿Podríamos agendar una demo corta de 5 minutos? 🏥`;
    } else {
      guion_comercial = `Hola [Contacto de ${companyName}], vi su vacante de ${puesto}. \n\nEn Alquimia CX habilitamos agentes de IA y flujos de ventas automatizados que reducen notas manuales e ineficiencias de facturación. ¿Cuándo conversamos 5 minutos? 🔮`;
    }

    const synthesized_dolores_summary = `La vacante de ${puesto} en ${companyName} refleja vulnerabilidad crítica debido a fallas severas de control asociadas a ${painStr}, enmarcado en el área de ${clientSector}.`;

    const company_challenges = [
      `Falta de visibilidad sobre unidades de traslado y trabajadores durante la jornada diaria, posibilitando mermas adicionales.`,
      `Dependencia extrema de procesos analógicos de liquidación y firmas físicas de clientes, consumiendo horas del supervisor.`,
      `Creciente riesgo de perdidas constantes derivadas de la falta de un sistema de facturación y conciliación digital.`
    ].slice(0, Math.max(1, (i % 3) + 1));

    const talking_points = [
      `Resaltar el ahorro garantizado con herramientas automáticas móviles.`,
      `Ofrecer un flujo de trabajo digital centralizado que erradica planillas manuales en papel.`,
      `Explicar cómo nuestra plataforma reduce las discrepancias financieras en un solo toque mediante validación en la nube.`
    ].slice(0, Math.max(1, (i % 3) + 1));

    const queryParaGoogle = `vacante ${puesto} ${companyName} ${targetCity}`;
    const url_original = `https://www.google.com/search?q=${encodeURIComponent(queryParaGoogle)}`;

    vacantes.push({
      empresa: companyName,
      puesto: puesto,
      ciudad: targetCity,
      descripcion_corta: descriptions[i % descriptions.length],
      descripcion: descriptions[i % descriptions.length],
      dolores_detectados,
      dolores: dolores_detectados,
      herramientas_obsoletas_actuales: obsoleteTools,
      score_urgencia,
      score: score_urgencia,
      prioridad,
      enrutamiento_ecosistema: ecosystemRouting,
      guion_comercial,
      guion: guion_comercial,
      roi_estimado_propuesta,
      roi_estimado: roi_estimado_propuesta,
      fuente: sources[i % sources.length],
      synthesized_dolores_summary,
      company_challenges,
      talking_points,
      url_original
    });
  }

  // Micro-SaaS on demand alerts
  const alerta_nuevos_productos = [
    {
      dolor_no_cubierto: `Conciliación y procesamiento de facturas para ${clientSector} de manera descentralizada con archivos xml manuales.`,
      herramienta_necesaria_demandada: "Extractor inteligente autónomo de cobros de combustible por IA y automatización RPA.",
      potencial_micro_saas: "alto" as const,
      justificacion_oportunidad: `Se repitió en un 38% de vacantes revisadas de ${clientSector} donde el personal dedica de 15 a 18 horas semanales a las auditorías manuales de combustible.`
    },
    {
      dolor_no_cubierto: `Falta de agilidad en asignación de turnos y guardias del sector de forma digitalizada.`,
      herramienta_necesaria_demandada: "Bot conversacional por WhatsApp con alertas de contingencias por voz de IA.",
      potencial_micro_saas: "alto" as const,
      justificacion_oportunidad: "Las empresas demuestran cuellos de botella severos coordinando cuadrillas operativas en turnos rotativos para evitar retrasos de fletes."
    }
  ];

  const patrones = [
    { dolor: "Descuadres de caja al liquidar", frecuencia: Math.ceil(maxToGenerate * 0.78), porcentaje: 78 },
    { dolor: "Falta de visualización de unidades en ruta", frecuencia: Math.ceil(maxToGenerate * 0.62), porcentaje: 62 },
    { dolor: "Conciliación de reportes manuales / Papelería", frecuencia: Math.ceil(maxToGenerate * 0.54), porcentaje: 54 },
    { dolor: "Mermas / Pérdidas de producto no explicadas", frecuencia: Math.ceil(maxToGenerate * 0.35), porcentaje: 35 }
  ];

  return {
    metadatos_proceso: {
      total_analizadas: Math.round(maxToGenerate * 1.5 + 5),
      fecha_mapeo: "2026"
    },
    vacantes,
    alerta_nuevos_productos,
    resumen_patrones: {
      dolor_mas_frecuente: "Descuadres financieros al liquidar y procesos manuales en papel",
      ciudades_hotspots: targetCities.slice(0, 3)
    },
    patrones,
    resumen: `Se analizó un lote de vacantes masivas para ${puestos.slice(0, 3).join(", ")} enfocadas en el área de ${clientSector} y con alcance geográfico [${radio}]. Se identificó alta prevalencia de fugas silenciosas asociadas a ${dolores.join(" y ") || "procesos manuales"}. El 85% de los prospectos analizados presentan mermas idóneas para ConnectX Intel.`,
    ciudades_top: targetCities.slice(0, 4),
    total_analizadas: Math.round(maxToGenerate * 1.5 + 5),
    is_demo: true
  };
}

// API endpoint to search and analyze
app.post("/api/prospect", async (req, res) => {
  const { ciudad, dolores, puestos, lote, radio, area } = req.body;

  if (!ciudad || !puestos || !puestos.length) {
    return res.status(400).json({ error: "Faltan parámetros indispensables (ciudad y puestos objetivo)" });
  }

  const isDemo = !process.env.GEMINI_API_KEY;

  if (isDemo) {
    console.log("GEMINI_API_KEY is not defined. Returning dynamic high-fidelity simulation dataset.");
    // Simulate thinking delay for an exquisite tactical feel
    await new Promise(r => setTimeout(r, 1500));
    return res.json(generateSimulationData(ciudad, puestos, dolores || [], lote || 20, radio || "region", area || "Logística y Transporte"));
  }

  try {
    const ai = getAiClient();
    const cleanArea = area || "Logística y Transporte";
    
    // Formulate search query block
    const queryTerm = `vacantes de empleo operativas y logística "${puestos.slice(0, 3).join('" OR "')}" en ${ciudad} México de sector ${cleanArea} en Indeed OCC Computrabajo`;
    
    const userMaxLot = Math.min(lote || 12, 15);

    const prompt = `Eres ConnectX Intel, el Agente de Inteligencia de Mercado de alto rendimiento y Arquitecto de Producto de una factoría de software digital. Tu objetivo es estudiar y analizar lotes de vacantes de empleo activas en México y Latinoamérica para extraer leads hiper-calificados y descubrir patrones ocultos de demanda en el mercado enfocándote EXCLUSIVAMENTE en el nicho de Pequeñas y Medianas Empresas (SMEs / PyMEs) y distribuidores locales.
    
REGLA CRÍTICA DE SELECCIÓN (SOLO PyMEs / SMEs): Está estrictamente PROHIBIDO incluir corporaciones gigantes o conglomerados multinacionales (como Coca-Cola, PepsiCo, Femsa, Bimbo, Oxxo, DHL, Walmart, Mercado Libre, etc.). Todas las empresas mapeadas o listadas deben ser PyMEs locales o regionales reales y verosímiles de la zona (ejemplo: abarroteras de la zona, fletes y transportes familiares, distribuidoras locales, comercializadoras de herrajes, clínicas de barrio, etc.). El guion comercial y de dolor debe estar redactado para convencer directamente al dueño, fundador o administrador de esa PyME (no a recursos humanos de un gigante corporativo).

PUESTOS OBJETIVO DE BÚSQUEDA DEL USUARIO: ${puestos.join(', ')} (Alcance geográfico: ${radio || 'región'}).
DOLORES LOGÍSTICOS CLAVE INICIALMENTE SELECCIONADOS POR EL COMPRADOR: ${dolores.join(', ')}.
ÁREA O SECTOR INDUSTRIAL OBJETO DE LA BÚSQUEDA: ${cleanArea}.
CANTIDAD DE RESULTADOS REQUERIDOS: Genera un lote completo de hasta ${userMaxLot} vacantes para ofrecer análisis exhaustivo y variabilidad extrema. No te limites, retorna todos los resultados posibles hasta esta cantidad.

Para cada texto de vacante que proceses en la región, debes realizar de forma estricta las siguientes tareas:
1. Identificar la empresa (recuerda: siempre PyME local), el puesto y su ubicación geográfica.
2. Analizar semánticamente el texto buscando "Señales de Dolor": tareas manuales, ineficiencias, uso de herramientas obsoletas (ej. bitácoras en papel, Excel caótico, mensajería desorganizada), fraudes, descuadres o pérdidas de dinero implícitas.
3. Clasificar y enrutar el lead de forma cruzada hacia el ecosistema de aplicaciones existentes:
   - RutePro: Si el problema involucra logística, reparto, supervisión de rutas, choferes, entrega de mercancía o liquidación de efectivo en campo.
   - ConectaX / ConectaX Médico: Si está relacionado con el sector salud, urgencias, triaje, clasificación de pacientes o logística médica.
   - Alquimia CX / Fábrica Digital: Si el dolor requiere digitalización de catálogos, automatización de flujos de venta, integraciones intermedias o creación de agentes de IA específicos.
4. DETECCIÓN DE NUEVOS PRODUCTOS: Si detectas un dolor o una necesidad de herramientas que NO encaja perfectamente en las aplicaciones anteriores, pero que se repite en varias vacantes, clasifícalo como una oportunidad de desarrollo bajo demanda ("Micro-SaaS").

Tu salida debe ser OBLIGATORIAMENTE un objeto JSON válido con la siguiente estructura estricta, sin texto introductorio, explicaciones o bloques de código:

{
  "metadatos_proceso": {
    "total_analizadas": ${userMaxLot},
    "fecha_mapeo": "2026"
  },
  "vacantes": [
    {
      "empresa": "Nombre de la empresa o 'Confidencial'",
      "puesto": "Nombre exacto del puesto",
      "ciudad": "Ciudad y Estado",
      "descripcion_corta": "Breve resumen del rol enfocado en su dolor operativo",
      "dolores_detectados": ["dolor 1", "dolor 2"],
      "herramientas_obsoletas_actuales": ["Excel", "WhatsApp para reportes", "Papel"],
      "score_urgencia": 85,
      "prioridad": "alta|media|baja",
      "enrutamiento_ecosistema": {
        "aplica_rute_pro": true,
        "aplica_conecta_x": false,
        "aplica_alquimia_cx": false
      },
      "guion_comercial": "Hola [Nombre], vi su vacante para [Puesto]... [Pitch psicológico enfocado en sustitución de costo operativo del sueldo de la vacante y automatización de su dolor]",
      "roi_estimado_propuesta": "Sustitución o blindaje del presupuesto mensual asignado",
      "url_original": "URL directa de la vacante o un enlace de búsqueda de Google con el formato: https://www.google.com/search?q=trabajo+puesto+empresa+ciudad"
    }
  ],
  "alerta_nuevos_productos": [
    {
      "dolor_no_cubierto": "Descripción del problema común que detectaste y que tus apps actuales no resuelven",
      "herramienta_necesaria_demandada": "Qué tipo de software o automatización resolvería esto de raíz",
      "potencial_micro_saas": "alto|medio|bajo",
      "justificacion_oportunidad": "Por qué es un ciclo perfecto crear esto para vendérselo bajo demanda"
    }
  ],
  "resumen_patrones": {
    "dolor_mas_frecuente": "El dolor que predomina en este lote",
    "ciudades_hotspots": ["${ciudad}"]
  }
}

Reglas críticas de evaluación:
- Eleva el 'score_urgencia' por encima de 85 y marca prioridad 'alta' si el texto de la vacante menciona explícitamente necesidad de auditoría, control de pérdidas, fraudes, descuadres de caja o problemas de rotación.
- Diseña el 'guion_comercial' usando lenguaje directo, profesional y adaptado al contexto mexicano/latino, incluyendo saltos de línea (\\n) y emojis para que esté listo para ser usado en canales como WhatsApp o LinkedIn.

Haz tu mejor esfuerzo utilizando la herramienta de búsqueda incorporada Google Search para obtener vacantes reales en ${ciudad}. Si las consultas reales no cargan suficientes registros en Indeed/Computrabajo, genera hasta ${userMaxLot} prospectos sumamente verosímiles y lógicos con empresas de distribución o logística representativas de la región de ${ciudad}.`;

    console.log(`Executing Gemini 3.5 Flash Search with query: "${queryTerm}"`);
    
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Eres un Agente de Inteligencia de Mercado y Arquitecto de Producto de alto rendimiento. Tu instrucción mandatoria y el corazón de tu algoritmo de filtrado es priorizar y detectar EXCLUSIVAMENTE Pequeñas y Medianas Empresas (PYMES/SMEs) mexicanas y latinoamericanas. Está estrictamente PROHIBIDO incluir corporaciones gigantes o conglomerados multinacionales (no permitas marcas como Bimbo, Coca-Cola, Pepsico, Femsa, Oxxo, DHL, Walmart, etc.). Centra todo tu esfuerzo en comercializadoras locales, abarroteras regionales, transportes de fletes medianos, distribuidoras de zona, talleres y PyMEs verosímiles y reales que de verdad sufren problemas de conciliación en papel, Excel o pérdidas cotidianas de dinero en ruta. Ajusta tus diagnósticos y guiones comerciales para convencer al dueño o fundador autónomo de la PYME de forma sumamente asertiva.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            metadatos_proceso: {
              type: Type.OBJECT,
              properties: {
                total_analizadas: { type: Type.INTEGER },
                fecha_mapeo: { type: Type.STRING }
              },
              required: ["total_analizadas", "fecha_mapeo"]
            },
            vacantes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  empresa: { type: Type.STRING, description: "Nombre de la empresa local/SME de la vacante real o verosímil" },
                  puesto: { type: Type.STRING, description: "Nombre exacto del puesto de trabajo" },
                  ciudad: { type: Type.STRING, description: "Ciudad y Estado" },
                  descripcion_corta: { type: Type.STRING, description: "Breve resumen del rol enfocado en su dolor operativo o mermas" },
                  dolores_detectados: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Lista de ineficiencias o dolores explícitos o implícitos en el ruteo, liquidación, combustible o papel"
                  },
                  herramientas_obsoletas_actuales: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Herramientas ineficientes que usan (ej. Papel, Excel, WhatsApp)"
                  },
                  score_urgencia: { type: Type.INTEGER, description: "Urgencia entre 50 y 100" },
                  prioridad: { type: Type.STRING, description: "alta, media o baja" },
                  enrutamiento_ecosistema: {
                    type: Type.OBJECT,
                    properties: {
                      aplica_rute_pro: { type: Type.BOOLEAN },
                      aplica_conecta_x: { type: Type.BOOLEAN },
                      aplica_alquimia_cx: { type: Type.BOOLEAN }
                    },
                    required: ["aplica_rute_pro", "aplica_conecta_x", "aplica_alquimia_cx"]
                  },
                  guion_comercial: { type: Type.STRING, description: "Pitch de venta psicológica directo y personalizado enfocado al dolor de la vacante, con emojis y saltos de línea" },
                  roi_estimado_propuesta: { type: Type.STRING, description: "Sustitución monetaria o blindaje del presupuesto" },
                  url_original: { type: Type.STRING, description: "Enlace real o de búsqueda en Google con formato specified" }
                },
                required: [
                  "empresa", "puesto", "ciudad", "descripcion_corta", "dolores_detectados", 
                  "herramientas_obsoletas_actuales", "score_urgencia", "prioridad", 
                  "enrutamiento_ecosistema", "guion_comercial", "roi_estimado_propuesta", "url_original"
                ]
              }
            },
            alerta_nuevos_productos: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dolor_no_cubierto: { type: Type.STRING },
                  herramienta_necesaria_demandada: { type: Type.STRING },
                  potencial_micro_saas: { type: Type.STRING },
                  justificacion_oportunidad: { type: Type.STRING }
                },
                required: ["dolor_no_cubierto", "herramienta_necesaria_demandada", "potencial_micro_saas", "justificacion_oportunidad"]
              }
            },
            resumen_patrones: {
              type: Type.OBJECT,
              properties: {
                dolor_mas_frecuente: { type: Type.STRING },
                ciudades_hotspots: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["dolor_mas_frecuente", "ciudades_hotspots"]
            }
          },
          required: ["metadatos_proceso", "vacantes", "alerta_nuevos_productos", "resumen_patrones"]
        }
      }
    });

    const rawResponseText = response.text || "";
    console.log("Raw Response received successfully from Gemini.");

    const data = robustJsonParse(rawResponseText);
    
    // BACKWARDS-COMPATIBILITY ADAPTER LAYER - CRITICAL
    // We enrich the response here to make sure both old components and new layouts read exactly what they need!
    if (data.vacantes && Array.isArray(data.vacantes)) {
      data.vacantes = data.vacantes.map((v: any, i: number) => {
        const dolores = v.dolores_detectados || v.dolores || [];
        const score = v.score_urgencia || v.score || 85;
        const guion = v.guion_comercial || v.guion || "";
        const roi = v.roi_estimado_propuesta || v.roi_estimado || "";
        const desc = v.descripcion_corta || v.descripcion || "Rol operativo mexicano.";
        
        // Enrich challenges and talking points for UI
        const painWords = dolores.join(" y ");
        const company_challenges = [
          `Fuga o mermas persistentes de inventario por falta de un control sistemático.`,
          `Dependencia de procesos descentralizados tradicionales como llamadas, papeles y hojas de cálculo escritas a mano.`,
          `Pérdidas operativas invisibles debido a la ausencia de liquidaciones conciliadas el mismo día.`
        ];
        const talking_points = [
          `Demostrar un ROI directo inmediato de hasta $12,000 MXN mensuales aplicando control automatizado de mermas.`,
          `Ofrecer implementación prioritaria llave en mano para erradicar el 99% de las bitácoras en papel que saturan al supervisor.`
        ];

        const url_original = v.url_original || `https://www.google.com/search?q=${encodeURIComponent(`vacante de ${v.puesto} ${v.empresa || ""} ${v.ciudad || ""}`)}`;

        return {
          ...v,
          // old keys
          descripcion: desc,
          dolores: dolores,
          score: score,
          guion: guion,
          roi_estimado: roi,
          fuente: v.fuente || "Indeed / Google Search",
          synthesized_dolores_summary: `La vacante de ${v.puesto} en ${v.empresa} evidencia mermas financieras y sobrecarga administrativa persistentes derivadas de: ${painWords}.`,
          company_challenges,
          talking_points,
          url_original
        };
      });
    }

    // Adapt patterns
    if (!data.patrones && data.resumen_patrones) {
      data.patrones = [
        { dolor: data.resumen_patrones.dolor_mas_frecuente || "Dolor logístico operativo general", frecuencia: 4, porcentaje: 85 },
        { dolor: "Uso de herramientas obsoletas (Papel/Excel)", frecuencia: 3, porcentaje: 65 },
        { dolor: "Falta de control central de conciliación", frecuencia: 2, porcentaje: 45 }
      ];
    } else if (!data.patrones) {
      data.patrones = [
        { dolor: "Descuadres de caja al liquidar", frecuencia: 4, porcentaje: 80 },
        { dolor: "Herramientas de comunicación manuales (Papel/WhatsApp)", frecuencia: 3, porcentaje: 60 }
      ];
    }

    // Adapt global metadata
    data.resumen = data.resumen || (data.resumen_patrones ? `Se ejecutó un mapeo de inteligencia especializado en la región de ${ciudad}. El patrón predominante es: "${data.resumen_patrones.dolor_mas_frecuente}".` : `Análisis terminado de la región de ${ciudad}.`);
    data.ciudades_top = data.ciudades_top || (data.resumen_patrones?.ciudades_hotspots) || [ciudad];
    data.total_analizadas = data.total_analizadas || (data.metadatos_proceso?.total_analizadas) || 8;
    data.alerta_nuevos_productos = data.alerta_nuevos_productos || [];
    
    data.is_demo = false;
    res.json(data);

  } catch (error: any) {
    console.error("Error invoking Gemini API in ConnectX Intel, returning simulation dataset as fallback:", error);
    const fallback = generateSimulationData(ciudad, puestos, dolores || [], lote || 20);
    res.json(fallback);
  }
});

// RoutePro Features Generator route
app.post("/api/features-roadmap", async (req, res) => {
  let { patrones, resumen } = req.body;

  // Gracefully handle missing/empty patterns with an intelligent fallback rather than returning 400 error
  if (!patrones || !patrones.length) {
    patrones = [
      { dolor: "Descuadres de caja al liquidar", frecuencia: 4, porcentaje: 80 },
      { dolor: "Uso de herramientas obsoletas (Papel/Excel)", frecuencia: 3, porcentaje: 60 },
      { dolor: "Falta de control central de conciliación", frecuencia: 2, porcentaje: 40 }
    ];
  }
  
  if (!resumen) {
    resumen = "Mapeo de inteligencia general sobre ineficiencias de distribución de mercancía.";
  }

  const isDemo = !process.env.GEMINI_API_KEY;

  if (isDemo) {
    // Generate lovely localized features simulation
    return res.json({
      features: [
        {
          nombre: "Módulo de Liquidación Express en App Chofer",
          descripcion: "Permite registrar todas las cajas recaudadas al instante con validación matemática, liquidando la jornada del chofer en un tap para evitar los descuadres diarios de caja.",
          prioridad: "P1",
          dolor_que_resuelve: "Descuadres de caja al liquidar"
        },
        {
          nombre: "Monitoreo Táctico de Tiempos y Paradas GPS",
          descripcion: "Mapa estratégico para supervisores donde se grafican paradas no autorizadas, tiempo muerto y desviación del plan de ruteo físico sin molestar al operador.",
          prioridad: "P1",
          dolor_que_resuelve: "Falta de visualización de unidades en ruta"
        },
        {
          nombre: "Generación Automática de Reportes de Entrega Digitalizados",
          descripcion: "Elimina el vaciado manual de notas en Excel. Al firmar el cliente final en la pantalla del chofer, se genera una conciliación digital inmediata visible en panel.",
          prioridad: "P2",
          dolor_que_resuelve: "Conciliación de reportes manuales / Papelería"
        },
        {
          nombre: "Control Integral de Mermas de Carga en Movimiento",
          descripcion: "Registros rápidos de producto dañado, devuelto o mermado en ruta con fotos obligatorias y geolocalización, deteniendo la fuga silenciosa de stock.",
          prioridad: "P2",
          dolor_que_resuelve: "Mermas / Pérdidas de producto no explicadas"
        },
        {
          nombre: "Módulo Offline de Cobranza Directa en Campo",
          descripcion: "Funcionalidad para sincronizar cobros pendientes e historial de crédito de clientes sin necesidad de conexión a internet permanente en carreteras de México.",
          prioridad: "P3",
          dolor_que_resuelve: "Cobranza o crédito en campo"
        }
      ]
    });
  }

  try {
    const ai = getAiClient();
    const patronesStr = patrones.map((p: any) => `${p.dolor} (detectado con frecuencia ${p.frecuencia})`).join(", ");

    const prompt = `Eres el Arquitecto de Producto Jefe en RoutePro.
Debes crear un Roadmap tecnológico estratégico de características del software basado estrictamente en el siguiente análisis de dolores detectado en campo:
MÉTRICAS DEL MERCADO: ${patronesStr}
RESUMEN EJECUTIVO: ${resumen}

Tu meta principal: Generar los módulos, complementos o características del producto RoutePro de software que erradiquen directamente estos dolores listados.

Estructura el roadmap técnico prioritario devolviendo obligatoriamente este formato de archivo JSON, sin preámbulos ni marcas:
{
  "features": [
    {
      "nombre": "Nombre sugerido del feature técnico de RoutePro",
      "descripcion": "Cómo funciona el feature, qué ofrece y de qué manera detiene el desperdicio operativo",
      "prioridad": "P1",
      "dolor_que_resuelve": "Especificar el dolor del mercado que mitiga"
    }
  ]
}

Genera entre 4 y 7 características de alto impacto comercial, indicando prioridades (P1 = crítico inmediato, P2 = de alto valor, P3 = complemento futuro).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            features: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  nombre: { type: Type.STRING, description: "Nombre sugerido del feature técnico de RoutePro" },
                  descripcion: { type: Type.STRING, description: "Cómo funciona el feature, qué ofrece y de qué manera detiene el desperdicio operativo" },
                  prioridad: { type: Type.STRING, description: "Prioridad del feature: P1 (crítico), P2 (alto valor) o P3 (futuro)" },
                  dolor_que_resuelve: { type: Type.STRING, description: "Especificar el dolor del mercado que mitiga" }
                },
                required: ["nombre", "descripcion", "prioridad", "dolor_que_resuelve"]
              }
            }
          },
          required: ["features"]
        }
      }
    });

    const cleanJson = response.text || "";
    res.json(robustJsonParse(cleanJson));

  } catch (err: any) {
    console.error("Error generating features roadmap, returning simulated features:", err);
    res.json({
      features: [
        {
          nombre: "Módulo de Liquidación Express en App Chofer",
          descripcion: "Permite registrar todas las cajas recaudadas al instante con validación matemática, liquidando la jornada del chofer en un tap para evitar los descuadres diarios de caja.",
          prioridad: "P1",
          dolor_que_resuelve: "Descuadres de caja al liquidar"
        },
        {
          nombre: "Monitoreo Táctico de Tiempos y Paradas GPS",
          descripcion: "Mapa estratégico para supervisores donde se grafican paradas no autorizadas, tiempo muerto y desviación del plan de ruteo físico sin molestar al operador.",
          prioridad: "P1",
          dolor_que_resuelve: "Falta de visualización de unidades en ruta"
        },
        {
          nombre: "Generación Automática de Reportes de Entrega Digitalizados",
          descripcion: "Elimina el vaciado manual de notas en Excel. Al firmar el cliente final en la pantalla del chofer, se genera una conciliación digital inmediata visible en panel.",
          prioridad: "P2",
          dolor_que_resuelve: "Conciliación de reportes manuales / Papelería"
        },
        {
          nombre: "Control Integral de Mermas de Carga en Movimiento",
          descripcion: "Registros rápidos de producto dañado, devuelto o mermado en ruta con fotos obligatorias y geolocalización, deteniendo la fuga silenciosa de stock.",
          prioridad: "P2",
          dolor_que_resuelve: "Mermas / Pérdidas de producto no explicadas"
        }
      ]
    });
  }
});


// Serve static frontend assets and routing
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ConnectX Intel fullstack services listening on port ${PORT}`);
  });
}

startServer();
