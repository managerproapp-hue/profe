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

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  allergens: string[];
}


export type NavItemType = 
  | 'Alumnos' 
  | 'Gestión Práctica' 
  | 'Gestión de Notas' 
  | 'Gestión Académica'
  | 'Cocina'
  | 'Gestión de la App';

export type CocinaSubView = 'Productos' | 'Pedidos' | 'Fichas Técnicas' | 'Creación de Menús';

export interface TeacherData {
  name: string;
  email: string;
  logo?: string | null;
}

export interface InstituteData {
  name: string;
  address: string;
  cif: string;
  logo?: string | null;
}
