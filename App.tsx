
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import AlumnosView from './components/AlumnosView';
import Login from './components/Login';
import { Student, NavItemType, EvaluationsState, StudentPracticalExam } from './types';
import { INITIAL_STUDENTS } from './constants';
import GestionPracticaView from './components/GestionPracticaView';
import CocinaView from './components/CocinaView';
import GestionAppView from './components/GestionAppView';
import GestionNotasView from './components/GestionNotasView';
import ExamenesPracticosView from './components/ExamenesPracticosView';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState<NavItemType>('Alumnos');
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const savedStudents = localStorage.getItem('teacher-dashboard-students');
      return savedStudents ? JSON.parse(savedStudents) : INITIAL_STUDENTS;
    } catch (error) {
      console.error("Could not parse students from localStorage", error);
      return INITIAL_STUDENTS;
    }
  });

  const [evaluations, setEvaluations] = useState<EvaluationsState>(() => {
    try {
      const saved = localStorage.getItem('teacher-dashboard-evaluations');
      return saved ? JSON.parse(saved) : { group: [], individual: [] };
    } catch (error) {
      console.error("Could not parse evaluations from localStorage", error);
      return { group: [], individual: [] };
    }
  });

  const [practicalExams, setPracticalExams] = useState<StudentPracticalExam[]>(() => {
    try {
      const saved = localStorage.getItem('teacher-dashboard-practical-exams');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Could not parse practical exams from localStorage", error);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('teacher-dashboard-students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('teacher-dashboard-evaluations', JSON.stringify(evaluations));
  }, [evaluations]);

  useEffect(() => {
    localStorage.setItem('teacher-dashboard-practical-exams', JSON.stringify(practicalExams));
  }, [practicalExams]);


  const renderView = () => {
    switch (activeView) {
      case 'Alumnos':
        return <AlumnosView students={students} setStudents={setStudents} evaluations={evaluations} />;
      case 'Gestión Práctica':
        return <GestionPracticaView students={students} />;
      case 'Cocina':
        return <CocinaView />;
      case 'Gestión de la App':
        return <GestionAppView />;
      case 'Gestión de Notas':
        return <GestionNotasView 
                  students={students} 
                  evaluations={evaluations} 
                  setEvaluations={setEvaluations} 
               />;
      case 'Exámenes Prácticos':
        return <ExamenesPracticosView 
                  students={students}
                  exams={practicalExams}
                  setExams={setPracticalExams}
                />;
      case 'Gestión Académica':
        return (
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-800">{activeView}</h1>
            <p className="mt-4 text-gray-600">Esta sección está en construcción.</p>
          </div>
        );
      default:
        return <AlumnosView students={students} setStudents={setStudents} evaluations={evaluations} />;
    }
  };
  
  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <main className="flex-1 overflow-y-auto">
        {renderView()}
      </main>
    </div>
  );
};

export default App;