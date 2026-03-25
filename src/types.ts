export type PriorityType = 'baja' | 'media' | 'alta';

export interface Capture {
  id: string;
  fecha: string;
  audioUrl?: string; // Local blob URL for playback
  transcripcion_original: string;
  texto_limpio: string;
  titulo: string;
  tipo: string;
  proyecto: string;
  prioridad: PriorityType;
  completado: boolean;
  fecha_completado?: string;
}
