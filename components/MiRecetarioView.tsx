import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FullRecipe, Product } from '../types';
import { INITIAL_RECIPES, RECIPE_CATEGORIES } from '../constants';
import { SparklesIcon, PhotoIcon, DocumentTextIcon, CodeBracketIcon, PencilIcon } from './icons';
import { uuidv4 } from '../utils';
import RecipeDetailView from './RecipeDetailView';
import RecipeFormView from './RecipeFormView';

const MOCK_CURRENT_USER = { email: 'profesor@example.com' };

// --- Main View ---

interface MiRecetarioViewProps {
    products: Product[];
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const MiRecetarioView: React.FC<MiRecetarioViewProps> = ({ products, setProducts }) => {
    const [recipes, setRecipes] = useState<FullRecipe[]>(() => {
        const saved = localStorage.getItem('cocina-recetario');
        return saved ? JSON.parse(saved) : INITIAL_RECIPES;
    });

    useEffect(() => {
        localStorage.setItem('cocina-recetario', JSON.stringify(recipes));
    }, [recipes]);

    const [viewState, setViewState] = useState<{ mode: 'list' | 'detail' | 'form'; recipeId?: string }>({ mode: 'list' });

    // State for main list filters
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [scopeFilter, setScopeFilter] = useState('All'); // 'All', 'Mine', 'Public'

    const [isAiModalOpen, setIsAiModalOpen] = useState(false);

    const filteredRecipes = useMemo(() => {
        return recipes.filter(r => {
            const searchMatch = r.name.toLowerCase().includes(searchTerm.toLowerCase());
            const categoryMatch = categoryFilter === 'All' || r.category === categoryFilter;
            const scopeMatch = scopeFilter === 'All'
                || (scopeFilter === 'Mine' && r.authorEmail === MOCK_CURRENT_USER.email)
                || (scopeFilter === 'Public' && r.isPublic && r.authorEmail !== MOCK_CURRENT_USER.email);
            return searchMatch && categoryMatch && scopeMatch;
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [recipes, searchTerm, categoryFilter, scopeFilter]);


    const handleSaveRecipe = (recipeToSave: FullRecipe) => {
        const isNew = !recipes.some(r => r.id === recipeToSave.id);
        if (isNew) {
            setRecipes(prev => [recipeToSave, ...prev]);
        } else {
            setRecipes(prev => prev.map(r => r.id === recipeToSave.id ? recipeToSave : r));
        }
        setViewState({ mode: 'list' });
    }

    const handleDeleteRecipe = (recipeId: string) => {
        if (window.confirm("¿Seguro que quieres eliminar esta receta de forma permanente?")) {
            setRecipes(prev => prev.filter(r => r.id !== recipeId));
            setViewState({ mode: 'list' });
        }
    };
    
    const handleMakeMine = (recipeId: string) => {
        const originalRecipe = recipes.find(r => r.id === recipeId);
        if (!originalRecipe) return;

        const newRecipe: FullRecipe = {
            ...JSON.parse(JSON.stringify(originalRecipe)), // Deep copy
            id: uuidv4(),
            authorEmail: MOCK_CURRENT_USER.email,
            isPublic: false,
            name: `${originalRecipe.name} (Copia)`
        };
        
        setRecipes(prev => [newRecipe, ...prev]);
        setViewState({ mode: 'form', recipeId: newRecipe.id });
    };

    // Mock AI responses
    const handleGenerateWithAI = (prompt: string) => {
        console.log("Mock AI generation for:", prompt);
        const newRecipe: FullRecipe = {
            id: uuidv4(),
            name: `Receta de IA: ${prompt}`,
            category: 'Carnes',
            authorEmail: MOCK_CURRENT_USER.email,
            isPublic: false,
            yield: '4 raciones',
            ingredients: [{ productId: '', productName: 'Ingrediente de ejemplo', quantity: '100g' }],
            elaboration: [{ id: uuidv4(), description: 'Paso de elaboración generado por IA.' }],
            serviceDetails: { customerDescription: 'Un plato delicioso inspirado en tus ideas.' },
        };
        setRecipes(prev => [newRecipe, ...prev]);
        setIsAiModalOpen(false);
        setViewState({ mode: 'form', recipeId: newRecipe.id });
    };

    const handleImportFile = (type: 'image' | 'pdf' | 'doc' | 'json') => {
        console.log(`Mock import for file type: ${type}`);
         const newRecipe: FullRecipe = {
            id: uuidv4(),
            name: `Receta importada de ${type.toUpperCase()}`,
            category: 'Entrantes',
            authorEmail: MOCK_CURRENT_USER.email,
            isPublic: false,
            yield: '2 raciones',
            ingredients: [{ productId: '', productName: 'Tomate', quantity: '2 unidades' }],
            elaboration: [{ id: uuidv4(), description: 'Paso extraído del documento.' }],
            serviceDetails: {},
        };
        setRecipes(prev => [newRecipe, ...prev]);
        setViewState({ mode: 'form', recipeId: newRecipe.id });
    }

    const recipeForView = useMemo(() => {
        if (viewState.mode === 'list' || !viewState.recipeId) return undefined;
        return recipes.find(r => r.id === viewState.recipeId);
    }, [viewState, recipes]);

    if (viewState.mode === 'form') {
        return <RecipeFormView 
            initialRecipe={recipeForView}
            products={products}
            onSave={handleSaveRecipe}
            onCancel={() => setViewState({ mode: 'list' })}
        />;
    }

    if (viewState.mode === 'detail') {
        if (!recipeForView) {
            // Should not happen, but as a fallback:
            return <div className="text-center p-8">Receta no encontrada. <button onClick={() => setViewState({ mode: 'list' })}>Volver a la lista</button></div>;
        }
        return <RecipeDetailView 
            recipe={recipeForView}
            products={products}
            onBack={() => setViewState({ mode: 'list' })}
            onEdit={(id) => setViewState({ mode: 'form', recipeId: id })}
            onDelete={handleDeleteRecipe}
            onMakeMine={handleMakeMine}
        />;
    }

    // --- MAIN LIST VIEW ---
    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800">Mi Recetario</h2>
                <p className="mt-1 text-gray-600">Busca, crea y gestiona tus fichas técnicas de cocina.</p>
            </div>

            {/* Creation Panel */}
            <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="font-bold text-lg text-center mb-3">Crear nueva ficha técnica</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <CreateButton icon={<PencilIcon />} label="Manual" onClick={() => setViewState({mode: 'form'})} />
                    <CreateButton icon={<SparklesIcon />} label="con IA" onClick={() => setIsAiModalOpen(true)} />
                    <CreateButton icon={<PhotoIcon />} label="Imagen" onClick={() => handleImportFile('image')} />
                    <CreateButton icon={<DocumentTextIcon />} label="PDF" onClick={() => handleImportFile('pdf')} />
                    <CreateButton icon={<DocumentTextIcon />} label="Doc" onClick={() => handleImportFile('doc')} />
                    <CreateButton icon={<CodeBracketIcon />} label="JSON" onClick={() => handleImportFile('json')} />
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white p-4 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <input
                    type="text"
                    placeholder="Buscar por nombre..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="md:col-span-1 w-full p-2 border border-gray-300 rounded-md"
                />
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                    <option value="All">Todas las categorías</option>
                    {RECIPE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={scopeFilter} onChange={e => setScopeFilter(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                    <option value="All">Todas las recetas</option>
                    <option value="Mine">Mis recetas</option>
                    <option value="Public">Recetas públicas</option>
                </select>
            </div>

            {/* Recipe Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredRecipes.map(recipe => (
                    <RecipeCard key={recipe.id} recipe={recipe} onSelect={() => setViewState({ mode: 'detail', recipeId: recipe.id })}/>
                ))}
            </div>
             {filteredRecipes.length === 0 && (
                <div className="col-span-full text-center py-12 bg-white rounded-lg shadow-md">
                    <p className="text-gray-500">No se encontraron recetas con los filtros actuales.</p>
                </div>
            )}
            
            {/* Modals */}
            {isAiModalOpen && <GenerateWithAIModal onGenerate={handleGenerateWithAI} onClose={() => setIsAiModalOpen(false)} />}
        </div>
    );
};

// --- Child Components for MiRecetarioView ---

// FIX: The props for the icon element were not correctly typed, causing an error with cloneElement. The props are passed to a wrapper that sets the className.
const CreateButton: React.FC<{ icon: React.ReactElement<{ className?: string }>, label: string, onClick: () => void }> = ({ icon, label, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center gap-2 p-3 bg-gray-50 hover:bg-teal-50 border border-gray-200 hover:border-teal-300 rounded-lg transition-colors text-sm font-semibold text-gray-700 hover:text-teal-800">
        {React.cloneElement(icon, { className: "h-6 w-6" })}
        <span>{label}</span>
    </button>
);

const RecipeCard: React.FC<{ recipe: FullRecipe, onSelect: () => void }> = ({ recipe, onSelect }) => (
    <div onClick={onSelect} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer flex flex-col overflow-hidden">
        <div className="h-40 bg-gray-200 flex items-center justify-center">
            {recipe.photoUrl ? <img src={recipe.photoUrl} alt={recipe.name} className="w-full h-full object-cover" /> : <PhotoIcon className="h-16 w-16 text-gray-400" />}
        </div>
        <div className="p-4 flex-grow flex flex-col">
            <h4 className="font-bold text-gray-800 flex-grow">{recipe.name}</h4>
            <div className="flex justify-between items-center mt-2 text-xs">
                 <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full">{recipe.category}</span>
                 {recipe.authorEmail === MOCK_CURRENT_USER.email 
                    ? <span className="px-2 py-1 bg-teal-100 text-teal-800 rounded-full font-semibold">Mía</span>
                    : recipe.isPublic && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold">Pública</span>
                 }
            </div>
        </div>
    </div>
);

const GenerateWithAIModal: React.FC<{onGenerate: (prompt: string) => void, onClose: () => void}> = ({onGenerate, onClose}) => {
    const [prompt, setPrompt] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(prompt.trim()) {
            onGenerate(prompt);
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h3 className="text-xl font-bold">Generar Receta con IA</h3>
                        <p className="text-sm text-gray-600 mt-2">Describe la receta que tienes en mente. Por ejemplo: "un postre con chocolate, naranja y un toque picante".</p>
                        <textarea
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            placeholder="Describe tu idea aquí..."
                            className="w-full p-2 border rounded-md mt-4 h-28"
                            required
                        />
                    </div>
                    <div className="bg-gray-50 p-4 flex justify-end gap-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-teal-500 text-white font-bold rounded-md hover:bg-teal-600">Generar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MiRecetarioView;