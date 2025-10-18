export interface Interview {
  id: string;
  date: string;
  attendees: string;
  notes: string;
}

export interface Grade {
  subject: string;
  score: number;
}

export interface Annotation {
  id: string;
  date: string;
  note: string;
  type: 'positive' | 'negative' | 'neutral';
}


export interface Student {
  nre: string;
  expediente: string;
  apellido1: string;
  apellido2: string;
  nombre: string;
  grupo: string;
  subgrupo: string;
  fechaNacimiento: string;
  telefono: string;
  telefono2: string;
  emailPersonal: string;
  emailOficial: string;
  photoUrl?: string;
  entrevistas?: Interview[];
  calificaciones?: Grade[];
  anotaciones?: Annotation[];
}

export type NavItemType = 
  | 'Alumnos' 
  | 'Gestión Práctica' 
  | 'Gestión de Notas' 
  | 'Gestión Académica' 
  | 'Gestión de la App';