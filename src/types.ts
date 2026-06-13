export interface EnrutamientoEcosistema {
  aplica_rute_pro: boolean;
  aplica_conecta_x: boolean;
  aplica_alquimia_cx: boolean;
}

export interface Vacante {
  empresa: string;
  puesto: string;
  ciudad: string;
  descripcion: string;
  descripcion_corta?: string;
  dolores: string[];
  dolores_detectados?: string[];
  herramientas_obsoletas_actuales?: string[];
  score: number;
  score_urgencia?: number;
  prioridad: 'alta' | 'media' | 'baja';
  guion: string;
  guion_comercial?: string;
  roi_estimado: string;
  roi_estimado_propuesta?: string;
  fuente: string;
  synthesized_dolores_summary?: string;
  company_challenges?: string[];
  talking_points?: string[];
  enrutamiento_ecosistema?: EnrutamientoEcosistema;
  url_original?: string;
  parlamento_mb?: ParlamentoMB;
}

export interface Patron {
  dolor: string;
  frecuencia: number;
  porcentaje: number;
}

export interface AlertaNuevoProducto {
  dolor_no_cubierto: string;
  herramienta_necesaria_demandada: string;
  potencial_micro_saas: 'alto' | 'media' | 'bajo' | 'medio';
  justificacion_oportunidad: string;
  score_rentabilidad?: number;
  score_facilidad?: number;
  vacantes_con_este_dolor?: number;
  precio_mrr_sugerido?: number;
  semanas_desarrollo?: number;
}

export interface ResumenPatrones {
  dolor_mas_frecuente: string;
  ciudades_hotspots: string[];
}

export interface MetadatosProceso {
  total_analizadas: number;
  fecha_mapeo: string;
}

export interface ProspectResponse {
  metadatos_proceso?: MetadatosProceso;
  vacantes: Vacante[];
  alerta_nuevos_productos: AlertaNuevoProducto[];
  resumen_patrones?: ResumenPatrones;
  patrones: Patron[];
  resumen: string;
  ciudades_top: string[];
  total_analizadas: number;
  is_demo?: boolean;
}

export interface AppNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionable?: boolean;
  targetQuery?: {
    ciudad: string;
    puestos: string[];
  };
}

export interface Feature {
  nombre: string;
  descripcion: string;
  prioridad: 'P1' | 'P2' | 'P3';
  dolor_que_resuelve: string;
}

export interface RoadmapResponse {
  features: Feature[];
}

export interface LogEntry {
  timestamp: string;
  type: 'ok' | 'info' | 'warn' | 'err';
  msg: string;
}

export interface SyncLotHistory {
  id: string;
  timestamp: string;
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  ciudad: string;
  scope: string;
  area: string;
}

export interface ParlamentoMBFase {
  fase: 'apertura' | 'sondeo' | 'presentacion' | 'objeciones' | 'cierre';
  titulo: string;
  guion: string;
  tip: string;
}

export interface ParlamentoMB {
  fases: ParlamentoMBFase[];
  duracion_estimada: string;
  canal_recomendado: string;
  tono: string;
}

export interface OceanoAzulProject {
  id: string;
  titulo: string;
  codename: string;
  descripcion: string;
  bovedaSegura: string;
  estadoMaduracion: 'Concepto' | 'BETA' | 'Producción' | 'Piloto Activo';
  maduracionPorcentaje: number;
  metricas: {
    impactoProyectado: string;
    leadsPotenciales: number;
    retornoAnualEstimado: string;
    eficienciaCoeficiente: number;
  };
  bovedaSector: string;
}

