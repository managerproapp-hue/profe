import React from 'react';
import { CloseIcon } from './icons';
import { Service } from '../types';

interface FichaServicioModalProps {
  service: Service | null;
  onClose: () => void;
  onSave: (updatedService: Service) => void;
}

const FichaServicioModal: React.FC<FichaServicioModalProps> = ({ service, onClose, onSave }) => {
  if (!service) return null;

  // This is a placeholder component. In a real app, you'd have state and handlers.
  const handleSave = () => {
    // Logic to save changes
    onSave(service); 
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl transform transition-all flex flex-col max-h-[95vh]">
        <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-white rounded-t-xl flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-800">Ficha de Servicio: {service.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full bg-gray-100 hover:bg-gray-200">
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
            <h3 className="font-bold text-yellow-800">Componente en Construcción</h3>
            <p className="text-sm text-yellow-700 mt-1">La funcionalidad completa para editar servicios se implementará aquí.</p>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold">Detalles del Servicio</h3>
            <p><strong>Nombre:</strong> {service.name}</p>
            <p><strong>Fecha:</strong> {new Date(service.date).toLocaleDateString()}</p>
            <p><strong>Trimestre:</strong> {service.trimestre}</p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 flex justify-end items-center space-x-4 rounded-b-lg">
          <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors">
            Cancelar
          </button>
          <button type="button" onClick={handleSave} className="px-6 py-2 bg-teal-500 text-white font-bold rounded-md hover:bg-teal-600 transition-colors">
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

export default FichaServicioModal;
