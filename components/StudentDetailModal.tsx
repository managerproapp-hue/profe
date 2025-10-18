import React, { useState } from 'react';
import { Student, Grade, Annotation, Interview } from '../types';
import { CloseIcon, PencilIcon, PlusIcon } from './icons';

// Re-using helper functions from the old view
const getGradeColor = (score: number) => {
  if (score >= 9) return 'bg-green-100 text-green-800';
  if (score >= 7) return 'bg-green-100 text-green-800';
  if (score >= 5) return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800';
};
const getAnnotationColor = (type: 'positive' | 'negative' | 'neutral') => {
  switch (type) {
    case 'positive': return 'border-green-500';
    case 'negative': return 'border-red-500';
    default: return 'border-gray-400';
  }
};

interface StudentDetailModalProps {
  student: Student;
  onClose: () => void;
  onEdit: (student: Student) => void;
  onUpdateStudent: (student: Student) => void;
}

const StudentDetailModal: React.FC<StudentDetailModalProps> = ({ student, onClose, onEdit, onUpdateStudent }) => {
  const [isAddingInterview, setIsAddingInterview] = useState(false);
  const [newInterview, setNewInterview] = useState({ date: new Date().toISOString().split('T')[0], attendees: '', notes: '' });
  
  const averageGrade = React.useMemo(() => {
    if (!student.calificaciones || student.calificaciones.length === 0) return 'N/A';
    const total = student.calificaciones.reduce((sum, grade) => sum + grade.score, 0);
    return (total / student.calificaciones.length).toFixed(2);
  }, [student.calificaciones]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const updatedStudent = { ...student, photoUrl: event.target?.result as string };
        onUpdateStudent(updatedStudent);
      };
      reader.readAsDataURL(file);
      e.target.value = ''; // Reset file input to allow re-uploading the same file
    }
  };

  const handleSaveInterview = () => {
    if (!newInterview.date || !newInterview.notes) {
      alert("Por favor, complete la fecha y las observaciones.");
      return;
    }
    const newInterviewData: Interview = {
      id: `ent_${Date.now()}`,
      ...newInterview,
    };
    const updatedStudent = {
      ...student,
      entrevistas: [...(student.entrevistas || []), newInterviewData],
    };
    onUpdateStudent(updatedStudent);
    setNewInterview({ date: new Date().toISOString().split('T')[0], attendees: '', notes: '' });
    setIsAddingInterview(false);
  };

  const InfoField: React.FC<{label: string, value: React.ReactNode}> = ({label, value}) => (
    <div className="flex flex-col">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
        <span className="text-gray-800">{value || '-'}</span>
    </div>
  );


  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-gray-50 rounded-xl shadow-2xl w-full max-w-6xl transform transition-all flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-white rounded-t-xl flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-800">Ficha del Alumno</h2>
          <div className="flex items-center space-x-4">
             <button
              onClick={() => onEdit(student)}
              className="flex items-center bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              <PencilIcon className="h-5 w-5 mr-2" />
              Editar Datos
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full bg-gray-100 hover:bg-gray-200">
              <CloseIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Header */}
              <div className="bg-white p-6 rounded-lg shadow-md flex flex-col sm:flex-row items-center text-center sm:text-left space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="relative group flex-shrink-0">
                  <img src={student.photoUrl || `https://i.pravatar.cc/150?u=${student.nre}`} alt="Foto de perfil" className="w-28 h-28 rounded-full object-cover border-4 border-gray-200" />
                  <label htmlFor="photo-upload" className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center rounded-full cursor-pointer transition-opacity" title="Cambiar foto">
                    <PencilIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </label>
                  <input id="photo-upload" type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-800">{student.nombre} {student.apellido1} {student.apellido2}</h1>
                  <p className="text-md text-gray-500 mt-1">{student.emailOficial}</p>
                </div>
                <div className="flex flex-col items-center justify-center bg-teal-50 p-4 rounded-lg border border-teal-200">
                  <p className="text-sm font-semibold text-teal-800 uppercase tracking-wider">Nota Media</p>
                  <p className="text-4xl font-bold text-teal-600">{averageGrade}</p>
                </div>
              </div>

              {/* Personal Data */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-4 text-gray-700">Datos Personales</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                    <InfoField label="NRE" value={student.nre} />
                    <InfoField label="Expediente" value={student.expediente} />
                    <InfoField label="Grupo" value={`${student.grupo} (${student.subgrupo})`} />
                    <InfoField label="Fecha de Nacimiento" value={new Date(student.fechaNacimiento).toLocaleDateString()} />
                    <InfoField label="Teléfono" value={student.telefono} />
                    <InfoField label="Teléfono 2" value={student.telefono2} />
                    <InfoField label="Email Personal" value={student.emailPersonal} />
                </div>
              </div>

              {/* Interviews */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-700">Entrevistas y Tutorías</h3>
                    <button onClick={() => setIsAddingInterview(!isAddingInterview)} className="text-teal-600 hover:text-teal-800 font-semibold text-sm flex items-center py-1 px-2 rounded-md hover:bg-teal-50 transition-colors">
                        <PlusIcon className="h-4 w-4 mr-1" /> {isAddingInterview ? 'Cancelar' : 'Añadir Nueva'}
                    </button>
                </div>
                {isAddingInterview && (
                  <div className="bg-gray-100 p-4 rounded-lg mb-4 space-y-3">
                      <h4 className="text-sm font-bold text-gray-600">Registrar Nueva Tutoría</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input type="date" value={newInterview.date} onChange={e => setNewInterview({...newInterview, date: e.target.value})} className="w-full p-2 border rounded-md text-sm"/>
                        <input type="text" placeholder="Asistentes (ej. Tutor, Alumno)" value={newInterview.attendees} onChange={e => setNewInterview({...newInterview, attendees: e.target.value})} className="w-full p-2 border rounded-md text-sm"/>
                      </div>
                      <textarea placeholder="Observaciones..." value={newInterview.notes} onChange={e => setNewInterview({...newInterview, notes: e.target.value})} className="w-full p-2 border rounded-md text-sm" rows={3}></textarea>
                      <div className="text-right">
                          <button onClick={handleSaveInterview} className="px-4 py-1.5 bg-teal-500 text-white rounded-md text-sm font-semibold hover:bg-teal-600 transition-colors">Guardar Tutoría</button>
                      </div>
                  </div>
                )}
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                    {student.entrevistas?.length ? [...student.entrevistas].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(interview => (
                        <details key={interview.id} className="p-3 bg-gray-50 rounded-md border border-gray-200">
                            <summary className="font-semibold cursor-pointer text-sm text-gray-800">{new Date(interview.date).toLocaleDateString()} - <span className="font-normal text-gray-600">{interview.attendees}</span></summary>
                            <p className="mt-2 text-gray-700 text-sm whitespace-pre-wrap pt-2 border-t border-gray-200">{interview.notes}</p>
                        </details>
                    )) : <p className="text-sm text-gray-500 italic text-center py-4">No hay entrevistas registradas.</p>}
                </div>
              </div>
            </div>

            {/* Side Column */}
            <div className="space-y-6">
              {/* Grades */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-4 text-gray-700">Calificaciones</h3>
                <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {student.calificaciones?.length ? student.calificaciones.map(grade => (
                    <li key={grade.subject} className="flex justify-between items-center text-sm py-1">
                      <span className="text-gray-700">{grade.subject}</span>
                      <span className={`px-2 py-1 rounded-full font-bold text-xs ${getGradeColor(grade.score)}`}>{grade.score.toFixed(1)}</span>
                    </li>
                  )) : <p className="text-sm text-gray-500 italic text-center py-4">No hay calificaciones.</p>}
                </ul>
              </div>

              {/* Annotations */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-4 text-gray-700">Anotaciones</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {student.anotaciones?.length ? student.anotaciones.map(annotation => (
                    <div key={annotation.id} className={`p-3 border-l-4 ${getAnnotationColor(annotation.type)} bg-gray-50 rounded-r-md`}>
                      <p className="text-sm text-gray-800">{annotation.note}</p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(annotation.date).toLocaleDateString()}</p>
                    </div>
                  )) : <p className="text-sm text-gray-500 italic text-center py-4">No hay anotaciones.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailModal;