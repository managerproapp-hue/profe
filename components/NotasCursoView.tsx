import React, { useState, useMemo } from 'react';
import { Student, CourseGrades } from '../types';
import { COURSE_MODULES } from '../constants';
import { CheckIcon } from './icons';

interface NotasCursoViewProps {
  students: Student[];
  courseGrades: { [nre: string]: CourseGrades };
  setCourseGrades: React.Dispatch<React.SetStateAction<{ [nre: string]: CourseGrades }>>;
}

const getGradeColor = (score: number | undefined) => {
    if (score === undefined) return '';
    if (score >= 9) return 'text-green-700';
    if (score >= 7) return 'text-blue-700';
    if (score >= 5) return 'text-yellow-700';
    return 'text-red-700';
};

const NotasCursoView: React.FC<NotasCursoViewProps> = ({ students, courseGrades, setCourseGrades }) => {
  const [saveNotification, setSaveNotification] = useState(false);

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

  const handleGradeChange = (studentNre: string, moduleKey: string, period: 't1' | 't2' | 'rec', value: string) => {
    const newGrade = value === '' ? undefined : parseFloat(value);
    if (newGrade !== undefined && (isNaN(newGrade) || newGrade < 0 || newGrade > 10)) {
        return; // Invalid input
    }
    
    setCourseGrades(prev => {
        const studentGrades = { ...(prev[studentNre] || {}) };
        const moduleGrades = { ...(studentGrades[moduleKey] || {}) };
        
        if (newGrade === undefined) {
            delete moduleGrades[period];
        } else {
            moduleGrades[period] = newGrade;
        }

        const newStudentGrades = { ...studentGrades, [moduleKey]: moduleGrades };
        if (Object.keys(moduleGrades).length === 0) {
            delete newStudentGrades[moduleKey];
        }

        const newCourseGrades = { ...prev, [studentNre]: newStudentGrades };
        if (Object.keys(newStudentGrades).length === 0) {
            delete newCourseGrades[studentNre];
        }

        return newCourseGrades;
    });

    setSaveNotification(true);
    setTimeout(() => setSaveNotification(false), 2000);
  };

  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Notas de Otros Módulos</h1>
          <p className="mt-2 text-gray-600">
            Introduce y gestiona las calificaciones de los módulos complementarios del curso.
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
            <thead className="bg-gray-100 sticky top-0 z-20">
              <tr>
                <th rowSpan={2} className="sticky left-0 bg-gray-100 px-4 py-3 text-left text-sm font-semibold text-gray-700 z-30 border-b border-r">
                  Alumno
                </th>
                {COURSE_MODULES.map(module => (
                  <th key={module.key} colSpan={3} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r">
                    {module.name}
                  </th>
                ))}
              </tr>
              <tr>
                {COURSE_MODULES.map(module => (
                  <React.Fragment key={`${module.key}-periods`}>
                    <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r bg-gray-50">T1</th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r bg-gray-50">T2</th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r bg-gray-50">REC</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {studentsByGroup.map(([groupName, groupStudents]) => (
                    <React.Fragment key={groupName}>
                        <tr>
                            <td colSpan={COURSE_MODULES.length * 3 + 1} className="sticky left-0 px-4 py-2 bg-gray-200 text-sm font-bold text-gray-800 z-10">{groupName}</td>
                        </tr>
                        {groupStudents.map(student => {
                            const studentGrades = courseGrades[student.nre];
                            return (
                                <tr key={student.nre} className="hover:bg-gray-50">
                                    <td className="sticky left-0 bg-white hover:bg-gray-50 px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 z-10 border-r">
                                        {student.apellido1} {student.apellido2}, {student.nombre}
                                    </td>
                                    {COURSE_MODULES.map(module => {
                                        const t1 = studentGrades?.[module.key]?.t1;
                                        const t2 = studentGrades?.[module.key]?.t2;
                                        const rec = studentGrades?.[module.key]?.rec;
                                        return (
                                            <React.Fragment key={module.key}>
                                                <td className="px-2 py-1 text-center text-sm border-r">
                                                    <input
                                                        type="number"
                                                        defaultValue={t1 ?? ''}
                                                        onBlur={(e) => handleGradeChange(student.nre, module.key, 't1', e.target.value)}
                                                        min="0" max="10" step="0.1"
                                                        className={`w-20 p-1 border rounded-md text-center bg-gray-50 focus:bg-white focus:ring-1 focus:ring-teal-500 ${getGradeColor(t1)}`}
                                                    />
                                                </td>
                                                <td className="px-2 py-1 text-center text-sm border-r">
                                                    <input
                                                        type="number"
                                                        defaultValue={t2 ?? ''}
                                                        onBlur={(e) => handleGradeChange(student.nre, module.key, 't2', e.target.value)}
                                                        min="0" max="10" step="0.1"
                                                        className={`w-20 p-1 border rounded-md text-center bg-gray-50 focus:bg-white focus:ring-1 focus:ring-teal-500 ${getGradeColor(t2)}`}
                                                    />
                                                </td>
                                                <td className="px-2 py-1 text-center text-sm border-r">
                                                    <input
                                                        type="number"
                                                        defaultValue={rec ?? ''}
                                                        onBlur={(e) => handleGradeChange(student.nre, module.key, 'rec', e.target.value)}
                                                        min="0" max="10" step="0.1"
                                                        className={`w-20 p-1 border rounded-md text-center bg-gray-50 focus:bg-white focus:ring-1 focus:ring-teal-500 ${getGradeColor(rec)}`}
                                                    />
                                                </td>
                                            </React.Fragment>
                                        );
                                    })}
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

export default NotasCursoView;