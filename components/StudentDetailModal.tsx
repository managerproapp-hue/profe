import React, { useMemo, useCallback } from 'react';
import { Student, EvaluationsState, Service, StudentGroupAssignments, EvaluationItemScore } from '../types';
import { CloseIcon, PencilIcon } from './icons';

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
    onClose: () => void;
    onEdit: (student: Student) => void;
    onUpdateStudent: (student: Student) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({ student, evaluations, onClose, onEdit }) => {
    
    const averageGrade = useMemo(() => {
        if (!student.calificaciones || student.calificaciones.length === 0) return 'N/A';
        const total = student.calificaciones.reduce((sum, grade) => sum + grade.score, 0);
        return (total / student.calificaciones.length).toFixed(2);
    }, [student.calificaciones]);

    const services = useMemo(() => safeJsonParse<Service[]>('practicaServices', []), []);
    const studentGroupAssignments = useMemo(() => safeJsonParse<StudentGroupAssignments>('studentGroupAssignments', {}), []);

    const studentServices = useMemo(() => {
        const practiceGroup = studentGroupAssignments[student.nre];
        if (!practiceGroup) return [];
        return services.filter(service => 
            service.groupAssignments.comedor.includes(practiceGroup) || 
            service.groupAssignments.takeaway.includes(practiceGroup)
        ).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [services, studentGroupAssignments, student.nre]);

    const getEvaluationScoresForService = useCallback((service: Service) => {
        const practiceGroup = studentGroupAssignments[student.nre];
        const groupEval = evaluations.group.find(e => e.serviceId === service.id && e.groupId === practiceGroup);
        const indEval = evaluations.individual.find(e => e.serviceId === service.id && e.studentNre === student.nre);

        if (!indEval || indEval.attendance === 'absent') {
            return { group: null, individual: null, total: null, status: 'Ausente' };
        }

        const groupScore = groupEval ? calculateScore(groupEval.scores) : 0;
        const indScore = indEval ? calculateScore(indEval.scores) : 0;
        const total = groupScore + indScore;

        return { group: groupScore, individual: indScore, total, status: 'Evaluado' };
    }, [evaluations, student.nre, studentGroupAssignments]);
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4" onClick={onClose}>
          <div className="bg-gray-50 rounded-lg shadow-xl w-full max-w-5xl transform transition-all flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white rounded-t-lg sticky top-0">
                <div className="flex items-center gap-4">
                    <img src={student.photoUrl || `https://i.pravatar.cc/150?u=${student.nre}`} alt="Foto de perfil" className="w-16 h-16 rounded-full object-cover border-2 border-gray-200" />
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{student.nombre} {student.apellido1} {student.apellido2}</h2>
                        <p className="text-sm text-gray-500">{student.grupo} - {student.nre}</p>
                    </div>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full">
                    <CloseIcon className="h-6 w-6" />
                </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                          <div className="bg-white p-6 rounded-lg shadow-sm">
                            <h3 className="text-xl font-bold mb-4 text-gray-700">Datos Personales</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                <div><span className="font-semibold text-gray-500">Expediente:</span> {student.expediente}</div>
                                <div><span className="font-semibold text-gray-500">Subgrupo:</span> {student.subgrupo}</div>
                                <div><span className="font-semibold text-gray-500">Nacimiento:</span> {new Date(student.fechaNacimiento).toLocaleDateString()}</div>
                                <div><span className="font-semibold text-gray-500">Teléfono:</span> {student.telefono}</div>
                                <div className="col-span-2"><span className="font-semibold text-gray-500">Email Oficial:</span> {student.emailOficial}</div>
                            </div>
                          </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <h3 className="text-xl font-bold text-gray-700 mb-4">Entrevistas y Tutorías</h3>
                            <div className="space-y-4 max-h-48 overflow-y-auto">
                                {student.entrevistas?.length ? student.entrevistas.map(interview => (
                                    <details key={interview.id} className="p-3 bg-gray-50 rounded-md">
                                        <summary className="font-semibold cursor-pointer text-sm">{new Date(interview.date).toLocaleDateString()} - {interview.attendees}</summary>
                                        <p className="mt-2 text-gray-600 text-sm whitespace-pre-wrap">{interview.notes}</p>
                                    </details>
                                )) : <p className="text-sm text-gray-500 italic">No hay entrevistas registradas.</p>}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <h3 className="text-xl font-bold text-gray-700 mb-4">Evaluaciones de Prácticas</h3>
                            <div className="space-y-2 max-h-72 overflow-y-auto">
                                {studentServices.length > 0 ? studentServices.map(service => {
                                    const scores = getEvaluationScoresForService(service);
                                    return (
                                        <div key={service.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                                            <div>
                                                <p className="font-semibold">{service.name}</p>
                                                <p className="text-xs text-gray-500">{new Date(service.date).toLocaleDateString()}</p>
                                            </div>
                                            {scores.status === 'Ausente' ? (
                                                <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded-full">{scores.status}</span>
                                            ) : (
                                                <div className="text-right">
                                                    <p className="font-bold text-lg">{scores.total?.toFixed(2)} / 20.00</p>
                                                    <p className="text-xs text-gray-500">G: {scores.group?.toFixed(2)} + I: {scores.individual?.toFixed(2)}</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                }) : <p className="text-sm text-gray-500 italic">Este alumno no tiene servicios de prácticas asignados.</p>}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <h3 className="text-xl font-bold mb-4 text-gray-700">Calificaciones</h3>
                            <div className="flex justify-between items-baseline mb-3">
                                <span className="text-sm text-gray-500">Nota Media</span>
                                <span className="text-2xl font-bold text-teal-600">{averageGrade}</span>
                            </div>
                            <ul className="space-y-2 max-h-48 overflow-y-auto">
                                {student.calificaciones?.length ? student.calificaciones.map(grade => (
                                    <li key={grade.subject} className="flex justify-between items-center text-sm">
                                        <span>{grade.subject}</span>
                                        <span className={`px-2 py-1 rounded-full font-bold text-xs ${getGradeColor(grade.score)}`}>{grade.score.toFixed(1)}</span>
                                    </li>
                                )) : <p className="text-sm text-gray-500 italic">No hay calificaciones.</p>}
                            </ul>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <h3 className="text-xl font-bold mb-4 text-gray-700">Anotaciones</h3>
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                                {student.anotaciones?.length ? student.anotaciones.map(annotation => (
                                    <div key={annotation.id} className={`p-3 border-l-4 bg-gray-50 ${getAnnotationColor(annotation.type)}`}>
                                        <p className="text-sm text-gray-800">{annotation.note}</p>
                                        <p className="text-xs text-gray-400 mt-1">{new Date(annotation.date).toLocaleDateString()}</p>
                                    </div>
                                )) : <p className="text-sm text-gray-500 italic">No hay anotaciones.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-gray-100 p-4 flex justify-end items-center space-x-4 rounded-b-lg sticky bottom-0">
                <button type="button" onClick={() => onEdit(student)} className="px-6 py-2 bg-blue-500 text-white font-bold rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2">
                    <PencilIcon className="h-5 w-5" /> Editar Ficha Completa
                </button>
            </div>
          </div>
        </div>
    );
};
