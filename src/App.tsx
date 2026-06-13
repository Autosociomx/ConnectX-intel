import React, { useState, useEffect, useRef } from "react";
import { 
  Terminal, 
  Search, 
  MapPin, 
  AlertTriangle, 
  Plus, 
  Check, 
  Trash2, 
  TrendingUp, 
  ExternalLink, 
  CheckSquare, 
  Square, 
  FileText, 
  Briefcase, 
  RefreshCw, 
  Zap, 
  MessageSquare,
  HelpCircle,
  Coins,
  ChevronRight,
  Info,
  Bell,
  BellRing,
  Sparkles,
  AlertCircle,
  Database,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Vacante, Patron, Feature, LogEntry, AppNotification, AlertaNuevoProducto, SyncLotHistory } from "./types";
import { ProspectDeepView } from "./components/ProspectDeepView";
import { OceanoAzulEcosystem } from "./components/OceanoAzulEcosystem";

// Firebase and Auth imports
import { auth, db, handleFirestoreError, OperationType } from "./firebase";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  User 
} from "firebase/auth";
import { doc, setDoc, getDocs, collection } from "firebase/firestore";

export default function App() {
  // Firebase Sync state
  const [user, setUser] = useState<User | null>(null);
  const [savedStatus, setSavedStatus] = useState<Record<string, boolean>>({});
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [batchSaving, setBatchSaving] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{
    total: number;
    processed: number;
    successCount: number;
    errorCount: number;
    currentName: string;
    errorsList: { name: string; error: string }[];
  } | null>(null);

  // Persistent Sync History state
  const [syncLotHistory, setSyncLotHistory] = useState<SyncLotHistory[]>(() => {
    try {
      const saved = localStorage.getItem("connectx_sync_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [areaSector, setAreaSector] = useState("Logística y Transporte");
  const [customAreaSector, setCustomAreaSector] = useState("");

  // Config state
  const [ciudad, setCiudad] = useState("Querétaro");
  const [radio, setRadio] = useState("region");
  const [lote, setLote] = useState(50);
  
  // Dolores List
  const INITIAL_DOLORES = [
    { key: "rutas desorganizadas", label: "rutas desorganizadas" },
    { key: "sin control de entregas", label: "sin control de entregas" },
    { key: "reportes manuales", label: "reportes manuales" },
    { key: "cobranza en campo", label: "cobranza en campo" },
    { key: "gestión de clientes", label: "gestión de clientes" },
    { key: "inventario en ruta", label: "inventario en ruta" },
    { key: "rastreo GPS", label: "rastreo GPS" },
    { key: "liquidación diaria", label: "liquidación diaria caótica" }
  ];
  const [activeDolores, setActiveDolores] = useState<string[]>([
    "rutas desorganizadas",
    "sin control de entregas",
    "reportes manuales",
    "liquidación diaria"
  ]);

  // Puestos
  const PUESTOS_PRESET = [
    { id: "c1", label: "Chofer repartidor", checked: true },
    { id: "c2", label: "Auxiliar de reparto", checked: true },
    { id: "c3", label: "Coordinador de rutas", checked: true },
    { id: "c4", label: "Supervisor de distribución", checked: true },
    { id: "c5", label: "Capturista de pedidos", checked: false },
    { id: "c6", label: "Repartidor ventas", checked: false }
  ];
  const [puestos, setPuestos] = useState(PUESTOS_PRESET);

  // Real-time Notification state
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: "init-1",
      type: "info",
      title: "Inicialización ConnectX",
      message: "Monitoreo geo-referencial de vacantes logísticas activo para todo México.",
      timestamp: "Hace 1 min",
      read: false
    },
    {
      id: "init-2",
      type: "alert",
      title: "Dolor Crítico Sectorial",
      message: "Se detectó aumento del 22% en reportes de robos de combustible y descuadres de caja en rutas de última milla en Querétaro.",
      timestamp: "Hace 5 mins",
      read: false,
      actionable: true,
      targetQuery: { ciudad: "Querétaro", puestos: ["Supervisor de distribución", "Chofer repartidor"] }
    }
  ]);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);
  const [toasts, setToasts] = useState<AppNotification[]>([]);

  // Function to sound/trigger notifications
  const triggerNotification = (type: 'info' | 'success' | 'warning' | 'alert', title: string, message: string, actionable?: boolean, targetQuery?: any) => {
    const newNotif: AppNotification = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      title,
      message,
      timestamp: "Ahora mismo",
      read: false,
      actionable,
      targetQuery
    };
    setNotifications(prev => [newNotif, ...prev]);
    setToasts(prev => [...prev, newNotif]);
    // Auto-remove toast after 4500ms
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newNotif.id));
    }, 4500);
  };

  // Click handler for notification (to load configuration)
  const handleApplyNotification = (notif: AppNotification) => {
    if (notif.targetQuery) {
      setCiudad(notif.targetQuery.ciudad);
      if (notif.targetQuery.puestos) {
        setPuestos(prev => prev.map(p => ({
          ...p,
          checked: notif.targetQuery!.puestos.some(nq => nq.toLowerCase() === p.label.toLowerCase())
        })));
      }
      triggerNotification("success", "Filtro Cargado", `Configuración de Inteligencia cargada para: ${notif.targetQuery.ciudad}.`);
      
      // Mark as read
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
      setShowNotificationsMenu(false);
    }
  };

  // App Operational states
  const [selectedTab, setSelectedTab] = useState<"terminal" | "vacantes" | "reporte" | "routepro" | "ecosistema">("terminal");
  const [logs, setLogs] = useState<LogEntry[]>([
    { timestamp: "00:00", type: "ok", msg: "Sistema de prospección ConnectX Intel v2.0 activo." },
    { timestamp: "00:00", type: "info", msg: "Enlace comercial sincronizado con RoutePro API." },
    { timestamp: "00:00", type: "info", msg: "Configura el target operativo y presiona 'Iniciar búsqueda masiva'." }
  ]);
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [hasSearched, setHasSearched] = useState(() => {
    try {
      return localStorage.getItem("connectx_has_searched") === "true";
    } catch {
      return false;
    }
  });
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Business data retrieved with robust localStorage recovery fallback
  const [vacantes, setVacantes] = useState<Vacante[]>(() => {
    try {
      const saved = localStorage.getItem("connectx_vacantes");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [patrones, setPatrones] = useState<Patron[]>(() => {
    try {
      const saved = localStorage.getItem("connectx_patrones");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [resumen, setResumen] = useState(() => {
    try {
      return localStorage.getItem("connectx_resumen") || "";
    } catch {
      return "";
    }
  });
  const [ciudadesTop, setCiudadesTop] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("connectx_ciudades_top");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [totalAnalizadas, setTotalAnalizadas] = useState(() => {
    try {
      const saved = localStorage.getItem("connectx_total_analizadas");
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [features, setFeatures] = useState<Feature[]>(() => {
    try {
      const saved = localStorage.getItem("connectx_features");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [alertaNuevosProductos, setAlertaNuevosProductos] = useState<AlertaNuevoProducto[]>(() => {
    try {
      const saved = localStorage.getItem("connectx_alerta_nuevos_productos");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  // Expanded messages Accordion
  const [expandedWhatsAppIdx, setExpandedWhatsAppIdx] = useState<number | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  // Helpers to push logs
  const addLog = (type: 'ok' | 'info' | 'warn' | 'err', msg: string, startTime: number) => {
    const elapsedSecs = Math.floor((Date.now() - startTime) / 1000);
    const m = Math.floor(elapsedSecs / 60).toString().padStart(2, "0");
    const s = (elapsedSecs % 60).toString().padStart(2, "0");
    setLogs(prev => [...prev, { timestamp: `${m}:${s}`, type, msg }]);
  };

  // Toggle helpers
  const handleDolorToggle = (key: string) => {
    if (activeDolores.includes(key)) {
      setActiveDolores(prev => prev.filter(d => d !== key));
    } else {
      setActiveDolores(prev => [...prev, key]);
    }
  };

  const handlePuestoToggle = (id: string) => {
    setPuestos(prev => prev.map(p => p.id === id ? { ...p, checked: !p.checked } : p));
  };

  const cleanAll = () => {
    setVacantes([]);
    setPatrones([]);
    setResumen("");
    setCiudadesTop([]);
    setTotalAnalizadas(0);
    setFeatures([]);
    setAlertaNuevosProductos([]);
    setProgress(0);
    setHasSearched(false);
    setExpandedWhatsAppIdx(null);

    try {
      localStorage.removeItem("connectx_vacantes");
      localStorage.removeItem("connectx_patrones");
      localStorage.removeItem("connectx_resumen");
      localStorage.removeItem("connectx_ciudades_top");
      localStorage.removeItem("connectx_total_analizadas");
      localStorage.removeItem("connectx_features");
      localStorage.removeItem("connectx_alerta_nuevos_productos");
      localStorage.removeItem("connectx_has_searched");
    } catch (e) {
      console.warn("Could not clean localStorage inside cleanAll:", e);
    }

    setLogs([
      { timestamp: "00:00", type: "ok", msg: "Base de datos local purgada con éxito." },
      { timestamp: "00:00", type: "info", msg: "ConnectX Intel listo para una nueva ronda de búsqueda." }
    ]);
    setSelectedTab("terminal");
  };

  // Run intelligence pipeline
  const runProspeccion = async () => {
    if (isRunning) return;

    const checkedPuestos = puestos.filter(p => p.checked).map(p => p.label);
    
    if (!ciudad || !ciudad.trim()) {
      triggerNotification("alert", "Error de Validación", "Por favor ingresa una ciudad o zona target.");
      return;
    }

    if (checkedPuestos.length === 0) {
      triggerNotification("alert", "Error de Validación", "Debes seleccionar al menos un puesto objetivo.");
      return;
    }

    setIsRunning(true);
    setHasSearched(true);
    setProgress(5);
    setSelectedTab("terminal");
    setExpandedWhatsAppIdx(null);

    const startTime = Date.now();
    
    setLogs([
      { timestamp: "00:00", type: "info", msg: `Iniciando diagnóstico estratégico para: ${ciudad}` }
    ]);
    triggerNotification("info", "Iniciando Búsqueda", `Rastreando vacantes activas y dolores de logística en ${ciudad}...`);

    await new Promise(r => setTimeout(r, 600));
    addLog("info", `Parámetros cargados: Radio [${radio}], Puestos [${checkedPuestos.join(", ")}]`, startTime);
    addLog("info", `Sector comercial target: [${areaSector === "Custom" ? customAreaSector : areaSector}]`, startTime);
    addLog("info", `Dolores logísticos a escanear: ${activeDolores.join(", ")}`, startTime);
    setProgress(15);

    try {
      await new Promise(r => setTimeout(r, 800));
      addLog("info", `Estableciendo conexión y ejecutando Google Search Grounding...`, startTime);
      setProgress(30);
      triggerNotification("warning", "Sondeo en Progreso", `Invocando el rastreo de bolsas y foros logísticos en la región de ${ciudad}...`);

      // Call Express server API endpoint
      const response = await fetch("/api/prospect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ciudad,
          dolores: activeDolores,
          puestos: checkedPuestos,
          lote,
          radio,
          area: areaSector === "Custom" ? customAreaSector : areaSector
        })
      });

      if (!response.ok) {
        throw new Error(`Error en los servicios del servidor: ${response.status} ${response.statusText}`);
      }

      setProgress(55);
      addLog("ok", `Sondeo de empleo y foros logísticos finalizado de forma segura.`, startTime);
      addLog("info", `Desglosando dolor financiero y mermas con modelo Gemini...`, startTime);

      const data = await response.json();
      
      setIsDemoMode(!!data.is_demo);
      if (data.is_demo) {
        addLog("warn", "Modo Simulación Inteligente Activo — No se encontró una clave de API comercial para Gemini.", startTime);
      } else {
        addLog("ok", "Muestreo recibido exitosamente del agente de RoutePro.", startTime);
      }

      await new Promise(r => setTimeout(r, 1000));
      setProgress(75);
      
      // Assign primary data
      const extractedVacantes = data.vacantes || [];
      const extractedPatrones = data.patrones || [];
      setVacantes(extractedVacantes);
      setPatrones(extractedPatrones);
      setResumen(data.resumen || "");
      setCiudadesTop(data.ciudades_top || [ciudad]);
      setTotalAnalizadas(data.total_analizadas || 0);
      setAlertaNuevosProductos(data.alerta_nuevos_productos || []);

      try {
        localStorage.setItem("connectx_vacantes", JSON.stringify(extractedVacantes));
        localStorage.setItem("connectx_patrones", JSON.stringify(extractedPatrones));
        localStorage.setItem("connectx_resumen", data.resumen || "");
        localStorage.setItem("connectx_ciudades_top", JSON.stringify(data.ciudades_top || [ciudad]));
        localStorage.setItem("connectx_total_analizadas", String(data.total_analizadas || 0));
        localStorage.setItem("connectx_alerta_nuevos_productos", JSON.stringify(data.alerta_nuevos_productos || []));
        localStorage.setItem("connectx_has_searched", "true");
      } catch (errLocalStorage) {
        console.warn("Could not save prospection data layout to localStorage:", errLocalStorage);
      }

      addLog("info", `Recibidos ${extractedVacantes.length} prospectos hiper-calificados.`, startTime);
      addLog("info", `Frecuencia e impacto de dolor determinado para ${extractedPatrones.length} patrones sectoriales.`, startTime);
      addLog("info", `Solicitando sugerencias de roadmap de ingeniería (RoutePro Features)...`, startTime);

      triggerNotification(
        "success", 
        "Sondeo Finalizado", 
        `Se identificaron ${extractedVacantes.length} prospectos hiper-calificados en ${ciudad}.`
      );

      // Trigger critical notifications for high pain score
      if (extractedVacantes.length > 0) {
        const highestScoreVacante = [...extractedVacantes].sort((a,b) => b.score - a.score)[0];
        if (highestScoreVacante.score >= 90) {
          triggerNotification(
            "alert", 
            "Dolor Crítico Identificado", 
            `La empresa '${highestScoreVacante.empresa}' califica con Score ${highestScoreVacante.score} debido a fallos severos de liquidación.`
          );
        }
      }

      // Call Feature Generator endpoint
      const featureResponse = await fetch("/api/features-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patrones: extractedPatrones,
          resumen: data.resumen
        })
      });

      if (featureResponse.ok) {
        const featureData = await featureResponse.json();
        const extractedFeatures = featureData.features || [];
        setFeatures(extractedFeatures);
        try {
          localStorage.setItem("connectx_features", JSON.stringify(extractedFeatures));
        } catch (errFeaturesStorage) {
          console.warn("Could not save roadmap features to localStorage:", errFeaturesStorage);
        }
        addLog("ok", `Roadmap tecnológico de mitigación de mermas estructurado con éxito.`, startTime);
      } else {
        addLog("warn", `No se pudo formular el roadmap adaptativo automático.`, startTime);
      }

      setProgress(100);
      addLog("ok", `Análisis comercial completado con éxito. ¡Prospectos filtrados listos!`, startTime);
      
      // Auto switch to results tab
      setSelectedTab("vacantes");

    } catch (err: any) {
      console.error(err);
      addLog("err", `Excepción crítica en la tubería ConnectX: ${err.message}`, startTime);
      triggerNotification("success", "Error de Consulta", `Ocurrió un error consultando los datos del servidor.`);
      setProgress(100);
    } finally {
      setIsRunning(false);
    }
  };

  // Background Alert Simulation Hook
  useEffect(() => {
    const alertInterval = setInterval(() => {
      const places = ["Monterrey", "Guadalajara", "Puebla", "Toluca", "San Luis Potosí", "Querétaro"];
      const roles = ["Chofer repartidor", "Supervisor de distribución", "Gerente de operaciones", "Coordinador de rutas"];
      const randomPlace = places[Math.floor(Math.random() * places.length)];
      const randomRole = roles[Math.floor(Math.random() * roles.length)];
      const scores = [88, 91, 93, 95];
      const randomScore = scores[Math.floor(Math.random() * scores.length)];

      const alertsList = [
        {
          type: "alert" as const,
          title: "Incidencia Crítica Detectada",
          message: `Dolores alarmantes de 'Descuadres de caja' e ineficiencia en liquidación en ${randomPlace} para el rol de ${randomRole}.`,
          actionable: true,
          targetQuery: { ciudad: randomPlace, puestos: [randomRole] }
        },
        {
          type: "warning" as const,
          title: "Desvío Frecuente de Ruta",
          message: `Nuevas vacantes en ${randomPlace} expresan apremio por 'Falta de control de entregas' y mermas de combustible no explicadas.`,
          actionable: true,
          targetQuery: { ciudad: randomPlace, puestos: [randomRole] }
        },
        {
          type: "success" as const,
          title: "Prospecto Óptimo Encontrado",
          message: `Empresa distribuidora en ${randomPlace} busca con alta urgencia un ${randomRole} (Alineación RoutePro: ${randomScore}%).`,
          actionable: true,
          targetQuery: { ciudad: randomPlace, puestos: [randomRole] }
        }
      ];

      const chosenAlert = alertsList[Math.floor(Math.random() * alertsList.length)];
      triggerNotification(chosenAlert.type, chosenAlert.title, chosenAlert.message, chosenAlert.actionable, chosenAlert.targetQuery);
    }, 45000);

    return () => clearInterval(alertInterval);
  }, []);

  // Listen for Google Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        addLog("ok", `Sesión de Google iniciada: ${u.email}`, Date.now());
        fetchSavedProspects(u);
      } else {
        addLog("info", "Inicia sesión con Google para almacenar prospectos persistentes en Firestore.", Date.now());
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch already saved prospects in Firestore to match and show badge
  const fetchSavedProspects = async (currentUser: User) => {
    try {
      const qSnap = await getDocs(collection(db, "prospectos"));
      const statuses: Record<string, boolean> = {};
      qSnap.forEach((doc) => {
        const data = doc.data();
        if (data.informacion_general?.nombre_comercial) {
          statuses[data.informacion_general.nombre_comercial] = true;
        }
      });
      setSavedStatus(statuses);
      addLog("info", `Sincronizados ${Object.keys(statuses).length} prospectos desde Firestore.`, Date.now());
    } catch (error) {
      console.warn("Could not fetch saved status from Firestore:", error);
    }
  };

  // Google sign in / sign out handlers
  const handleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      triggerNotification("success", "Acceso Exitoso", `Sesión iniciada como ${result.user.displayName}`);
    } catch (error: any) {
      addLog("err", `Error iniciando sesión de Google: ${error.message}`, Date.now());
      triggerNotification("alert", "Error de Autenticación", "No se pudo completar el inicio de sesión.");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setSavedStatus({});
      triggerNotification("info", "Sesión Cerrada", "Has cerrado sesión correctamente.");
    } catch (error: any) {
      addLog("err", `Error cerrando sesión: ${error.message}`, Date.now());
    }
  };

  // Convert and save a single Vacante object as Prospecto in Firestore
  const saveToFirestore = async (v: Vacante, idx: number) => {
    if (!user) {
      triggerNotification("warning", "Inicia Sesión", "Debes iniciar sesión con Google para guardar en Firestore.");
      return;
    }

    setSavingIdx(idx);
    const id_prospecto = `PROSP_MX_${Math.floor(100000 + Math.random() * 900000)}`;
    const path = `prospectos/${id_prospecto}`;

    const prospectoDoc = {
      id_prospecto: id_prospecto,
      informacion_general: {
        nombre_comercial: v.empresa,
        contacto: {
          telefono: "+52311XXXXXXX",
          email: `${v.empresa.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
          sitio_web: `https://facebook.com/${v.empresa.toLowerCase().replace(/\s+/g, '')}`
        },
        ubicacion: {
          direccion_completa: `${v.ciudad}, México`,
          geolocalizacion: {
            latitud: 21.5072,
            longitud: -104.8942
          }
        }
      },
      segmentacion: {
        categoria_maestra: "Logística y Transporte",
        subcategoria: v.puesto,
        tamano_estimado: "Mediano"
      },
      analisis_ia: {
        estado_procesamiento: "completado",
        dolores_detectados: v.dolores_detectados || v.dolores || [],
        nivel_prioridad_venta: v.prioridad === 'alta' ? 'Alto' : v.prioridad === 'media' ? 'Medio' : 'Bajo',
        hook_sugerido: v.guion || v.guion_comercial || "Propuesta adaptativa de automatización."
      },
      control: {
        fecha_captura: new Date().toISOString(),
        fuente_origen: "RoutePro_ConnectX_Intel",
        asignado_a_campana: "Autosocio_Afiliados_2026"
      }
    };

    try {
      await setDoc(doc(db, "prospectos", id_prospecto), prospectoDoc);
      setSavedStatus(prev => ({ ...prev, [v.empresa]: true }));
      addLog("ok", `Prospecto '${v.empresa}' guardado exitosamente en Firestore. ID: ${id_prospecto}`, Date.now());
      triggerNotification("success", "Sincronizado", `Se guardó '${v.empresa}' en Firestore.`);
    } catch (error: any) {
      console.error("Firestore persistence failed:", error);
      try {
        handleFirestoreError(error, OperationType.WRITE, path);
      } catch (formattedError: any) {
        addLog("err", `Error de seguridad Firestore: ${formattedError.message}`, Date.now());
        triggerNotification("alert", "Error de Validación", "Se rechazó el guardado por reglas de seguridad.");
      }
    } finally {
      setSavingIdx(null);
    }
  };

  // Convert and save all Vacante objects with real-time feedback
  const saveAllToFirestore = async () => {
    if (!user) {
      triggerNotification("warning", "Inicia Sesión", "Debes iniciar sesión con Google para guardar en Firestore.");
      return;
    }
    if (vacantes.length === 0) return;

    // Filter to only those not already saved
    const pendingToSync = vacantes.filter(v => !savedStatus[v.empresa]);
    if (pendingToSync.length === 0) {
      triggerNotification("info", "Al día", "Todos los prospectos actuales ya están sincronizados en Firestore.");
      return;
    }

    setBatchSaving(true);
    setSyncProgress({
      total: pendingToSync.length,
      processed: 0,
      successCount: 0,
      errorCount: 0,
      currentName: "",
      errorsList: []
    });

    let successCount = 0;
    let errorCount = 0;
    const errorsList: { name: string; error: string }[] = [];
    
    addLog("info", `Iniciando almacenamiento masivo de ${pendingToSync.length} nuevos prospectos a Firestore...`, Date.now());

    for (let i = 0; i < pendingToSync.length; i++) {
      const v = pendingToSync[i];
      setSyncProgress(prev => prev ? {
        ...prev,
        currentName: v.empresa,
        processed: i
      } : null);

      const id_prospecto = `PROSP_MX_${Math.floor(100000 + Math.random() * 900000)}`;
      const prospectoDoc = {
        id_prospecto: id_prospecto,
        informacion_general: {
          nombre_comercial: v.empresa,
          contacto: {
            telefono: "+52311XXXXXXX",
            email: `${v.empresa.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
            sitio_web: `https://facebook.com/${v.empresa.toLowerCase().replace(/\s+/g, '')}`
          },
          ubicacion: {
            direccion_completa: `${v.ciudad}, México`,
            geolocalizacion: {
              latitud: 21.5072,
              longitud: -104.8942
            }
          }
        },
        segmentacion: {
          categoria_maestra: "Logística y Transporte",
          subcategoria: v.puesto,
          tamano_estimado: "Mediano"
        },
        analisis_ia: {
          estado_procesamiento: "completado",
          dolores_detectados: v.dolores_detectados || v.dolores || [],
          nivel_prioridad_venta: v.prioridad === 'alta' ? 'Alto' : v.prioridad === 'media' ? 'Medio' : 'Bajo',
          hook_sugerido: v.guion || v.guion_comercial || "Propuesta adaptativa de automatización."
        },
        control: {
          fecha_captura: new Date().toISOString(),
          fuente_origen: "RoutePro_ConnectX_Intel",
          asignado_a_campana: "Autosocio_Afiliados_2026"
        }
      };

      try {
        await setDoc(doc(db, "prospectos", id_prospecto), prospectoDoc);
        setSavedStatus(prev => ({ ...prev, [v.empresa]: true }));
        successCount++;
        setSyncProgress(prev => prev ? {
          ...prev,
          processed: i + 1,
          successCount
        } : null);
      } catch (error: any) {
        console.warn(`Error individual en guardado masivo para ${v.empresa}:`, error);
        errorCount++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        errorsList.push({ name: v.empresa, error: errorMessage });
        setSyncProgress(prev => prev ? {
          ...prev,
          processed: i + 1,
          errorCount,
          errorsList: [...errorsList]
        } : null);
        addLog("err", `Error al sincronizar '${v.empresa}': ${errorMessage}`, Date.now());
      }
    }

    setBatchSaving(false);
    addLog("ok", `Sincronización masiva de lote terminada. Éxito: ${successCount}, Errores: ${errorCount}`, Date.now());
    triggerNotification(
      errorCount > 0 ? "warning" : "success",
      "Sincronización Masiva",
      `Sincronización finalizada: ${successCount} guardados, ${errorCount} fallidos.`
    );

    // Save batch sync history entry
    const newHistoryEntry: SyncLotHistory = {
      id: `BATCH_${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" }),
      totalProcessed: pendingToSync.length,
      successCount,
      errorCount,
      ciudad,
      scope: radio === "latam" ? "Latinoamérica" : radio === "nacional" ? "Mx" : radio === "region" ? "Región" : radio === "suburbano" ? "Suburbano" : "Urbano",
      area: areaSector === "Custom" ? (customAreaSector || "Custom") : areaSector
    };
    setSyncLotHistory(prev => {
      const updated = [newHistoryEntry, ...prev];
      localStorage.setItem("connectx_sync_history", JSON.stringify(updated));
      return updated;
    });
  };

  const highPriorityCount = vacantes.filter(v => v.prioridad === 'alta').length;

  return (
    <div id="connectx-app" className="min-h-screen bg-[#050505] text-[#e5e5e5] font-mono selection:bg-[#f97316]/30 selection:text-[#f97316] relative overflow-x-hidden pb-12">
      {/* Dynamic Background Matrix Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(249,115,22,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Header */}
      <header id="connectx-header" className="border-b border-border-grid bg-[#0f0f0f]/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent text-black font-sans font-bold text-center flex items-center justify-center rounded-sm tracking-tighter" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
              CX
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-syne font-extrabold text-[20px] text-white tracking-tight">ConnectX Intel</h1>
                <span className="text-[9px] px-2 py-0.5 bg-accent/10 text-accent border border-accent/30 rounded">ROUTEPRO AGENT</span>
              </div>
              <p className="text-[10px] text-[#7a8899] uppercase tracking-widest mt-0.5">Commercial Pipeline Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isDemoMode && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-[#e05c00]/10 border border-[#e05c00]/40 text-[#e05c00] rounded text-xs">
                <Info className="w-3.5 h-3.5" />
                <span>Simulador Activo</span>
              </div>
            )}

            {/* Real-time notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotificationsMenu(!showNotificationsMenu)}
                className="p-2 bg-[#151515] border border-border-grid rounded text-[#7a8899] hover:text-white transition-all relative cursor-pointer"
              >
                {notifications.some(n => !n.read) ? (
                  <>
                    <BellRing className="w-4 h-4 text-accent animate-pulse" />
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-accent rounded-full" />
                  </>
                ) : (
                  <Bell className="w-4 h-4 text-[#7a8899]" />
                )}
              </button>

              <AnimatePresence>
                {showNotificationsMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-80 bg-[#0f0f0f] border border-border-grid rounded-lg shadow-xl overflow-hidden z-50 font-mono text-xs"
                  >
                    <div className="p-3 border-b border-border-grid bg-black/40 flex items-center justify-between">
                      <span className="font-syne font-bold text-white uppercase tracking-wider text-[10px]">// Alertas de Fuga Intel</span>
                      <button 
                        onClick={() => {
                          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                          triggerNotification("info", "Centro Limpio", "Todas las alertas se marcaron como leídas.");
                        }}
                        className="text-[10px] text-accent hover:underline bg-transparent border-0 cursor-pointer"
                      >
                        Marcar leídos
                      </button>
                    </div>

                    <div className="divide-y divide-border-grid/60 max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-[#3a4555]">
                          Sin alertas en este momento.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div 
                            key={n.id} 
                            className={`p-3.5 space-y-1.5 transition-all text-left ${n.read ? "opacity-60 bg-transparent" : "bg-accent/5"}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className={`font-bold uppercase text-[9px] px-1.5 py-0.5 rounded ${
                                n.type === "alert" ? "bg-red-950/40 text-red-400 border border-red-900/60" :
                                n.type === "warning" ? "bg-orange-950/40 text-accent border border-orange-900/60" :
                                n.type === "success" ? "bg-green-950/40 text-emerald-400 border border-green-900/60" :
                                "bg-blue-950/40 text-blue-400 border border-blue-900/60"
                              }`}>
                                {n.type}
                              </span>
                              <span className="text-[9px] text-[#3a4555]">{n.timestamp}</span>
                            </div>
                            <h5 className="font-syne font-bold text-white leading-tight">{n.title}</h5>
                            <p className="text-[#a4b3c6] text-[11px] leading-relaxed select-none">{n.message}</p>
                            
                            {n.actionable && n.targetQuery && (
                              <button 
                                onClick={() => handleApplyNotification(n)}
                                className="mt-2 text-[10px] text-accent font-semibold flex items-center hover:underline cursor-pointer bg-transparent border-0"
                              >
                                Analizar Objetivo ({n.targetQuery.ciudad}) <ChevronRight className="w-3 h-3 ml-0.5" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {user ? (
              <div className="flex items-center gap-2 px-3 py-1 bg-[#0f0f0f] border border-border-grid rounded-sm text-xs font-mono">
                <div className="hidden sm:flex flex-col text-right mr-1">
                  <span className="text-[10px] text-white leading-tight font-bold">{user.displayName || "Usuario"}</span>
                  <span className="text-[8px] text-[#7a8899] leading-none">{user.email}</span>
                </div>
                <button 
                  onClick={handleSignOut}
                  className="px-2 py-1 bg-red-950/30 border border-red-500/30 text-red-400 hover:bg-red-950/50 rounded text-[9px] font-mono cursor-pointer"
                >
                  Salir
                </button>
              </div>
            ) : (
              <button 
                onClick={handleSignIn}
                className="px-3 py-1.5 bg-accent/20 hover:bg-accent/30 border border-accent/40 text-accent rounded text-xs font-mono cursor-pointer font-bold flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-accent animate-pulse" />
                <span>Conectar Google</span>
              </button>
            )}

            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0f0f0f] border border-border-grid rounded-sm text-xs font-mono text-[#7a8899]">
              <span className={`w-2 h-2 rounded-full ${user ? "bg-[#00c97a]" : "bg-orange-500"} animate-pulse`} />
              <span>{user ? "Sincronizado" : "Local"}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid View */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Sidebar Config Section */}
          <aside className="lg:col-span-4 space-y-6">
            
            {/* Box 1: Target Geography */}
            <div id="target-geography-card" className="bg-[#0f0f0f] border border-border-grid rounded-md p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border-grid pb-2">
                <span className="text-[10px] text-[#3a4555] tracking-widest uppercase">// 01 Target Geográfico</span>
                <span className="text-accent text-[11px] font-sans font-bold">MX Hub</span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label htmlFor="ciudad-input" className="block text-[10px] text-[#7a8899] uppercase tracking-wider mb-1.5">Ciudad o Zona Target</label>
                  <div className="relative">
                    <MapPin className="absolute left-2.5 top-2.5 w-4 h-4 text-[#3a4555]" />
                    <input 
                      id="ciudad-input"
                      type="text" 
                      className="w-full bg-[#151515] border border-border-grid focus:border-accent text-sm text-[#d0d8e8] pl-9 pr-3 py-2 rounded outline-none transition-colors"
                      value={ciudad}
                      onChange={(e) => setCiudad(e.target.value)}
                      placeholder="ej. Querétaro, CDMX, Monterrey"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="radio-select" className="block text-[10px] text-[#7a8899] uppercase tracking-wider mb-1.5">Alcance Geográfico</label>
                  <select 
                    id="radio-select"
                    className="w-full bg-[#151515] border border-border-grid focus:border-accent text-xs text-[#d0d8e8] p-2 rounded outline-none transition-colors"
                    value={radio}
                    onChange={(e) => setRadio(e.target.value)}
                  >
                    <option value="urbano">Solo ciudad urbana (Local)</option>
                    <option value="suburbano">Suburbano</option>
                    <option value="region">Región metropolitana</option>
                    <option value="nacional">Nacional Mx</option>
                    <option value="latam">América Latina completa (LATAM)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="area-select" className="block text-[10px] text-[#7a8899] uppercase tracking-wider mb-1.5">Área o Sector de Negocio</label>
                  <select 
                    id="area-select"
                    className="w-full bg-[#151515] border border-border-grid focus:border-accent text-xs text-[#d0d8e8] p-2 rounded outline-none transition-colors mb-2"
                    value={areaSector}
                    onChange={(e) => setAreaSector(e.target.value)}
                  >
                    <option value="Logística y Transporte">Logística y Transporte</option>
                    <option value="Salud e Insumos Médicos">Salud e Insumos Médicos (Clínicas, Hospitales)</option>
                    <option value="Abarrotes y Consumo Masivo">Abarrotes y Consumo Masivo (Retail, Tiendas)</option>
                    <option value="Manufactura y Distribución">Manufactura y Distribución</option>
                    <option value="Servicios de Campo y Ventas">Servicios de Campo y Ventas</option>
                    <option value="Custom">Customizado...</option>
                  </select>
                  {areaSector === "Custom" && (
                    <input 
                      id="custom-area-input"
                      type="text"
                      className="w-full bg-[#151515] border border-[#f97316]/40 focus:border-accent text-xs text-[#d0d8e8] px-2.5 py-1.5 rounded outline-none transition-colors animate-fadeIn"
                      value={customAreaSector}
                      onChange={(e) => setCustomAreaSector(e.target.value)}
                      placeholder="ej. Distribución de Gas, Seguridad, Retail"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Box 2: Pain Signals */}
            <div id="pain-signals-card" className="bg-[#0f0f0f] border border-border-grid rounded-md p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-border-grid pb-2">
                <span className="text-[10px] text-[#3a4555] tracking-widest uppercase">// 02 Señales de Dolor</span>
                <span className="text-accent text-[11px] font-sans font-bold">Fuga Operativa</span>
              </div>
              <p className="text-[11px] text-[#7a8899]">Filtra los dolores recurrentes que RoutePro soluciona de inmediato:</p>
              
              <div className="flex flex-wrap gap-2 pt-1">
                {INITIAL_DOLORES.map((dolor) => {
                  const isActive = activeDolores.includes(dolor.key);
                  return (
                    <button
                      key={dolor.key}
                      onClick={() => handleDolorToggle(dolor.key)}
                      className={`text-[11px] px-2.5 py-1.5 rounded transition-all flex items-center gap-1.5 border cursor-pointer ${
                        isActive 
                          ? "bg-accent/10 border-accent text-accent" 
                          : "bg-[#151515] border-border-grid text-[#7a8899] hover:border-white/20"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-accent" : "bg-[#3a4555]"}`} />
                      <span>{dolor.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Box 3: Target Roles */}
            <div id="target-roles-card" className="bg-[#0f0f0f] border border-border-grid rounded-md p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border-grid pb-2">
                <span className="text-[10px] text-[#3a4555] tracking-widest uppercase">// 03 Puestos Objetivo</span>
                <span className="text-accent text-[11px] font-sans font-bold">Sondeo Vacantes</span>
              </div>
              
              <div className="space-y-2">
                {puestos.map((puesto) => (
                  <label 
                    key={puesto.id}
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded bg-[#151515] hover:bg-[#151515]/80 border border-border-grid text-xs text-[#d0d8e8] cursor-pointer"
                  >
                    <input 
                      type="checkbox"
                      checked={puesto.checked}
                      onChange={() => handlePuestoToggle(puesto.id)}
                      className="rounded border-border-grid text-accent focus:ring-0 cursor-pointer"
                    />
                    <span>{puesto.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Run controls and lot sizing */}
            <div className="bg-[#0f0f0f]/60 p-4 border border-border-grid rounded-md space-y-4">
              <div>
                <label htmlFor="lote-input" className="block text-[10px] text-[#7a8899] uppercase mb-1.5 font-bold tracking-wider">Lote máximo de vacantes a analizar</label>
                <input 
                  id="lote-input"
                  type="number"
                  min="5"
                  max="150"
                  className="w-full bg-[#151515] border border-border-grid text-xs p-2 rounded outline-none text-[#e5e5e5] focus:border-accent"
                  value={lote}
                  onChange={(e) => setLote(parseInt(e.target.value) || 30)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  id="btn-buscar"
                  onClick={runProspeccion}
                  disabled={isRunning || puestos.every(p => !p.checked)}
                  className="col-span-2 bg-accent text-black font-syne font-extrabold text-sm uppercase py-3 px-4 rounded hover:bg-accent/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-accent/10"
                >
                  {isRunning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-black" />
                      <span>Analizando...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-black fill-black" />
                      <span>Iniciar prospección</span>
                    </>
                  )}
                </button>

                <button
                  onClick={cleanAll}
                  className="col-span-2 text-xs text-[#7a8899] hover:text-[#d0d8e8] font-mono border border-border-grid p-2 rounded bg-transparent hover:bg-[#151515]/30 transition-all cursor-pointer"
                >
                  Limpiar resultados
                </button>
              </div>
            </div>

            {/* Quick stats panel */}
            <AnimatePresence>
              {hasSearched && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-[#0f0f0f] border border-border-grid p-4 rounded-md space-y-3"
                >
                  <span className="text-[10px] text-[#3a4555] tracking-widest uppercase block font-bold">// Sesión Activa</span>
                  <div className="grid grid-cols-2 gap-1.5 text-center">
                    <div className="bg-[#151515] p-3 rounded border border-border-grid">
                      <div className="text-[10px] opacity-50 uppercase">Prospectos</div>
                      <div className="text-xl font-mono font-bold mt-1 text-[#e5e5e5]">{vacantes.length}</div>
                    </div>
                    <div className="bg-[#151515] p-3 rounded border border-border-grid">
                      <div className="text-[10px] opacity-50 uppercase">Urgencia Alta</div>
                      <div className="text-xl font-mono font-bold text-accent mt-1">{highPriorityCount}</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </aside>

          {/* Main Dashboard / Panel Area */}
          <section className="lg:col-span-8 flex flex-col min-h-[660px]">
            
            {/* Tabs */}
            <div id="tab-nav" className="flex border-b border-border-grid bg-[#0f0f0f]/40 px-2 rounded-t-md">
              <button 
                onClick={() => setSelectedTab("terminal")}
                className={`flex items-center gap-2 py-3 px-5 text-xs uppercase tracking-wider font-mono border-b-2 transition-all cursor-pointer ${
                  selectedTab === "terminal" 
                    ? "border-accent text-accent" 
                    : "border-transparent text-[#7a8899] hover:text-white"
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Gestor Terminal</span>
              </button>

              <button 
                onClick={() => setSelectedTab("vacantes")}
                className={`flex items-center gap-2 py-3 px-5 text-xs uppercase tracking-wider font-mono border-b-2 transition-all cursor-pointer ${
                  selectedTab === "vacantes" 
                    ? "border-accent text-accent" 
                    : "border-transparent text-[#7a8899] hover:text-white"
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Prospectos</span>
                {vacantes.length > 0 && (
                  <span className="px-1.5 py-0.2 text-[9px] bg-accent text-black rounded-full font-bold">
                    {vacantes.length}
                  </span>
                )}
              </button>

              <button 
                onClick={() => setSelectedTab("reporte")}
                className={`flex items-center gap-2 py-3 px-5 text-xs uppercase tracking-wider font-mono border-b-2 transition-all cursor-pointer ${
                  selectedTab === "reporte" 
                    ? "border-accent text-accent" 
                    : "border-transparent text-[#7a8899] hover:text-white"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Métricas</span>
              </button>

              <button 
                onClick={() => setSelectedTab("routepro")}
                className={`flex items-center gap-2 py-3 px-5 text-xs uppercase tracking-wider font-mono border-b-2 transition-all cursor-pointer ${
                  selectedTab === "routepro" 
                    ? "border-accent text-accent" 
                    : "border-transparent text-[#7a8899] hover:text-white"
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Roadmap RoutePro</span>
              </button>

              <button 
                onClick={() => setSelectedTab("ecosistema")}
                className={`flex items-center gap-2 py-3 px-5 text-xs uppercase tracking-wider font-mono border-b-2 transition-all cursor-pointer ${
                  selectedTab === "ecosistema" 
                    ? "border-accent text-accent" 
                    : "border-transparent text-[#7a8899] hover:text-white"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ecosistema & Micro-SaaS</span>
                {alertaNuevosProductos.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[8px] bg-[#00c97a] text-black font-bold rounded-full select-none animate-pulse">
                    {alertaNuevosProductos.length}
                  </span>
                )}
              </button>
            </div>

            {/* TAB PANEL 1: TERMINAL / LOGS */}
            <div id="panel-terminal" className={`bg-[#0f0f0f] border border-border-grid border-t-0 rounded-b-md p-6 flex flex-col flex-1 ${selectedTab === "terminal" ? "" : "hidden"}`}>
              
              <div className="bg-black rounded border border-border-grid overflow-hidden flex flex-col flex-1 min-h-[360px] max-h-[480px]">
                <div className="bg-[#0f0f0f] px-4 py-2 border-b border-border-grid flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                    <span className="text-[10px] text-[#7a8899] font-mono ml-4">connectx-api-stream — console</span>
                  </div>
                  <span className="text-[9px] text-[#3a4555]">Active TLS</span>
                </div>

                {/* Log Line Scroll container */}
                <div className="p-4 overflow-y-auto font-mono text-[11px] leading-relaxed flex-1 space-y-1.5 bg-[#05070a]">
                  {logs.map((log, i) => (
                    <div key={i} className="flex gap-2 items-start animate-fadeIn">
                      <span className="text-[#3a4555] select-none">[{log.timestamp}]</span>
                      <span className={`font-bold uppercase select-none ${
                        log.type === "ok" ? "text-[#00c97a]" :
                        log.type === "err" ? "text-[#ff4444]" :
                        log.type === "warn" ? "text-[#e05c00]" : "text-[#4a9eff]"
                      }`}>
                        {log.type}
                      </span>
                      <span className="text-[#a4b3c6]">{log.msg}</span>
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              </div>

              {/* Progress bar container */}
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#7a8899]">Estado de la consulta</span>
                  <span className="text-accent">{progress}%</span>
                </div>
                <div className="w-full bg-[#151515] h-1.5 rounded-full overflow-hidden border border-border-grid">
                  <div 
                    className="bg-accent h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* HISTORIAL DE SINCRONIZACIÓN EN FIRESTORE (Lotes Masivos) */}
              <div id="sync-history-panel" className="mt-6 border-t border-border-grid/50 pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-accent animate-pulse" />
                    <h3 className="font-syne font-bold text-[11px] text-white tracking-wider uppercase">// Historial de Sincronización en Lote (Firestore)</h3>
                  </div>
                  {syncLotHistory.length > 0 && (
                    <button 
                      onClick={() => {
                        setSyncLotHistory([]);
                        localStorage.removeItem("connectx_sync_history");
                        triggerNotification("info", "Historial Limpiado", "El historial de lotes sincronizados fue eliminado localmente.");
                      }}
                      className="text-[9px] text-[#ff4444] hover:text-red-400 font-mono tracking-wider uppercase cursor-pointer"
                    >
                      [ Limpiar Historial ]
                    </button>
                  )}
                </div>

                {syncLotHistory.length === 0 ? (
                  <div className="bg-[#0a0a0a] border border-dashed border-border-grid/40 rounded p-4 text-center text-[11px] text-[#3a4555]">
                    No se han registrado lotes guardados en Firestore en esta terminal.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[180px] overflow-y-auto pr-1">
                    {syncLotHistory.map((lot) => (
                      <div key={lot.id} className="bg-[#0c0c0c] border border-border-grid/60 rounded p-2.5 space-y-2 hover:border-accent/40 transition-colors animate-fadeIn text-[10px]">
                        <div className="flex items-center justify-between border-b border-border-grid/40 pb-1">
                          <span className="font-bold text-accent font-mono">{lot.id}</span>
                          <span className="text-[#7a8899] font-mono">{lot.timestamp}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[#a4b3c6]">
                          <div>
                            <span className="text-[#556575] text-[8px] uppercase block">Sector</span>
                            <span className="font-semibold block truncate">{lot.area}</span>
                          </div>
                          <div>
                            <span className="text-[#556575] text-[8px] uppercase block">Target / Alcance</span>
                            <span className="font-semibold block truncate">{lot.ciudad} ({lot.scope})</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between bg-[#111] px-2 py-1 rounded border border-border-grid/30">
                          <span className="text-[#7a8899]">Subidos: <strong className="text-white font-mono">{lot.totalProcessed}</strong></span>
                          <div className="flex gap-2">
                            <span className="text-green-400 font-mono font-bold">✓ {lot.successCount}</span>
                            {lot.errorCount > 0 && <span className="text-red-400 font-mono font-bold">✗ {lot.errorCount}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {!hasSearched && (
                <div className="text-center py-12 text-[#3a4555] space-y-2 flex-1 flex flex-col justify-center items-center">
                  <Search className="w-12 h-12 stroke-1 opacity-40 text-[#7a8899] mb-2 animate-pulse" />
                  <div className="font-syne font-bold text-[#7a8899] text-base">Conexión Segura Establecida</div>
                  <div className="text-xs max-w-sm text-[#3a4555]">
                    El agente comercial interactúa con el buscador web y las bolsas de empleo locales en México para compilar prospectos.
                  </div>
                </div>
              )}
            </div>

            {/* TAB PANEL 2: VACANTES LISTING */}
            <div id="panel-vacantes" className={`space-y-4 flex-1 ${selectedTab === "vacantes" ? "" : "hidden"}`}>
              {vacantes.length === 0 ? (
                <div className="bg-[#0f0f0f] border border-border-grid rounded-md text-center py-20 space-y-3">
                  <Briefcase className="w-12 h-12 text-[#3a4555] mx-auto opacity-50" />
                  <div className="font-syne font-bold text-[#7a8899]">Sin prospectos en memoria</div>
                  <p className="text-xs text-[#3a4555] max-w-md mx-auto leading-relaxed">
                    Presiona el botón de "Iniciar prospección" para que ConnectX Intel realice la exploración de reclutadores activos en la región.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {!user && (
                    <div className="bg-[#1a0f02]/40 border border-[#e05c00]/30 text-accent p-3.5 rounded-lg text-xs leading-relaxed flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-accent flex-shrink-0" />
                        <span>Inicia sesión con Google para almacenar y persistir inteligentemente tus prospectos analizados en Firestore.</span>
                      </div>
                      <button 
                        onClick={handleSignIn}
                        className="px-3 py-1 bg-accent/20 hover:bg-accent/30 border border-accent/40 text-accent text-[11px] rounded font-mono shrink-0 cursor-pointer font-bold"
                      >
                        Conectar
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between bg-[#0f0f0f]/80 border border-border-grid px-4 py-2.5 rounded text-xs gap-4 flex-wrap">
                    <div className="flex items-center gap-2 text-[#7a8899]">
                      <span>Comisiones filtradas por urgencia económica</span>
                      <span className="text-[#00c97a] font-bold">· {vacantes.length} vacantes analizadas</span>
                    </div>
                    {user && (
                      <button
                        onClick={saveAllToFirestore}
                        disabled={batchSaving}
                        className="px-3 py-1 bg-accent text-black font-bold uppercase rounded hover:bg-accent/80 transition-all font-mono text-[9px] cursor-pointer flex items-center gap-1"
                      >
                        {batchSaving ? (
                          <RefreshCw className="w-3 h-3 animate-spin text-black" />
                        ) : (
                          <Sparkles className="w-3 h-3 text-black fill-black" />
                        )}
                        <span>Sincronizar Lote a Firestore</span>
                      </button>
                    )}
                  </div>

                  {/* Real-time batch sync status panel */}
                  {syncProgress && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-[#0f0f0f]/90 border border-border-grid rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {batchSaving ? (
                            <RefreshCw className="w-4 h-4 text-accent animate-spin" />
                          ) : syncProgress.errorCount > 0 ? (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          ) : (
                            <Check className="w-4 h-4 text-[#00c97a]" />
                          )}
                          <span className="font-bold text-xs text-white">
                            {batchSaving ? "Sincronizando Lote con Firestore..." : "Sincronización de Lote Finalizada"}
                          </span>
                        </div>
                        <button 
                          onClick={() => setSyncProgress(null)}
                          disabled={batchSaving}
                          className="text-[#7a8899] hover:text-white text-xs px-2.5 py-1 bg-[#151515] hover:bg-[#202020] border border-border-grid rounded transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Cerrar Panel
                        </button>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-[#151515] rounded-full h-2 overflow-hidden border border-border-grid">
                        <div 
                          className="bg-accent h-full transition-all duration-300"
                          style={{ width: `${(syncProgress.processed / syncProgress.total) * 100}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs font-mono">
                        <div className="text-[#7a8899]">
                          Sincronizados: <span className="text-white font-bold">{syncProgress.processed}</span> / {syncProgress.total}
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-[#00c97a] flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>{syncProgress.successCount} Exitosos</span>
                          </span>
                          {syncProgress.errorCount > 0 && (
                            <span className="text-red-400 flex items-center gap-1 font-bold">
                              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                              <span>{syncProgress.errorCount} Errores</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {batchSaving && syncProgress.currentName && (
                        <div className="text-[11px] text-accent animate-pulse font-mono truncate flex items-center gap-1">
                          📡 Guardando en Firestore: "{syncProgress.currentName}"
                        </div>
                      )}

                      {/* Error listing for permission/validation audit trail */}
                      {syncProgress.errorsList.length > 0 && (
                        <div className="border border-red-500/25 bg-red-950/15 rounded p-3 space-y-1.5 max-h-36 overflow-y-auto">
                          <p className="text-[10px] font-bold text-red-400 uppercase flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
                            <span>Registro de Errores / Reglas de Seguridad ({syncProgress.errorCount})</span>
                          </p>
                          <div className="divide-y divide-red-950/25 text-[10px]">
                            {syncProgress.errorsList.map((err, idx) => (
                              <div key={idx} className="py-2 flex flex-col sm:flex-row sm:items-start justify-between gap-1.5">
                                <span className="font-semibold text-gray-300 shrink-0">{err.name}:</span>
                                <span className="text-red-400 font-mono text-left break-all">{err.error}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  <div className="grid grid-cols-1 gap-4">
                    {vacantes.map((v, idx) => {
                      const isExpanded = expandedWhatsAppIdx === idx;
                      return (
                        <div 
                          key={idx}
                          id={`prospect-card-${idx}`}
                          className={`bg-[#0f0f0f] border rounded-lg p-5 transition-all hover:border-white/20 relative overflow-hidden ${
                            v.prioridad === "alta" 
                              ? "border-l-4 border-l-[#00c97a] border-border-grid" 
                              : v.prioridad === "media"
                                ? "border-l-4 border-l-accent border-border-grid"
                                : "border-l-4 border-l-[#3a4555] border-border-grid"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap pb-1">
                                <span className="font-syne font-bold text-base text-white">{v.empresa}</span>
                                <span className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold ${
                                  v.prioridad === "alta" ? "bg-[#00c97a]/15 text-[#00c97a]" :
                                  v.prioridad === "media" ? "bg-accent/15 text-accent" : "bg-[#3a4555]/30 text-[#7a8899]"
                                }`}>
                                  Prioridad {v.prioridad}
                                </span>
                                {savedStatus[v.empresa] ? (
                                  <span className="text-[8px] px-1.5 py-0.5 bg-green-500/10 border border-green-500/30 text-green-400 rounded uppercase font-bold flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                                    <span>SINCRONIZADO EN FIRESTORE</span>
                                  </span>
                                ) : (
                                  <span className="text-[8px] px-1.5 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500/70 rounded uppercase font-bold flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-yellow-500/40" />
                                    <span>LOCAL (PENDIENTE SYNC)</span>
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-accent mt-1 pr-1 font-semibold">{v.puesto} · {v.ciudad}</div>
                            </div>

                            {/* Pain Score Badge */}
                            <div className="flex items-center gap-2 bg-[#151515] border border-border-grid px-3 py-1.5 rounded self-start">
                              <div className="text-right">
                                <p className="text-[20px] font-syne font-black text-accent leading-none">{v.score}</p>
                                <span className="text-[7px] text-[#7a8899] uppercase tracking-wider block mt-1">Pain Score</span>
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-[#7a8899] mt-3 leading-relaxed border-t border-border-grid/40 pt-2">{v.descripcion}</p>

                          {/* Identified pain signals */}
                          <div className="mt-4 flex flex-wrap gap-1.5">
                            {v.dolores.map((dolor, i) => (
                              <span key={i} className="text-[9px] px-2 py-0.5 bg-accent/10 border border-accent/20 text-accent rounded-sm font-sans font-medium uppercase tracking-wider">
                                ⚠ {dolor}
                              </span>
                            ))}
                          </div>

                          {/* Footers of card */}
                          <div className="mt-5 pt-3 border-t border-border-grid/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
                            <div className="flex items-center gap-5 text-[#7a8899] self-start sm:self-auto">
                              <span className="flex items-center gap-1"><Coins className="w-3.5 h-3.5 text-[#00c97a]" /> ROI: <strong className="text-[#00c97a] font-normal">{v.roi_estimado}</strong></span>
                              <span className="hidden sm:inline-block text-[#3a4555]">|</span>
                              <span className="flex items-center gap-1">Pilar: <strong className="text-white font-normal">{v.fuente}</strong></span>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  saveToFirestore(v, idx);
                                }}
                                disabled={savingIdx === idx}
                                className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-1.5 rounded border transition-all text-xs font-mono cursor-pointer ${
                                  savedStatus[v.empresa]
                                    ? "bg-[#00c97a]/15 text-[#00c97a] border-[#00c97a]/40"
                                    : "bg-accent/10 hover:bg-accent/20 border-accent/40 text-accent disabled:opacity-50 disabled:cursor-not-allowed"
                                }`}
                              >
                                {savingIdx === idx ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : savedStatus[v.empresa] ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : (
                                  <Sparkles className="w-3.5 h-3.5" />
                                )}
                                <span>
                                  {savedStatus[v.empresa] ? "Sincronizado" : "Guardar en Firestore"}
                                </span>
                              </button>

                               <button 
                                 onClick={() => setExpandedWhatsAppIdx(isExpanded ? null : idx)}
                                 className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-1.5 bg-[#151515] hover:bg-[#202020] hover:border-accent text-accent rounded border border-border-grid transition-all text-xs font-mono cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>{isExpanded ? "Ocultar Ficha Intel" : "Ver Ficha de Prospecto"}</span>
                              </button>

                              {v.url_original && (
                                <a 
                                  href={v.url_original}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-1.5 bg-[#120a1c] hover:bg-purple-950/40 border border-purple-500/30 text-purple-300 rounded transition-all text-xs font-mono"
                                  id={`btn-vacante-link-${idx}`}
                                >
                                  <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                                  <span>Ir a Vacante</span>
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Expanded Prospect Profile segment via ProspectDeepView component */}
                          <AnimatePresence>
                            {isExpanded && (
                              <ProspectDeepView vacante={v} isExpanded={isExpanded} />
                            )}
                          </AnimatePresence>

                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* TAB PANEL 3: METRICS & AGGREGATE REPORTS */}
            <div id="panel-reporte" className={`space-y-6 flex-1 ${selectedTab === "reporte" ? "" : "hidden"}`}>
              {patrones.length === 0 ? (
                <div className="bg-[#0f0f0f] border border-border-grid rounded-md text-center py-20 space-y-3">
                  <TrendingUp className="w-12 h-12 text-[#3a4555] mx-auto opacity-50" />
                  <div className="font-syne font-bold text-[#7a8899]">Métricas primarias no disponibles</div>
                  <p className="text-xs text-[#3a4555]">Realiza una exploración comercial para modelar las variables del dolor operativo.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Summary Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-[#0f0f0f] border border-border-grid p-5 rounded-lg text-center">
                      <div className="text-3xl font-syne font-extrabold text-accent leading-none mb-1">{totalAnalizadas}</div>
                      <div className="text-[10px] text-[#7a8899] uppercase tracking-wider">Vacantes Exploradas</div>
                    </div>

                    <div className="bg-[#0f0f0f] border border-border-grid p-5 rounded-lg text-center">
                      <div className="text-3xl font-syne font-extrabold text-[#00c97a] leading-none mb-1">{highPriorityCount}</div>
                      <div className="text-[10px] text-[#7a8899] uppercase tracking-wider">Prospectos Alta Urgencia</div>
                    </div>

                    <div className="bg-[#0f0f0f] border border-border-grid p-5 rounded-lg text-center">
                      <div className="text-3xl font-syne font-extrabold text-[#4a9eff] leading-none mb-1">{patrones.length}</div>
                      <div className="text-[10px] text-[#7a8899] uppercase tracking-wider">Patrones de Fuga</div>
                    </div>
                  </div>

                  {/* Summary commentary card */}
                  {resumen && (
                    <div className="bg-[#0f0f0f] border-l-4 border-l-accent border-border-grid p-5 rounded">
                      <h4 className="text-[10px] text-[#7a8899] uppercase font-bold tracking-widest mb-1.5">// Diagnóstico del Agente</h4>
                      <p className="text-xs text-[#d0d8e8] leading-relaxed">{resumen}</p>
                    </div>
                  )}

                  {/* Frequency of Logistical Pains Graph bar */}
                  <div className="bg-[#0f0f0f] border border-border-grid rounded-lg p-5">
                    <div className="flex justify-between items-center pb-3 border-b border-border-grid mb-4">
                      <span className="text-[10px] text-[#7a8899] uppercase tracking-wider font-bold">// Dolores más frecuentes detectados</span>
                      <span className="text-xs text-accent">Ponderación (%)</span>
                    </div>

                    <div className="space-y-4">
                      {patrones.map((p, i) => (
                        <div key={i} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-white font-medium">{p.dolor}</span>
                            <span className="text-accent font-mono">{p.frecuencia} menciones ({p.porcentaje}%)</span>
                          </div>
                          <div className="w-full bg-[#151515] h-2 rounded overflow-hidden border border-border-grid/40">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${p.porcentaje}%` }}
                              className="bg-gradient-to-r from-orange-600 to-accent h-full"
                              transition={{ duration: 0.8, delay: i * 0.1 }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Regional Insights Block */}
                  {ciudadesTop.length > 0 && (
                    <div className="bg-[#0f0f0f] border border-border-grid rounded-lg p-5 space-y-3">
                      <h4 className="text-[10px] text-[#7a8899] uppercase tracking-wider font-bold">// Concentración de mermas por zona</h4>
                      <div className="flex flex-wrap gap-2">
                        {ciudadesTop.map((c, i) => (
                          <div key={i} className="px-3 py-1.5 bg-[#151515] border border-border-grid rounded text-xs text-white">
                            📍 {c}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* TAB PANEL 4: PRODUCT ROADMAP ROUTEPRO FEATURES */}
            <div id="panel-routepro" className={`space-y-4 flex-1 ${selectedTab === "routepro" ? "" : "hidden"}`}>
              {features.length === 0 ? (
                <div className="bg-[#0f0f0f] border border-border-grid rounded-md text-center py-20 space-y-3">
                  <Zap className="w-12 h-12 text-[#3a4555] mx-auto opacity-50" />
                  <div className="font-syne font-bold text-[#7a8899]">Roadmap automático no estructurado</div>
                  <p className="text-xs text-[#3a4555] max-w-sm mx-auto leading-relaxed">
                    Formulamos características a medida para RoutePro alineados con las mermas reales del mercado de {ciudad} tan pronto termines la prospección.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-[#0f0f0f] border border-border-grid rounded-lg p-5">
                    <div className="flex flex-col sm:flex-row items-center justify-between border-b border-border-grid pb-3 mb-4 gap-2">
                      <div>
                        <h3 className="font-syne font-extrabold text-white text-base">Roadmap Adaptativo de RoutePro</h3>
                        <p className="text-[11px] text-[#7a8899] mt-0.5">Mapeo estratégico: Features técnicos de software para erradicar los dolores de los prospectos descubiertos en {ciudad}.</p>
                      </div>
                      <span className="text-[10px] text-[#00c97a] bg-[#00c97a]/15 px-2 py-0.5 rounded border border-[#00c97a]/30 font-bold uppercase shrink-0">
                        Alineado al dolor
                      </span>
                    </div>

                    <div className="divide-y divide-border-grid/60">
                      {features.map((f, i) => (
                        <div key={i} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4 animate-fadeIn">
                          <span className={`text-[9px] px-2.5 py-1.5 rounded font-sans font-bold uppercase shrink-0 block mt-1 border ${
                            f.prioridad === "P1" 
                              ? "bg-[#00c97a]/10 border-[#00c97a]/20 text-[#00c97a]" 
                              : f.prioridad === "P2"
                                ? "bg-accent/10 border-accent/20 text-accent"
                                : "bg-[#4a9eff]/10 border-[#4a9eff]/20 text-[#4a9eff]"
                          }`}>
                            {f.prioridad}
                          </span>
                          <div className="space-y-1">
                            <h4 className="font-syne font-bold text-sm text-white select-none">{f.nombre}</h4>
                            <p className="text-xs text-[#7a8899] leading-relaxed select-none">{f.descripcion}</p>
                            <div className="text-[10px] text-accent/70 flex items-center gap-1 mt-1.5 select-none font-medium">
                              <span>↳ Resuelve:</span>
                              <span className="italic text-[#d0d8e8]/90">{f.dolor_que_resuelve}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* TAB PANEL 5: ECOSYSTEM ROUTING & MICRO-SAAS ALERTS */}
            <div id="panel-ecosistema" className={`space-y-6 flex-1 ${selectedTab === "ecosistema" ? "" : "hidden"}`}>
              {/* Alquimia CX: Océano Azul interactive projects */}
              <OceanoAzulEcosystem />

              {vacantes.length === 0 ? (
                <div className="bg-[#0f0f0f] border border-border-grid rounded-md text-center py-20 space-y-3">
                  <Sparkles className="w-12 h-12 text-[#3a4555] mx-auto opacity-50 animate-pulse" />
                  <div className="font-syne font-bold text-[#7a8899]">Consola de Enrutamiento Cruzado en Espera</div>
                  <p className="text-xs text-[#3a4555] max-w-sm mx-auto leading-relaxed">
                    Inicia el rastreo de reclutamiento operativo en México para habilitar el motor de enrutamiento cruzado y detección de Micro-SaaS adicionales en tiempo real.
                  </p>
                </div>
              ) : (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Part A: Cross-routing Table / List */}
                  <div className="bg-[#0f0f0f] border border-border-grid rounded-lg p-5">
                    <div className="border-b border-border-grid pb-3 mb-4">
                      <h3 className="font-syne font-extrabold text-white text-base">Enrutamiento Cruzado de Leads</h3>
                      <p className="text-[11px] text-[#7a8899] mt-0.5 font-sans font-medium">ConnectX clasifica de forma inteligente cada prospecto mexicano dentro de tu portafolio de productos existente.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {vacantes.map((v, idx) => {
                        const route = v.enrutamiento_ecosistema || { aplica_rute_pro: true, aplica_conecta_x: false, aplica_alquimia_cx: false };
                        const tools = v.herramientas_obsoletas_actuales || ["Papel", "Excel"];
                        return (
                          <div key={idx} className="bg-[#0a0a0c] border border-border-grid p-4 rounded-md flex flex-col justify-between hover:border-white/10 transition-all">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-syne font-bold text-sm text-white">{v.empresa}</span>
                                <span className="text-[9px] text-[#7a8899] font-mono select-none">📍 {v.ciudad.replace(", México", "")}</span>
                              </div>
                              <div className="text-xs text-accent font-semibold">{v.puesto}</div>
                              <p className="text-[11px] text-[#7a8899] leading-relaxed line-clamp-2">"{v.descripcion}"</p>
                              
                              {/* Obsolete Tools Badge */}
                              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <span className="text-[8px] text-[#4a5869] uppercase font-mono tracking-widest mr-1">Remover:</span>
                                {tools.map((tool, tIdx) => (
                                  <span key={tIdx} className="text-[9px] px-1.5 py-0.5 bg-red-950/20 text-red-400 border border-red-900/30 rounded-sm font-mono line-through opacity-75">
                                    {tool}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Portfolio destinations */}
                            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border-grid/40 text-center select-none">
                              <div className={`p-1.5 rounded border text-[9px] font-mono leading-none flex flex-col justify-center items-center gap-1 ${
                                route.aplica_rute_pro 
                                  ? "bg-emerald-950/25 border-emerald-500/40 text-emerald-400 font-bold" 
                                  : "bg-[#0b0c0d] border-border-grid/35 text-[#3a4555]"
                              }`}>
                                <Zap className="w-3 h-3" />
                                <span>RoutePro</span>
                              </div>
                              <div className={`p-1.5 rounded border text-[9px] font-mono leading-none flex flex-col justify-center items-center gap-1 ${
                                route.aplica_conecta_x 
                                  ? "bg-blue-950/25 border-blue-500/40 text-blue-400 font-bold" 
                                  : "bg-[#0b0c0d] border-border-grid/35 text-[#3a4555]"
                              }`}>
                                <AlertCircle className="w-3 h-3" />
                                <span>ConectaX</span>
                              </div>
                              <div className={`p-1.5 rounded border text-[9px] font-mono leading-none flex flex-col justify-center items-center gap-1 ${
                                route.aplica_alquimia_cx 
                                  ? "bg-purple-950/25 border-purple-500/40 text-purple-400 font-bold" 
                                  : "bg-[#0b0c0d] border-border-grid/35 text-[#3a4555]"
                              }`}>
                                <Sparkles className="w-3 h-3" />
                                <span>Alquimia</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Part B: On-Demand Micro-SaaS alarms */}
                  <div className="bg-[#0f0f0f] border border-border-grid rounded-lg p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border-grid pb-3 mb-4 gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-syne font-extrabold text-white text-base">Alertas de Nuevos Productos & Micro-SaaS</h3>
                          <span className="bg-orange-500/10 border border-orange-500/30 text-accent text-[8px] tracking-widest uppercase font-black px-1.5 py-0.5 rounded animate-pulse">Semáforo de Brechas Activo</span>
                        </div>
                        <p className="text-[11px] text-[#7a8899] mt-0.5 font-sans font-medium">Brechas de mercado registradas por dolores recurrentes para desarrollo satélite bajo demanda.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {alertaNuevosProductos.map((alerta, aIdx) => (
                        <div key={aIdx} className="bg-[#0b0c10] border border-l-4 border-l-accent border-border-grid p-4 rounded-md space-y-3 relative overflow-hidden flex flex-col justify-between">
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[9px] text-[#7a8899] font-mono select-none uppercase tracking-wider">⚠ Alerta Inteligente</span>
                              <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${
                                alerta.potencial_micro_saas === "alto" 
                                  ? "bg-emerald-950 text-emerald-400 border border-emerald-900" 
                                  : "bg-[#151515] text-[#7a8899] border border-border-grid/60"
                              }`}>
                                Potencial {alerta.potencial_micro_saas}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <h4 className="text-[11px] font-sans font-extrabold text-white uppercase tracking-wider">
                                Dolor No Cubierto
                              </h4>
                              <p className="text-xs text-[#a4b3c6] leading-relaxed italic">"{alerta.dolor_no_cubierto}"</p>
                            </div>
                          </div>

                          <div className="space-y-3 pt-2 text-[11px]">
                            <div className="bg-[#111] p-3 rounded border border-border-grid/50 space-y-1">
                              <div className="text-[9px] text-accent font-extrabold uppercase tracking-widest">SaaS Requerido</div>
                              <p className="text-white leading-relaxed">{alerta.herramienta_necesaria_demandada}</p>
                            </div>
                            <div className="bg-[#111] p-3 rounded border border-border-grid/50 space-y-1">
                              <div className="text-[9px] text-[#00c97a] font-extrabold uppercase tracking-widest">Oportunidad del Mercado</div>
                              <p className="text-white leading-relaxed">{alerta.justificacion_oportunidad}</p>
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>

          </section>

        </div>
      </main>

      {/* Real-time Toasts Overlay Stream */}
      <div id="connectx-toast-stream" className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div 
              key={t.id}
              initial={{ opacity: 0, x: 80, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, x: 80 }}
              className="bg-[#0f0f0f]/95 border border-border-grid shadow-2xl p-4 rounded-lg flex gap-3 pointer-events-auto relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1.5 before:bg-accent overflow-hidden"
            >
              <div className="flex-1 space-y-1.5 text-left text-xs">
                <div className="flex items-center justify-between text-[10px]">
                  <span className={`font-bold uppercase tracking-wider text-[8px] px-1.5 py-0.5 rounded ${
                    t.type === "alert" ? "bg-red-950/40 text-red-400 border border-red-900/40" :
                    t.type === "warning" ? "bg-orange-950/40 text-accent border border-orange-900/40" :
                    t.type === "success" ? "bg-green-950/40 text-emerald-400 border border-green-900/40" :
                    "bg-blue-950/40 text-blue-400 border border-blue-900/40"
                  }`}>
                    {t.type}
                  </span>
                  <button 
                    onClick={() => setToasts(prev => prev.filter(toast => toast.id !== t.id))}
                    className="text-[#5a687a] hover:text-white cursor-pointer bg-transparent border-0 font-bold"
                  >
                    ×
                  </button>
                </div>
                <h6 className="font-syne font-bold text-white leading-tight flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-accent animate-pulse" />
                  {t.title}
                </h6>
                <p className="text-[#a4b3c6] text-[11px] leading-relaxed select-none">{t.message}</p>
                
                {t.actionable && t.targetQuery && (
                  <button 
                    onClick={() => handleApplyNotification(t)}
                    className="mt-1 text-[10px] text-accent font-semibold flex items-center gap-1 hover:underline cursor-pointer bg-transparent border-0"
                  >
                    Analizar Objetivo ({t.targetQuery.ciudad}) <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
