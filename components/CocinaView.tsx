import React, { useState } from 'react';
import { CocinaSubView } from '../types';
import CatalogoProductosView from './CatalogoProductosView';
import MiRecetarioView from './MiRecetarioView';

const CocinaView: React.FC = () => {
  const [activeSubView, setActiveSubView] = useState<CocinaSubView>('Productos');

  const renderContent = () => {
    switch (activeSubView) {
      case 'Productos':
        return <CatalogoProductosView />;
      case 'Mi Recetario':
        return <MiRecetarioView />;
      case 'Pedidos':
      case 'Creación de Menús':
        return (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <h2 className="text-2xl font-bold text-gray-800">{activeSubView}</h2>
            <p className="mt-4 text-gray-600">Esta sección está en construcción y estará disponible próximamente.</p>
          </div>
        );
      default:
        return null;
    }
  };

  const subNavItems: CocinaSubView[] = ['Productos', 'Mi Recetario', 'Pedidos', 'Creación de Menús'];

  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Módulo de Cocina</h1>
        <p className="mt-2 text-gray-600">Gestión centralizada de productos, pedidos, recetas y menús.</p>
      </header>
      
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
          {subNavItems.map(item => (
            <button
              key={item}
              onClick={() => setActiveSubView(item)}
              className={`flex-shrink-0 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeSubView === item
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {item}
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

export default CocinaView;
