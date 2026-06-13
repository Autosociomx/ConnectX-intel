import React, { useState } from "react";
import {
  TrendingUp,
  Zap,
  Clock,
  DollarSign,
  BarChart2,
  Layers,
  ChevronRight,
  Award,
  Sparkles,
  Target
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AlertaNuevoProducto } from "../types";

interface BlueOceanScannerProps {
  alertas: AlertaNuevoProducto[];
}

function calcIndice(a: AlertaNuevoProducto): number {
  const r = a.score_rentabilidad ?? 5;
  const f = a.score_facilidad ?? 5;
  return Math.round((r * 0.6 + f * 0.4) * 10) / 10;
}

const MEDALLA = ["🥇", "🥈", "🥉"];
const MEDALLA_LABEL = ["Primera Prioridad", "Segunda Prioridad", "Tercera Prioridad"];

const MEDALLA_COLORS = [
  { border: "border-amber-500/40", bg: "bg-amber-950/20", accent: "#f59e0b", bar: "from-amber-500 to-yellow-400" },
  { border: "border-slate-400/40", bg: "bg-slate-900/30", accent: "#94a3b8", bar: "from-slate-400 to-slate-300" },
  { border: "border-orange-700/40", bg: "bg-orange-950/20", accent: "#c2410c", bar: "from-orange-700 to-orange-500" },
];

function ScoreBar({ value, max = 10, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="w-full h-1.5 bg-[#1a1c20] rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${(value / max) * 100}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`h-full rounded-full bg-gradient-to-r ${color}`}
      />
    </div>
  );
}

export function BlueOceanScanner({ alertas }: BlueOceanScannerProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);

  if (!alertas || alertas.length === 0) return null;

  const ranked = [...alertas]
    .map(a => ({ ...a, _indice: calcIndice(a) }))
    .sort((a, b) => b._indice - a._indice);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#0d1a2a] border border-blue-500/20 rounded">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div>
            <h4 className="text-[11px] font-mono font-black text-white uppercase tracking-widest">
              Blue Ocean Scanner
            </h4>
            <p className="text-[9px] text-[#556375] font-mono">
              Oportunidades rankeadas por Índice de Impacto (Rentabilidad × Facilidad)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-blue-950/30 border border-blue-500/20 px-2 py-1 rounded">
          <BarChart2 className="w-3 h-3 text-blue-400" />
          <span className="text-[9px] font-mono text-blue-300">{ranked.length} oportunidades</span>
        </div>
      </div>

      {/* Ranked cards */}
      <div className="space-y-2">
        {ranked.map((alerta, rank) => {
          const color = MEDALLA_COLORS[rank] ?? MEDALLA_COLORS[2];
          const isExpanded = expandedIdx === rank;
          const mrrFmt = alerta.precio_mrr_sugerido
            ? `$${alerta.precio_mrr_sugerido.toLocaleString("es-MX")} MXN/mes`
            : "—";
          const arrFmt = alerta.precio_mrr_sugerido
            ? `$${(alerta.precio_mrr_sugerido * 12).toLocaleString("es-MX")} MXN/año`
            : "—";

          return (
            <motion.div
              key={rank}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: rank * 0.07 }}
              className={`border rounded-md overflow-hidden transition-all ${color.border} ${
                isExpanded ? color.bg : "bg-[#0a0a0c] hover:bg-[#0e0e12]"
              }`}
            >
              {/* Card header — always visible */}
              <button
                onClick={() => setExpandedIdx(isExpanded ? null : rank)}
                className="w-full flex items-center gap-3 p-3 text-left cursor-pointer"
              >
                {/* Rank medal */}
                <div className="text-xl flex-shrink-0 leading-none select-none">
                  {rank < 3 ? MEDALLA[rank] : `#${rank + 1}`}
                </div>

                {/* Title + label */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[8px] font-mono uppercase tracking-widest font-bold" style={{ color: color.accent }}>
                      {rank < 3 ? MEDALLA_LABEL[rank] : `Rank #${rank + 1}`}
                    </span>
                    <span className={`text-[7.5px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider border ${
                      alerta.potencial_micro_saas === "alto"
                        ? "bg-emerald-950/50 text-emerald-400 border-emerald-900/50"
                        : "bg-[#151515] text-[#7a8899] border-border-grid/60"
                    }`}>
                      Potencial {alerta.potencial_micro_saas}
                    </span>
                  </div>
                  <p className="text-[11px] text-white font-sans font-semibold leading-tight truncate">
                    {alerta.herramienta_necesaria_demandada}
                  </p>
                </div>

                {/* Índice badge */}
                <div className="flex-shrink-0 text-right">
                  <div className="text-lg font-syne font-black leading-none" style={{ color: color.accent }}>
                    {alerta._indice}
                  </div>
                  <div className="text-[7px] font-mono text-[#556375] uppercase">índice</div>
                </div>

                <ChevronRight
                  className={`w-3.5 h-3.5 flex-shrink-0 text-[#4a5869] transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                />
              </button>

              {/* Expanded body */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-3">

                      {/* Dolor detectado */}
                      <div className="space-y-1">
                        <span className="text-[8.5px] text-[#556375] font-mono uppercase tracking-widest">Dolor detectado en el mercado</span>
                        <p className="text-[11px] text-[#c8d4e4] leading-relaxed italic font-sans">
                          "{alerta.dolor_no_cubierto}"
                        </p>
                      </div>

                      {/* Scores dobles */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[9px] font-mono">
                            <span className="text-[#556375] flex items-center gap-1">
                              <DollarSign className="w-2.5 h-2.5" /> Rentabilidad
                            </span>
                            <span className="font-black" style={{ color: color.accent }}>
                              {alerta.score_rentabilidad ?? "?"}/10
                            </span>
                          </div>
                          <ScoreBar value={alerta.score_rentabilidad ?? 5} color={color.bar} />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[9px] font-mono">
                            <span className="text-[#556375] flex items-center gap-1">
                              <Zap className="w-2.5 h-2.5" /> Facilidad
                            </span>
                            <span className="font-black text-blue-400">
                              {alerta.score_facilidad ?? "?"}/10
                            </span>
                          </div>
                          <ScoreBar value={alerta.score_facilidad ?? 5} color="from-blue-500 to-cyan-400" />
                        </div>
                      </div>

                      {/* Métricas clave */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-black/40 rounded border border-border-grid/40 p-2 text-center space-y-0.5">
                          <Target className="w-3 h-3 mx-auto text-[#556375]" />
                          <div className="text-[10px] font-mono font-black text-white">
                            {alerta.vacantes_con_este_dolor ?? "—"}
                          </div>
                          <div className="text-[7.5px] text-[#556375] font-mono uppercase">vacantes</div>
                        </div>
                        <div className="bg-black/40 rounded border border-border-grid/40 p-2 text-center space-y-0.5">
                          <DollarSign className="w-3 h-3 mx-auto text-[#00c97a]" />
                          <div className="text-[10px] font-mono font-black text-[#00c97a]">{mrrFmt}</div>
                          <div className="text-[7.5px] text-[#556375] font-mono uppercase">MRR sugerido</div>
                        </div>
                        <div className="bg-black/40 rounded border border-border-grid/40 p-2 text-center space-y-0.5">
                          <Clock className="w-3 h-3 mx-auto text-[#f59e0b]" />
                          <div className="text-[10px] font-mono font-black text-[#f59e0b]">
                            {alerta.semanas_desarrollo ?? "—"} sem
                          </div>
                          <div className="text-[7.5px] text-[#556375] font-mono uppercase">MVP</div>
                        </div>
                      </div>

                      {/* ARR projection */}
                      <div className="flex items-center justify-between bg-[#0a1a10] border border-[#00c97a]/20 rounded px-3 py-2">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-3.5 h-3.5 text-[#00c97a]" />
                          <span className="text-[9px] font-mono text-[#556375] uppercase tracking-wider">Retorno anual proyectado</span>
                        </div>
                        <span className="text-sm font-syne font-black text-[#00c97a]">{arrFmt}</span>
                      </div>

                      {/* Justificación */}
                      <div className="bg-[#0f0f0f] border border-border-grid/50 rounded p-3 space-y-1">
                        <span className="text-[8.5px] text-accent font-mono uppercase tracking-widest font-black">
                          ¿Por qué ahora?
                        </span>
                        <p className="text-[10.5px] text-[#a4b3c6] leading-relaxed font-sans">
                          {alerta.justificacion_oportunidad}
                        </p>
                      </div>

                      {/* CTA */}
                      <button className="w-full flex items-center justify-center gap-2 py-2 bg-blue-950/30 hover:bg-blue-950/50 border border-blue-500/30 text-blue-300 rounded text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer group">
                        <Layers className="w-3.5 h-3.5" />
                        <span>Agregar a Hoja de Ruta del Ecosistema</span>
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </button>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
