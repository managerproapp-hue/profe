import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Recipe, Product, RecipeIngredient, RecipeStep, Elaboration } from '../types';
import { RAW_PRODUCTS, normalizeCategory, ALLERGENS, PRODUCT_UNITS, PRODUCT_CATEGORIES, RECIPE_CATEGORIES } from '../constants';
import { PencilIcon, CodeBracketIcon, PlusIcon, TrashIcon, BackIcon, UploadIcon, DownloadIcon, EyeIcon, CheckIcon, XIcon } from './icons';

// --- HELPER FUNCTIONS ---
const uuidv4 = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

const EMPTY_ELABORATION: Elaboration = { id: uuidv4(), name: 'Elaboración Principal', ingredients: [], steps: [{ id: uuidv4(), description: '' }] };
const EMPTY_RECIPE: Omit<Recipe, 'id' | 'authorId' | 'createdAt' | 'updatedAt'> = {
    name: '',
    category: RECIPE_CATEGORIES[0],
    servings: 1,
    description: '',
    serviceNotes: '',
    imageUrl: undefined,
    elaborations: [JSON.parse(JSON.stringify(EMPTY_ELABORATION))],
    visibility: 'private',
};

// --- SUB-COMPONENTS ---

const RecipeCard: React.FC<{ recipe: Recipe; onSelect: () => void; }> = ({ recipe, onSelect }) => (
    <div onClick={onSelect} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer flex flex-col overflow-hidden group">
        <div className="h-40 bg-gray-200 flex items-center justify-center overflow-hidden">
            {recipe.imageUrl ? (
                <img src={recipe.imageUrl} alt={recipe.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
            ) : (
                <KitchenIcon className="h-16 w-16 text-gray-400" />
            )}
        </div>
        <div className="p-4 flex-grow flex flex-col">
            <span className="text-xs font-semibold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full self-start">{recipe.category}</span>
            <h3 className="mt-2 font-bold text-gray-800 text-lg flex-grow">{recipe.name}</h3>
            <div className="mt-2 text-xs text-gray-500">
                {recipe.authorId === 'currentUser' ? 'Mía' : 'Pública'}
            </div>
        </div>
    </div>
);


const KitchenIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m-3-1l-3-1m3 1v5.25c0 .621-.504 1.125-1.125-1.125h-2.25c-.621 0-1.125-.504-1.125-1.125V10.5m0 0L12 9M12 9l-3 1m0 0l-4.5 1.636M12 9V3.545" /></svg>
);

const AddProductModal: React.FC<{
    initialName: string;
    onSave: (newProduct: Product) => void;
    onCancel: () => void;
}> = ({ initialName, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Omit<Product, 'id'>>({
        name: initialName,
        category: PRODUCT_CATEGORIES[0],
        price: 0,
        unit: 'kg',
        allergens: []
    });

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
        if (!formData.name.trim()) {
            alert('El nombre del producto no puede estar vacío.');
            return;
        }
        const newProduct: Product = { ...formData, id: uuidv4(), name: formData.name.trim() };
        onSave(newProduct);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl transform transition-all">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b">
                        <h3 className="text-xl font-bold text-gray-800">Crear Nuevo Producto</h3>
                    </div>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nombre del Producto</label>
                            <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Categoría</label>
                                <select name="category" value={formData.category} onChange={handleInputChange} required className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white">
                                    {PRODUCT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Unidad</label>
                                <select name="unit" value={formData.unit} onChange={handleInputChange} required className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white">
                                    {PRODUCT_UNITS.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                                </select>
                            </div>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Coste (Precio)</label>
                            <input type="number" name="price" value={formData.price} onChange={handleInputChange} required min="0" step="0.01" className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Alérgenos</label>
                            <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {ALLERGENS.map(allergen => (
                                    <label key={allergen} className="flex items-center text-sm">
                                        <input type="checkbox" checked={formData.allergens.includes(allergen)} onChange={() => handleAllergenChange(allergen)} className="h-4 w-4 rounded border-gray-300 text-teal-600"/>
                                        <span className="ml-2 text-gray-700">{allergen}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 p-4 flex justify-end gap-4">
                        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                        <button type="submit" className="px-6 py-2 bg-teal-500 text-white font-bold rounded-md hover:bg-teal-600">Crear y Añadir</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const RecipeFormView: React.FC<{
    initialRecipe: Recipe | null;
    products: Product[];
    recipeCategories: string[];
    onSave: (recipe: Omit<Recipe, 'id' | 'authorId' | 'createdAt' | 'updatedAt'>) => void;
    onCancel: () => void;
    onAddNewProduct: (newProduct: Product) => void;
}> = ({ initialRecipe, products, recipeCategories, onSave, onCancel, onAddNewProduct }) => {
    const [formData, setFormData] = useState<Omit<Recipe, 'id' | 'authorId' | 'createdAt' | 'updatedAt'>>(() => 
        initialRecipe 
            ? { ...initialRecipe } 
            : JSON.parse(JSON.stringify(EMPTY_RECIPE)) // Deep copy
    );
    
    const [ingredientSearch, setIngredientSearch] = useState<{ elabId: string; term: string }>({ elabId: '', term: '' });
    const [isAddingProduct, setIsAddingProduct] = useState<string | null>(null);
    const imageUploadRef = useRef<HTMLInputElement>(null);

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'servings' ? Math.max(1, parseInt(value)) : value }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => setFormData(prev => ({ ...prev, imageUrl: event.target?.result as string }));
            reader.readAsDataURL(file);
        }
    };
    
    const addElaboration = () => {
        const newElaboration = { id: uuidv4(), name: `Elaboración ${formData.elaborations.length + 1}`, ingredients: [], steps: [{id: uuidv4(), description: ''}] };
        setFormData(prev => ({ ...prev, elaborations: [...prev.elaborations, newElaboration] }));
    };

    const removeElaboration = (elabId: string) => {
        setFormData(prev => ({ ...prev, elaborations: prev.elaborations.filter(e => e.id !== elabId) }));
    };

    const updateElaboration = (elabId: string, field: keyof Elaboration, value: any) => {
        setFormData(prev => ({
            ...prev,
            elaborations: prev.elaborations.map(e => e.id === elabId ? { ...e, [field]: value } : e)
        }));
    };

    const addIngredient = (elabId: string, product: Product) => {
        const newIngredient: RecipeIngredient = { productId: product.id, quantity: 1, unit: product.unit };
        const newElaborations = formData.elaborations.map(e => {
            if (e.id === elabId) {
                if (e.ingredients.some(ing => ing.productId === product.id)) return e;
                return { ...e, ingredients: [...e.ingredients, newIngredient] };
            }
            return e;
        });
        setFormData(prev => ({...prev, elaborations: newElaborations}));
        setIngredientSearch({ elabId: '', term: '' });
    };

    const removeIngredient = (elabId: string, productId: string) => {
        const newElaborations = formData.elaborations.map(e => 
            e.id === elabId ? { ...e, ingredients: e.ingredients.filter(i => i