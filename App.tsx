
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import AlumnosView from './components/AlumnosView';
import Login from './components/Login';
import { Student, NavItemType } from './types';
import { INITIAL_STUDENTS } from './constants';
import GestionPracticaView from './components/GestionPracticaView';

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

  useEffect(() => {
    localStorage.setItem('teacher-dashboard-students', JSON.stringify(students));
  }, [students]);

  const renderView = () => {
    switch (activeView) {
      case 'Alumnos':
        return <AlumnosView students={students} setStudents={setStudents} />;
      case 'Gestión Práctica':
        return <GestionPracticaView students={students} />;
      case 'Gestión de Notas':
      case 'Gestión Académica':
      case 'Gestión de la App':
        return (
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-800">{activeView}</h1>
            <p className="mt-4 text-gray-600">Esta sección está en construcción.</p>
          </div>
        );
      default:
        return <AlumnosView students={students} setStudents={setStudents} />;
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
