import React, { useState, useMemo, useCallback } from 'react';
import { Student } from '../types';
import StudentTable from './StudentTable';
import StudentDetailModal from './StudentDetailModal';
import ImportModal from './ImportModal';
import AddEditStudentModal from './EditStudentModal';
import { EyeIcon, PencilIcon, TrashIcon, ViewGridIcon, ViewListIcon, PlusIcon, DownloadIcon } from './icons';
import { downloadAsPdf, exportToExcel } from './printUtils';

interface AlumnosViewProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
}

type ViewMode = 'grid' | 'list';

const StudentCard: React.FC<{ student: Student; index: number; onSelect: () => void; onEdit: () => void; onDelete: () => void; }> = 
({ student, index, onSelect, onEdit, onDelete }) => (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col relative">
        <span className="absolute top-2 right-2 bg-teal-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center z-10">{index}</span>
        <div className="p-4 flex-grow">
            <img 
                className="w-24 h-24 rounded-full mx-auto border-4 border-gray-100" 
                src={student.photoUrl || `https://i.pravatar.cc/150?u=${student.nre}`} 
                alt={`${student.nombre} ${student.apellido1}`} 
            />
            <h3 className="text-center mt-3 font-bold text-gray-800">{student.apellido1} {student.apellido2}, {student.nombre}</h3>
            <p className="text-center text-sm text-gray-500">{student.grupo}</p>
        </div>
        <div className="bg-gray-50 p-2 flex justify-around rounded-b-lg">
            <button onClick={onSelect} className="text-gray-500 hover:text-teal-600 p-2 rounded-full transition-colors" title="Ver Detalles"><EyeIcon className="h-5 w-5" /></button>
            <button onClick={onEdit} className="text-gray-500 hover:text-blue-600 p-2 rounded-full transition-colors" title="Editar"><PencilIcon className="h-5 w-5" /></button>
            <button onClick={onDelete} className="text-gray-500 hover:text-red-600 p-2 rounded-full transition-colors" title="Eliminar"><TrashIcon className="h-5 w-5" /></button>
        </div>
    </div>
);


const AlumnosView: React.FC<AlumnosViewProps> = ({ students, setStudents }) => {
  const [studentToView, setStudentToView] = useState<Student | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filter, setFilter] = useState('');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const handleSaveStudent = (studentToSave: Student) => {
    const isNew = !students.some(s => s.nre === studentToSave.nre);
    if (isNew) {
      setStudents(prev => [studentToSave, ...prev]);
    } else {
      setStudents(prev => prev.map(s => s.nre === studentToSave.nre ? studentToSave : s));
    }
    
    // Update selected student view if it was being edited
    if (studentToView && studentToView.nre === studentToSave.nre) {
        setStudentToView(studentToSave);
    }

    closeModals();
  };
  
  const handleUpdateStudent = (updatedStudent: Student) => {
    setStudents(prev => prev.map(s => s.nre === updatedStudent.nre ? updatedStudent : s));
    if (studentToView && studentToView.nre === updatedStudent.nre) {
      setStudentToView(updatedStudent);
    }
  };

  const closeModals = () => {
    setStudentToEdit(null);
    setIsAdding(false);
    setIsImporting(false);
    setStudentToView(null);
  };

  const handleDeleteStudent = useCallback((studentNre: string) => {
    const studentToDelete = students.find(s => s.nre === studentNre);
    const studentName = studentToDelete ? `${studentToDelete.nombre} ${studentToDelete.apellido1}` : 'este alumno';

    if (window.confirm(`¿Estás seguro de que quieres eliminar a ${studentName}? Esta acción no se puede deshacer.`)) {
        setStudents(prev => prev.filter(s => s.nre !== studentNre));
        if (studentToView?.nre === studentNre) {
            setStudentToView(null);
        }
    }
  }, [students, setStudents, studentToView]);

  const handleImportSave = (newStudents: Student[]) => {
      const existingNres = new Set(students.map(s => s.nre));
      const studentsToAdd = newStudents.filter(s => !existingNres.has(s.nre));
      setStudents(prev => [...prev, ...studentsToAdd]);
      setIsImporting(false);
  };
  
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
        const nameA = `${a.apellido1} ${a.apellido2} ${a.nombre}`.toLowerCase();
        const nameB = `${b.apellido1} ${b.apellido2} ${b.nombre}`.toLowerCase();
        return nameA.localeCompare(nameB);
    });
  }, [students]);

  const filteredStudents = useMemo(() => {
    if (!filter) return sortedStudents;
    return sortedStudents.filter(student =>
      `${student.nombre} ${student.apellido1} ${student.apellido2} ${student.nre} ${student.grupo}`
        .toLowerCase()
        .includes(filter.toLowerCase())
    );
  }, [sortedStudents, filter]);
  
  const handleDownloadPdfList = () => {
    const tableHtml = `
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Nombre Completo</th>
            <th>NRE</th>
            <th>Grupo</th>
            <th>Email Oficial</th>
            <th>Teléfono</th>
          </tr>
        </thead>
        <tbody>
          ${filteredStudents.map((s, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${s.apellido1} ${s.apellido2}, ${s.nombre}</td>
              <td>${s.nre}</td>
              <td>${s.grupo}</td>
              <td>${s.emailOficial}</td>
              <td>${s.telefono}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    downloadAsPdf('Listado de Alumnos', tableHtml, 'listado_alumnos');
    setIsExportMenuOpen(false);
  };

  const handleExportExcel = () => {
    const dataToExport = filteredStudents.map((s, index) => ({
        '#': index + 1,
        'Apellido 1': s.apellido1,
        'Apellido 2': s.apellido2,
        'Nombre': s.nombre,
        'NRE': s.nre,
        'Expediente': s.expediente,
        'Grupo': s.grupo,
        'Subgrupo': s.subgrupo,
        'Fecha Nacimiento': s.fechaNacimiento,
        'Email Oficial': s.emailOficial,
        'Email Personal': s.emailPersonal,
        'Teléfono': s.telefono,
        'Teléfono 2': s.telefono2,
    }));
    exportToExcel(dataToExport, 'listado_alumnos', 'Alumnos');
    setIsExportMenuOpen(false);
  };


  return (
    <div className="p-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-800">Gestión de Alumnos</h1>
            <p className="mt-1 text-gray-600">({students.length} alumnos en total)</p>
        </div>
        <div className="flex items-center gap-2">
           <button 
            onClick={() => setIsAdding(true)}
            className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            Añadir Alumno
          </button>
          <button 
            onClick={() => setIsImporting(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Importar
          </button>
           <div className="relative">
                <button 
                    onClick={() => setIsExportMenuOpen(prev => !prev)}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center"
                >
                    <DownloadIcon className="h-5 w-5 mr-1"/>
                    Exportar
                </button>
                {isExportMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                        <button onClick={handleDownloadPdfList} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Descargar PDF</button>
                        <button onClick={handleExportExcel} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Exportar a Excel</button>
                    </div>
                )}
            </div>
        </div>
      </header>

      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <input
                type="text"
                placeholder="Buscar por nombre, NRE, grupo..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-white shadow' : ''}`} title="Vista de Tarjetas">
                    <ViewGridIcon className={`h-5 w-5 ${viewMode === 'grid' ? 'text-teal-600' : 'text-gray-500'}`} />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-white shadow' : ''}`} title="Vista de Lista">
                    <ViewListIcon className={`h-5 w-5 ${viewMode === 'list' ? 'text-teal-600' : 'text-gray-500'}`} />
                </button>
            </div>
        </div>
      </div>

        {viewMode === 'grid' ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredStudents.map((student, index) => (
                    <StudentCard 
                        key={student.nre}
                        student={student}
                        index={index + 1}
                        onSelect={() => setStudentToView(student)}
                        onEdit={() => setStudentToEdit(student)}
                        onDelete={() => handleDeleteStudent(student.nre)}
                    />
                ))}
             </div>
        ) : (
            <StudentTable 
                students={filteredStudents} 
                onSelectStudent={setStudentToView}
                onEditStudent={setStudentToEdit}
                onDeleteStudent={handleDeleteStudent}
            />
        )}
     
      {isImporting && (
        <ImportModal 
          onClose={closeModals}
          onSave={handleImportSave}
        />
      )}
      {(studentToEdit || isAdding) && (
        <AddEditStudentModal
            student={studentToEdit} // if null, it's an "add" operation
            onClose={closeModals}
            onSave={handleSaveStudent}
        />
      )}
       {studentToView && (
        <StudentDetailModal
          student={studentToView}
          onClose={() => setStudentToView(null)}
          onEdit={(s) => {
            setStudentToView(null);
            setStudentToEdit(s);
          }}
          onUpdateStudent={handleUpdateStudent}
        />
      )}
    </div>
  );
};

export default AlumnosView;
