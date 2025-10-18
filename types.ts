// For Alumnos
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
  
export interface Interview {
    id: string;
    date: string;
    attendees: string;
    notes: string;
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
    telefono2?: string;
    emailPersonal: string;
    emailOficial: string;
    photoUrl?: string;
    entrevistas?: Interview[];
    calificaciones?: Grade[];
    anotaciones?: Annotation[];
}

// For Navigation
export type NavItemType = 'Alumnos' | 'Gestión Práctica' | 'Gestión de Notas' | 'Gestión Académica' | 'Cocina' | 'Gestión de la App';

// For Cocina and Gestion Practica
export interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    unit: string;
    allergens: string[];
}

export interface Ingredient {
    productId: string;
    productName: string;
    quantity: string;
}

export interface ElaborationStep {
    id: string;
    description: string;
}

export interface ServiceDetails {
    servingTemp?: string;
    cutlery?: string;
    platingNotes?: string;
    customerDescription?: string;
}

export interface Recipe {
    id: string;
    dish: string;
    ingredients: Ingredient[];
}

export interface FullRecipe {
    id: string;
    name: string;
    category: string;
    authorEmail: string;
    isPublic: boolean;
    yield: string;
    photoUrl?: string;
    ingredients: Ingredient[];
    elaboration: ElaborationStep[];
    serviceDetails: ServiceDetails;
    pvp?: number;
}

export interface Service {
    id: string;
    name: string;
    date: string;
    trimestre: number;
    groupAssignments: {
        comedor: string[];
        takeaway: string[];
    };
    menu?: {
        comedor: Record<string, Recipe[]>;
        takeaway: Record<string, Recipe[]>;
    };
    comedorDiners?: number;
    takeawayDiners?: number;
}

export interface Order {
    id: string;
    fecha: string;
    origen: string; // serviceId
    products: { product: string, quantity: string }[];
    estado: 'Borrador' | 'Enviado';
}

export type CocinaSubView = 'Productos' | 'Mi Recetario' | 'Pedidos';

// For Gestion App
export interface TeacherData {
    name: string;
    email: string;
    logo: string | null;
}
  
export interface InstituteData {
    name: string;
    address: string;
    cif: string;
    logo: string | null;
}
