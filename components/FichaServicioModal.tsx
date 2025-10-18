import React, { useState } from 'react';
import { Service, Recipe, Ingredient, Order, Product } from '../types';
import { CloseIcon, PlusIcon, TrashIcon } from './icons';
import { uuidv4, parseQuantity } from '../utils';

// Mock AI API Call for order generation
const mockGeminiOrderApiCall = async (ingredients: { ingredient: string, quantity: string }[]): Promise<{ product: string, quantity: string }[]> => {
    console.log("--- MOCK GEMINI: Optimizing order list ---", ingredients);
    
    // Simple mock logic: rounds up quantities to logical units
    const optimizedProducts = ingredients.map(item => {
        const parsed = parseQuantity(item.quantity);
        let finalQuantity = `${parsed.value}${parsed.unit}`;

        if (!parsed.value || isNaN(parsed.value)) {
            return { product: item.ingredient, quantity: '1 unidad' }; // Default for invalid quantity
        }

        if (parsed.unit === 'g') {
            finalQuantity = `${Math.ceil(parsed.value / 100) * 100}g`;
            if (parsed.value > 1000) finalQuantity = `${Math.ceil(parsed.value / 1000)}kg`;
        } else if (parsed.unit === 'ml') {
             finalQuantity = `${Math.ceil(parsed.value / 100) * 100}ml`;
            if (parsed.value > 1000) finalQuantity = `${Math.ceil(parsed.value / 1000)}l`;
        } else if (parsed.unit === 'unidad') {
            finalQuantity = `${Math.ceil(parsed.value)} unidad(es)`;
        } else if (parsed.unit === 'kg' || parsed.unit === 'l') {
             finalQuantity = `${Math.ceil(parsed.value)}${parsed.unit}`;
        }
        
        return { product: item.ingredient, quantity: finalQuantity };
    });

    return new Promise(resolve => setTimeout(() => resolve(optimizedProducts), 800));
};

interface FichaServicioModalProps {
    service: Service;
    onClose: () => void;
    onSave: (updatedService: Service) => void;
    onGenerateOrder: (newOrder: Order) => void;
}

const FichaServicioModal: React.FC<FichaServicioModalProps> = ({ service, onClose, onSave, onGenerateOrder }) => {
    const [localService, setLocalService] = useState<Service>(service);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleRecipeChange = (menuType: 'comedor' | 'takeaway', recipeId: string, updatedRecipe: Recipe) => {
        setLocalService(prev => ({
            ...prev,
            menu: {
                ...prev.menu,
                [menuType]: (prev.menu?.[menuType] || []).map(r => r.id === recipeId ? updatedRecipe : r),
            } as any
        }));
    };

    const handleAddRecipe = (menuType: 'comedor' | 'takeaway') => {
        const newRecipe: Recipe = { id: uuidv4(), dish: 'Nuevo Plato', ingredients: [] };
        setLocalService(prev => ({
            ...prev,
            menu: {
                ...prev.menu,
                [menuType]: [...(prev.menu?.[menuType] || []), newRecipe],
            } as any
        }));
    };

    const handleDeleteRecipe = (menuType: 'comedor' | 'takeaway', recipeId: string) => {
        if (window.confirm("¿Seguro que quieres eliminar esta receta?")) {
            setLocalService(prev => ({
                ...prev,
                menu: {
                    ...prev.menu,
                    [menuType]: (prev.menu?.[menuType] || []).filter(r => r.id !== recipeId),
                } as any
            }));
        }
    };
    
    const handleGenerateOrder = async () => {
        setIsGenerating(true);
        try {
            const allRecipes = [
                ...(localService.menu?.comedor || []),
                ...(localService.menu?.takeaway || [])
            ];
            
            if (allRecipes.length === 0) {
                alert("No hay recetas en el menú para generar un pedido.");
                return;
            }

            // Aggregate ingredients
            const aggregated: { [key: string]: { value: number, unit: string } } = {};
            allRecipes.forEach(recipe => {
                recipe.ingredients.forEach(ing => {
                    const parsed = parseQuantity(ing.quantity);
                    const name = ing.name.trim();
                    if (!aggregated[name]) {
                        aggregated[name] = { value: 0, unit: parsed.unit };
                    }
                    // Simple aggregation, assumes compatible units (e.g., all grams)
                    // A real app would need unit conversion logic here
                    aggregated[name].value += parsed.value;
                });
            });

            const ingredientList = Object.entries(aggregated).map(([name, data]) => ({
                ingredient: name,
                quantity: `${data.value}${data.unit}`
            }));

            const optimizedList = await mockGeminiOrderApiCall(ingredientList);
            
            const newOrder: Order = {
                id: uuidv4(),
                fecha: new Date().toISOString(),
                origen: service.id,
                products: optimizedList,
                estado: 'Borrador',
            };

            onGenerateOrder(newOrder);
            alert(`Pedido generado con éxito. Se encuentra en estado "Borrador" en la pestaña de Gestión de Pedidos.`);
            onClose();

        } catch (error) {
            console.error("Error generating order:", error);
            alert("Hubo un error al generar el pedido.");
        } finally {
            setIsGenerating(false);
        }
    };


    const RecipeEditor: React.FC<{ recipe: Recipe, onChange: (r: Recipe) => void, onDelete: () => void }> = ({ recipe, onChange, onDelete }) => {
        const [draftRecipe, setDraftRecipe] = useState(recipe);

        const handleIngredientChange = (index: number, field: 'name' | 'quantity', value: string) => {
            const newIngredients = [...draftRecipe.ingredients];
            newIngredients[index] = { ...newIngredients[index], [field]: value };
            setDraftRecipe(prev => ({ ...prev, ingredients: newIngredients }));
        };

        const addIngredient = () => {
            setDraftRecipe(prev => ({ ...prev, ingredients: [...prev.ingredients, { name: '', quantity: '' }] }));
        };

        const removeIngredient = (index: number) => {
            const newIngredients = draftRecipe.ingredients.filter((_, i) => i !== index);
            setDraftRecipe(prev => ({ ...prev, ingredients: newIngredients }));
        };

        return (
             <details className="p-3 bg-gray-50 rounded-md border border-gray-200">
                <summary className="font-semibold cursor-pointer text-sm text-gray-800 flex justify-between items-center">
                    <input 
                        type="text" 
                        value={draftRecipe.dish}
                        onChange={(e) => setDraftRecipe(prev => ({...prev, dish: e.target.value}))}
                        onBlur={() => onChange(draftRecipe)}
                        className="font-semibold text-gray-800 bg-transparent p-1 -m-1 rounded focus:bg-white focus:ring-1 focus:ring-teal-500 w-full"
                    />
                     <button onClick={onDelete} className="text-red-500 hover:text-red-700 ml-2 p-1"><TrashIcon className="h-4 w-4"/></button>
                </summary>
                <div className="mt-2 pt-2 border-t text-sm space-y-2">
                    {draftRecipe.ingredients.map((ing, index) => (
                        <div key={index} className="flex gap-2 items-center">
                            <input type="text" placeholder="Ingrediente" value={ing.name} onChange={e => handleIngredientChange(index, 'name', e.target.value)} onBlur={() => onChange(draftRecipe)} className="flex-1 p-1 border rounded text-xs"/>
                            <input type="text" placeholder="Cantidad (e.g. 500g)" value={ing.quantity} onChange={e => handleIngredientChange(index, 'quantity', e.target.value)} onBlur={() => onChange(draftRecipe)} className="w-28 p-1 border rounded text-xs"/>
                            <button onClick={() => removeIngredient(index)} className="text-gray-400 hover:text-red-500"><CloseIcon className="h-4 w-4"/></button>
                        </div>
                    ))}
                    <button onClick={addIngredient} className="text-xs text-teal-600 font-semibold flex items-center gap-1 hover:text-teal-800">
                        <PlusIcon className="h-3 w-3"/> Añadir ingrediente
                    </button>
                </div>
            </details>
        )
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-gray-50 rounded-xl shadow-2xl w-full max-w-4xl transform transition-all flex flex-col max-h-[95vh]">
                <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-white rounded-t-xl">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Ficha de Servicio</h2>
                        <p className="text-gray-500">{service.name} - {new Date(service.date).toLocaleDateString()}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full bg-gray-100 hover:bg-gray-200">
                        <CloseIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Comedor Menu */}
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-lg text-gray-700">Menú Comedor</h3>
                                <button onClick={() => handleAddRecipe('comedor')} className="text-sm font-semibold text-teal-600 hover:text-teal-800 flex items-center gap-1"><PlusIcon className="h-4 w-4"/> Añadir Plato</button>
                            </div>
                            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                                {localService.menu?.comedor?.map(recipe => (
                                    <RecipeEditor key={recipe.id} recipe={recipe} onChange={(r) => handleRecipeChange('comedor', recipe.id, r)} onDelete={() => handleDeleteRecipe('comedor', recipe.id)} />
                                ))}
                                {(!localService.menu?.comedor || localService.menu.comedor.length === 0) && <p className="text-sm text-gray-400 italic text-center py-4">No hay platos.</p>}
                            </div>
                        </div>

                        {/* Takeaway Menu */}
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                             <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-lg text-gray-700">Menú Takeaway</h3>
                                <button onClick={() => handleAddRecipe('takeaway')} className="text-sm font-semibold text-teal-600 hover:text-teal-800 flex items-center gap-1"><PlusIcon className="h-4 w-4"/> Añadir Plato</button>
                            </div>
                            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                                {localService.menu?.takeaway?.map(recipe => (
                                    <RecipeEditor key={recipe.id} recipe={recipe} onChange={(r) => handleRecipeChange('takeaway', recipe.id, r)} onDelete={() => handleDeleteRecipe('takeaway', recipe.id)} />
                                ))}
                                 {(!localService.menu?.takeaway || localService.menu.takeaway.length === 0) && <p className="text-sm text-gray-400 italic text-center py-4">No hay platos.</p>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-100 p-4 flex justify-between items-center rounded-b-xl border-t">
                    <button onClick={handleGenerateOrder} disabled={isGenerating} className="px-4 py-2 bg-indigo-500 text-white font-bold rounded-md hover:bg-indigo-600 disabled:bg-gray-400">
                        {isGenerating ? 'Generando...' : 'Generar Pedido con IA'}
                    </button>
                    <div className="space-x-2">
                        <button onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">Cancelar</button>
                        <button onClick={() => onSave(localService)} className="px-6 py-2 bg-teal-500 text-white font-bold rounded-md hover:bg-teal-600">Guardar Cambios</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FichaServicioModal;
