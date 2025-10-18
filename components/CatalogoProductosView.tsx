import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Product } from '../types';
import { PRODUCT_CATEGORIES, PRODUCT_UNITS, ALLERGENS } from '../constants';
import { PlusIcon, PencilIcon, TrashIcon, UploadIcon, DownloadIcon, CheckIcon, XIcon } from './icons';

// Simple UUID generator
const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
};

const EMPTY_PRODUCT: Omit<Product, 'id'> = {
    name: '',
    category: PRODUCT_CATEGORIES[0],
    price: 0,
    unit: PRODUCT_UNITS[0],
    allergens: [],
};

const CatalogoProductosView: React.FC = () => {
    const [products, setProducts] = useState<Product[]>(() => {
        try {
            const saved = localStorage.getItem('cocina-catalogo-productos');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to parse products from localStorage", e);
            return [];
        }
    });

    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState<Omit<Product, 'id'>>(EMPTY_PRODUCT);
    const [searchTerm, setSearchTerm] = useState('');
    const [stagedForImport, setStagedForImport] = useState<{ fileName: string; products: Product[] } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        localStorage.setItem('cocina-catalogo-productos', JSON.stringify(products));
    }, [products]);

    useEffect(() => {
        if (editingProduct) {
            setFormData({
                name: editingProduct.name,
                category: editingProduct.category,
                price: editingProduct.price,
                unit: editingProduct.unit,
                allergens: editingProduct.allergens,
            });
        } else {
            setFormData(EMPTY_PRODUCT);
        }
    }, [editingProduct]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'price' ? parseFloat(value) : value }));
    };

    const handleAllergenChange = (allergen: string) => {
        setFormData(prev => {
            const newAllergens = prev.allergens.includes(allergen)
                ? prev.allergens.filter(a => a !== allergen)
                : [...prev.allergens, allergen];
            return { ...prev, allergens: newAllergens };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || formData.price <= 0) {
            alert('Por favor, complete el nombre y un precio válido.');
            return;
        }

        if (editingProduct) {
            // Edit existing product
            setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...formData, id: p.id } : p));
        } else {
            // Add new product
            if (products.some(p => p.name.toLowerCase() === formData.name.trim().toLowerCase())) {
                alert('Ya existe un producto con este nombre.');
                return;
            }
            const newProduct: Product = { ...formData, id: uuidv4(), name: formData.name.trim() };
            setProducts(prev => [newProduct, ...prev]);
        }
        setEditingProduct(null);
    };

    const handleCancelEdit = () => {
        setEditingProduct(null);
    };

    const handleDeleteProduct = (productId: string) => {
        const productToDelete = products.find(p => p.id === productId);
        if (productToDelete && window.confirm(`¿Seguro que quieres eliminar "${productToDelete.name}"?`)) {
            setProducts(prev => prev.filter(p => p.id !== productId));
        }
    };
    
    const handleImportJson = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target?.result as string);
                if (!Array.isArray(imported)) throw new Error("JSON must be an array.");

                const newProducts: Product[] = [];
                const existingNames = new Set(products.map(p => p.name.toLowerCase()));

                for (const item of imported) {
                    if (item.name && item.category && typeof item.price === 'number' && item.unit && Array.isArray(item.allergens)) {
                         if (!existingNames.has(item.name.toLowerCase())) {
                            newProducts.push({ ...item, id: uuidv4() });
                            existingNames.add(item.name.toLowerCase());
                         }
                    }
                }
                
                if(newProducts.length > 0) {
                    setStagedForImport({ fileName: file.name, products: newProducts });
                } else {
                    alert("No se encontraron nuevos productos válidos para importar en el archivo seleccionado.");
                }

            } catch (err) {
                 alert(`Error al procesar el archivo JSON: ${(err as Error).message}`);
            } finally {
                // Reset file input
                if(fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            }
        };
        reader.readAsText(file);
    };
    
    const handleConfirmImport = () => {
        if (stagedForImport) {
            setProducts(prev => [...prev, ...stagedForImport.products]);
            alert(`${stagedForImport.products.length} productos importados y guardados con éxito.`);
            setStagedForImport(null);
        }
    };

    const handleCancelImport = () => {
        setStagedForImport(null);
    };

    const handleExportJson = () => {
        const dataStr = JSON.stringify(products, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = 'catalogo_productos.json';

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const filteredProducts = useMemo(() => {
        return products
            .filter(p => 
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                p.category.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [products, searchTerm]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left Column: Form */}
            <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-md h-fit">
                <h3 className="text-xl font-bold text-gray-800 mb-6">{editingProduct ? `Editar Producto: ${editingProduct.name}` : 'Añadir Nuevo Producto'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre del Producto</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} required maxLength={100} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
                    </div>
                    
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Categoría</label>
                        <select name="category" id="category" value={formData.category} onChange={handleInputChange} required className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm">
                            {PRODUCT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700">Precio</label>
                            <input type="number" name="price" id="price" value={formData.price} onChange={handleInputChange} required min="0" step="0.01" className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
                        </div>
                         <div>
                            <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Unidad</label>
                            <select name="unit" id="unit" value={formData.unit} onChange={handleInputChange} required className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm">
                                {PRODUCT_UNITS.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Alérgenos</label>
                        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 border p-3 rounded-md max-h-40 overflow-y-auto">
                            {ALLERGENS.map(allergen => (
                                <label key={allergen} className="flex items-center text-sm">
                                    <input type="checkbox" checked={formData.allergens.includes(allergen)} onChange={() => handleAllergenChange(allergen)} className="h-4 w-4 text-teal-600 border-gray-300 rounded"/>
                                    <span className="ml-2">{allergen}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-end space-x-4 pt-4">
                        {editingProduct && (
                             <button type="button" onClick={handleCancelEdit} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">
                                Cancelar
                            </button>
                        )}
                        <button type="submit" className="px-4 py-2 bg-teal-500 text-white font-bold rounded-md hover:bg-teal-600">
                            {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Right Column: List */}
            <div className="lg:col-span-2">
                <div className="bg-white p-4 rounded-lg shadow-md">
                     <h3 className="text-xl font-bold text-gray-800 mb-4">Listado del Catálogo ({products.length})</h3>
                     <div className="flex flex-col sm:flex-row gap-2 mb-4">
                        <input type="text" placeholder="Buscar por nombre o categoría..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md"/>
                     </div>
                     <div className="flex flex-col sm:flex-row gap-2 mb-4">
                        <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex justify-center items-center gap-2 p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm disabled:bg-gray-400 disabled:cursor-not-allowed" disabled={!!stagedForImport}>
                            <UploadIcon className="h-4 w-4 mr-2"/> Subir JSON
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleImportJson} accept=".json" className="hidden" />

                        <button onClick={handleExportJson} className="flex-1 flex justify-center items-center gap-2 p-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm">
                             <DownloadIcon className="h-4 w-4 mr-2"/> Exportar Catálogo
                        </button>
                    </div>

                    {stagedForImport && (
                        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
                            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg transform transition-all">
                                <div className="p-6 border-b border-gray-200">
                                    <h3 className="text-xl font-bold text-gray-800">Confirmar Importación</h3>
                                </div>
                                <div className="p-6 space-y-2">
                                    <p className="text-gray-700">
                                        El archivo <span className="font-semibold text-blue-600">{stagedForImport.fileName}</span> ha sido procesado.
                                    </p>
                                    <p className="text-lg">
                                        Se encontraron <span className="font-bold text-teal-600">{stagedForImport.products.length}</span> nuevos productos para añadir al catálogo.
                                    </p>
                                    <p className="mt-2 text-sm text-gray-500">
                                        Los productos existentes con el mismo nombre serán ignorados. ¿Deseas guardar estos cambios?
                                    </p>
                                </div>
                                <div className="bg-gray-50 p-4 flex justify-end items-center space-x-4 rounded-b-lg">
                                    <button onClick={handleCancelImport} className="flex items-center gap-1 px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 font-semibold">
                                        <XIcon className="h-5 w-5 mr-1" />
                                        Cancelar
                                    </button>
                                    <button onClick={handleConfirmImport} className="flex items-center gap-1 px-6 py-2 bg-teal-500 text-white font-bold rounded-md hover:bg-teal-600">
                                        <CheckIcon className="h-5 w-5 mr-1" />
                                        Guardar Cambios
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="overflow-auto max-h-[60vh]">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2">Producto</th>
                                    <th className="px-4 py-2">Precio</th>
                                    <th className="px-4 py-2">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map(p => (
                                    <tr key={p.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-4 py-2 font-medium text-gray-900">
                                            {p.name}
                                            <div className="text-xs text-gray-500 font-normal">{p.category}</div>
                                            <div className="text-xs text-gray-400 font-normal italic">{p.allergens.length > 0 ? p.allergens.join(', ') : 'Ninguno'}</div>
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap">€{p.price.toFixed(2)} / {p.unit}</td>
                                        <td className="px-4 py-2">
                                            <div className="flex space-x-2">
                                                <button onClick={() => setEditingProduct(p)} title="Editar"><PencilIcon className="h-5 w-5 text-blue-500 hover:text-blue-700"/></button>
                                                <button onClick={() => handleDeleteProduct(p.id)} title="Eliminar"><TrashIcon className="h-5 w-5 text-red-500 hover:text-red-700"/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                 {filteredProducts.length === 0 && (
                                    <tr><td colSpan={3} className="text-center py-4">No se encontraron productos.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CatalogoProductosView;