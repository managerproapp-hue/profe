import React, { useState, useMemo } from 'react';
import { Order, Service, Product } from '../types';
import { EyeIcon, TrashIcon, PencilIcon, DownloadIcon, CheckIcon, CloseIcon, XIcon } from './icons';
import { parseQuantity } from '../utils';

declare const jspdf: any;

interface PedidoDetailModalProps {
    order: Order;
    serviceName: string;
    productCatalog: Product[];
    onClose: () => void;
    onSave: (updatedOrder: Order) => void;
}

const PedidoDetailModal: React.FC<PedidoDetailModalProps> = ({ order, serviceName, productCatalog, onClose, onSave }) => {
    const [editedOrder, setEditedOrder] = useState<Order>(order);
    const isSent = editedOrder.estado === 'Enviado';

    const priceMap = useMemo(() => new Map(productCatalog.map(p => [p.name.toLowerCase(), {price: p.price, unit: p.unit}])), [productCatalog]);

    const handleQuantityChange = (productName: string, newQuantity: string) => {
        setEditedOrder(prev => ({
            ...prev,
            products: prev.products.map(p => p.product === productName ? { ...p, quantity: newQuantity } : p)
        }));
    };

    const totalCost = useMemo(() => {
        return editedOrder.products.reduce((sum, p) => {
            const productInfo = priceMap.get(p.product.toLowerCase());
            if (productInfo) {
                const { value } = parseQuantity(p.quantity);
                // Basic cost calculation, assumes units match. A real app needs conversion.
                return sum + (value * productInfo.price);
            }
            return sum;
        }, 0);
    }, [editedOrder.products, priceMap]);
    
    const handleExportPdf = () => {
        const { jsPDF } = jspdf;
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text(`Pedido para: ${serviceName}`, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Fecha de generación: ${new Date(order.fecha).toLocaleDateString()}`, 14, 30);

        const tableColumn = ["Producto", "Cantidad"];
        const tableRows: (string|number)[][] = [];

        editedOrder.products.forEach(p => {
            const ticketData = [p.product, p.quantity];
            tableRows.push(ticketData);
        });

        (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 35,
        });
        
        doc.save(`pedido_${serviceName.replace(/\s+/g, '_')}.pdf`);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl transform transition-all flex flex-col max-h-[95vh]">
                <div className="p-5 border-b border-gray-200 flex justify-between items-center rounded-t-xl">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Detalle del Pedido</h2>
                        <p className="text-sm text-gray-500">Origen: {serviceName}</p>
                    </div>
                     <span className={`px-3 py-1 text-xs font-bold rounded-full ${isSent ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {editedOrder.estado}
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-2 px-3 text-left font-medium text-gray-600 text-sm">Producto</th>
                                <th className="py-2 px-3 text-left font-medium text-gray-600 text-sm w-32">Cantidad</th>
                                <th className="py-2 px-3 text-right font-medium text-gray-600 text-sm w-32">Coste Estimado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {editedOrder.products.map(p => {
                                const productInfo = priceMap.get(p.product.toLowerCase());
                                const { value: quantityValue } = parseQuantity(p.quantity);
                                const cost = productInfo ? (quantityValue * productInfo.price).toFixed(2) + ' €' : 'N/A';
                                
                                return (
                                    <tr key={p.product} className="border-t">
                                        <td className="py-2 px-3 font-medium">{p.product}</td>
                                        <td className="py-2 px-3">
                                            <input 
                                                type="text" 
                                                value={p.quantity}
                                                onChange={e => handleQuantityChange(p.product, e.target.value)}
                                                readOnly={isSent}
                                                className={`w-full p-1 border rounded text-sm ${isSent ? 'bg-gray-100' : 'border-gray-300'}`}
                                            />
                                        </td>
                                        <td className="py-2 px-3 text-right text-gray-600">{cost}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="bg-gray-50 p-4 rounded-b-xl border-t flex justify-between items-center">
                    <div>
                        <span className="font-bold text-lg">Coste Total Estimado:</span>
                        <span className="text-lg ml-2">{totalCost.toFixed(2)} €</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleExportPdf} className="p-2 text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200" title="Exportar a PDF"><DownloadIcon className="h-5 w-5"/></button>
                        <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cerrar</button>
                        {!isSent ? (
                            <>
                                <button onClick={() => onSave(editedOrder)} className="px-4 py-2 bg-teal-500 text-white font-bold rounded-md hover:bg-teal-600">Guardar Cambios</button>
                                <button onClick={() => onSave({...editedOrder, estado: 'Enviado'})} className="px-4 py-2 bg-green-500 text-white font-bold rounded-md hover:bg-green-600">Marcar como Enviado</button>
                            </>
                        ) : (
                            <button onClick={() => onSave({...editedOrder, estado: 'Borrador'})} className="px-4 py-2 bg-yellow-500 text-white font-bold rounded-md hover:bg-yellow-600">Reabrir (Borrador)</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


interface GestionPedidosTabProps {
    orders: Order[];
    services: Service[];
    productCatalog: Product[];
    setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
}

const GestionPedidosTab: React.FC<GestionPedidosTabProps> = ({ orders, services, productCatalog, setOrders }) => {
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const serviceMap = useMemo(() => new Map(services.map(s => [s.id, s.name])), [services]);

    const handleDeleteOrder = (orderId: string) => {
        if (window.confirm("¿Estás seguro de que quieres eliminar este pedido?")) {
            setOrders(prev => prev.filter(o => o.id !== orderId));
        }
    };
    
    const handleSaveOrder = (updatedOrder: Order) => {
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
        setSelectedOrder(updatedOrder);
    };

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const serviceName = serviceMap.get(order.origen) || '';
            return serviceName.toLowerCase().includes(searchTerm.toLowerCase());
        }).sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    }, [orders, searchTerm, serviceMap]);

    return (
        <div>
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <input 
                    type="text"
                    placeholder="Buscar por nombre de servicio..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                />
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="py-3 px-4 text-left font-medium text-gray-600 text-sm">Fecha</th>
                            <th className="py-3 px-4 text-left font-medium text-gray-600 text-sm">Origen (Servicio)</th>
                            <th className="py-3 px-4 text-left font-medium text-gray-600 text-sm">Nº Productos</th>
                            <th className="py-3 px-4 text-left font-medium text-gray-600 text-sm">Estado</th>
                            <th className="py-3 px-4 text-right font-medium text-gray-600 text-sm">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filteredOrders.map(order => {
                            const serviceName = serviceMap.get(order.origen) || 'Desconocido';
                            return (
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="py-3 px-4 text-sm">{new Date(order.fecha).toLocaleDateString()}</td>
                                    <td className="py-3 px-4 font-medium">{serviceName}</td>
                                    <td className="py-3 px-4 text-sm">{order.products.length}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${order.estado === 'Enviado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {order.estado}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-right flex justify-end gap-2">
                                        <button onClick={() => setSelectedOrder(order)} className="text-teal-600 font-semibold text-sm">Ver / Editar</button>
                                        <button onClick={() => handleDeleteOrder(order.id)} className="p-1 text-gray-400 hover:text-red-600"><TrashIcon className="h-4 w-4"/></button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                 {filteredOrders.length === 0 && <p className="text-center text-gray-500 py-8">No se encontraron pedidos.</p>}
            </div>

            {selectedOrder && (
                <PedidoDetailModal 
                    order={selectedOrder}
                    serviceName={serviceMap.get(selectedOrder.origen) || 'Desconocido'}
                    productCatalog={productCatalog}
                    onClose={() => setSelectedOrder(null)}
                    onSave={handleSaveOrder}
                />
            )}
        </div>
    );
};

export default GestionPedidosTab;
