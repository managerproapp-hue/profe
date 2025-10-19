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

export type CocinaSubView = 'Productos' | 'Pedidos' | 'Mi Recetario' | 'Creación de Menús';

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

// --- MI RECETARIO TYPES ---

export interface RecipeIngredient {
  productId: string;
  quantity: number;
  unit: string;
}

export interface RecipeStep {
  id: string;
  description: string;
}

export interface Elaboration {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  imageUrl?: string;
  description: string;
  serviceNotes: string; // "Anotaciones extras"
  servings: number;
  elaborations: Elaboration[];
  visibility: 'private' | 'public';
  authorId: string; // Placeholder for future multi-user system
  createdAt: string;
  updatedAt?: string;
}