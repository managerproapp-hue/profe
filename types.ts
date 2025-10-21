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
  | 'Exámenes Prácticos'
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

// --- GESTION PRÁCTICA TYPES ---
export interface Service {
  id: string;
  name: string;
  date: string;
  trimestre: number;
  groupAssignments: {
    comedor: string[];
    takeaway: string[];
  };
  menu?: string;
}

export type StudentGroupAssignments = Record<string, string>; // { [studentNre]: groupName }


// --- CREACIÓN DE MENÚS TYPES ---

export interface MenuApartado {
  [apartadoName: string]: string[]; // Array of recipe IDs
}

export interface Menu {
  pax: number;
  comedor: MenuApartado;
  takeaway: MenuApartado;
}

export interface MenusState {
  [serviceId: string]: Menu;
}


// --- GESTIÓN DE NOTAS TYPES ---
export interface EvaluationItemScore {
  itemId: string;
  score: number;
}

export interface GroupEvaluation {
  serviceId: string;
  groupId: string; // The name of the practica group, e.g., "Grupo 1"
  scores: EvaluationItemScore[];
  observation: string;
}

export interface IndividualEvaluation {
  serviceId: string;
  studentNre: string;
  attendance: 'present' | 'absent';
  scores: EvaluationItemScore[];
  observation?: string;
}

export interface EvaluationsState {
  group: GroupEvaluation[];
  individual: IndividualEvaluation[];
}

// --- EXÁMENES PRÁCTICOS TYPES ---
export type ExamType = 'T1' | 'T2' | 'REC';

export interface PracticalExamScore {
  criterionId: string;
  score: number; // e.g., 10, 8, 5, 2
  notes: string;
}

export interface StudentPracticalExam {
  studentNre: string;
  examType: ExamType;
  scores: PracticalExamScore[];
  generalObservations?: string;
  startTime?: string;
  endTime?: string;
  finalScore?: number;
}

// --- GESTIÓN ACADÉMICA TYPES ---
export interface TheoreticalExamGrades {
  examen1?: number;
  examen2?: number;
  examen3?: number;
  examen4?: number;
  recuperacion?: number;
}