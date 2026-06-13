import React, { useState } from "react";
import { 
  AlertTriangle, 
  Zap, 
  MessageSquare, 
  Copy, 
  Check, 
  HelpCircle, 
  TrendingUp, 
  Briefcase, 
  ShieldAlert, 
  Layers, 
  CheckSquare, 
  Square,
  Sparkles,
  Search,
  BookOpen
} from "lucide-react";
import { motion } from "motion/react";
import { Vacante } from "../types";

interface ProspectDeepViewProps {
  vacante: Vacante;
  isExpanded: boolean;
}

export function ProspectDeepView({ vacante, isExpanded }: ProspectDeepViewProps) {
  const [copied, setCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"estrategia" | "diagnostico">("estrategia");
  
  // Local state for checkboxes to allow sales representatives to "verify" challenges and arguments during sales calls
  const [checkedChallenges, setCheckedChallenges] = useState<Record<number, boolean>>({});
  const [checkedPoints, setCheckedPoints] = useState<Record<number, boolean>>({});

  if (!isExpanded) return null;

  // Use variables with fallback matching typical structure
  const dolores = vacante.dolores_detectados || vacante.dolores || [];
  const score = vacante.score_urgencia || vacante.score || 85;
  const guion = vacante.guion_comercial || vacante.guion || "";
  const roi = vacante.roi_estimado_propuesta || vacante.roi_estimado || "";
  
  const synthesizedSummary = vacante.synthesized_dolores_summary || 
    `La vacante de ${vacante.puesto} en ${vacante.empresa} evidencia mermas financieras y sobrecarga administrativa persistentes derivadas de: ${dolores.join(" y ")}. Se observa alta dependencia de comunicación tradicional y registros en papel.`;

  const challenges = vacante.company_challenges || [
    "Pérdidas hormiga recurrentes por falta de control centralizado y supervisión de rutas.",
    "Procesos analógicos manuales que demandan horas extra del supervisor y personal administrativo.",
    "Riesgos de mermas e inexactitudes en la conciliación diaria de efectivo de choferes."
  ];

  const talkingPoints = vacante.talking_points || [
    `Demostrar la reducción inmediata del dolor mediante conciliaciones automatizadas en tiempo real con un ROI estimado de ${roi}.`,
    "Enfocar el gancho en la paz mental: sustituir las bitácoras obsoletas y liquidar en 5 minutos.",
    "Apelar a la urgencia de control de pérdidas de inventario y fugas ocultas de combustible."
  ];

  const toggleChallenge = (idx: number) => {
    setCheckedChallenges(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const togglePoint = (idx: number) => {
    setCheckedPoints(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const copyScriptToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(guion);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for iframe environments or unsupported browsers
      const textarea = document.createElement("textarea");
      textarea.value = guion;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="mt-5 pt-5 border-t border-border-grid/50 space-y-4 font-sans"
    >
      {/* Sub-tabs within details section to maintain pristine hierarchy and density */}
      <div className="flex items-center gap-1.5 border-b border-border-grid/40 pb-2 mb-1">
        <button
          onClick={() => setActiveSubTab("estrategia")}
          className={`flex items-center gap-1.5 px-3 py-1 text-[10px] uppercase font-mono tracking-wider transition-all rounded-sm cursor-pointer ${
            activeSubTab === "estrategia"
              ? "bg-[#111] text-accent font-bold border border-border-grid"
              : "text-[#7a8899] hover:text-white"
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Pitch & Estrategia comercial</span>
        </button>
        <button
          onClick={() => setActiveSubTab("diagnostico")}
          className={`flex items-center gap-1.5 px-3 py-1 text-[10px] uppercase font-mono tracking-wider transition-all rounded-sm cursor-pointer ${
            activeSubTab === "diagnostico"
              ? "bg-[#111] text-[#00c97a] font-bold border border-border-grid"
              : "text-[#7a8899] hover:text-white"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Ficha Técnica y Dolores</span>
        </button>
      </div>

      {activeSubTab === "estrategia" ? (
        <div className="space-y-4 animate-fadeIn">
          
          {/* Main customized commercial script card with psychological copywriting */}
          <div className="bg-[#121215] border border-border-grid rounded p-4 space-y-3 relative group">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="text-[10px] text-accent uppercase font-mono font-bold tracking-widest flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                Guion Comercial Personalizado (México Context)
              </span>
              <button
                onClick={copyScriptToClipboard}
                className="flex items-center gap-1 px-2.5 py-1 bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent rounded text-[9px] font-mono cursor-pointer transition-all active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-[#00c97a]" />
                    <span className="text-[#00c97a] font-black">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copiar Guion</span>
                  </>
                )}
              </button>
            </div>
            
            <p className="text-xs text-[#e5e9f0] leading-relaxed italic bg-black/30 p-3.5 rounded border border-white/5 cursor-pointer selection:bg-accent/30 hover:border-accent/30 transition-all font-sans whitespace-pre-wrap">
              "{guion}"
            </p>

            <div className="text-[9px] text-[#556375] font-mono flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-accent" />
              <span>Pitch enfocado en sustitución del presupuesto del sueldo de la vacante y blindaje operativo.</span>
            </div>
          </div>

          {/* Interactive Talking Points */}
          <div className="bg-[#0f0f0f] border border-border-grid/80 rounded-md p-4 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h5 className="text-[10px] font-mono font-black text-[#00c97a] uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#00c97a]" />
                Argumentos Clave / Talking Points en Reunión
              </h5>
              <span className="text-[8px] text-[#556375] font-sans font-medium uppercase">Marcar para el guion</span>
            </div>

            <div className="space-y-2">
              {talkingPoints.map((point, i) => {
                const checked = !!checkedPoints[i];
                return (
                  <div 
                    key={i} 
                    onClick={() => togglePoint(i)}
                    className={`flex items-start gap-3 p-2.5 rounded border transition-all cursor-pointer select-none text-[11px] ${
                      checked 
                        ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300" 
                        : "bg-black/25 border-border-grid/50 text-[#a4b3c6] hover:bg-black/40"
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {checked ? (
                        <CheckSquare className="w-4 h-4 text-[#00c97a] fill-emerald-950/40" />
                      ) : (
                        <Square className="w-4 h-4 text-[#4a5869]" />
                      )}
                    </div>
                    <span className="leading-relaxed font-sans">{point}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      ) : (
        <div className="space-y-4 animate-fadeIn">
          
          {/* Synthesized Pain Summary Section - highlighting the underlying problem */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-mono font-black text-[#7a8899] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-[#ff4a4a]" />
                Síntesis del Dolor y Presión Operativa
              </h4>
              <span className="text-[8px] bg-[#ff4a4a]/10 border border-[#ff4a4a]/20 text-[#ff4a4a] rounded px-1.5 py-0.5 font-mono select-none">Auditoría Reclutamiento</span>
            </div>
            
            <div className="text-xs text-[#d2dcfa] leading-relaxed bg-gradient-to-r from-[#17171a] to-[#121213] border border-border-grid/60 p-4 rounded-md relative overflow-hidden font-sans">
              <span className="absolute -right-3 -bottom-6 text-7xl font-serif text-white/[0.03] select-none">“</span>
              <p className="relative z-10 italic">"{synthesizedSummary}"</p>
            </div>
          </div>

          {/* Interactive Company Challenges Checklist */}
          <div className="bg-[#0f0f0f] border border-border-grid/80 rounded-md p-4 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h5 className="text-[10px] font-mono font-black text-accent uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-accent" />
                Desafíos Corporativos Estimados
              </h5>
              <span className="text-[8px] text-[#556375] font-sans font-medium uppercase">Confirmar dolores</span>
            </div>

            <div className="space-y-2">
              {challenges.map((challenge, i) => {
                const checked = !!checkedChallenges[i];
                return (
                  <div 
                    key={i} 
                    onClick={() => toggleChallenge(i)}
                    className={`flex items-start gap-3 p-2.5 rounded border transition-all cursor-pointer select-none text-[11px] ${
                      checked 
                        ? "bg-amber-950/20 border-amber-500/30 text-amber-300" 
                        : "bg-black/25 border-border-grid/50 text-[#a4b3c6] hover:bg-black/40"
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {checked ? (
                        <CheckSquare className="w-4 h-4 text-accent fill-amber-950/40" />
                      ) : (
                        <Square className="w-4 h-4 text-[#4a5869]" />
                      )}
                    </div>
                    <span className="leading-relaxed font-sans">{challenge}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}
    </motion.div>
  );
}
