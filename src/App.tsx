import React, { useState, useEffect, useRef, MouseEvent } from 'react';
import { 
  Mic, 
  Square, 
  Play, 
  Trash2, 
  Check, 
  X, 
  ChevronRight, 
  Filter, 
  Plus, 
  RotateCcw, 
  Edit2,
  Calendar,
  Tag,
  Briefcase,
  AlertCircle,
  Settings,
  Menu,
  ArrowLeft,
  Save,
  ChevronDown,
  Search,
  SortAsc,
  ChevronLeft,
  LayoutGrid,
  List
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Capture, PriorityType } from './types';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const Logo = ({ className = "w-10 h-10" }: { className?: string }) => (
  <div className={`flex items-center justify-center bg-white rounded-xl shadow-sm border border-zinc-100 ${className}`}>
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-1/2 h-1/2">
      {/* T Horizontal Bar (Height 5) */}
      <path d="M5 6 H16.5 V11 H2 V9 C2 7.34 3.34 6 5 6 Z" fill="#4b4b4b" />
      {/* T Vertical Bar (Width 5) */}
      <rect x="7.5" y="11" width="5" height="10" fill="#4b4b4b" />
      {/* i Dot (Width 5, Height 5) */}
      <path d="M16.5 6 H18.5 C20.16 6 21.5 7.34 21.5 9 V11 H16.5 V6 Z" fill="#ff9800" />
      {/* i Body (Width 5, Height 10) */}
      <path d="M16.5 11 H21.5 V18 C21.5 19.66 20.16 21 18.5 21 H16.5 V11 Z" fill="#4b4b4b" />
    </svg>
  </div>
);

const DEFAULT_PROJECTS = ['Personal', 'Trabajo', 'Estudio', 'Proyectos'];
const PRIORITIES: PriorityType[] = ['baja', 'media', 'alta'];

const INITIAL_CAPTURES: Capture[] = [
  {
    id: '1',
    fecha: new Date().toISOString(),
    titulo: 'Llamar a Juan',
    texto_limpio: 'Recordar preguntarle por el presupuesto del nuevo proyecto y coordinar la entrega.',
    transcripcion_original: 'Llamar a Juan para preguntarle por el presupuesto del nuevo proyecto y coordinar la entrega.',
    tipo: 'Tarea',
    proyecto: 'Trabajo',
    prioridad: 'alta',
    completado: false
  },
  {
    id: '2',
    fecha: new Date().toISOString(),
    titulo: 'Armar reunión de equipo',
    texto_limpio: 'Definir objetivos del trimestre y revisar pendientes de la semana pasada.',
    transcripcion_original: 'Armar reunión de equipo para definir objetivos del trimestre y revisar pendientes de la semana pasada.',
    tipo: 'Reunión',
    proyecto: 'Proyectos',
    prioridad: 'media',
    completado: false
  },
  {
    id: '3',
    fecha: new Date().toISOString(),
    titulo: 'Mirar charla de Diseño',
    texto_limpio: 'Charla sobre nuevas tendencias en interfaces minimalistas y tipografía.',
    transcripcion_original: 'Mirar charla de diseño sobre nuevas tendencias en interfaces minimalistas y tipografía.',
    tipo: 'Estudio',
    proyecto: 'Estudio',
    prioridad: 'baja',
    completado: false
  },
  {
    id: '4',
    fecha: new Date().toISOString(),
    titulo: 'Investigar nuevas APIs',
    texto_limpio: 'Explorar la documentación de la nueva API de voz para mejorar la precisión.',
    transcripcion_original: 'Investigar nuevas APIs explorando la documentación de la nueva API de voz para mejorar la precisión.',
    tipo: 'Investigación',
    proyecto: 'Personal',
    prioridad: 'media',
    completado: false
  }
];

interface CustomDropdownProps {
  label: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
  onAdd?: (val: string) => void;
  onEdit?: (oldVal: string, newVal: string) => void;
  onDelete?: (val: string) => void;
  showAllOption?: boolean;
  buttonClassName?: string;
  className?: string;
  icon?: React.ReactNode;
}

function CustomDropdown({ label, options, value, onChange, onAdd, onEdit, onDelete, showAllOption, buttonClassName, className, icon }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [editingItem, setEditingItem] = useState<{original: string, current: string} | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setEditingItem(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAdd = () => {
    if (newItemName.trim() && onAdd) {
      onAdd(newItemName.trim());
      setNewItemName('');
    }
  };

  const handleUpdate = () => {
    if (editingItem && editingItem.current.trim() && onEdit) {
      onEdit(editingItem.original, editingItem.current.trim());
      setEditingItem(null);
    }
  };

  return (
    <div className={`relative inline-block text-left ${className || ''}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider border rounded-full px-4 py-2 focus:outline-none focus:ring-4 focus:ring-zinc-100 transition-all shadow-sm ${buttonClassName || 'bg-white border-zinc-100 text-zinc-400 hover:border-zinc-200 hover:bg-zinc-50'}`}
      >
        {icon && <span className="text-zinc-400">{icon}</span>}
        <span className="truncate max-w-[100px]">{value === 'all' ? label : value}</span>
        <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute z-50 mt-2 w-64 bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="max-h-64 overflow-y-auto p-1">
              {/* "Todos" Option */}
              {showAllOption && (
                <button
                  onClick={() => { onChange('all'); setIsOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors mb-1 ${value === 'all' ? 'bg-zinc-100 font-bold text-zinc-900' : 'hover:bg-zinc-50 text-zinc-600'}`}
                >
                  Todos
                </button>
              )}

              {/* Existing Items */}
              {options.map((opt) => (
                <div key={opt} className="group flex items-center gap-1 px-1">
                  {editingItem?.original === opt ? (
                    <div className="flex flex-1 items-center gap-1 p-1 bg-zinc-50 rounded-lg">
                      <input
                        autoFocus
                        type="text"
                        value={editingItem.current}
                        onChange={(e) => setEditingItem({ ...editingItem, current: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                        className="flex-1 text-xs p-1 bg-white border border-zinc-300 rounded focus:outline-none text-zinc-900"
                      />
                      <button onClick={handleUpdate} className="text-green-600 p-1"><Check size={14} /></button>
                      <button onClick={() => setEditingItem(null)} className="text-zinc-400 p-1"><X size={14} /></button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => { onChange(opt); setIsOpen(false); }}
                        className={`flex-1 text-left px-3 py-2.5 text-xs rounded-lg transition-colors truncate ${value === opt ? 'bg-zinc-100 font-bold text-zinc-900' : 'hover:bg-zinc-50 text-zinc-600'}`}
                      >
                        {opt}
                      </button>
                      {(onEdit || onDelete) && (
                        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                          {onEdit && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingItem({ original: opt, current: opt }); }}
                              className="p-1.5 text-zinc-400 hover:text-zinc-600"
                            >
                              <Edit2 size={12} />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onDelete(opt); }}
                              className="p-1.5 text-red-400 hover:text-red-600"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}

              {/* Minimalist Add Section */}
              {onAdd && (
                <div className="p-2 mt-1 border-t border-zinc-50 bg-zinc-50/30">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder={`Nuevo ${label.toLowerCase()}...`}
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                      className="w-full text-[10px] p-2 bg-white border border-zinc-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-200 placeholder:text-zinc-300 text-zinc-900"
                    />
                    <button onClick={handleAdd} className="absolute right-2 p-1 text-zinc-400 hover:text-zinc-900 transition-colors">
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [captures, setCaptures] = useState<Capture[]>(() => {
    const saved = localStorage.getItem('buzon_captures');
    return saved ? JSON.parse(saved) : INITIAL_CAPTURES;
  });
  const [projects, setProjects] = useState<string[]>(() => {
    const saved = localStorage.getItem('buzon_projects');
    return saved ? JSON.parse(saved) : DEFAULT_PROJECTS;
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingCapture, setPendingCapture] = useState<Partial<Capture> | null>(null);
  const [selectedCapture, setSelectedCapture] = useState<Capture | null>(null);
  const [filterProject, setFilterProject] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewFilter, setViewFilter] = useState<'recientes' | 'prioridad' | 'finalizados'>('recientes');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem('buzon_viewmode');
    return (saved as 'grid' | 'list') || 'grid';
  });
  const [longPressedCapture, setLongPressedCapture] = useState<Capture | null>(null);
  const [showSearch, setShowSearch] = useState(true);
  const lastScrollY = useRef(0);

  const [showResetModal, setShowResetModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [showTopMenu, setShowTopMenu] = useState(false);
  const topMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (topMenuRef.current && !topMenuRef.current.contains(event.target as Node)) {
        setShowTopMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    
    // Always show at the very top
    if (currentScrollY <= 10) {
      setShowSearch(true);
      lastScrollY.current = currentScrollY;
      return;
    }

    const diff = currentScrollY - lastScrollY.current;
    
    // Hide when scrolling DOWN
    if (diff > 15) {
      setShowSearch(false);
    } 
    // Show when scrolling UP
    else if (diff < -15) {
      setShowSearch(true);
    }
    
    lastScrollY.current = currentScrollY;
  };

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleLongPressStart = (capture: Capture) => {
    longPressTimer.current = setTimeout(() => {
      setLongPressedCapture(capture);
      // Vibrate if supported
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }, 600);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('buzon_captures', JSON.stringify(captures));
  }, [captures]);

  useEffect(() => {
    localStorage.setItem('buzon_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('buzon_viewmode', viewMode);
  }, [viewMode]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (err) {
      console.error("Error accessing microphone", err);
      alert("No se pudo acceder al micrófono.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const processAudio = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'undefined' || process.env.GEMINI_API_KEY === '') {
        throw new Error("API Key no encontrada. Asegurate de haberla configurado en los 'Secrets' de GitHub y haber hecho un nuevo 'Push'.");
      }

      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
      });

      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });

      const result = await model.generateContent([
        { inlineData: { mimeType: "audio/webm", data: base64Data } },
        {
          text: `Analizá este audio en español rioplatense. 
          Extraé la información y devolvela en formato JSON con el siguiente esquema:
          - titulo: un título corto y claro
          - proyecto: una de estas opciones: ${projects.join(', ')}
          - texto_limpio: el contenido interpretado, bien redactado.
          - transcripcion_original: la transcripción literal.
          - prioridad: una de estas opciones: ${PRIORITIES.join(', ')}

          Reglas:
          - Si no menciona proyecto, usá "${projects[0] || 'Proyectos'}".
          - No inventes contenido.
          - Normalizá nombres si es necesario.`
        }
      ]);

      const responseText = result.response.text();
      const jsonResult = JSON.parse(responseText || '{}');
      
      setPendingCapture({
        ...jsonResult,
        id: crypto.randomUUID(),
        fecha: new Date().toISOString(),
        audioUrl: URL.createObjectURL(blob),
        completado: false
      });
    } catch (err: any) {
      console.error("Error processing audio:", err);
      const msg = err.message || "Error desconocido";
      alert(`Error al procesar el audio: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const saveCapture = () => {
    if (pendingCapture) {
      setCaptures(prev => [pendingCapture as Capture, ...prev]);
      setPendingCapture(null);
    }
  };

  const deleteCapture = (id: string) => {
    setCaptures(prev => prev.filter(c => c.id !== id));
    if (selectedCapture?.id === id) setSelectedCapture(null);
  };

  const toggleComplete = (id: string, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    setCaptures(prev => prev.map(c => {
      if (c.id === id) {
        const newStatus = !c.completado;
        return { 
          ...c, 
          completado: newStatus,
          fecha_completado: newStatus ? new Date().toISOString() : undefined
        };
      }
      return c;
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProjectColor = (project: string) => {
    switch (project) {
      case 'Personal': return 'bg-blue-50 text-blue-600';
      case 'Trabajo': return 'bg-orange-50 text-orange-600';
      case 'Estudio': return 'bg-green-50 text-green-600';
      case 'Proyectos': return 'bg-purple-50 text-purple-600';
      default: return 'bg-zinc-50 text-zinc-400';
    }
  };

  const getPriorityColor = (priority: PriorityType) => {
    switch (priority) {
      case 'alta': return 'bg-red-500';
      case 'media': return 'bg-yellow-500';
      case 'baja': return 'bg-green-500';
      default: return 'bg-zinc-200';
    }
  };

  const getPriorityButtonColor = (priority: PriorityType, isSelected: boolean) => {
    if (!isSelected) return 'bg-zinc-50 text-zinc-400 border-transparent hover:border-zinc-200';
    switch (priority) {
      case 'alta': return 'bg-red-500 text-white border-red-500';
      case 'media': return 'bg-yellow-500 text-white border-yellow-500';
      case 'baja': return 'bg-green-500 text-white border-green-500';
      default: return 'bg-[#4b4b4b] text-white border-[#4b4b4b]';
    }
  };

  const filteredCaptures = captures
    .filter(c => {
      const projectMatch = filterProject === 'all' || c.proyecto === filterProject;
      const searchMatch = !searchQuery || 
        c.titulo.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.texto_limpio.toLowerCase().includes(searchQuery.toLowerCase());
      const completionMatch = viewFilter === 'finalizados' ? c.completado : !c.completado;
      return projectMatch && searchMatch && completionMatch;
    })
    .sort((a, b) => {
      if (viewFilter === 'prioridad') {
        const priorityScore = { alta: 3, media: 2, baja: 1 };
        return priorityScore[b.prioridad] - priorityScore[a.prioridad];
      }
      // Default sort by date for 'recientes' and 'finalizados'
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    });

  const handleAddProject = (val: string) => {
    if (!projects.includes(val)) setProjects([...projects, val]);
  };

  const handleEditProject = (oldVal: string, newVal: string) => {
    setProjects(projects.map(p => p === oldVal ? newVal : p));
    setCaptures(captures.map(c => c.proyecto === oldVal ? { ...c, proyecto: newVal } : c));
    if (filterProject === oldVal) setFilterProject(newVal);
  };

  const handleDeleteProject = (val: string) => {
    setProjectToDelete(val);
  };

  const confirmDeleteProject = () => {
    if (!projectToDelete) return;

    // Remove from projects list
    setProjects(prev => prev.filter(p => p !== projectToDelete));
    
    // Update captures
    setCaptures(prev => prev.map(c => {
      // If it's the deleted project and NOT completed, move to 'Sin proyecto'
      if (c.proyecto === projectToDelete && !c.completado) {
        return { ...c, proyecto: 'Sin proyecto' };
      }
      // If completed, keep original name (it won't be in the projects list anymore)
      return c;
    }));

    // Add 'Sin proyecto' to list if it doesn't exist and we moved something to it
    const hasActiveNotesInProject = captures.some(c => c.proyecto === projectToDelete && !c.completado);
    if (hasActiveNotesInProject && !projects.includes('Sin proyecto')) {
      setProjects(prev => {
        const filtered = prev.filter(p => p !== projectToDelete);
        if (!filtered.includes('Sin proyecto')) {
          return [...filtered, 'Sin proyecto'];
        }
        return filtered;
      });
    }

    if (filterProject === projectToDelete) setFilterProject('all');
    setProjectToDelete(null);
  };

  return (
    <div className="h-screen h-[100dvh] flex flex-col max-w-md mx-auto bg-white shadow-2xl relative overflow-hidden transition-colors">
      {/* Fixed Header and Filters */}
      <div className="flex-none bg-white z-10 border-b border-zinc-50 transition-colors">
        <header className="px-6 pt-8 pb-4 relative">
          <div className="flex justify-between items-center">
            <div 
              className="flex items-center gap-3 cursor-pointer active:scale-95 transition-transform"
              onClick={() => setShowTopMenu(!showTopMenu)}
            >
              <Logo className="w-8 h-8" />
              <h1 className="text-xl font-display font-extrabold tracking-tight text-zinc-900 leading-none">
                Tap<span className="text-[#FF6321]">In</span>
              </h1>
            </div>
            <div className="relative" ref={topMenuRef}>
              <button 
                onClick={() => setShowTopMenu(!showTopMenu)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 cursor-pointer ${showTopMenu ? 'bg-zinc-900 text-white' : 'bg-zinc-50 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100'}`}
                title="Menú"
              >
                <Menu size={18} />
              </button>

              <AnimatePresence>
                {showTopMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden z-50"
                  >
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setShowTopMenu(false);
                          setShowResetModal(true);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <RotateCcw size={18} />
                        Resetear App
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Reset Confirmation Modal */}
        <AnimatePresence>
          {showResetModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowResetModal(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-white w-full max-w-xs rounded-3xl p-8 shadow-2xl text-center"
              >
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <RotateCcw className="text-red-500" size={32} />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-2">¿Resetear todo?</h3>
                <p className="text-sm text-zinc-500 mb-8 leading-relaxed">
                  Se borrarán todas tus notas y proyectos. Volverás a la configuración inicial.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      localStorage.removeItem('buzon_captures');
                      localStorage.removeItem('buzon_projects');
                      window.location.reload();
                    }}
                    className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-red-600/20 active:scale-95 transition-transform"
                  >
                    Sí, resetear ahora
                  </button>
                  <button
                    onClick={() => setShowResetModal(false)}
                    className="w-full py-4 bg-zinc-100 text-zinc-600 rounded-2xl font-bold text-sm active:scale-95 transition-transform"
                  >
                    Cancelar
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Project Delete Confirmation Modal */}
        <AnimatePresence>
          {projectToDelete && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setProjectToDelete(null)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-white w-full max-w-xs rounded-3xl p-8 shadow-2xl text-center"
              >
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trash2 className="text-red-500" size={32} />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-2">¿Borrar proyecto?</h3>
                <p className="text-sm text-zinc-500 mb-8 leading-relaxed">
                  Las notas activas de <span className="font-bold text-zinc-900">"{projectToDelete}"</span> pasarán a <span className="font-bold text-zinc-900">"Sin proyecto"</span>. Las finalizadas mantendrán su nombre original.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={confirmDeleteProject}
                    className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-red-600/20 active:scale-95 transition-transform"
                  >
                    Confirmar borrar
                  </button>
                  <button
                    onClick={() => setProjectToDelete(null)}
                    className="w-full py-4 bg-zinc-100 text-zinc-600 rounded-2xl font-bold text-sm active:scale-95 transition-transform"
                  >
                    Cancelar
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Filters and Search */}
        <div className="px-6 pb-4 space-y-3">
          <AnimatePresence initial={false}>
            {showSearch && (
              <motion.div 
                initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                animate={{ height: 'auto', opacity: 1, marginBottom: 12 }}
                exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                className="relative group overflow-hidden"
              >
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-zinc-900 transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-zinc-50 border-none rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-100 transition-all placeholder:text-zinc-300 text-zinc-900"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 pb-1">
              <CustomDropdown
                label="Proyectos"
                options={projects}
                value={filterProject}
                onChange={setFilterProject}
                onAdd={handleAddProject}
                onEdit={handleEditProject}
                onDelete={handleDeleteProject}
                showAllOption
                buttonClassName={filterProject !== 'all' ? getProjectColor(filterProject) : undefined}
              />
              
              <CustomDropdown
                label="Ordenar"
                options={['Recientes', 'Prioridad', 'Finalizados']}
                value={viewFilter.charAt(0).toUpperCase() + viewFilter.slice(1)}
                onChange={(val) => setViewFilter(val.toLowerCase() as any)}
                icon={<SortAsc size={14} />}
                buttonClassName="bg-zinc-50 border-zinc-100 text-zinc-500 hover:bg-zinc-100/50"
              />
            </div>

            <div className="flex bg-zinc-100 p-1 rounded-full flex-shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-full transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-400'}`}
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-full transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-400'}`}
              >
                <List size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable List Content */}
      <main 
        className="flex-1 overflow-y-auto px-6 pt-6"
        onScroll={handleScroll}
      >
        {/* List of Captures */}
        <div className={`${viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-2'} pb-60`}>
          {filteredCaptures.length === 0 ? (
            <div className="col-span-2 text-center py-24 opacity-20">
              <Mic className="mx-auto mb-4 text-zinc-900" size={48} strokeWidth={1} />
              <p className="text-sm font-medium text-zinc-900">No hay notas aquí</p>
            </div>
          ) : (
            filteredCaptures.map((capture) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={capture.id}
                onPointerDown={() => handleLongPressStart(capture)}
                onPointerUp={handleLongPressEnd}
                onPointerLeave={handleLongPressEnd}
                onClick={() => {
                  if (!longPressedCapture) {
                    setSelectedCapture(capture);
                  }
                }}
                className={`bg-white border border-zinc-100 shadow-sm hover:shadow-md active:scale-[0.98] transition-all cursor-pointer group relative flex flex-col justify-between ${
                  viewMode === 'grid' 
                    ? 'p-4 rounded-2xl min-h-[140px]' 
                    : 'p-3 rounded-xl min-h-0'
                } ${capture.completado ? 'opacity-40' : ''}`}
              >
                {viewMode === 'grid' ? (
                  <>
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-wrap gap-2 items-center">
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(capture.prioridad)} shadow-sm`} />
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${getProjectColor(capture.proyecto)} bg-opacity-10`}>
                            {capture.proyecto}
                          </span>
                        </div>
                      </div>
                      <h3 className={`text-sm font-bold text-zinc-900 mb-1 line-clamp-2 leading-tight transition-colors ${capture.completado ? 'line-through text-zinc-400' : ''}`}>
                        {capture.titulo}
                      </h3>
                      <p className="text-[11px] text-zinc-400 line-clamp-2 leading-snug">{capture.texto_limpio}</p>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[9px] text-zinc-300 font-bold uppercase tracking-tighter">
                        {new Date(capture.fecha).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                      </span>
                      <div className="flex gap-1 items-center">
                        {capture.audioUrl && (
                          <div className="w-1.5 h-1.5 rounded-full bg-zinc-200" />
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getPriorityColor(capture.prioridad)} shadow-sm`} />
                      <h3 className={`text-sm font-bold text-zinc-900 truncate transition-colors ${capture.completado ? 'line-through text-zinc-400' : ''}`}>
                        {capture.titulo}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${getProjectColor(capture.proyecto)} bg-opacity-10`}>
                        {capture.proyecto}
                      </span>
                      <span className="text-[9px] text-zinc-300 font-bold uppercase tracking-tighter">
                        {new Date(capture.fecha).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </main>

      {/* Recording Overlay/Button */}
      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none">
        <div className="max-w-xs mx-auto flex flex-col items-center pointer-events-auto">
          <AnimatePresence>
            {isRecording && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="mb-6 flex flex-col items-center"
              >
                <div className="flex items-center gap-3 px-4 py-2 bg-[#4b4b4b] rounded-full shadow-xl">
                  <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                  <span className="text-sm font-mono font-bold text-white tracking-widest">{formatTime(recordingTime)}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`w-24 h-24 rounded-full flex items-center justify-center border-4 border-zinc-200 bg-white shadow-xl transition-all active:scale-95 relative ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isProcessing ? (
              <RotateCcw className="animate-spin text-zinc-400" size={32} />
            ) : (
              <motion.div 
                animate={{ 
                  width: isRecording ? 32 : 64,
                  height: isRecording ? 32 : 64,
                  borderRadius: isRecording ? 8 : 32
                }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="bg-red-600 shadow-lg shadow-red-600/20"
              />
            )}
          </button>
        </div>
      </div>

      {/* Long Press Context Menu */}
      <AnimatePresence>
        {longPressedCapture && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLongPressedCapture(null)}
            className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-[280px] rounded-3xl shadow-2xl overflow-hidden border border-zinc-100"
            >
              <div className="p-6 border-b border-zinc-50">
                <h3 className="text-sm font-bold text-zinc-900 line-clamp-1">{longPressedCapture.titulo}</h3>
                <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest mt-1 mb-3">{longPressedCapture.proyecto}</p>
                <div className="bg-zinc-50 p-3 rounded-xl">
                  <p className="text-xs text-zinc-600 leading-relaxed line-clamp-4 italic">
                    "{longPressedCapture.texto_limpio}"
                  </p>
                </div>
              </div>
              <div className="p-4 flex justify-center gap-4">
                <button
                  onClick={() => {
                    toggleComplete(longPressedCapture.id);
                    setLongPressedCapture(null);
                  }}
                  className={`p-4 rounded-2xl transition-all active:scale-95 ${longPressedCapture.completado ? 'bg-zinc-100 text-zinc-400' : 'bg-green-50 text-green-600 shadow-sm'}`}
                >
                  <Check size={24} />
                </button>
                <button
                  onClick={() => {
                    deleteCapture(longPressedCapture.id);
                    setLongPressedCapture(null);
                  }}
                  className="p-4 bg-red-50 text-red-600 rounded-2xl transition-all active:scale-95 shadow-sm"
                >
                  <Trash2 size={24} />
                </button>
              </div>
              <button
                onClick={() => setLongPressedCapture(null)}
                className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:text-zinc-900 transition-colors"
              >
                Cancelar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending Capture Modal (Edit before save) */}
      <AnimatePresence>
        {pendingCapture && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 100, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 100, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900">Revisar</h2>
                  <p className="text-xs text-zinc-400 font-medium">Ajustá los detalles antes de guardar</p>
                </div>
                <button onClick={() => setPendingCapture(null)} className="p-2 bg-zinc-50 text-zinc-400 hover:text-zinc-900 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-2 block">Título</label>
                  <input 
                    type="text" 
                    value={pendingCapture.titulo} 
                    onChange={e => setPendingCapture({...pendingCapture, titulo: e.target.value})}
                    className="w-full p-4 bg-zinc-50 border-none rounded-2xl text-lg font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-100 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 overflow-visible">
                  <div className="relative">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-2 block">Proyecto</label>
                    <CustomDropdown
                      label="Proyecto"
                      options={projects}
                      value={pendingCapture.proyecto || ''}
                      onChange={val => setPendingCapture({...pendingCapture, proyecto: val})}
                      onAdd={handleAddProject}
                      onEdit={handleEditProject}
                      onDelete={handleDeleteProject}
                      buttonClassName={getProjectColor(pendingCapture.proyecto || '')}
                    />
                  </div>
                  <div className="relative">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-2 block">Prioridad</label>
                    <div className="flex gap-2">
                      {PRIORITIES.map(p => (
                        <button
                          key={p}
                          onClick={() => setPendingCapture({...pendingCapture, prioridad: p})}
                          className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                            getPriorityButtonColor(p, pendingCapture.prioridad === p)
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-2 block">Contenido</label>
                  <textarea 
                    rows={3}
                    value={pendingCapture.texto_limpio} 
                    onChange={e => setPendingCapture({...pendingCapture, texto_limpio: e.target.value})}
                    onInput={(e: any) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    className="w-full p-4 bg-zinc-50 border-none rounded-2xl text-sm leading-relaxed text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-100 transition-all min-h-[100px] max-h-[300px] overflow-y-auto resize-none"
                  />
                </div>

                <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-2xl">
                  <div className="flex-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300 block mb-1">Estado</span>
                    <span className="text-xs font-bold text-zinc-900">{pendingCapture.completado ? 'Terminado' : 'Pendiente'}</span>
                  </div>
                  <button 
                    onClick={() => {
                      const newStatus = !pendingCapture.completado;
                      setPendingCapture({
                        ...pendingCapture, 
                        completado: newStatus,
                        fecha_completado: newStatus ? new Date().toISOString() : undefined
                      });
                    }}
                    className={`w-12 h-6 rounded-full transition-all relative ${pendingCapture.completado ? 'bg-[#4b4b4b]' : 'bg-zinc-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${pendingCapture.completado ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <div className="pt-6 flex flex-col gap-4">
                  {pendingCapture.audioUrl && (
                    <div className="bg-zinc-50 p-4 rounded-2xl">
                      <audio src={pendingCapture.audioUrl} controls className="w-full h-8" />
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        setPendingCapture(null);
                        startRecording();
                      }}
                      className="flex-1 py-4 bg-zinc-100 text-zinc-900 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors"
                    >
                      <RotateCcw size={18} />
                    </button>
                    <button 
                      onClick={saveCapture}
                      className="flex-[3] py-4 bg-[#4b4b4b] text-white rounded-2xl text-sm font-bold shadow-xl shadow-orange-500/20 active:scale-95 transition-all"
                    >
                      Guardar
                    </button>
                  </div>
                  <button 
                    onClick={() => setPendingCapture(null)}
                    className="py-2 text-xs font-bold text-zinc-300 hover:text-orange-500 transition-colors uppercase tracking-widest"
                  >
                    Descartar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail View Modal */}
      <AnimatePresence>
        {selectedCapture && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-white flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-zinc-50">
              <button onClick={() => setSelectedCapture(null)} className="p-2 bg-zinc-50 text-zinc-400 hover:text-zinc-900 rounded-full transition-colors">
                <ChevronLeft size={24} />
              </button>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setCaptures(captures.map(c => c.id === selectedCapture.id ? selectedCapture : c));
                    setSelectedCapture(null);
                  }}
                  className="px-6 py-2 bg-[#4b4b4b] text-white rounded-full text-sm font-bold shadow-lg shadow-orange-500/10 active:scale-95 transition-all"
                >
                  Guardar
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 max-w-2xl mx-auto w-full">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-2 block">Título</label>
                <input 
                  type="text" 
                  value={selectedCapture.titulo} 
                  onChange={e => setSelectedCapture({...selectedCapture, titulo: e.target.value})}
                  className="w-full text-3xl font-bold text-zinc-900 border-none focus:outline-none focus:ring-0 p-0 placeholder:text-zinc-200"
                  placeholder="Título de la nota"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="relative">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-2 block">Proyecto</label>
                  <CustomDropdown
                    label="Proyecto"
                    options={projects}
                    value={selectedCapture.proyecto || ''}
                    onChange={val => setSelectedCapture({...selectedCapture, proyecto: val})}
                    onAdd={handleAddProject}
                    onEdit={handleEditProject}
                    onDelete={handleDeleteProject}
                    buttonClassName={getProjectColor(selectedCapture.proyecto)}
                  />
                </div>
                <div className="relative">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-2 block">Prioridad</label>
                  <div className="flex gap-2">
                    {PRIORITIES.map(p => (
                      <button
                        key={p}
                        onClick={() => setSelectedCapture({...selectedCapture, prioridad: p})}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                          getPriorityButtonColor(p, selectedCapture.prioridad === p)
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-2 block">Contenido</label>
                <textarea 
                  rows={3}
                  value={selectedCapture.texto_limpio} 
                  onChange={e => setSelectedCapture({...selectedCapture, texto_limpio: e.target.value})}
                  onInput={(e: any) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  className="w-full p-6 bg-zinc-50 border-none rounded-[2rem] text-base leading-relaxed text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-100 transition-all min-h-[120px] max-h-[400px] overflow-y-auto resize-none"
                  placeholder="Escribe aquí..."
                />
              </div>

              {selectedCapture.audioUrl && (
                <div className="bg-zinc-50 p-6 rounded-[2rem]">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-4 block">Audio Original</label>
                  <audio src={selectedCapture.audioUrl} controls className="w-full" />
                </div>
              )}

              <div className="pt-8 border-t border-zinc-50 flex flex-col gap-6">
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const newStatus = !selectedCapture.completado;
                      const completionDate = newStatus ? new Date().toISOString() : undefined;
                      setCaptures(prev => prev.map(c => c.id === selectedCapture.id ? { ...c, completado: newStatus, fecha_completado: completionDate } : c));
                      setSelectedCapture(prev => prev ? { ...prev, completado: newStatus, fecha_completado: completionDate } : null);
                    }}
                    className={`flex-1 py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                      selectedCapture.completado 
                        ? 'bg-green-50 text-green-600' 
                        : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200'
                    }`}
                  >
                    <Check size={18} />
                    {selectedCapture.completado ? 'Completado' : 'Marcar como hecho'}
                  </button>
                  <button
                    onClick={() => {
                      setCaptures(captures.filter(c => c.id !== selectedCapture.id));
                      setSelectedCapture(null);
                    }}
                    className="p-4 bg-red-50 text-red-600 rounded-2xl transition-all active:scale-95 hover:bg-red-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
                    Creada el {new Date(selectedCapture.fecha).toLocaleDateString()}
                  </span>
                  {selectedCapture.completado && selectedCapture.fecha_completado && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-green-600/50">
                      Finalizada el {new Date(selectedCapture.fecha_completado).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
