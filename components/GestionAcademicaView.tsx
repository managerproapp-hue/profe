import React from 'react';
import { Student, EvaluationsState, StudentPracticalExam, TheoreticalExamGrades } from '../types';

interface GestionAcademicaViewProps {
  students: Student[];
  evaluations: EvaluationsState;
  practicalExams: StudentPracticalExam[];
  academicGrades: {[nre: string]: TheoreticalExamGrades};
  setAcademicGrades: React.Dispatch<React.SetStateAction<{[nre: string]: TheoreticalExamGrades}>>;
}

const GestionAcademicaView: React.FC<GestionAcademicaViewProps> = ({
  students,
  evaluations,
  practicalExams,
  academicGrades,
  setAcademicGrades,
}) => {
  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestión Académica</h1>
        <p className="mt-2 text-gray-600">
          Vista centralizada para gestionar las notas teóricas, ponderar evaluaciones y calcular notas finales.
        </p>
      </header>
      <div className="bg-white p-12 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold text-gray-700">Próximamente</h2>
        <p className="mt-4 text-gray-500">
          Esta sección está en desarrollo y estará disponible en futuras actualizaciones.
        </p>
      </div>
    </div>
  );
};

export default GestionAcademicaView;
