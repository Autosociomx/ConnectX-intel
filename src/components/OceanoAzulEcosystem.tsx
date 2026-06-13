import React, { useState } from "react";
import { 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  TrendingUp, 
  Cpu, 
  Lock, 
  RefreshCw, 
  Eye, 
  Layers,
  ChevronRight,
  Activity,
  Award,
  BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { OceanoAzulProject } from "../types";

// Proyectos de Océano Azul - Alquimia CX predefinidos
const PREDEFINED_PROJECTS: OceanoAzulProject[] = [
  {
    id: "OA_SEC_VAULT",
    titulo: "Alquimia Secure Vault v2 (Bóveda Inmutable)",
    codename: "SECURE_VAULT_256",
    descripcion: "Bóveda redundante de ciberseguridad que almacena logs de auditoría inmutables mediante hashes SHA-256 criptográficos. Protege las carteras operativas frente a mermas e intromisiones de terceros.",
    bovedaSegura: "AES-GCM-256 Redundant Audit Logs",
    estadoMaduracion: "Producción",
    maduracionPorcentaje: 95,
    metricas: {
      impactoProyectado: "100% de blindaje contra alteración de bitácoras de rutas",
      leadsPotenciales: 240,
      retornoAnualEstimado: "$1,890,000 MXN recuperados por evasión de fraudes",
      eficienciaCoeficiente: 9.8
    },
    bovedaSector: "Bóveda de Seguridad & Integridad Financiera"
  },
  {
    id: "OA_MULT_500x9",
    titulo: "Alquimia Multiplying Node 500x9",
    codename: "MULT_NODES_4500",
    descripcion: "Motor algorítmico que multiplica 500 leads o empresas objetivo por 9 vectores de diagnóstico operativo. Genera 4,500 ganchos de venta ineludibles hyper-personalizados de forma paralela en menos de 5 segundos.",
    bovedaSegura: "Hyper-threaded API Worker & Auto-Pitch Generator",
    estadoMaduracion: "Piloto Activo",
    maduracionPorcentaje: 80,
    metricas: {
      impactoProyectado: "+420% en tasa de apertura de propuestas comerciales",
      leadsPotenciales: 4500,
      retornoAnualEstimado: "$4,120,000 MXN en nuevos contratos SaaS automáticos",
      eficienciaCoeficiente: 12.5
    },
    bovedaSector: "Bóveda de Multiplicación & Automatización de Demanda"
  },
  {
    id: "OA_BLUE_OCEAN",
    titulo: "Ocean Analytics Protocol",
    codename: "BLUE_WAVE_9",
    descripcion: "Algoritmo de penetración comercial en 'Océanos Azules' sin competencia. Identifica vacantes municipales y logísticas que denotan rezago crítico de software, automatizando la sustitución de nómina ineficiente.",
    bovedaSegura: "Competitive Intelligence Scraping Node",
    estadoMaduracion: "Concepto",
    maduracionPorcentaje: 45,
    metricas: {
      impactoProyectado: "Creación de 3 nuevos nichos de mercado Micro-SaaS p/año",
      leadsPotenciales: 850,
      retornoAnualEstimado: "$2,400,000 MXN libres de competencia",
      eficienciaCoeficiente: 8.9
    },
    bovedaSector: "Bóveda de Inteligencia Competitiva & Estrategia"
  }
];

export function OceanoAzulEcosystem() {
  const [projects, setProjects] = useState<OceanoAzulProject[]>(PREDEFINED_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("OA_MULT_500x9");
  
  // Interactive Simulator parameters (Multiplicación 500 x 9)
  const [leadBase, setLeadBase] = useState<number>(500);
  const [vectoresEvaluacion, setVectoresEvaluacion] = useState<number>(9);
  const [tasaConversion, setTasaConversion] = useState<number>(2.5); // %
  const [ingresoPromedioSaaS, setIngresoPromedioSaaS] = useState<number>(3500); // MXN mensuales
  
  // Vault cryptography generation simulator state
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [encryptionLog, setEncryptionLog] = useState<string[]>([]);
  const [simulatedHash, setSimulatedHash] = useState<string>("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");

  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  // Run a cryptographic audit simulation
  const runVaultEncryptionTest = () => {
    setIsEncrypting(true);
    setEncryptionLog([]);
    
    const steps = [
      "🔄 [CONNECTX] Iniciando conexión con Alquimia Secure Vault v2...",
      "🔒 [SHA-256] Cargando certificado del servidor de la Bóveda...",
      "⚙️ [ENGINE] Procesando firma digital inmutable para 500 registros...",
      "🔑 [CRYPT] Aplicando cifrado de flujo AES-GCM (9 niveles redundantes)...",
      "🚀 [RESULT] ¡Hash de Integridad Generado y Sincronizado con Éxito!"
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setEncryptionLog(prev => [...prev, step]);
        if (idx === steps.length - 1) {
          setIsEncrypting(false);
          // Generate a random dynamic sha256 mock hash
          const randomHash = Array.from({length: 64}, () => 
            Math.floor(Math.random() * 16).toString(16)
          ).join('');
          setSimulatedHash(randomHash);
        }
      }, (idx + 1) * 400);
    });
  };

  // Perform calculations for Multiplication 500 * 9
  const totalCombinaciones = leadBase * vectoresEvaluacion;
  const conversionesEstimadas = Math.round((totalCombinaciones * tasaConversion) / 100);
  const mrrProyectado = conversionesEstimadas * ingresoPromedioSaaS;
  const arrProyectado = mrrProyectado * 12;

  // Maturity states badge styles
  const getMaduracionStyle = (state: string) => {
    switch (state) {
      case "Producción":
        return "bg-green-500/10 border-green-500/30 text-green-400";
      case "Piloto Activo":
        return "bg-blue-500/10 border-blue-500/30 text-blue-400";
      case "BETA":
        return "bg-amber-500/10 border-amber-500/30 text-amber-400";
      default:
        return "bg-purple-500/10 border-purple-500/30 text-purple-400";
    }
  };

  return (
    <div className="bg-[#0f0f0f] border border-border-grid rounded-lg p-5 space-y-6 animate-fadeIn font-sans" id="oceano-azul-section">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border-grid pb-3 mb-1 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent animate-pulse" />
            <h3 className="font-syne font-extrabold text-white text-base tracking-tight uppercase">
              Alquimia CX: Proyectos Especiales 'Océano Azul'
            </h3>
            <span className="bg-[#9333ea]/15 border border-[#9333ea]/30 text-[#c084fc] text-[8.5px] uppercase font-mono tracking-widest px-2 py-0.5 rounded">
              Bóvedas Activas
            </span>
          </div>
          <p className="text-[11px] text-[#7a8899] mt-0.5 leading-relaxed">
            Consola estratégica de alto nivel para el rastreo de nichos inexplorados, blindajes de ciberseguridad, y algoritmos de multiplicación comercial.
          </p>
        </div>
      </div>

      {/* Main Grid: Interactive Project Cards vs Deep Interactive Simulator Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Side: Cards (5 Columns) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-[10px] text-[#556375] uppercase font-mono tracking-wider font-bold mb-1">// Selección de Iniciativa Océano Azul</div>
          
          {projects.map((proj) => {
            const isSelected = proj.id === selectedProjectId;
            return (
              <div
                key={proj.id}
                onClick={() => setSelectedProjectId(proj.id)}
                className={`p-4 rounded-md border text-left cursor-pointer transition-all space-y-2 relative overflow-hidden group select-none ${
                  isSelected 
                    ? "bg-[#110c14] border-purple-500/50 shadow-lg shadow-purple-950/10" 
                    : "bg-[#08080a] border-border-grid hover:bg-[#0c0c0e] hover:border-border-grid/80"
                }`}
                id={`project-card-${proj.id}`}
              >
                {/* Visual Glow Indicator */}
                {isSelected && (
                  <div className="absolute top-0 left-0 bottom-0 w-[3px] bg-purple-500" />
                )}

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[9px] font-mono text-purple-400 uppercase tracking-widest block font-bold">
                      {proj.codename}
                    </span>
                    <h4 className="font-syne font-bold text-xs text-white group-hover:text-amber-400 transition-colors">
                      {proj.titulo}
                    </h4>
                  </div>
                  <span className={`text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${getMaduracionStyle(proj.estadoMaduracion)}`}>
                    {proj.estadoMaduracion}
                  </span>
                </div>

                <p className="text-[11px] text-[#728296] leading-relaxed line-clamp-2">
                  {proj.descripcion}
                </p>

                {/* Micro Progress Bar of maturity */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[9px] text-[#556375] font-mono">
                    <span>Nivel de Maduración</span>
                    <span className="text-[#a4b3c6] font-bold">{proj.maduracionPorcentaje}%</span>
                  </div>
                  <div className="w-full bg-[#111] h-1 rounded overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${
                        isSelected ? "bg-gradient-to-r from-purple-500 to-accent" : "bg-[#2a3038]"
                      }`}
                      style={{ width: `${proj.maduracionPorcentaje}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Deep Interactive / Simulator Panel (7 Columns) */}
        <div className="lg:col-span-7 bg-[#0a0a0c] border border-border-grid/80 rounded-md p-4 flex flex-col justify-between">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedProject.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Header inside Panel */}
              <div className="border-b border-border-grid/50 pb-3">
                <div className="flex items-center gap-1.5 text-accent text-[9px] font-mono tracking-widest uppercase">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>{selectedProject.bovedaSector}</span>
                </div>
                <h4 className="font-syne font-extrabold text-base text-white mt-1">
                  {selectedProject.titulo}
                </h4>
                <p className="text-xs text-[#a4b3c6] leading-relaxed mt-2 italic">
                  "{selectedProject.descripcion}"
                </p>
              </div>

              {/* Sub-Metrics Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#101014] border border-border-grid p-2.5 rounded">
                  <span className="text-[8px] text-[#556375] uppercase block font-mono tracking-wide">
                    Retorno Anual Estimado
                  </span>
                  <span className="text-sm font-syne font-bold text-green-400 block mt-1">
                    {selectedProject.metricas.retornoAnualEstimado}
                  </span>
                </div>
                <div className="bg-[#101014] border border-border-grid p-2.5 rounded">
                  <span className="text-[8px] text-[#556375] uppercase block font-mono tracking-wide">
                    Coeficiente de Eficiencia
                  </span>
                  <span className="text-sm font-syne font-bold text-accent block mt-1 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-accent" />
                    {selectedProject.metricas.eficienciaCoeficiente}x ROI
                  </span>
                </div>
              </div>

              {/* Dynamic Interactive Element depending on selected project */}
              {selectedProject.id === "OA_MULT_500x9" ? (
                /* Interactive 500x9 Multiplier Simulator Case */
                <div className="bg-[#121217] border border-purple-950/30 rounded p-4 space-y-3">
                  <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                    <span className="text-[10px] text-purple-400 uppercase font-mono font-bold tracking-widest flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-purple-400 animate-spin" />
                      Simulador de Coeficiente Multiplicador (500 Lote x 9 Vectores)
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    {/* Input range Lead base (500) */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#a4b3c6]">Prospectos Base (Sueldo Destinado)</span>
                        <span className="font-mono text-accent font-bold">{leadBase}</span>
                      </div>
                      <input 
                        type="range"
                        min="50"
                        max="1000"
                        step="50"
                        value={leadBase}
                        onChange={(e) => setLeadBase(Number(e.target.value))}
                        className="w-full accent-purple-500 cursor-pointer h-1.5 bg-[#1b1c20] rounded-sm"
                      />
                    </div>

                    {/* Input range Diagnostic Vectors (9) */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#a4b3c6]">Vectores de Diagnóstico Técnico</span>
                        <span className="font-mono text-purple-400 font-bold">{vectoresEvaluacion}</span>
                      </div>
                      <input 
                        type="range"
                        min="3"
                        max="18"
                        step="1"
                        value={vectoresEvaluacion}
                        onChange={(e) => setVectoresEvaluacion(Number(e.target.value))}
                        className="w-full accent-purple-500 cursor-pointer h-1.5 bg-[#1b1c20] rounded-sm"
                      />
                    </div>

                    {/* Input range conversion rate */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#a4b3c6]">Tasa de Conversión (SaaS Pitch)</span>
                        <span className="font-mono text-green-400 font-bold">{tasaConversion}%</span>
                      </div>
                      <input 
                        type="range"
                        min="0.5"
                        max="10.0"
                        step="0.5"
                        value={tasaConversion}
                        onChange={(e) => setTasaConversion(Number(e.target.value))}
                        className="w-full accent-purple-500 cursor-pointer h-1.5 bg-[#1b1c20] rounded-sm"
                      />
                    </div>
                  </div>

                  {/* Simulator real-time calculated metrics */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-purple-900/20 text-center select-none bg-black/40 p-2.5 rounded">
                    <div>
                      <span className="text-[8px] text-[#556375] uppercase block font-mono">Ganchos Totales</span>
                      <strong className="text-white text-xs font-mono">{totalCombinaciones}</strong>
                    </div>
                    <div>
                      <span className="text-[8px] text-[#556375] uppercase block font-mono">Contratos Estimados</span>
                      <strong className="text-[#00c97a] text-xs font-mono">{conversionesEstimadas}</strong>
                    </div>
                    <div>
                      <span className="text-[8px] text-[#556375] uppercase block font-mono">MRR Proyectado</span>
                      <strong className="text-accent text-xs font-mono">${mrrProyectado.toLocaleString("es-MX")} MXN</strong>
                    </div>
                  </div>

                  <div className="text-[9px] text-[#a4b3c6]/60 leading-normal text-center italic">
                    "Al multiplicar el lote de vacantes por {vectoresEvaluacion} vectores de ineficiencia se automatizan {totalCombinaciones} combinaciones de dolores listos para WhatsApp."
                  </div>
                </div>
              ) : selectedProject.id === "OA_SEC_VAULT" ? (
                /* Cybersecurity Vault cryptographic simulator case */
                <div className="bg-[#121217] border border-green-950/30 rounded p-4 space-y-4">
                  <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                    <span className="text-[10px] text-green-400 uppercase font-mono font-bold tracking-widest flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-green-400" />
                      Consola de Encriptación Inmutable (AES-GCM-256 + SHA-256)
                    </span>
                    <button
                      onClick={runVaultEncryptionTest}
                      disabled={isEncrypting}
                      className="px-2.5 py-1 bg-green-500/10 hover:bg-green-500/25 border border-green-500/30 text-green-400 rounded text-[9px] font-mono cursor-pointer transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isEncrypting ? "animate-spin" : ""}`} />
                      <span>{isEncrypting ? "Firmando..." : "Ejecutar Firma de Seguridad"}</span>
                    </button>
                  </div>

                  {/* Hash Status */}
                  <div className="space-y-1.5">
                    <div className="text-[9px] text-emerald-400 uppercase tracking-widest font-mono">HASH DE INTEGRIDAD REDUNDANTE (SISTEMA DE BÓVEDA):</div>
                    <div className="bg-black text-[10px] text-[#00ff99] font-mono p-2.5 rounded border border-emerald-950/40 select-all break-all overflow-x-auto whitespace-pre-wrap leading-relaxed">
                      {simulatedHash}
                    </div>
                  </div>

                  {/* Encryption terminal steps log */}
                  {encryptionLog.length > 0 && (
                    <div className="bg-black/80 rounded border border-white/5 p-3 space-y-1 max-h-[110px] overflow-y-auto font-mono text-[9px] text-[#a4b3c6]">
                      {encryptionLog.map((log, lIdx) => (
                        <div key={lIdx} className="animate-fadeIn">
                          {log}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 p-2 bg-[#022c22]/10 border border-green-900/30 rounded text-[9.5px] text-green-400">
                    <ShieldCheck className="w-4 h-4 flex-shrink-0 text-green-400" />
                    <span>Esta bóveda garantiza que los reclamos financieros históricos sincronizados en Firestore permanezcan inmutables ante auditorías de la gerencia comercial.</span>
                  </div>
                </div>
              ) : (
                /* Concept platform interactive info */
                <div className="bg-[#121217] border border-border-grid rounded p-4 space-y-3 text-center py-6">
                  <Award className="w-10 h-10 text-purple-400 mx-auto opacity-75 animate-pulse" />
                  <div className="font-syne font-bold text-white text-xs">Módulo Ocean Analytics Protocol en Diseño Conceptual</div>
                  <p className="text-[11px] text-[#a4b3c6] max-w-md mx-auto leading-relaxed">
                    Este motor asíncrono mapeará vacantes de la industria alimenticia mexicana que utilizan planillas para la liquidación. Al identificar estas brechas de software específicas, el protocolo recomienda el micro-SaaS óptimo a desarrollar bajo demanda.
                  </p>
                  <button 
                    onClick={() => setSelectedProjectId("OA_MULT_500x9")}
                    className="mt-2 text-purple-400 text-[10px] hover:underline uppercase font-mono font-bold tracking-widest flex items-center gap-1 mx-auto cursor-pointer"
                  >
                    Estudiar Plan 500x9 de Alquimia CX <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Shared Tech metadata section */}
              <div className="border-t border-border-grid/50 pt-3 space-y-2 text-[10px]">
                <div className="flex items-center justify-between text-[#728296] font-mono">
                  <span>Bóveda Tecnológica:</span>
                  <span className="text-white bg-black/40 px-2 py-0.5 rounded border border-border-grid/35">
                    {selectedProject.bovedaSegura}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#728296] font-mono">
                  <span>Impacto Operativo Esperado:</span>
                  <span className="text-amber-400 font-semibold text-[10.5px]">
                    {selectedProject.metricas.impactoProyectado}
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Senior Manager Commentary Panel */}
          <div className="mt-4 pt-3.5 border-t border-border-grid/40 flex gap-2.5 items-start bg-[#060608] p-3 rounded-md border border-border-grid/20">
            <div className="bg-[#16131c] p-2 rounded border border-[#9333ea]/35 text-[#d946ef]">
              <BookOpen className="w-4 h-4 text-[#d946ef]" />
            </div>
            <div className="space-y-1 text-left">
              <span className="text-[8.5px] uppercase tracking-wider font-bold text-[#b07cf0] block font-mono">ConnectX Executive Senior Manager Report | Océano Azul</span>
              <p className="text-[10px] text-[#a4b3c6] leading-relaxed">
                "Esta visión consolida la propuesta de que Alquimia CX no busca capturar mercados saturados; busca descubrir 'Océanos Azules' donde se puede proponer software automatizado resolviendo el dolor operativo por una fracción del costo de un sueldo real. La multiplicación algorítmica 500x9 constituye nuestra mayor ventaja en el territorio mexicano."
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
