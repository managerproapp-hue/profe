import React, { useState, useMemo } from 'react';
import { Student, EvaluationsState, StudentPracticalExam, TheoreticalExamGrades, Service, StudentGroupAssignments, EvaluationItemScore } from '../types';
import { ACADEMIC_EVALUATION_STRUCTURE } from '../constants';
import { CheckIcon } from './icons';

interface GestionAcademicaViewProps {
  students: Student[];
  evaluations: EvaluationsState;
  practicalExams: StudentPracticalExam[];
  academicGrades: {[nre: string]: TheoreticalExamGrades};
  setAcademicGrades: React.Dispatch<React.SetStateAction<{[nre: string]: TheoreticalExamGrades}>>;
}

// Helper to get data from localStorage
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
  if (score >= 9) return 'text-green-700';
  if (score >= 7) return 'text-blue-700';
  if (score >= 5) return 'text-yellow-700';
  return 'text-red-700';
};

const GestionAcademicaView: React.FC<GestionAcademicaViewProps> = ({
  students,
  evaluations,
  practicalExams,
  academicGrades,
  setAcademicGrades,
}) => {
    const [saveNotification, setSaveNotification] = useState(false);

    const services = useMemo(() => safeJsonParse<Service[]>('practicaServices', []), []);
    const studentGroupAssignments = useMemo(() => safeJsonParse<StudentGroupAssignments>('studentGroupAssignments', {}), []);

    const handleGradeChange = (studentNre: string, instrumentKey: keyof TheoreticalExamGrades, value: string) => {
        const newGrade = value === '' ? undefined : parseFloat(value);
        if (newGrade !== undefined && (isNaN(newGrade) || newGrade < 0 || newGrade > 10)) {
            return; // Invalid input
        }

        setAcademicGrades(prev => {
            const studentGrades = { ...(prev[studentNre] || {}) };
            if (newGrade === undefined) {
                delete studentGrades[instrumentKey];
            } else {
                studentGrades[instrumentKey] = newGrade;
            }
            return { ...prev, [studentNre]: studentGrades };
        });
        
        setSaveNotification(true);
        setTimeout(() => setSaveNotification(false), 2000);
    };

    const calculatedGradesByStudent = useMemo(() => {
        const result: { [nre: string]: { [key: string]: number | null } } = {};

        students.forEach(student => {
            const grades: { [key: string]: number | null } = {};

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

            const examT1 = practicalExams.find(e => e.studentNre === student.nre && e.examType === 'T1');
            grades['exPractico1'] = examT1?.finalScore ?? null;
            
            const examT2 = practicalExams.find(e => e.studentNre === student.nre && e.examType === 'T2');
            grades['exPractico2'] = examT2?.finalScore ?? null;

            const examRec = practicalExams.find(e => e.studentNre === student.nre && e.examType === 'REC');
            grades['exPracticoRec'] = examRec?.finalScore ?? null;

            result[student.nre] = grades;
        });
        return result;
    }, [students, services, evaluations, practicalExams, studentGroupAssignments]);

    const studentsByGroup = useMemo(() => {
        const grouped: { [key: string]: Student[] } = {};
        students.forEach(s => {
            const groupName = s.grupo || 'Sin Grupo';
            if (!grouped[groupName]) grouped[groupName] = [];
            grouped[groupName].push(s);
        });

        for (const groupName in grouped) {
            grouped[groupName].sort((a, b) => 
                `${a.apellido1} ${a.apellido2} ${a.nombre}`.localeCompare(`${b.apellido1} ${b.apellido2} ${b.nombre}`)
            );
        }
        
        return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
    }, [students]);

  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-3xl font-bold text-gray-800">Gestión Académica</h1>
            <p className="mt-2 text-gray-600">
            Vista centralizada para gestionar las notas teóricas y visualizar las medias ponderadas.
            </p>
        </div>
         {saveNotification && (
            <div className="bg-green-100 text-green-700 font-semibold py-2 px-4 rounded-lg flex items-center transition-opacity duration-300 animate-pulse">
                <CheckIcon className="h-5 w-5 mr-2" />
                Guardado
            </div>
        )}
      </header>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto max-h-[75vh]">
            <table className="min-w-full divide-y divide-gray-200 border-separate" style={{borderSpacing: 0}}>
                <thead className="bg-gray-50 sticky top-0 z-20">
                    <tr>
                        <th rowSpan={2} className="sticky left-0 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider z-30 border-b border-r">Alumno</th>
                        {ACADEMIC_EVALUATION_STRUCTURE.trimestres.map(trimestre => (
                            <th key={trimestre.name} colSpan={trimestre.instruments.length + 1} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r">
                                {trimestre.name}
                            </th>
                        ))}
                         <th colSpan={ACADEMIC_EVALUATION_STRUCTURE.recuperacion.instruments.length + 1} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r">
                            {ACADEMIC_EVALUATION_STRUCTURE.recuperacion.name}
                        </th>
                    </tr>
                    <tr>
                         {ACADEMIC_EVALUATION_STRUCTURE.trimestres.map(trimestre => (
                            <React.Fragment key={`${trimestre.name}-cols`}>
                                {trimestre.instruments.map(inst => (
                                    <th key={inst.key} className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r whitespace-nowrap">
                                        {inst.name} <span className="font-normal">({(inst.weight * 50).toFixed(0)}%)</span>
                                    </th>
                                ))}
                                <th className="px-2 py-2 text-center text-xs font-bold text-teal-600 uppercase tracking-wider border-b border-r bg-teal-50 whitespace-nowrap">Media</th>
                            </React.Fragment>
                        ))}
                        {ACADEMIC_EVALUATION_STRUCTURE.recuperacion.instruments.map(inst => (
                            <th key={inst.key} className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r whitespace-nowrap">
                                {inst.name} <span className="font-normal">({(inst.weight * 100).toFixed(0)}%)</span>
                            </th>
                        ))}
                        <th className="px-2 py-2 text-center text-xs font-bold text-teal-600 uppercase tracking-wider border-b border-r bg-teal-50 whitespace-nowrap">Media REC</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                     {studentsByGroup.map(([groupName, groupStudents]) => (
                        <React.Fragment key={groupName}>
                            <tr>
                                <td colSpan={14} className="sticky left-0 px-4 py-2 bg-gray-100 text-sm font-bold text-gray-700 z-10">{groupName}</td>
                            </tr>
                            {groupStudents.map((student) => {
                                const calculatedGrades = calculatedGradesByStudent[student.nre] || {};
                                const theoreticalGrades = academicGrades[student.nre] || {};

                                return (
                                <tr key={student.nre} className="hover:bg-gray-50">
                                    <td className="sticky left-0 bg-white hover:bg-gray-50 px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 z-10 border-r">{student.apellido1} {student.apellido2}, {student.nombre}</td>
                                    {/* Trimestres */}
                                    {ACADEMIC_EVALUATION_STRUCTURE.trimestres.map(trimestre => {
                                        let weightedTotal = 0;
                                        let totalWeight = 0;
                                        const cells = trimestre.instruments.map(inst => {
                                            const grade = inst.type === 'manual' ? theoreticalGrades[inst.key as keyof TheoreticalExamGrades] : calculatedGrades[inst.key];
                                            if (typeof grade === 'number' && !isNaN(grade)) {
                                                weightedTotal += grade * inst.weight;
                                                totalWeight += inst.weight;
                                            }
                                            return (
                                                <td key={inst.key} className="px-2 py-2 text-center text-sm border-r">
                                                    {inst.type === 'manual' ? (
                                                        <input 
                                                            type="number"
                                                            defaultValue={grade ?? ''}
                                                            onBlur={(e) => handleGradeChange(student.nre, inst.key as keyof TheoreticalExamGrades, e.target.value)}
                                                            min="0" max="10" step="0.01"
                                                            className={`w-20 p-1 border rounded-md text-center bg-gray-50 focus:bg-white focus:ring-1 focus:ring-teal-500 ${grade !== undefined ? getGradeColor(grade) : ''}`}
                                                        />
                                                    ) : (
                                                        <span className={`font-semibold ${grade !== null && grade !== undefined ? getGradeColor(grade) : 'text-gray-400'}`}>
                                                            {grade !== null && grade !== undefined ? grade.toFixed(2) : 'N/A'}
                                                        </span>
                                                    )}
                                                </td>
                                            );
                                        });

                                        const trimestreAverage = totalWeight > 0 ? weightedTotal / totalWeight : 0;
                                        cells.push(
                                            <td key={`${trimestre.name}-avg`} className={`px-2 py-2 text-center text-sm font-bold border-r bg-teal-50 ${getGradeColor(trimestreAverage)}`}>
                                                {trimestreAverage.toFixed(2)}
                                            </td>
                                        );
                                        return cells;
                                    })}

                                    {/* Recuperacion */}
                                    {(() => {
                                        let weightedTotalRec = 0;
                                        let totalWeightRec = 0;
                                        const recCells = ACADEMIC_EVALUATION_STRUCTURE.recuperacion.instruments.map(inst => {
                                            const grade = inst.type === 'manual' ? theoreticalGrades[inst.key as keyof TheoreticalExamGrades] : calculatedGrades[inst.key];
                                            if (typeof grade === 'number' && !isNaN(grade)) {
                                                weightedTotalRec += grade * inst.weight;
                                                totalWeightRec += inst.weight;
                                            }
                                            return (
                                                <td key={inst.key} className="px-2 py-2 text-center text-sm border-r">
                                                    {inst.type === 'manual' ? (
                                                        <input 
                                                            type="number"
                                                            defaultValue={grade ?? ''}
                                                            onBlur={(e) => handleGradeChange(student.nre, inst.key as keyof TheoreticalExamGrades, e.target.value)}
                                                            min="0" max="10" step="0.01"
                                                            className={`w-20 p-1 border rounded-md text-center bg-gray-50 focus:bg-white focus:ring-1 focus:ring-teal-500 ${grade !== undefined ? getGradeColor(grade) : ''}`}
                                                        />
                                                    ) : (
                                                        <span className={`font-semibold ${grade !== null && grade !== undefined ? getGradeColor(grade) : 'text-gray-400'}`}>
                                                            {grade !== null && grade !== undefined ? grade.toFixed(2) : 'N/A'}
                                                        </span>
                                                    )}
                                                </td>
                                            );
                                        });
                                        const recAverage = totalWeightRec > 0 ? weightedTotalRec / totalWeightRec : 0;
                                        recCells.push(
                                            <td key="rec-avg" className={`px-2 py-2 text-center text-sm font-bold border-r bg-teal-50 ${getGradeColor(recAverage)}`}>
                                                {recAverage.toFixed(2)}
                                            </td>
                                        );
                                        return recCells;
                                    })()}
                                </tr>
                                );
                            })}
                        </React.Fragment>
                     ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default GestionAcademicaView;