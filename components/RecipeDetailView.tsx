import React, { useMemo } from 'react';
import { FullRecipe, Product } from '../types';
import { BackIcon, PencilIcon, TrashIcon, DownloadIcon, DocumentDuplicateIcon, PhotoIcon } from './icons';
import { parseQuantity } from '../utils';

const MOCK_CURRENT_USER = { email: 'profesor@example.com' };

interface RecipeDetailViewProps {
    recipe: FullRecipe;
    products: Product[];
    onBack: () => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onMakeMine: (id: string) => void;
}

const calculateRecipeAnalysis = (recipe: FullRecipe, products: Product[]) => {
    let totalCost = 0;
    const allergens = new Set<string>();
    const productMap = new Map(products.map(p => [p.id, p]));

    recipe.ingredients.forEach(ing => {
        const product = productMap.get(ing.productId);
        if (product) {
            // Add allergens
            product.allergens.forEach(a => allergens.add(a));
            
            // Calculate cost
            const ingQty = parseQuantity(ing.quantity);
            const prodUnit = product.unit;
            let costMultiplier = ingQty.value;

            // Basic unit conversion
            if (prodUnit === 'kg' && (ingQty.unit === 'g' || ingQty.unit === 'gramo')) {
                costMultiplier = ingQty.value / 1000;
            } else if (prodUnit === 'litro' && (ingQty.unit === 'ml' || ingQty.unit === 'mililitro')) {
                costMultiplier = ingQty.value / 1000;
            }
            
            totalCost += product.price * costMultiplier;
        }
    });

    const yieldValue = parseFloat(recipe.yield) || 1;
    const costPerServing = totalCost / yieldValue;

    return {
        totalCost,
        costPerServing,
        allergens: Array.from(allergens).sort(),
    };
};


const RecipeDetailView: React.FC<RecipeDetailViewProps> = ({ recipe, products, onBack, onEdit, onDelete, onMakeMine }) => {
    const isOwner = recipe.authorEmail === MOCK_CURRENT_USER.email;

    const analysis = useMemo(() => calculateRecipeAnalysis(recipe, products), [recipe, products]);

    const handleExportJson = () => {
        const dataStr = JSON.stringify(recipe, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = `${recipe.name.replace(/\s+/g, '_')}.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <button onClick={onBack} className="flex items-center text-teal-600 hover:text-teal-800 font-semibold">
                    <BackIcon className="h-5 w-5 mr-2" /> Volver al Recetario
                </button>
                <div className="flex items-center gap-2">
                    {isOwner ? (
                        <>
                            <button onClick={() => onEdit(recipe.id)} className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm font-semibold"><PencilIcon className="h-4 w-4" /> Editar</button>
                            <button onClick={() => onDelete(recipe.id)} className="flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm font-semibold"><TrashIcon className="h-4 w-4" /> Eliminar</button>
                            <button onClick={handleExportJson} className="p-2 bg-gray-200 rounded-md hover:bg-gray-300" title="Exportar a JSON"><DownloadIcon className="h-5 w-5 text-gray-600" /></button>
                        </>
                    ) : (
                        <button onClick={() => onMakeMine(recipe.id)} className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 font-bold"><DocumentDuplicateIcon className="h-5 w-5" /> Hacer Mía</button>
                    )}
                </div>
            </div>

            {/* Main Info */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-1/3 h-64 bg-gray-100 rounded-md flex items-center justify-center">
                         {recipe.photoUrl ? (
                            <img src={recipe.photoUrl} alt={recipe.name} className="w-full h-full object-cover rounded-md" />
                         ) : <PhotoIcon className="h-24 w-24 text-gray-400" />}
                    </div>
                    <div className="flex-1">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">{recipe.category}</span>
                        <h1 className="text-3xl font-bold text-gray-800 mt-2">{recipe.name}</h1>
                        <p className="mt-2 text-gray-600">{recipe.serviceDetails.customerDescription || 'Sin descripción para el cliente.'}</p>
                        
                        <div className="mt-6 border-t pt-4">
                            <h3 className="font-bold text-gray-700">Detalles para el Servicio</h3>
                            <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                                <div><strong className="text-gray-500">Temp. Servicio:</strong> {recipe.serviceDetails.servingTemp || '-'}</div>
                                <div><strong className="text-gray-500">Marcaje:</strong> {recipe.serviceDetails.cutlery || '-'}</div>
                                <div className="col-span-2"><strong className="text-gray-500">Notas de Emplatado:</strong> {recipe.serviceDetails.platingNotes || '-'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 border-t pt-6">
                    {/* Ingredients */}
                    <div className="md:col-span-1">
                        <h2 className="text-xl font-bold text-gray-800 mb-3">Ingredientes</h2>
                        <p className="text-sm text-gray-500 mb-4">Para: <strong>{recipe.yield}</strong></p>
                        <ul className="space-y-2">
                            {recipe.ingredients.map((ing, i) => (
                                <li key={i} className="flex justify-between border-b pb-1">
                                    <span className="text-gray-700">{ing.productName}</span>
                                    <span className="font-medium text-gray-600">{ing.quantity}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    {/* Elaboration */}
                    <div className="md:col-span-2">
                        <h2 className="text-xl font-bold text-gray-800 mb-3">Elaboración</h2>
                        <div className="prose prose-sm max-w-none">
                            <ol className="list-decimal pl-5 space-y-3">
                                {recipe.elaboration.map(step => (
                                    <li key={step.id}>{step.description}</li>
                                ))}
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
            
             {/* Analysis Footer */}
            <div className="bg-white p-4 rounded-lg shadow-lg flex flex-wrap justify-around items-center text-center">
                <div className="p-2">
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Coste Total</p>
                    <p className="text-xl font-bold text-red-600">{analysis.totalCost.toFixed(2)} €</p>
                </div>
                 <div className="p-2">
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Coste / Ración</p>
                    <p className="text-xl font-bold text-red-600">{analysis.costPerServing.toFixed(2)} €</p>
                </div>
                 <div className="p-2">
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">P.V.P.</p>
                    <p className="text-xl font-bold text-green-600">{recipe.pvp ? `${recipe.pvp.toFixed(2)} €` : 'N/A'}</p>
                </div>
                <div className="p-2 min-w-[200px] text-left">
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider text-center mb-1">Alérgenos</p>
                    {analysis.allergens.length > 0 ? (
                        <div className="flex flex-wrap gap-1 justify-center">
                            {analysis.allergens.map(a => <span key={a} className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">{a}</span>)}
                        </div>
                    ) : <p className="text-xs text-center text-gray-500">Ninguno detectado</p>}
                </div>
            </div>
        </div>
    );
};

export default RecipeDetailView;
