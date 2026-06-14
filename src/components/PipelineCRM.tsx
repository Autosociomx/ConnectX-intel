import React, { useState } from "react";
import {
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  Trash2,
  Edit3,
  Check,
  DollarSign,
  Users,
  Sparkles,
  Copy,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PipelineLead, PipelineEtapa } from "../types";

interface PipelineCRMProps {
  leads: PipelineLead[];
  onUpdate: (leads: PipelineLead[]) => void;
}

const ETAPAS: { id: PipelineEtapa; label: string; color: string; border: string; bg: string; dot: string }[] = [
  { id: "detectado",  label: "Detectado",        color: "text-blue-400",    border: "border-blue-500/30",   bg: "bg-blue-950/20",    dot: "bg-blue-400" },
  { id: "contactado", label: "Contactado",        color: "text-amber-400",   border: "border-amber-500/30",  bg: "bg-amber-950/20",   dot: "bg-amber-400" },
  { id: "demo",       label: "Demo Agendada",     color: "text-violet-400",  border: "border-violet-500/30", bg: "bg-violet-950/20",  dot: "bg-violet-400" },
  { id: "propuesta",  label: "Propuesta Enviada", color: "text-orange-400",  border: "border-orange-500/30", bg: "bg-orange-950/20",  dot: "bg-orange-400" },
  { id: "cerrado",    label: "Cerrado 🎉",         color: "text-emerald-400", border: "border-emerald-500/30",bg: "bg-emerald-950/20", dot: "bg-emerald-400" },
];

const ETAPA_INDEX: Record<PipelineEtapa, number> = {
  detectado: 0, contactado: 1, demo: 2, propuesta: 3, cerrado: 4
};

const SCORE_COLORS: Record<string, string> = {
  alta:  "bg-red-950/60 text-red-400 border-red-900/50",
  media: "bg-amber-950/60 text-amber-400 border-amber-900/50",
  baja:  "bg-[#151515] text-[#7a8899] border-border-grid/50",
};

function scoreColor(score: number) {
  if (score >= 85) return SCORE_COLORS.alta;
  if (score >= 70) return SCORE_COLORS.media;
  return SCORE_COLORS.baja;
}

function MRRProyectado({ leads }: { leads: PipelineLead[] }) {
  const cerrados = leads.filter(l => l.etapa === "cerrado").length;
  const mrr = cerrados * 3500;
  const arr = mrr * 12;
  if (cerrados === 0) return null;
  return (
    <div className="flex items-center gap-2 bg-emerald-950/30 border border-emerald-500/20 rounded px-3 py-1.5">
      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
      <span className="text-[10px] font-mono text-emerald-300">
        MRR estimado: <strong>${mrr.toLocaleString("es-MX")} MXN</strong>
        <span className="text-emerald-600 ml-1">(ARR ${arr.toLocaleString("es-MX")})</span>
      </span>
    </div>
  );
}

function LeadCard({
  lead,
  etapas,
  onMove,
  onDelete,
  onNota,
}: {
  lead: PipelineLead;
  etapas: typeof ETAPAS;
  onMove: (id: string, dir: 1 | -1) => void;
  onDelete: (id: string) => void;
  onNota: (id: string, nota: string) => void;
}) {
  const [editingNota, setEditingNota] = useState(false);
  const [notaDraft, setNotaDraft] = useState(lead.nota);
  const [guionEnriquecido, setGuionEnriquecido] = useState<string | null>(null);
  const [roiEnriquecido, setRoiEnriquecido] = useState<string | null>(null);
  const [loadingGuion, setLoadingGuion] = useState(false);
  const [showGuion, setShowGuion] = useState(false);
  const [copied, setCopied] = useState(false);
  const idx = ETAPA_INDEX[lead.etapa];
  const etapa = etapas[idx];

  const saveNota = () => {
    onNota(lead.id, notaDraft);
    setEditingNota(false);
  };

  const generarGuion = async () => {
    if (guionEnriquecido) { setShowGuion(v => !v); return; }
    setLoadingGuion(true);
    try {
      const res = await fetch("/api/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empresa: lead.empresa, puesto: lead.puesto, ciudad: lead.ciudad }),
      });
      const data = await res.json();
      setGuionEnriquecido(data.guion_comercial || "No se pudo generar el guión.");
      setRoiEnriquecido(data.roi_estimado_propuesta || null);
      setShowGuion(true);
    } catch {
      setGuionEnriquecido("Error al conectar con el servidor.");
      setShowGuion(true);
    } finally {
      setLoadingGuion(false);
    }
  };

  const copyGuion = () => {
    if (!guionEnriquecido) return;
    navigator.clipboard.writeText(guionEnriquecido);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.18 }}
      className={`rounded-md border ${etapa.border} bg-[#0a0a0d] p-3 space-y-2 hover:bg-[#0d0d11] transition-colors`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-sans font-bold text-white leading-tight truncate">{lead.empresa}</p>
          <p className="text-[9px] text-[#7a8899] font-mono truncate">{lead.puesto} · {lead.ciudad}</p>
        </div>
        <span className={`text-[8px] px-1.5 py-0.5 rounded border font-black flex-shrink-0 ${scoreColor(lead.score)}`}>
          {lead.score}
        </span>
      </div>

      {/* Nota */}
      {editingNota ? (
        <div className="space-y-1">
          <textarea
            value={notaDraft}
            onChange={e => setNotaDraft(e.target.value)}
            onBlur={saveNota}
            className="w-full bg-black/60 border border-border-grid/60 rounded text-[10px] text-white font-sans p-1.5 resize-none focus:outline-none focus:border-white/20"
            rows={2}
            autoFocus
            placeholder="Agregar nota..."
          />
          <button onClick={saveNota} className="flex items-center gap-1 text-[9px] text-emerald-400 font-mono cursor-pointer">
            <Check className="w-2.5 h-2.5" /> Guardar
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditingNota(true)}
          className="w-full text-left flex items-center gap-1.5 text-[9px] text-[#4a5869] hover:text-[#7a8899] transition-colors cursor-pointer font-mono"
        >
          <Edit3 className="w-2.5 h-2.5 flex-shrink-0" />
          <span className="truncate">{lead.nota || "Agregar nota..."}</span>
        </button>
      )}

      {/* Generar Guión button */}
      <button
        onClick={generarGuion}
        disabled={loadingGuion}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded border border-violet-500/30 bg-violet-950/20 hover:bg-violet-950/40 text-violet-300 text-[9px] font-mono uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loadingGuion ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Sparkles className="w-3 h-3" />
        )}
        {loadingGuion ? "Generando..." : guionEnriquecido ? (showGuion ? "Ocultar guión" : "Ver guión") : "Generar Guión IA"}
      </button>

      {/* Guión expandido */}
      <AnimatePresence>
        {showGuion && guionEnriquecido && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-1 space-y-2">
              <div className="relative bg-black/50 border border-violet-500/20 rounded p-2.5">
                <pre className="text-[9px] text-[#c8d4e4] font-sans leading-relaxed whitespace-pre-wrap break-words">
                  {guionEnriquecido}
                </pre>
                <button
                  onClick={copyGuion}
                  className="absolute top-1.5 right-1.5 p-1 rounded bg-[#1a1c20] border border-border-grid/50 text-[#7a8899] hover:text-white transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                </button>
              </div>
              {roiEnriquecido && (
                <p className="text-[9px] font-mono text-emerald-400 bg-emerald-950/20 border border-emerald-500/20 rounded px-2 py-1.5 leading-relaxed">
                  💰 {roiEnriquecido}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex items-center justify-between pt-1 border-t border-white/5">
        <button
          onClick={() => onMove(lead.id, -1)}
          disabled={idx === 0}
          className="p-1 rounded text-[#4a5869] hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <span className="text-[8px] font-mono text-[#4a5869]">{etapa.label}</span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onDelete(lead.id)}
            className="p-1 rounded text-[#3a4555] hover:text-red-400 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
          </button>
          <button
            onClick={() => onMove(lead.id, 1)}
            disabled={idx === etapas.length - 1}
            className="p-1 rounded text-[#4a5869] hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function PipelineCRM({ leads, onUpdate }: PipelineCRMProps) {
  const moveLead = (id: string, dir: 1 | -1) => {
    onUpdate(leads.map(l => {
      if (l.id !== id) return l;
      const newIdx = Math.max(0, Math.min(ETAPAS.length - 1, ETAPA_INDEX[l.etapa] + dir));
      return { ...l, etapa: ETAPAS[newIdx].id, fecha_actualizada: new Date().toISOString() };
    }));
  };

  const deleteLead = (id: string) => {
    onUpdate(leads.filter(l => l.id !== id));
  };

  const updateNota = (id: string, nota: string) => {
    onUpdate(leads.map(l => l.id === id ? { ...l, nota, fecha_actualizada: new Date().toISOString() } : l));
  };

  const totalLeads = leads.length;
  const cerrados = leads.filter(l => l.etapa === "cerrado").length;
  const conversionRate = totalLeads > 0 ? Math.round((cerrados / totalLeads) * 100) : 0;

  if (leads.length === 0) {
    return (
      <div className="bg-[#0f0f0f] border border-border-grid rounded-lg text-center py-20 space-y-3">
        <Users className="w-12 h-12 text-[#3a4555] mx-auto opacity-50" />
        <div className="font-syne font-bold text-[#7a8899]">Pipeline vacío</div>
        <p className="text-xs text-[#3a4555] max-w-xs mx-auto leading-relaxed">
          Desde la pestaña Vacantes, presiona <strong className="text-[#556375]">"Agregar al Pipeline"</strong> en cualquier prospecto para empezar a darle seguimiento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 bg-[#0f0f0f] border border-border-grid rounded px-3 py-1.5">
          <Users className="w-3.5 h-3.5 text-[#7a8899]" />
          <span className="text-[10px] font-mono text-white">{totalLeads} leads</span>
        </div>
        <div className="flex items-center gap-1.5 bg-[#0f0f0f] border border-border-grid rounded px-3 py-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-[#00c97a]" />
          <span className="text-[10px] font-mono text-white">Conversión: <strong className="text-[#00c97a]">{conversionRate}%</strong></span>
        </div>
        <MRRProyectado leads={leads} />
      </div>

      {/* Kanban columns — horizontal scroll on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {ETAPAS.map((etapa) => {
          const columnLeads = leads.filter(l => l.etapa === etapa.id);
          return (
            <div key={etapa.id} className="space-y-2">
              {/* Column header */}
              <div className={`flex items-center justify-between px-3 py-2 rounded-md border ${etapa.border} ${etapa.bg}`}>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${etapa.dot}`} />
                  <span className={`text-[9px] font-mono font-black uppercase tracking-wider ${etapa.color}`}>
                    {etapa.label}
                  </span>
                </div>
                <span className={`text-[9px] font-mono font-black ${etapa.color}`}>
                  {columnLeads.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-2 min-h-[80px]">
                <AnimatePresence>
                  {columnLeads.map(lead => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      etapas={ETAPAS}
                      onMove={moveLead}
                      onDelete={deleteLead}
                      onNota={updateNota}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
