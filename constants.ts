import { Student, NavItemType } from './types';

export const INITIAL_STUDENTS: Student[] = [
  {
    nre: '123456',
    expediente: 'E001',
    apellido1: 'García',
    apellido2: 'López',
    nombre: 'Ana',
    grupo: '2ºDAW',
    subgrupo: 'A',
    fechaNacimiento: '2003-05-15',
    telefono: '600111222',
    telefono2: '',
    emailPersonal: 'ana.garcia@email.com',
    emailOficial: 'ana.garcia@edu.es',
    photoUrl: `https://i.pravatar.cc/150?u=ana.garcia`,
    entrevistas: [
        { id: 'ent1', date: '2024-03-15', attendees: 'Tutor, Ana García', notes: 'Revisión del progreso del primer trimestre. Muestra gran interés en desarrollo backend.' },
        { id: 'ent2', date: '2024-05-20', attendees: 'Tutor', notes: 'Seguimiento sobre el proyecto final. Necesita organizar mejor sus tiempos.' }
    ],
    calificaciones: [
        { subject: 'Programación', score: 8.5 },
        { subject: 'Bases de Datos', score: 9.2 },
        { subject: 'Sistemas Informáticos', score: 7.0 },
        { subject: 'Lenguajes de Marcas', score: 10.0 },
        { subject: 'Entornos de Desarrollo', score: 6.5 },
    ],
    anotaciones: [
        { id: 'ann1', date: '2024-04-10', note: 'Excelente participación en el debate sobre arquitecturas limpias.', type: 'positive' },
        { id: 'ann2', date: '2024-05-22', note: 'Llegó tarde a la presentación del proyecto.', type: 'negative' },
        { id: 'ann3', date: '2024-06-01', note: 'Ha solicitado material extra sobre Docker.', type: 'neutral' },
    ]
  },
  {
    nre: '789012',
    expediente: 'E002',
    apellido1: 'Martínez',
    apellido2: 'Ruiz',
    nombre: 'Carlos',
    grupo: '2ºDAW',
    subgrupo: 'B',
    fechaNacimiento: '2003-08-22',
    telefono: '600333444',
    telefono2: '600555666',
    emailPersonal: 'carlos.martinez@email.com',
    emailOficial: 'carlos.martinez@edu.es',
    photoUrl: `https://i.pravatar.cc/150?u=carlos.martinez`,
    calificaciones: [
        { subject: 'Programación', score: 6.0 },
        { subject: 'Bases de Datos', score: 5.5 },
        { subject: 'Sistemas Informáticos', score: 4.8 },
    ],
    anotaciones: [
         { id: 'ann4', date: '2024-05-15', note: 'Presenta dificultades con las consultas SQL complejas.', type: 'negative' },
    ]
  },
  {
    nre: '345678',
    expediente: 'E003',
    apellido1: 'Sánchez',
    apellido2: 'Gómez',
    nombre: 'Laura',
    grupo: '1ºSMR',
    subgrupo: 'A',
    fechaNacimiento: '2004-01-10',
    telefono: '600777888',
    telefono2: '',
    emailPersonal: 'laura.sanchez@email.com',
    emailOficial: 'laura.sanchez@edu.es',
    photoUrl: `https://i.pravatar.cc/150?u=laura.sanchez`,
    calificaciones: [
      { subject: 'Redes Locales', score: 9.5 },
      { subject: 'Sistemas Operativos', score: 8.0 },
    ],
    anotaciones: [
       { id: 'ann5', date: '2024-06-05', note: 'Muy proactiva ayudando a sus compañeros con la configuración de la red.', type: 'positive' },
    ]
  },
];

export const NAV_ITEMS: NavItemType[] = [
  'Alumnos',
  'Gestión Práctica',
  'Gestión de Notas',
  'Gestión Académica',
  'Cocina',
  'Gestión de la App',
];

export const PRODUCT_CATEGORIES = ['Carnes', 'Pescados', 'Lácteos', 'Verduras', 'Frutas', 'Cereales', 'Bebidas', 'Otros'];
export const PRODUCT_UNITS = ['kg', 'litro', 'unidad', 'gramo', 'mililitro', 'manojo'];
export const ALLERGENS = ['Gluten', 'Lactosa', 'Frutos Secos', 'Pescado', 'Huevo', 'Soja', 'Marisco', 'Apio', 'Mostaza', 'Sésamo', 'Sulfitos', 'Altramuces', 'Moluscos'];
