import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FullRecipe, Product } from '../types';
import { RECIPE_CATEGORIES } from '../constants';
import { BackIcon, CheckIcon, PhotoIcon, TrashIcon } from './icons';
import { uuidv4 } from '../utils';

const MOCK_CURRENT_USER = { email: 'profesor@example.com' };

interface RecipeFormViewProps {
    initialRecipe?: FullRecipe;
    products: Product[];
    onSave: (recipe: FullRecipe) => void;
    onCancel: () => void;
}

const getBlankRecipe = (): FullRecipe => ({
    id: uuidv4(),
    name: '',
    category: RECIPE_CATEGORIES[0],
    authorEmail: MOCK_CURRENT_USER.email,
    isPublic: false,
    yield: '1 raciones',
    ingredients: [],
    elaboration: [],
    serviceDetails: {},
});

const ToggleSwitch: React.FC<{ checked: boolean, onChange: (checked: boolean) => void, label: string }> = ({ checked, onChange, label }) => (
    <label className="flex items-center cursor-pointer">
        <div className="relative">
            <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <div className={`block w-14 h-8 rounded-full ${checked ? 'bg-teal-500' : 'bg-gray-300'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${checked ? 'transform translate-x-6' : ''}`}></div>
        </div>
        <div className="ml-3 text-gray-700 font-medium">{label}</div>
    </label>
);

const RecipeFormView: React.FC<RecipeFormViewProps> = ({ initialRecipe, products, onSave, onCancel }) => {
    const [formData, setFormData] = useState<FullRecipe>(getBlankRecipe());
    const [yieldValue, setYieldValue] = useState(1);
    const [yieldUnit, setYieldUnit] = useState('raciones');
    const [localCategories, setLocalCategories] = useState(RECIPE_CATEGORIES);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const photoInputRef = useRef<HTMLInputElement>(null);

    const isEditMode = useMemo(() => !!initialRecipe, [initialRecipe]);

    useEffect(() => {
        if (initialRecipe) {
            setFormData(initialRecipe);
            const yieldMatch = initialRecipe.yield.match(/^(\d*[\.,]?\d+)\s*(.*)/);
            if (yieldMatch) {
                setYieldValue(parseFloat(yieldMatch[1].replace(',', '.')) || 1);
                setYieldUnit(yieldMatch[2] || 'raciones');
            }
        } else {
            setFormData(getBlankRecipe());
        }
    }, [initialRecipe]);

    const handleBasicInfoChange = (field: keyof FullRecipe, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === '__add_new__') {
            setIsAddingCategory(true);
        } else {
            setIsAddingCategory(false);
            handleBasicInfoChange('category', value);
        }
    };
    
    const handleAddNewCategory = () => {
        if (newCategory.trim() && !localCategories.includes(newCategory.trim())) {
            const newCat = newCategory.trim();
            setLocalCategories(prev => [...prev, newCat]);
            handleBasicInfoChange('category', newCat);
            setNewCategory('');
            setIsAddingCategory(false);
        }
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                handleBasicInfoChange('photoUrl', event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFormSubmit = () => {
        if (!formData.name.trim()) {
            alert("El nombre del plato es obligatorio.");
            return;
        }
        const finalRecipe = {
            ...formData,
            yield: `${yieldValue} ${yieldUnit}`.trim(),
        };
        onSave(finalRecipe);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <button onClick={onCancel} className="flex items-center text-gray-600 hover:text-gray-800 font-semibold">
                    <BackIcon className="h-5 w-5 mr-2" /> Cancelar
                </button>
                <h2 className="text-xl font-bold text-gray-700">{isEditMode ? 'Editando Ficha Técnica' : 'Nueva Ficha Técnica'}</h2>
                <button onClick={handleFormSubmit} className="flex items-center gap-2 px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 font-bold">
                    <CheckIcon className="h-5 w-5" /> Guardar
                </button>
            </div>
            
            {/* Form Body */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* --- INFORMACIÓN BÁSICA --- */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Información Básica</h3>
                        <div className="space-y-4">
                            <ToggleSwitch
                                label="Hacer Pública"
                                checked={formData.isPublic}
                                onChange={checked => handleBasicInfoChange('isPublic', checked)}
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nombre del Plato</label>
                                <input type="text" value={formData.name} onChange={e => handleBasicInfoChange('name', e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Categoría</label>
                                    <select value={isAddingCategory ? '__add_new__' : formData.category} onChange={handleCategoryChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                                        {localCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                        <option value="__add_new__">Añadir nueva categoría...</option>
                                    </select>
                                    {isAddingCategory && (
                                        <div className="mt-2 flex gap-2">
                                            <input type="text" placeholder="Nueva categoría" value={newCategory} onChange={e => setNewCategory(e.target.value)} className="flex-1 p-2 border border-gray-300 rounded-md text-sm" />
                                            <button type="button" onClick={handleAddNewCategory} className="px-3 bg-teal-500 text-white rounded-md text-sm font-bold">Añadir</button>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Rendimiento</label>
                                        <input type="number" value={yieldValue} onChange={e => setYieldValue(parseFloat(e.target.value) || 0)} min="0" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                                    </div>
                                     <div>
                                        <label className="block text-sm font-medium text-gray-700">Unidad</label>
                                        <input type="text" value={yieldUnit} onChange={e => setYieldUnit(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                                    </div>
                                </div>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Foto del plato</label>
                                <div className="mt-1 flex items-center gap-4">
                                    <div className="w-32 h-32 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                                        {formData.photoUrl ? (
                                            <img src={formData.photoUrl} alt="Vista previa" className="w-full h-full object-cover"/>
                                        ) : <PhotoIcon className="h-12 w-12 text-gray-400" />}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button type="button" onClick={() => photoInputRef.current?.click()} className="px-4 py-2 bg-gray-200 text-sm font-semibold text-gray-800 rounded-md hover:bg-gray-300">Seleccionar Imagen</button>
                                        {formData.photoUrl && <button type="button" onClick={() => handleBasicInfoChange('photoUrl', undefined)} className="flex items-center justify-center gap-1 px-4 py-2 bg-red-50 text-sm font-semibold text-red-600 rounded-md hover:bg-red-100"><TrashIcon className="h-4 w-4" /> Quitar</button>}
                                        <input type="file" ref={photoInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden"/>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Placeholder for Ingredients */}
                     <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Ingredientes</h3>
                         <div className="text-center py-8 bg-gray-50 rounded-md">
                             <p className="text-gray-500">La gestión de ingredientes se implementará aquí.</p>
                         </div>
                    </div>
                     {/* Placeholder for Elaboration */}
                     <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Elaboración y Detalles</h3>
                        <div className="text-center py-8 bg-gray-50 rounded-md">
                           <p className="text-gray-500">Los pasos de elaboración y servicio se gestionarán aquí.</p>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-1 space-y-6">
                     <div className="bg-white p-6 rounded-lg shadow-md sticky top-6">
                        <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Análisis en Tiempo Real</h3>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-gray-600">Análisis de Coste</h4>
                                <div className="text-center py-4 mt-2 bg-gray-50 rounded-md">
                                    <p className="text-sm text-gray-500">Se actualizará al añadir ingredientes.</p>
                                </div>
                            </div>
                             <div>
                                <h4 className="font-semibold text-gray-600">Alérgenos Detectados</h4>
                                <div className="text-center py-4 mt-2 bg-gray-50 rounded-md">
                                    <p className="text-sm text-gray-500">Se actualizará al añadir ingredientes.</p>
                                </div>
                            </div>
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default RecipeFormView;
