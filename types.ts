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

export type CocinaSubView = 'Productos' | 'Mi Recetario' | 'Pedidos';

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

export interface Ingredient {
  name: string;
  quantity: string;
}

export interface Recipe {
  id: string;
  dish: string;
  ingredients: Ingredient[];
}

export interface Service {
  id: string;
  name:string;
  date: string;
  trimestre: number;
  groupAssignments: {
    comedor: string[];
    takeaway: string[];
  };
  menu?: {
    comedor: Recipe[];
    takeaway: Recipe[];
  };
}

export interface OrderProduct {
  product: string;
  quantity: string;
  cost?: number;
}

export interface Order {
  id: string;
  fecha: string; // ISO date string
  origen: string; // serviceId
  products: OrderProduct[];
  estado: 'Borrador' | 'Enviado';
}

// --- MI RECETARIO TYPES ---

export interface RecipeIngredient {
  productId: string; // Link to Product in catalog
  productName: string; // Denormalized for display
  quantity: string; // e.g., "500g", "2 unidades"
}

export interface RecipeStep {
  id: string;
  description: string;
}

export interface ServiceDetails {
  servingTemp?: string; // e.g., "Caliente", "Frío", "Ambiente"
  cutlery?: string; // e.g., "Cuchara y tenedor"
  platingNotes?: string;
  customerDescription?: string;
}

export interface FullRecipe {
  id: string;
  name: string;
  category: string;
  authorEmail: string; // To identify "Mis recetas"
  isPublic: boolean;
  yield: string; // e.g., "4 raciones"
  photoUrl?: string;
  ingredients: RecipeIngredient[];
  elaboration: RecipeStep[];
  serviceDetails: ServiceDetails;
  notes?: string;
  pvp?: number; // Precio de Venta al Público
}
