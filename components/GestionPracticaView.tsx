import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Student } from '../types';
import { UsersIcon, GroupIcon, ServiceIcon, CalendarIcon, TrashIcon, CloseIcon, CogIcon, PlusIcon, PencilIcon, CheckIcon, XIcon, DownloadIcon } from './icons';
import { printContent, exportToExcel } from './printUtils';


// --- HELPER FUNCTION ---
const safeJsonParse = <T,>(key: string, defaultValue: T): T => {
    try {
        const item = localStorage.getItem(key);
        // Ensure item is not null, undefined, or an empty string which causes JSON.parse to fail
        if (item) {
            return JSON.parse(item);
        }
        return defaultValue;
    } catch (error) {
        console.error(`Error parsing JSON from localStorage key "${key}":`, error);
        localStorage.removeItem(key); // Clear corrupted data
        return defaultValue;
    }
};


// --- DATA TYPES ---
interface Service {
  id: string;
  name: string;
  date: string;
  trimestre: number;
  groupAssignments: {
    comedor: string[];
    takeaway: string[];
  };
  menu?: string;
}
type StudentGroupAssignments = Record<string, string>; // { [studentNre]: groupName }
type PlanningAssignments = Record<string, Record<string, string>>; // { [serviceId]: { [studentNre]: role } }

// --- CONSTANTS ---
const LEADER_ROLES = ["Jefe de Cocina", "2º Jefe de Cocina", "2º Jefe de Takeaway"];
const SECONDARY_ROLES = ["Jefe de Partida", "Cocinero", "Ayudante", "Sin servicio 1", "Sin servicio 2"];
const COLOR_PALETTE = ['teal', 'blue', 'green', 'yellow', 'purple', 'pink', 'indigo'];
const colorStyles: Record<string, { border: string; bg: string }> = {
  teal: { border: 'border-teal-500', bg: 'bg-teal-50' },
  blue: { border: 'border-blue-500', bg: 'bg-blue-50' },
  green: { border: 'border-green-500', bg: 'bg-green-50' },
  yellow: { border: 'border-yellow-500', bg: 'bg-yellow-50' },
  purple: { border: 'border-purple-500', bg: 'bg-purple-50' },
  pink: { border: 'border-pink-500', bg: 'bg-pink-50' },
  indigo: { border: 'border-indigo-500', bg: 'bg-indigo-50' },
  default: { border: 'border-gray-200', bg: 'bg-gray-50' },
};


// --- MOCK API for AI assignments ---
const mockGeminiApiCall = (prompt: string): Promise<Record<string, string>> => {
    console.log("--- Sending prompt to Mock Gemini API ---");
    console.log(prompt);
    
    const studentsMatch = prompt.match(/Students to assign: (\[.*?\])/);
    const rolesMatch = prompt.match(/Available secondary roles to fill: (\[.*?\])/);
    
    if (!studentsMatch || !rolesMatch) {
      return Promise.reject("Invalid prompt format for mock API");
    }

    const studentsToAssign: {nre: string}[] = JSON.parse(studentsMatch[1]);
    const availableRoles: string[] = JSON.parse(rolesMatch[1]);

    const assignments: Record<string, string> = {};
    let studentPool = [...studentsToAssign].sort(() => Math.random() - 0.5);
    let rolePool = [...availableRoles].sort(() => Math.random() - 0.5);

    // Assign one unique role to each student until roles or students run out.
    while(studentPool.length > 0 && rolePool.length > 0) {
        const student = studentPool.pop();
        const role = rolePool.shift();
        if(student && role) {
            assignments[student.nre] = role;
        }
    }
    // Any remaining students are left unassigned, as per the corrected logic.
    // The previous logic incorrectly assigned "Ayudante" to all remaining students,
    // violating the unique role constraint within a group.

    console.log("--- Mock Gemini API Response ---", assignments);

    return new Promise(resolve => setTimeout(() => resolve(assignments), 500));
};


// --- TAB COMPONENTS ---

const ConfiguracionTab: React.FC<{
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  handleDeleteService: (id: string) => void;
}> = ({ services, setServices, handleDeleteService }) => {
    const [addingToTrimester, setAddingToTrimester] = useState<number | null>(null);
    const [manualService, setManualService] = useState({ name: '', date: ''});
    const [editingService, setEditingService] = useState<Service | null>(null);

    const calculateDefaultDate = (trimestre: number, allServices: Service[]): string => {
        const servicesInTrimester = allServices
            .filter(s => s.trimestre === trimestre)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (servicesInTrimester.length > 0) {
            const lastDate = new Date(servicesInTrimester[0].date);
            lastDate.setDate(lastDate.getDate() + 7);
            return lastDate.toISOString().split('T')[0];
        }

        const now = new Date();
        const year = now.getFullYear();
        const academicYearStartMonth = 8; // September (0-indexed)
        let academicYear = now.getMonth() >= academicYearStartMonth ? year : year - 1;

        switch (trimestre) {
            case 1: return new Date(academicYear, 8, 15).toISOString().split('T')[0]; // Sep 15
            case 2: return new Date(academicYear + 1, 0, 15).toISOString().split('T')[0]; // Jan 15
            case 3: return new Date(academicYear + 1, 3, 15).toISOString().split('T')[0]; // Apr 15
            default: return now.toISOString().split('T')[0];
        }
    };

    const handleShowAddForm = (trimestre: number) => {
        const defaultDate = calculateDefaultDate(trimestre, services);
        const serviceCount = services.filter(s => s.trimestre === trimestre).length;
        setManualService({ name: `Servicio T${trimestre} #${serviceCount + 1}`, date: defaultDate });
        setAddingToTrimester(trimestre);
    };

    const handleAddManualService = () => {
        if (!manualService.name || !manualService.date || addingToTrimester === null) {
            alert("Por favor, complete el nombre y la fecha.");
            return;
        }
        const newService: Service = {
            id: `service_${Date.now()}`,
            name: manualService.name,
            date: manualService.date,
            trimestre: addingToTrimester,
            groupAssignments: { comedor: [], takeaway: [] }
        };
        setServices(prev => [...prev, newService].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        setAddingToTrimester(null);
        setManualService({ name: '', date: '' });
    };

    const handleUpdateService = () => {
        if (editingService) {
            setServices(prev => prev.map(s => s.id === editingService.id ? editingService : s));
            setEditingService(null);
        }
    };

    const servicesByTrimester = useMemo(() => {
        const grouped: { [key: number]: Service[] } = { 1: [], 2: [], 3: [] };
        services.forEach(service => {
            const trimestre = service.trimestre || 1;
            if (!grouped[trimestre]) grouped[trimestre] = [];
            grouped[trimestre].push(service);
        });
        Object.keys(grouped).forEach(key => {
            const numKey = parseInt(key, 10);
            grouped[numKey].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        });
        return grouped;
    }, [services]);

    return (
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Servicios del Curso ({services.length})</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(trimestre => (
                    <div key={trimestre} className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col">
                        <h4 className="font-bold text-lg text-gray-700 mb-3 text-center border-b pb-2">Trimestre {trimestre}</h4>
                        
                        <div className="space-y-2 mb-4 flex-1 min-h-[200px] max-h-80 overflow-y-auto pr-2">
                            {servicesByTrimester[trimestre] && servicesByTrimester[trimestre].length > 0 ? (
                                servicesByTrimester[trimestre].map(service => (
                                    <div key={service.id} className="bg-white p-2 rounded-md shadow-sm text-sm">
                                        {editingService?.id === service.id ? (
                                            <div className="space-y-2">
                                                <input type="text" value={editingService.name} onChange={e => setEditingService({...editingService, name: e.target.value})} className="p-1 border rounded w-full text-sm" />
                                                <input type="date" value={editingService.date} onChange={e => setEditingService({...editingService, date: e.target.value})} className="p-1 border rounded w-full text-sm" />
                                                <div className="flex justify-end space-x-2">
                                                    <button onClick={handleUpdateService} className="text-green-600 hover:text-green-800"><CheckIcon className="h-5 w-5"/></button>
                                                    <button onClick={() => setEditingService(null)} className="text-red-600 hover:text-red-800"><XIcon className="h-5 w-5"/></button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium">{service.name}</p>
                                                    <p className="text-xs text-gray-500">{new Date(service.date).toLocaleDateString()}</p>
                                                </div>
                                                <div className="flex items-center space-x-2 flex-shrink-0">
                                                    <button onClick={() => setEditingService({...service})} className="text-blue-500 hover:text-blue-700"><PencilIcon className="h-4 w-4"/></button>
                                                    <button onClick={() => handleDeleteService(service.id)} className="text-red-500 hover:text-red-700"><TrashIcon className="h-4 w-4"/></button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 italic text-center pt-8">No hay servicios.</p>
                            )}
                        </div>
                        
                        {addingToTrimester === trimestre && (
                             <div className="bg-teal-50 p-3 rounded-md mb-4 border border-dashed border-teal-300 space-y-3">
                                <h5 className="font-semibold text-sm text-teal-800">Nuevo Servicio</h5>
                                <input type="text" placeholder="Nombre del Servicio" value={manualService.name} onChange={e => setManualService({...manualService, name: e.target.value})} className="w-full p-2 border rounded text-sm"/>
                                <input type="date" value={manualService.date} onChange={e => setManualService({...manualService, date: e.target.value})} className="w-full p-2 border rounded text-sm"/>
                                <div className="text-right space-x-2">
                                    <button onClick={() => setAddingToTrimester(null)} className="px-3 py-1 bg-gray-200 rounded text-xs">Cancelar</button>
                                    <button onClick={handleAddManualService} className="px-3 py-1 bg-teal-500 text-white rounded text-xs">Guardar</button>
                                </div>
                            </div>
                        )}

                        <button onClick={() => handleShowAddForm(trimestre)} className="w-full flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-sm px-3 py-1.5 rounded-md mt-auto">
                           <PlusIcon className="h-4 w-4 mr-1"/> Añadir Servicio
                        </button>
                    </div>
                ))}
            </div>
        </div>
      </div>
    );
};

const ServiciosTab: React.FC<{
    services: Service[];
    setServices: React.Dispatch<React.SetStateAction<Service[]>>;
    practicaGroups: string[];
    planningAssignments: PlanningAssignments;
    students: Student[];
}> = ({ services, setServices, practicaGroups, planningAssignments, students }) => {

    const handleGroupAssignmentChange = (serviceId: string, type: 'comedor' | 'takeaway', group: string, checked: boolean) => {
        setServices(prevServices => prevServices.map(s => {
            if (s.id === serviceId) {
                const currentAssignments = s.groupAssignments[type];
                const newAssignments = checked 
                    ? [...currentAssignments, group] 
                    : currentAssignments.filter(g => g !== group);
                return { ...s, groupAssignments: { ...s.groupAssignments, [type]: newAssignments }};
            }
            return s;
        }));
    };
    
    return (
        <div className="space-y-4">
             {services.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(service => {
                const leaderAssignments = planningAssignments[service.id] || {};
                const leaders = students.filter(s => LEADER_ROLES.includes(leaderAssignments[s.nre]));

                return (
                    <details key={service.id} className="bg-white p-4 rounded-lg shadow-md open:ring-2 open:ring-teal-500">
                        <summary className="font-bold text-lg cursor-pointer flex justify-between">
                           {service.name} <span className="font-normal text-gray-600">{new Date(service.date).toLocaleDateString()}</span>
                        </summary>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
                            <div>
                                <h4 className="font-semibold mb-2">Asignar Grupos (Comedor)</h4>
                                <div className="space-y-1">
                                {practicaGroups.map(g => (
                                    <label key={g} className="flex items-center">
                                        <input type="checkbox" checked={service.groupAssignments.comedor.includes(g)} onChange={(e) => handleGroupAssignmentChange(service.id, 'comedor', g, e.target.checked)} className="h-4 w-4 text-teal-600 border-gray-300 rounded"/>
                                        <span className="ml-2 text-sm">{g}</span>
                                    </label>
                                ))}
                                </div>
                            </div>
                             <div>
                                <h4 className="font-semibold mb-2">Asignar Grupos (Takeaway)</h4>
                                <div className="space-y-1">
                                {practicaGroups.map(g => (
                                    <label key={g} className="flex items-center">
                                        <input type="checkbox" checked={service.groupAssignments.takeaway.includes(g)} onChange={(e) => handleGroupAssignmentChange(service.id, 'takeaway', g, e.target.checked)} className="h-4 w-4 text-teal-600 border-gray-300 rounded"/>
                                        <span className="ml-2 text-sm">{g}</span>
                                    </label>
                                ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">Resumen de Líderes</h4>
                                {leaders.length > 0 ? (
                                     <ul className="text-sm space-y-1">
                                        {leaders.map(l => <li key={l.nre}><strong>{leaderAssignments[l.nre]}:</strong> {l.nombre} {l.apellido1}</li>)}
                                     </ul>
                                ) : <p className="text-sm text-gray-500">Pendiente de asignación.</p>}
                                 <button className="mt-4 text-sm bg-gray-200 px-3 py-1 rounded-md hover:bg-gray-300 w-full" onClick={() => alert("Función para gestionar ficha de servicio (menú, evaluaciones, etc.) no implementada.")}>
                                    Gestionar Ficha de Servicio
                                </button>
                            </div>
                        </div>
                    </details>
                )
             })}
        </div>
    );
};

const PlanningTab: React.FC<{
    services: Service[];
    students: Student[];
    studentGroupAssignments: StudentGroupAssignments;
    planningAssignments: PlanningAssignments;
    setPlanningAssignments: React.Dispatch<React.SetStateAction<PlanningAssignments>>;
}> = ({ services, students, studentGroupAssignments, planningAssignments, setPlanningAssignments }) => {
    const [isLoading, setIsLoading] = useState<string | null>(null); // serviceId of loading service
    const [openExportMenu, setOpenExportMenu] = useState<string | null>(null);

    const handlePlanningChange = (serviceId: string, studentNre: string, newRole: string, groupName: string | null) => {
        setPlanningAssignments(prev => {
            const serviceAssignments = { ...(prev[serviceId] || {}) };
            
            delete serviceAssignments[studentNre];

            if (LEADER_ROLES.includes(newRole)) {
                const currentHolderNre = Object.keys(serviceAssignments).find(nre => serviceAssignments[nre] === newRole);
                if (currentHolderNre) {
                    delete serviceAssignments[currentHolderNre];
                }
            }
    
            if (newRole !== "Sin asignar") {
                serviceAssignments[studentNre] = newRole;
            }
    
            return { ...prev, [serviceId]: serviceAssignments };
        });
    };

    const handleDeployAI = async (service: Service) => {
        setIsLoading(service.id);
        const serviceGroups = [...new Set([...service.groupAssignments.comedor, ...service.groupAssignments.takeaway])];
        let newServiceAssignments = { ...(planningAssignments[service.id] || {}) };
        let assignmentsMadeCount = 0;

        try {
            for (const groupName of serviceGroups) {
                const studentsInGroup = students.filter(s => studentGroupAssignments[s.nre] === groupName);
                const assignedNREsInGroup = new Set(Object.keys(newServiceAssignments));
                
                const studentsToAssign = studentsInGroup
                    .filter(s => !assignedNREsInGroup.has(s.nre))
                    .map(s => ({ nre: s.nre, nombre: s.nombre, apellido1: s.apellido1 }));

                if (studentsToAssign.length === 0) continue;

                const assignedRolesInGroup = Object.values(newServiceAssignments).filter(role => {
                    const assignees = Object.keys(newServiceAssignments).filter(nre => newServiceAssignments[nre] === role);
                    return studentsInGroup.some(s => assignees.includes(s.nre));
                });
                const availableRoles = SECONDARY_ROLES.filter(r => !assignedRolesInGroup.includes(r));
                
                const prompt = `You are a kitchen manager's assistant. Your task is to assign secondary cooking roles to a list of students within a specific work group ("partida").
                Context for Group "${groupName}":
                - Service Name: ${service.name}
                - Students to assign: ${JSON.stringify(studentsToAssign)}
                - Available secondary roles to fill for this group: ${JSON.stringify(availableRoles)}
                Rules:
                1. Assign ONE unique role from the available list to each student.
                2. Do not repeat roles within this group.
                3. If there are more students than roles, leave some students unassigned.
                Output the result as a single, valid JSON object where keys are student NREs (as strings) and values are the assigned role (as a string).
                `;

                const aiGroupAssignments = await mockGeminiApiCall(prompt);
                Object.keys(aiGroupAssignments).forEach(nre => {
                    if(!newServiceAssignments[nre]){ // Double check not to overwrite
                        newServiceAssignments[nre] = aiGroupAssignments[nre];
                        assignmentsMadeCount++;
                    }
                });
            }

            setPlanningAssignments(prev => ({
                ...prev,
                [service.id]: newServiceAssignments
            }));
            
            alert(`Despliegue de IA completado. Se han realizado ${assignmentsMadeCount} nuevas asignaciones.`);

        } catch (error) {
            console.error("AI Assignment failed:", error);
            alert("Error al desplegar con IA.");
        } finally {
            setIsLoading(null);
        }
    };

    const handlePrintPlanning = (service: Service) => {
        const serviceAssignments = planningAssignments[service.id] || {};
        let html = '';

        const leaders = LEADER_ROLES.map(role => {
            const studentNre = Object.keys(serviceAssignments).find(nre => serviceAssignments[nre] === role);
            const student = students.find(s => s.nre === studentNre);
            return { role, studentName: student ? `${student.nombre} ${student.apellido1}` : 'Sin asignar' };
        });

        html += `
            <div style="margin-bottom: 2rem; break-inside: avoid;">
                <h3 style="font-size: 1.25rem; font-weight: bold;">Roles de Liderazgo</h3>
                <table style="margin-top: 0.5rem;">
                    <thead><tr><th>Rol</th><th>Alumno</th></tr></thead>
                    <tbody>${leaders.map(l => `<tr><td>${l.role}</td><td>${l.studentName}</td></tr>`).join('')}</tbody>
                </table>
            </div>
        `;

        const serviceGroups = [...new Set([...service.groupAssignments.comedor, ...service.groupAssignments.takeaway])];
        serviceGroups.forEach(groupName => {
            const studentsInGroup = students.filter(s => studentGroupAssignments[s.nre] === groupName);
            html += `
                <div style="margin-bottom: 2rem; break-inside: avoid;">
                    <h3 style="font-size: 1.25rem; font-weight: bold;">Partida: ${groupName}</h3>
                    <table style="margin-top: 0.5rem;">
                        <thead><tr><th>Alumno</th><th>Rol Asignado</th></tr></thead>
                        <tbody>
                        ${studentsInGroup.map(student => {
                            const role = serviceAssignments[student.nre] || 'Sin asignar';
                            return `<tr><td>${student.nombre} ${student.apellido1}</td><td>${role}</td></tr>`;
                        }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        });
        
        printContent(`Planning: ${service.name} (${new Date(service.date).toLocaleDateString()})`, html);
        setOpenExportMenu(null);
    };

    const handleExportExcelPlanning = (service: Service) => {
        const serviceAssignments = planningAssignments[service.id] || {};
        const dataToExport: any[] = [];

        LEADER_ROLES.forEach(role => {
            const studentNre = Object.keys(serviceAssignments).find(nre => serviceAssignments[nre] === role);
            const student = students.find(s => s.nre === studentNre);
            dataToExport.push({
                'Partida': 'Liderazgo',
                'Rol': role,
                'Alumno': student ? `${student.nombre} ${student.apellido1}` : 'Sin asignar'
            });
        });

        const serviceGroups = [...new Set([...service.groupAssignments.comedor, ...service.groupAssignments.takeaway])];
        serviceGroups.forEach(groupName => {
            const studentsInGroup = students.filter(s => studentGroupAssignments[s.nre] === groupName);
            studentsInGroup.forEach(student => {
                 dataToExport.push({
                    'Partida': groupName,
                    'Rol': serviceAssignments[student.nre] || 'Sin asignar',
                    'Alumno': `${student.nombre} ${student.apellido1}`
                });
            });
        });

        exportToExcel(dataToExport, `planning_${service.name.replace(/\s+/g, '_')}`, 'Planning');
        setOpenExportMenu(null);
    };

    const sortedServices = useMemo(() => services.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [services]);

    return (
        <div className="space-y-6">
            {sortedServices.map(service => {
                const serviceAssignments = planningAssignments[service.id] || {};
                const serviceGroups = [...new Set([...service.groupAssignments.comedor, ...service.groupAssignments.takeaway])];

                return (
                    <div key={service.id} className="bg-white p-4 rounded-lg shadow-md">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">{service.name}</h3>
                                <p className="text-sm text-gray-500">{new Date(service.date).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <button 
                                        onClick={() => setOpenExportMenu(prev => prev === service.id ? null : service.id)}
                                        className="bg-green-500 text-white font-semibold py-1.5 px-3 rounded-md hover:bg-green-600 text-sm flex items-center"
                                    >
                                        <DownloadIcon className="h-4 w-4 mr-1"/> Exportar
                                    </button>
                                    {openExportMenu === service.id && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                                            <button onClick={() => handlePrintPlanning(service)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Imprimir Planning</button>
                                            <button onClick={() => handleExportExcelPlanning(service)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Exportar a Excel</button>
                                        </div>
                                    )}
                                </div>
                                <button 
                                    onClick={() => handleDeployAI(service)}
                                    disabled={isLoading === service.id}
                                    className="bg-indigo-500 text-white font-semibold py-1.5 px-3 rounded-md hover:bg-indigo-600 disabled:bg-gray-400 text-sm">
                                    {isLoading === service.id ? "Procesando..." : "Guardar y Desplegar IA"}
                                </button>
                            </div>
                        </div>

                        {/* Leader Assignments */}
                        <div className="bg-gray-50 p-3 rounded-md mb-4">
                            <h4 className="font-semibold text-gray-700 mb-2">Roles de Liderazgo (Servicio Completo)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                {LEADER_ROLES.map(role => {
                                    const assignedStudentNre = Object.keys(serviceAssignments).find(nre => serviceAssignments[nre] === role);
                                    return (
                                        <div key={role}>
                                            <label className="text-xs font-medium text-gray-600">{role}</label>
                                            <select value={assignedStudentNre || "Sin asignar"} onChange={e => handlePlanningChange(service.id, e.target.value, role, null)} className="w-full text-sm p-1.5 border rounded-md bg-white">
                                                <option value="Sin asignar">Sin asignar</option>
                                                {students.map(s => <option key={s.nre} value={s.nre}>{s.nombre} {s.apellido1}</option>)}
                                            </select>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Group/Partida Assignments */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {serviceGroups.map(groupName => {
                                const studentsInGroup = students.filter(s => studentGroupAssignments[s.nre] === groupName);
                                
                                const rolesAssignedInGroup = Object.values(serviceAssignments).filter(role => {
                                  const assigneeNre = Object.keys(serviceAssignments).find(nre => serviceAssignments[nre] === role);
                                  return studentsInGroup.some(s => s.nre === assigneeNre);
                                });

                                return (
                                    <div key={groupName} className="bg-blue-50 p-3 rounded-md border-l-4 border-blue-400">
                                        <h5 className="font-bold text-blue-800 mb-2">{groupName}</h5>
                                        <div className="space-y-2">
                                            {studentsInGroup.map(student => {
                                                const currentRole = serviceAssignments[student.nre] || "Sin asignar";
                                                const availableRoles = SECONDARY_ROLES.filter(r => !rolesAssignedInGroup.includes(r));
                                                return (
                                                    <div key={student.nre} className="flex items-center justify-between">
                                                        <span className="text-sm font-medium text-gray-700 w-2/5 truncate">{student.nombre} {student.apellido1}</span>
                                                        <select
                                                            value={currentRole}
                                                            onChange={e => handlePlanningChange(service.id, student.nre, e.target.value, groupName)}
                                                            className="w-3/5 text-sm p-1 border rounded-md"
                                                            disabled={LEADER_ROLES.includes(currentRole)}
                                                        >
                                                            <option value="Sin asignar">Sin asignar</option>
                                                            {currentRole !== "Sin asignar" && !availableRoles.includes(currentRole) && <option value={currentRole}>{currentRole}</option>}
                                                            {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                                                        </select>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                         {serviceGroups.length === 0 && <p className="text-center text-gray-500 italic py-4">No hay grupos asignados a este servicio.</p>}
                    </div>
                )
            })}
        </div>
    );
};


const PartidasYGruposTab: React.FC<{
  students: Student[];
  practicaGroups: string[];
  setPracticaGroups: React.Dispatch<React.SetStateAction<string[]>>;
  studentGroupAssignments: StudentGroupAssignments;
  setStudentGroupAssignments: React.Dispatch<React.SetStateAction<StudentGroupAssignments>>;
  groupColors: Record<string, string>;
  setGroupColors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleDeleteGroup: (groupName: string) => void;
}> = ({ students, practicaGroups, setPracticaGroups, studentGroupAssignments, setStudentGroupAssignments, groupColors, setGroupColors, handleDeleteGroup }) => {
  const [filter, setFilter] = useState('');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const handleAssignmentChange = (studentNre: string, group: string) => {
    setStudentGroupAssignments(prev => ({ ...prev, [studentNre]: group }));
  };

  const handleRemoveFromGroup = (studentNre: string) => {
    const student = students.find(s => s.nre === studentNre);
    const studentName = student ? `${student.nombre} ${student.apellido1}` : 'este alumno';
    if (window.confirm(`¿Estás seguro de que quieres quitar a ${studentName} de su grupo actual?`)) {
        setStudentGroupAssignments(prev => {
            const newAssignments = { ...prev };
            delete newAssignments[studentNre];
            return newAssignments;
        });
    }
  };


  const handleAddNewGroup = () => {
    const newGroupName = `Grupo ${practicaGroups.length + 1}`;
    const newColor = COLOR_PALETTE[practicaGroups.length % COLOR_PALETTE.length];
    setPracticaGroups(prev => [...prev, newGroupName]);
    setGroupColors(prev => ({ ...prev, [newGroupName]: newColor }));
  };

  const handlePrintGroups = () => {
    let html = '';
    practicaGroups.forEach(group => {
        const members = students.filter(s => studentGroupAssignments[s.nre] === group);
        html += `
            <div style="margin-bottom: 2rem; break-inside: avoid;">
                <h3 style="font-size: 1.25rem; font-weight: bold;">${group} (${members.length} miembros)</h3>
                ${members.length > 0 ? `
                    <table style="margin-top: 0.5rem;">
                        <thead><tr><th>Nombre</th><th>Apellidos</th></tr></thead>
                        <tbody>
                            ${members.map(m => `<tr><td>${m.nombre}</td><td>${m.apellido1} ${m.apellido2}</td></tr>`).join('')}
                        </tbody>
                    </table>
                ` : '<p>No hay alumnos en este grupo.</p>'}
            </div>
        `;
    });
    printContent('Distribución de Grupos de Prácticas', html);
    setIsExportMenuOpen(false);
  };
  
  const handleExportExcelGroups = () => {
    const dataToExport: any[] = [];
    practicaGroups.forEach(group => {
        const members = students.filter(s => studentGroupAssignments[s.nre] === group);
        if (members.length > 0) {
            members.forEach(m => {
                dataToExport.push({
                    'Grupo': group,
                    'Nombre': m.nombre,
                    'Apellidos': `${m.apellido1} ${m.apellido2}`,
                    'NRE': m.nre
                });
            });
        } else {
             dataToExport.push({ 'Grupo': group, 'Nombre': 'Sin alumnos', 'Apellidos': '', 'NRE': '' });
        }
    });
    exportToExcel(dataToExport, 'distribucion_grupos', 'Grupos');
    setIsExportMenuOpen(false);
  };


  const filteredStudents = useMemo(() => students.filter(student =>
      `${student.nombre} ${student.apellido1}`.toLowerCase().includes(filter.toLowerCase())), 
    [students, filter]);

  return (
    <div>
        <div className="flex justify-between items-center mb-4">
            <h4 className="text-xl font-bold text-gray-800">Distribución de Grupos y Alumnos</h4>
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
                        <button onClick={handlePrintGroups} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Imprimir Grupos</button>
                        <button onClick={handleExportExcelGroups} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Exportar a Excel</button>
                    </div>
                )}
            </div>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-3/5 lg:pr-8 md:border-r md:border-gray-200">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Alumnos y Participación</h4>
                <input type="text" placeholder="Buscar alumno..." value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-teal-500"/>
                <div className="bg-white p-2 sm:p-4 rounded-lg shadow-md space-y-4 max-h-[60vh] overflow-y-auto">
                {filteredStudents.map(student => {
                    const studentGroup = studentGroupAssignments[student.nre];
                    const studentColorName = studentGroup ? groupColors[studentGroup] : 'default';
                    const studentColorStyle = colorStyles[studentColorName] || colorStyles.default;

                    return (
                    <div key={student.nre} className={`border-b pb-4 last:border-b-0 border-l-4 p-2 rounded-r-md ${studentColorStyle.border}`}>
                        <div className="flex items-center space-x-4">
                        <img src={student.photoUrl || `https://i.pravatar.cc/150?u=${student.nre}`} alt="" className="h-12 w-12 rounded-full flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{student.nombre} {student.apellido1}</p>
                            <p className="text-sm text-gray-500">{student.grupo}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <select value={studentGroupAssignments[student.nre] || ''} onChange={(e) => handleAssignmentChange(student.nre, e.target.value)} className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500">
                            <option value="" disabled>Sin grupo</option>
                            {practicaGroups.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                            <button onClick={() => handleRemoveFromGroup(student.nre)} title="Quitar de cualquier grupo" className="text-gray-400 hover:text-red-600"><TrashIcon className="h-5 w-5" /></button>
                        </div>
                        </div>
                    </div>
                )})}
                {filteredStudents.length === 0 && (<p className="text-center text-gray-500 py-8">No se encontraron alumnos.</p>)}
                </div>
            </div>
            <div className="w-full md:w-2/5">
                <div className="flex justify-between items-center mb-4 gap-4">
                    <h4 className="text-lg font-semibold text-gray-800">Vista de Grupos</h4>
                    <button onClick={handleAddNewGroup} className="bg-teal-500 text-white font-bold text-sm px-3 py-1.5 rounded-md hover:bg-teal-600">Añadir Grupo</button>
                </div>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {practicaGroups.map((group) => {
                    const members = students.filter(s => studentGroupAssignments[s.nre] === group);
                    const colorName = groupColors[group] || 'default';
                    const { border: borderColor, bg: bgColor } = colorStyles[colorName] || colorStyles.default;
                    return (
                    <div key={group} className={`p-4 rounded-lg shadow-md border-l-4 ${borderColor} ${bgColor}`}>
                        <div className="flex items-center justify-between mb-3">
                            <h5 className="font-bold text-gray-800">{group} ({members.length} miembros)</h5>
                            <button onClick={() => handleDeleteGroup(group)} title={`Eliminar grupo ${group}`} className="text-gray-400 hover:text-red-600">
                                <TrashIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="space-y-2">
                        {members.length > 0 ? members.map(member => (
                            <div key={member.nre} className="flex items-center justify-between bg-white p-2 rounded-md shadow-sm">
                            <div className="flex items-center space-x-2 min-w-0">
                                <img src={member.photoUrl || `https://i.pravatar.cc/150?u=${member.nre}`} alt="" className="h-8 w-8 rounded-full flex-shrink-0" />
                                <span className="text-sm font-medium truncate">{member.nombre} {member.apellido1}</span>
                            </div>
                            <button onClick={() => handleRemoveFromGroup(member.nre)} title="Quitar del grupo" className="text-gray-400 hover:text-red-500 ml-2"><CloseIcon className="h-4 w-4" /></button>
                            </div>
                        )) : <p className="text-sm text-gray-500 italic">No hay alumnos en este grupo.</p>}
                        </div>
                    </div>
                    );
                })}
                </div>
            </div>
        </div>
    </div>
  );
};


// --- MAIN VIEW COMPONENT ---

type PracticaTab = 'Partidas y Grupos' | 'Configuración' | 'Servicios' | 'Planning';

interface GestionPracticaViewProps {
  students: Student[];
}

const GestionPracticaView: React.FC<GestionPracticaViewProps> = ({ students }) => {
  const [activeTab, setActiveTab] = useState<PracticaTab>('Partidas y Grupos');
  
  // State for group management
  const [practicaGroups, setPracticaGroups] = useState<string[]>(() => safeJsonParse('practicaGroups', ["Grupo 1", "Grupo 2", "Grupo 3", "Grupo 4"]));
  const [studentGroupAssignments, setStudentGroupAssignments] = useState<StudentGroupAssignments>(() => safeJsonParse('studentGroupAssignments', {}));
  const [groupColors, setGroupColors] = useState<Record<string, string>>(() => safeJsonParse('groupColors', {}));

  // State for services and planning
  const [services, setServices] = useState<Service[]>(() => safeJsonParse('practicaServices', []));
  const [planningAssignments, setPlanningAssignments] = useState<PlanningAssignments>(() => safeJsonParse('planningAssignments', {}));

  // Automatic saving effects
  useEffect(() => { localStorage.setItem('practicaServices', JSON.stringify(services)); }, [services]);
  useEffect(() => { localStorage.setItem('planningAssignments', JSON.stringify(planningAssignments)); }, [planningAssignments]);
  useEffect(() => { localStorage.setItem('practicaGroups', JSON.stringify(practicaGroups)); }, [practicaGroups]);
  useEffect(() => { localStorage.setItem('studentGroupAssignments', JSON.stringify(studentGroupAssignments)); }, [studentGroupAssignments]);
  useEffect(() => { localStorage.setItem('groupColors', JSON.stringify(groupColors)); }, [groupColors]);

  // Effect to clean up assignments if students are deleted from the main list
  useEffect(() => {
    const studentNreSet = new Set(students.map(s => s.nre));

    setStudentGroupAssignments(prev => {
        const newAssignments = {...prev};
        let changed = false;
        for (const nre in newAssignments) {
            if (!studentNreSet.has(nre)) {
                delete newAssignments[nre];
                changed = true;
            }
        }
        return changed ? newAssignments : prev;
    });

    setPlanningAssignments(prev => {
        const newAssignments = JSON.parse(JSON.stringify(prev));
        let changed = false;
        for (const serviceId in newAssignments) {
            for (const nre in newAssignments[serviceId]) {
                if (!studentNreSet.has(nre)) {
                    delete newAssignments[serviceId][nre];
                    changed = true;
                }
            }
        }
        return changed ? newAssignments : prev;
    });

  }, [students]);

  const handleDeleteService = useCallback((serviceId: string) => {
    if (window.confirm("¿Seguro que quieres eliminar este servicio? Esta acción también borrará todas las asignaciones de roles asociadas.")) {
        setServices(prevServices => prevServices.filter(s => s.id !== serviceId));
        setPlanningAssignments(prevAssignments => {
            const newAssignments = { ...prevAssignments };
            if (newAssignments[serviceId]) {
                delete newAssignments[serviceId];
            }
            return newAssignments;
        });
    }
  }, [setServices, setPlanningAssignments]);

  const handleDeleteGroup = useCallback((groupToDelete: string) => {
      if (window.confirm(`¿Estás seguro de que quieres eliminar el grupo "${groupToDelete}"? Los alumnos asignados pasarán a "Sin grupo" y el grupo se eliminará de todos los servicios.`)) {
          
          setStudentGroupAssignments(prev => {
              const newAssignments = { ...prev };
              Object.keys(newAssignments).forEach(nre => {
                  if (newAssignments[nre] === groupToDelete) {
                      delete newAssignments[nre];
                  }
              });
              return newAssignments;
          });

          setServices(prev => 
              prev.map(service => {
                  const newComedor = service.groupAssignments.comedor.filter(g => g !== groupToDelete);
                  const newTakeaway = service.groupAssignments.takeaway.filter(g => g !== groupToDelete);
                  if (newComedor.length < service.groupAssignments.comedor.length || newTakeaway.length < service.groupAssignments.takeaway.length) {
                      return { ...service, groupAssignments: { comedor: newComedor, takeaway: newTakeaway } };
                  }
                  return service;
              })
          );

          setPracticaGroups(prev => prev.filter(g => g !== groupToDelete));
          
          setGroupColors(prev => {
              const newColors = { ...prev };
              delete newColors[groupToDelete];
              return newColors;
          });
      }
  }, [setStudentGroupAssignments, setServices, setPracticaGroups, setGroupColors]);
  
  // Ensure initial colors are set for existing groups
  useEffect(() => {
    let updated = false;
    const newColors = { ...groupColors };
    practicaGroups.forEach((group, index) => {
        if (!newColors[group]) {
            newColors[group] = COLOR_PALETTE[index % COLOR_PALETTE.length];
            updated = true;
        }
    });
    if (updated) {
        setGroupColors(newColors);
    }
  }, [practicaGroups, groupColors]);


  const renderContent = () => {
    switch (activeTab) {
      case 'Partidas y Grupos':
        return <PartidasYGruposTab 
                    students={students} 
                    practicaGroups={practicaGroups} 
                    setPracticaGroups={setPracticaGroups} 
                    studentGroupAssignments={studentGroupAssignments} 
                    setStudentGroupAssignments={setStudentGroupAssignments}
                    groupColors={groupColors}
                    setGroupColors={setGroupColors}
                    handleDeleteGroup={handleDeleteGroup}
                />;
      case 'Configuración':
        return <ConfiguracionTab services={services} setServices={setServices} handleDeleteService={handleDeleteService} />;
      case 'Servicios':
        return <ServiciosTab services={services} setServices={setServices} practicaGroups={practicaGroups} planningAssignments={planningAssignments} students={students}/>;
      case 'Planning':
        return <PlanningTab services={services} students={students} studentGroupAssignments={studentGroupAssignments} planningAssignments={planningAssignments} setPlanningAssignments={setPlanningAssignments} />;
      default:
        return null;
    }
  };

  const tabs: { name: PracticaTab, icon: React.ReactNode }[] = [
    { name: 'Partidas y Grupos', icon: <GroupIcon className="h-5 w-5 mr-2" /> },
    { name: 'Configuración', icon: <CogIcon className="h-5 w-5 mr-2" /> },
    { name: 'Servicios', icon: <ServiceIcon className="h-5 w-5 mr-2" /> },
    { name: 'Planning', icon: <CalendarIcon className="h-5 w-5 mr-2" /> },
  ];

  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestión Práctica</h1>
        <p className="mt-2 text-gray-600">Organice y supervise las actividades prácticas del programa de cocina.</p>
      </header>
      
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
          {tabs.map(tab => (
            <button key={tab.name} onClick={() => setActiveTab(tab.name)} className={`flex items-center flex-shrink-0 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.name ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              {tab.icon}
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      <div>
        {renderContent()}
      </div>
    </div>
  );
};

export default GestionPracticaView;