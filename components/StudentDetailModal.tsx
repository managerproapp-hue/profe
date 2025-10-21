import React, { useState, useMemo, useCallback } from 'react';
import { Student, EvaluationsState, Service, StudentGroupAssignments, EvaluationItemScore, StudentPracticalExam, TheoreticalExamGrades, Interview, Annotation, Grade } from '../types';
import { CloseIcon, PencilIcon, PlusIcon } from './icons';
import { ACADEMIC_EVALUATION_STRUCTURE } from '../constants';


// Helper function to safely parse JSON from localStorage
const safeJsonParse = <T,>(key: string, defaultValue: T): T => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error parsing JSON from localStorage key "${key}":`, error);
        return defaultValue;
    }
};

const calculateScore = (scores: EvaluationItemScore[]): number => {
  if (!scores) return 0;
  return scores.reduce((sum, item) => sum + (item.score || 0), 0);
};

const getGradeColor = (score: number) => {
  if (score >= 9) return 'bg-green-100 text-green-800';
  if (score >= 7) return 'bg-blue-100 text-blue-800';
  if (score >= 5) return 'bg-yellow-100 text-yellow-800';
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
    evaluations: EvaluationsState;
    practicalExams: StudentPracticalExam[];
    academicGrades: {[nre: string]: TheoreticalExamGrades};
    onClose: () => void;
    onEdit: (student: Student) => void;
    onUpdateStudent: (student: Student) => void;
}

const AcademicSummary: React.FC<{
    student: Student;
    evaluations: EvaluationsState;
    practicalExams: StudentPracticalExam[];
    academicGrades: {[nre: string]: TheoreticalExamGrades};
}> = ({ student, evaluations, practicalExams, academicGrades }) => {
    const services = useMemo(() => safeJsonParse<Service[]>('practicaServices', []), []);
    const studentGroupAssignments = useMemo(() => safeJsonParse<StudentGroupAssignments>('studentGroupAssignments', {}), []);

    const calculatedGrades = useMemo(() => {
        const grades: { [key: string]: number | null } = {};

        // Servicios 1
        const servicesT1 = services.filter(s => s.trimestre === 1);
        let totalScoreT1 = 0;
        let servicesCountT1 = 0;
        servicesT1.forEach(service => {
            const indEval = evaluations.individual.find(e => e.serviceId === service.id && e.studentNre === student.nre);
            if (indEval?.attendance === 'present') {
                const practiceGroup = studentGroupAssignments[student.nre];
                const groupEval = evaluations.group.find(e => e.serviceId === service.id && e.groupId === practiceGroup);
                const individualScore = calculateScore(indEval.scores);
                const groupScore = groupEval ? calculateScore(groupEval.scores) : 0;
                totalScoreT1 += (individualScore + groupScore);
                servicesCountT1++;
            }
        });
        grades['servicios1'] = servicesCountT1 > 0 ? (totalScoreT1 / servicesCountT1) / 2 : null;

        // Servicios 2
        const servicesT2 = services.filter(s => s.trimestre === 2);
        let totalScoreT2 = 0;
        let servicesCountT2 = 0;
        servicesT2.forEach(service => {
            const indEval = evaluations.individual.find(e => e.serviceId === service.id && e.studentNre === student.nre);
            if (indEval?.attendance === 'present') {
                const practiceGroup = studentGroupAssignments[student.nre];
                const groupEval = evaluations.group.find(e => e.serviceId === service.id && e.groupId === practiceGroup);
                const individualScore = calculateScore(indEval.scores);
                const groupScore = groupEval ? calculateScore(groupEval.scores) : 0;
                totalScoreT2 += (individualScore + groupScore);
                servicesCountT2++;
            }
        });
        grades['servicios2'] = servicesCountT2 > 0 ? (totalScoreT2 / servicesCountT2) / 2 : null;

        // Ex. Practico 1
        const examT1 = practicalExams.find(e => e.studentNre === student.nre && e.examType === 'T1');
        grades['exPractico1'] = examT1?.finalScore ?? null;

        // Ex. Practico 2
        const examT2 = practicalExams.find(e => e.studentNre === student.nre && e.examType === 'T2');
        grades['exPractico2'] = examT2?.finalScore ?? null;

        return grades;
    }, [student, evaluations, practicalExams, services, studentGroupAssignments]);

    const studentTheoreticalGrades = academicGrades[student.nre] || {};

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <details className="group" open>
                <summary className="text-xl font-bold text-gray-700 cursor-pointer list-none">
                    <span className="group-open:rotate-90 inline-block transform transition-transform duration-200 mr-2">▶</span>
                    Resumen Académico
                </summary>
                <div className="mt-4 pt-4 border-t">
                    {ACADEMIC_EVALUATION_STRUCTURE.trimestres.map(trimestre => {
                        let weightedTotal = 0;
                        let totalWeight = 0;

                        return (
                            <div key={trimestre.name} className="mb-6">
                                <h4 className="font-bold text-lg text-gray-800 mb-3">{trimestre.name}</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {trimestre.instruments.map(inst => {
                                        const grade = inst.type === 'manual' 
                                            ? studentTheoreticalGrades[inst.key as keyof TheoreticalExamGrades] 
                                            : calculatedGrades[inst.key];
                                        
                                        if (typeof grade === 'number' && !isNaN(grade)) {
                                            weightedTotal += grade * inst.weight;
                                            totalWeight += inst.weight;
                                        }

                                        return (
                                            <div key={inst.key} className="bg-gray-50 p-3 rounded-md">
                                                <p className="text-sm text-gray-500">{inst.name}</p>
                                                <p className={`font-bold text-2xl ${getGradeColor(grade ?? 0).replace('bg-', 'text-').replace('-100', '-700')}`}>
                                                    {grade !== null && typeof grade !== 'undefined' ? grade.toFixed(2) : 'N/A'}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-4 text-right bg-gray-100 p-3 rounded-md">
                                    <span className="font-semibold text-gray-600">Nota Trimestral Ponderada: </span>
                                    <span className="font-bold text-xl text-teal-600">
                                        {(totalWeight > 0 ? weightedTotal / totalWeight : 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                     <div className="mt-4">
                        <h4 className="font-bold text-lg text-gray-800 mb-2">Recuperación</h4>
                        <div className="bg-gray-50 p-3 rounded-md inline-block">
                           <p className="text-sm text-gray-500">{ACADEMIC_EVALUATION_STRUCTURE.recuperacion.name}</p>
                           {/* FIX: Complete the truncated component */}
                           <p className={`font-bold text-2xl ${getGradeColor(studentTheoreticalGrades.recuperacion ?? 0).replace('bg-', 'text-').replace('-100', '-700')}`}>
                                {typeof studentTheoreticalGrades.recuperacion === 'number' ? studentTheoreticalGrades.recuperacion.toFixed(2) : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>
            </details>
        </div>
    );
};

// FIX: Create and export StudentDetailModal component to resolve the import error.
export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({ student, evaluations, practicalExams, academicGrades, onClose, onEdit, onUpdateStudent }) => {
    const [localStudent, setLocalStudent] = useState<Student>(student);
    const [isAddingInterview, setIsAddingInterview] = useState(false);
    const [newInterview, setNewInterview] = useState({ date: '', attendees: '', notes: '' });

    const averageGrade = useMemo(() => {
        if (!localStudent.calificaciones || localStudent.calificaciones.length === 0) return 'N/A';
        const total = localStudent.calificaciones.reduce((sum, grade) => sum + grade.score, 0);
        return (total / localStudent.calificaciones.length).toFixed(2);
      }, [localStudent.calificaciones]);

      const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (event) => {
            const updatedStudent = { ...localStudent, photoUrl: event.target?.result as string };
            setLocalStudent(updatedStudent);
            onUpdateStudent(updatedStudent);
          };
          reader.readAsDataURL(file);
        }
      };

      const handleSaveInterview = () => {
        if(!newInterview.date || !newInterview.notes) return;
        const newInterviewData: Interview = {
            id: `ent_${Date.now()}`,
            ...newInterview
        };
        const updatedStudent = {
            ...localStudent,
            entrevistas: [...(localStudent.entrevistas || []), newInterviewData]
        };
        setLocalStudent(updatedStudent);
        onUpdateStudent(updatedStudent);
        setNewInterview({ date: '', attendees: '', notes: '' });
        setIsAddingInterview(false);
      }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-gray-100 rounded-lg shadow-xl w-full max-w-6xl transform transition-all flex flex-col max-h-[90vh]">
                <div className="p-4 border-b bg-white rounded-t-lg flex justify-between items-center flex-shrink-0">
                    <h2 className="text-2xl font-bold text-gray-800">Detalles del Alumno: {student.nombre} {student.apellido1}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <CloseIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6 flex-1 overflow-y-auto">
                    <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8">
                        <div className="text-center">
                            <img src={localStudent.photoUrl || `https://i.pravatar.cc/150?u=${localStudent.nre}`} alt="Foto de perfil" className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 mx-auto" />
                            <label htmlFor="photo-upload-modal" className="mt-2 inline-flex items-center px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-xs font-semibold cursor-pointer">
                                <PencilIcon className="h-4 w-4 mr-1"/>
                                Cambiar Foto
                            </label>
                            <input id="photo-upload-modal" type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                            <h1 className="text-3xl font-bold text-gray-800">{localStudent.nombre} {localStudent.apellido1} {localStudent.apellido2}</h1>
                            <p className="text-gray-500">{localStudent.emailOficial}</p>
                        </div>
                        <div className="text-center sm:text-right flex flex-col items-center sm:items-end gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Nota Media Módulos</p>
                                <p className="text-4xl font-bold text-teal-600">{averageGrade}</p>
                            </div>
                            <button onClick={() => onEdit(student)} className="flex items-center text-sm bg-blue-100 text-blue-800 font-semibold py-2 px-4 rounded-lg hover:bg-blue-200">
                                <PencilIcon className="h-4 w-4 mr-2" /> Editar Ficha Completa
                            </button>
                        </div>
                    </div>

                    <div className="mb-8">
                        <AcademicSummary student={student} evaluations={evaluations} practicalExams={practicalExams} academicGrades={academicGrades} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white p-6 rounded-lg shadow-lg">
                                <h2 className="text-xl font-bold mb-4 text-gray-700">Datos Personales</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                    <div><span className="font-semibold text-gray-500">NRE:</span> {localStudent.nre}</div>
                                    <div><span className="font-semibold text-gray-500">Expediente:</span> {localStudent.expediente}</div>
                                    <div><span className="font-semibold text-gray-500">Grupo:</span> {localStudent.grupo} ({localStudent.subgrupo})</div>
                                    <div><span className="font-semibold text-gray-500">Nacimiento:</span> {localStudent.fechaNacimiento}</div>
                                    <div><span className="font-semibold text-gray-500">Teléfono:</span> {localStudent.telefono}</div>
                                    <div><span className="font-semibold text-gray-500">Teléfono 2:</span> {localStudent.telefono2 || '-'}</div>
                                    <div className="col-span-full"><span className="font-semibold text-gray-500">Email Personal:</span> {localStudent.emailPersonal}</div>
                                </div>
                            </div>
                            
                            <div className="bg-white p-6 rounded-lg shadow-lg">
                                <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-700">Entrevistas y Tutorías</h2>
                                <button onClick={() => setIsAddingInterview(!isAddingInterview)} className="text-teal-500 hover:text-teal-700 font-semibold text-sm flex items-center">
                                    <PlusIcon className="h-4 w-4 mr-1" /> Añadir Entrevista
                                </button>
                                </div>
                                {isAddingInterview && (
                                    <div className="bg-gray-50 p-4 rounded-md mb-4 space-y-3">
                                        <input type="date" value={newInterview.date} onChange={e => setNewInterview({...newInterview, date: e.target.value})} className="w-full p-2 border rounded"/>
                                        <input type="text" placeholder="Asistentes (ej. Tutor, Alumno)" value={newInterview.attendees} onChange={e => setNewInterview({...newInterview, attendees: e.target.value})} className="w-full p-2 border rounded"/>
                                        <textarea placeholder="Observaciones..." value={newInterview.notes} onChange={e => setNewInterview({...newInterview, notes: e.target.value})} className="w-full p-2 border rounded" rows={3}></textarea>
                                        <div className="text-right space-x-2">
                                            <button onClick={() => setIsAddingInterview(false)} className="px-4 py-1 bg-gray-200 rounded">Cancelar</button>
                                            <button onClick={handleSaveInterview} className="px-4 py-1 bg-teal-500 text-white rounded">Guardar</button>
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-4">
                                    {localStudent.entrevistas?.map(interview => (
                                        <details key={interview.id} className="p-3 bg-gray-50 rounded-md">
                                            <summary className="font-semibold cursor-pointer">{new Date(interview.date).toLocaleDateString()} - {interview.attendees}</summary>
                                            <p className="mt-2 text-gray-600 text-sm whitespace-pre-wrap">{interview.notes}</p>
                                        </details>
                                    ))}
                                    {(localStudent.entrevistas || []).length === 0 && <p className="text-sm text-gray-500 italic">No hay entrevistas registradas.</p>}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="bg-white p-6 rounded-lg shadow-lg">
                                <h2 className="text-xl font-bold mb-4 text-gray-700">Calificaciones (otros módulos)</h2>
                                <ul className="space-y-2">
                                    {localStudent.calificaciones?.map(grade => (
                                        <li key={grade.subject} className="flex justify-between items-center text-sm">
                                        <span>{grade.subject}</span>
                                        <span className={`px-2 py-1 rounded-full font-bold text-xs ${getGradeColor(grade.score)}`}>{grade.score.toFixed(1)}</span>
                                        </li>
                                    ))}
                                     {(localStudent.calificaciones || []).length === 0 && <p className="text-sm text-gray-500 italic">No hay calificaciones.</p>}
                                </ul>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-lg">
                                <h2 className="text-xl font-bold mb-4 text-gray-700">Anotaciones</h2>
                                <div className="space-y-3">
                                {localStudent.anotaciones?.map(annotation => (
                                    <div key={annotation.id} className={`p-3 border-l-4 ${getAnnotationColor(annotation.type)} bg-gray-50`}>
                                    <p className="text-sm text-gray-800">{annotation.note}</p>
                                    <p className="text-xs text-gray-400 mt-1">{new Date(annotation.date).toLocaleDateString()}</p>
                                    </div>
                                ))}
                                {(localStudent.anotaciones || []).length === 0 && <p className="text-sm text-gray-500 italic">No hay anotaciones.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
