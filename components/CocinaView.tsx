import React, { useState, useEffect } from 'react';
import { CocinaSubView, Product } from '../types';
import CatalogoProductosView from './CatalogoProductosView';
import MiRecetarioView from './MiRecetarioView';
import { INITIAL_PRODUCTS } from '../constants';
import { BookOpenIcon, ShoppingCartIcon, UsersIcon } from './icons';

const safeJsonParse = <T,>(key: string, defaultValue: T): T => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error parsing JSON from localStorage key "${key}":`, error);
        return defaultValue;
    }
};

const CocinaView: React.FC = () => {
  const [activeSubView, setActiveSubView] = useState<CocinaSubView>('Mi Recetario');
  
  const [products, setProducts] = useState<Product[]>(() => safeJsonParse('cocina-catalogo-productos', INITIAL_PRODUCTS));

  useEffect(() => {
    localStorage.setItem('cocina-catalogo-productos', JSON.stringify(products));
  }, [products]);


  const renderContent = () => {
    switch (activeSubView) {
      case 'Productos':
        return <CatalogoProductosView products={products} setProducts={setProducts} />;
      case 'Mi Recetario':
        return <MiRecetarioView products={products} setProducts={setProducts} />;
      case 'Pedidos':
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

  const subNavItems: { name: CocinaSubView, icon: React.ReactNode }[] = [
      { name: 'Productos', icon: <UsersIcon className="h-5 w-5 mr-2" /> },
      { name: 'Mi Recetario', icon: <BookOpenIcon className="h-5 w-5 mr-2" /> },
      { name: 'Pedidos', icon: <ShoppingCartIcon className="h-5 w-5 mr-2" /> },
  ];

  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Módulo de Cocina</h1>
        <p className="mt-2 text-gray-600">Gestión centralizada de productos, recetas y pedidos.</p>
      </header>
      
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
          {subNavItems.map(item => (
            <button
              key={item.name}
              onClick={() => setActiveSubView(item.name)}
              className={`flex items-center flex-shrink-0 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeSubView === item.name
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {item.icon}
              {item.name}
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
