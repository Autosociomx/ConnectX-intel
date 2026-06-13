const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { GoogleGenAI } = require('@google/genai');

admin.initializeApp();

// Configuración perezosa (lazy load) para evitar bloqueos en el arranque frío
let aiClientInstance = null;
function getAIClient() {
  if (!aiClientInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ Advertencia: GEMINI_API_KEY no está definida en el entorno. La llamada a la IA podría fallar.");
    }
    aiClientInstance = new GoogleGenAI({ apiKey: apiKey || "" });
  }
  return aiClientInstance;
}

/**
 * Cloud Function: analizarNuevoProspecto
 * Trigger: Al crearse un nuevo prospecto en la colección 'prospectos'
 * Acción: Si está marcado en estado 'pendiente', contacta a Gemini para 
 *         modelar los dolores y generar un hook de venta altamente efectivo en México.
 */
exports.analizarNuevoProspecto = functions.firestore
  .document('prospectos/{prospectoId}')
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data();

    // Evitamos bucles interminables de ejecución
    if (!data.analisis_ia || data.analisis_ia.estado_procesamiento !== 'pendiente') {
      console.log(`ℹ️ El prospecto ${context.params.prospectoId} no requiere procesamiento (No 'pendiente').`);
      return null;
    }

    const nombre = data.informacion_general?.nombre_comercial || "Negocio Mexicano";
    const categoria = data.segmentacion?.categoria_maestra || "General";
    const subcategoria = data.segmentacion?.subcategoria || "General";
    const direccion = data.informacion_general?.ubicacion?.direccion_completa || "México";

    console.log(`🤖 Iniciando análisis inteligente con IA para: "${nombre}" (${categoria} - ${subcategoria})`);

    const prompt = `
      Analiza el siguiente negocio local en México:
      - Nombre: "${nombre}"
      - Categoría: "${categoria}" / Subcategoría: "${subcategoria}"
      - Ubicación: "${direccion}"
      
      Actúa como un estratega técnico elite B2B especializado en solucionar brechas de software y dolores logísticos/operativos comunes (como mermas de producto, fugas de combustible, conciliaciones en papel, desorden de stock o lentitud de cotizaciones por WhatsApp) para este tipo específico de negocio.
      
      Determina exactamente:
      1. Tres (3) dolores reales y directos que este negocio sufre de forma cotidiana en su logística o supervisión.
      2. Un "hook sugerido" psicológico de impacto comercial para abrir conversación con el dueño (usando un lenguaje corporativo pero sumamente cercano y de urgencia pragmática).
      
      Importante: Devuelve estrictamente un objeto JSON plano que coincida exactamente con la siguiente estructura (ninguna otra palabra, sin bloques de código Markdown como \`\`\`json):
      {
        "dolores": ["Dolor 1", "Dolor 2", "Dolor 3"],
        "hook": "Tu frase persuasiva aquí"
      }
    `;

    try {
      const ai = getAIClient();
      console.log("📡 Invocando a Gemini API...");
      
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
        config: { 
          responseMimeType: 'application/json' 
        }
      });

      if (!response.text) {
        throw new Error("La respuesta de la IA llegó vacía.");
      }

      console.log("📦 Respuesta bruta de la IA recibida:", response.text);

      // Limpieza de posibles tags markdown de reaseguro
      let cleanJsonText = response.text.trim();
      if (cleanJsonText.startsWith("```json")) {
        cleanJsonText = cleanJsonText.substring(7);
      }
      if (cleanJsonText.endsWith("```")) {
        cleanJsonText = cleanJsonText.substring(0, cleanJsonText.length - 3);
      }
      cleanJsonText = cleanJsonText.trim();

      const resultadoIA = JSON.parse(cleanJsonText);

      // Verificación de campos para mantener consistencia
      const dolores_detectados = Array.isArray(resultadoIA.dolores) ? resultadoIA.dolores : [
        "Inconsistencias y descuadres en transacciones diarias.",
        "Dependencia de registros manuales susceptibles a errores.",
        "Retraso de atención a clientes y cotizaciones en campo."
      ];
      const hook_sugerido = resultadoIA.hook || `Hola, notamos que ${nombre} tiene áreas de optimización logística que merman hasta un 15% mensual. ¿Te interesaría digitalizar el control de rutas en 48 horas?`;

      // Actualizamos el documento con la estructura final
      await snapshot.ref.update({
        'analisis_ia.dolores_detectados': dolores_detectados,
        'analisis_ia.hook_sugerido': hook_sugerido,
        'analisis_ia.estado_procesamiento': 'completado',
        'analisis_ia.nivel_prioridad_venta': 'Alto'
      });

      console.log(`🎯 ¡Éxito! El prospecto ${nombre} (${context.params.prospectoId}) ha sido enriquecido con dolores y hooks estratégicos.`);
      return true;

    } catch (error) {
      console.error(`🚨 Error procesando el prospecto ${context.params.prospectoId}:`, error);
      
      // Colocamos el documento en estado 'error' para auditoría
      await snapshot.ref.update({ 
        'analisis_ia.estado_procesamiento': 'error',
        'analisis_ia.dolores_detectados': [
          "No se pudo determinar automáticamente (Error de API).",
          "Requiere asignación manual de pain-points.",
          "Verificar conexión con canal de comunicación."
        ],
        'analisis_ia.hook_sugerido': `Hola, estuvimos revisando el perfil de ${nombre} y queremos presentarte soluciones digitales simplificadas para tu sector.`
      });
      return false;
    }
  });
