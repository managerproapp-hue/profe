import React from 'react';
import { Student } from '../types';

interface GestionPracticaViewProps {
  students: Student[];
}

const GestionPracticaView: React.FC<GestionPracticaViewProps> = ({ students }) => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800">Gestión Práctica</h1>
      <div className="mt-6 bg-white p-8 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold text-gray-800">En construcción</h2>
        <p className="mt-4 text-gray-600">Esta sección está en construcción y estará disponible próximamente.</p>
        <p className="mt-2 text-sm text-gray-500">Número de alumnos recibidos: {students.length}</p>
      </div>
    </div>
  );
};

export default GestionPracticaView;
