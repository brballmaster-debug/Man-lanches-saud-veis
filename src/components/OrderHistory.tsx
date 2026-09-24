import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Order } from '../types';
import { X, Clock, MapPin, Package } from 'lucide-react';

interface OrderHistoryProps {
  onClose: () => void;
}

export default function OrderHistory({ onClose }: OrderHistoryProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      
      // Sort on the client to avoid requiring a composite index in Firestore
      fetchedOrders.sort((a, b) => {
        const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return dateB - dateA;
      });
      
      setOrders(fetchedOrders);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching orders:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'confirmed': return 'Confirmado';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <div className="fixed inset-0 z-30 pb-16 sm:pb-0 flex justify-end">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-mana-bg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-5 border-b border-mana-gold/20 flex items-center justify-between bg-white">
          <h2 className="font-serif text-xl font-bold text-mana-green flex items-center gap-2">
            <Package size={20} />
            Meus Pedidos
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-mana-text-light hover:text-mana-text hover:bg-mana-bg rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 pb-24 sm:pb-8">
          {auth.currentUser?.isAnonymous && (
            <div className="mb-6 p-4 bg-mana-gold/10 border border-mana-gold/20 rounded-xl text-sm text-mana-text-light">
              <p className="font-semibold text-mana-green mb-1">Atenção Visitante</p>
              <p>Como você não criou uma conta, seu histórico de pedidos só está disponível neste navegador. Recomendamos criar uma conta para não perder seus dados.</p>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mana-green"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-10">
              <Package size={48} className="mx-auto text-mana-gold/50 mb-4" />
              <p className="text-mana-text-light">Você ainda não fez nenhum pedido.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm border border-mana-gold/10">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                      <p className="text-sm text-mana-text-light flex items-center gap-1">
                        <Clock size={14} />
                        {order.deliveryDate} às {order.deliveryTime}
                      </p>
                    </div>
                    <span className="font-bold text-mana-green">
                      R$ {order.total.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="border-t border-b border-mana-gold/10 py-3 my-3">
                    <ul className="space-y-2">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="text-sm flex justify-between">
                          <span className="text-mana-text">{item.quantity}x {item.name}</span>
                          <span className="text-mana-text-light">R$ {(item.price * item.quantity).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="text-sm text-mana-text-light flex items-start gap-1">
                    <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                    <span>
                      {order.address.street}, {order.address.number}
                      {order.address.complement && ` - ${order.address.complement}`}
                      <br />
                      {order.address.neighborhood}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
