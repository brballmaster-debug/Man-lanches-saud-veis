import React, { useState, useMemo } from 'react';
import { Order } from '../types';
import { 
  MessageCircle, 
  Phone, 
  Send, 
  ArrowLeft, 
  CheckCheck, 
  Clock, 
  MapPin, 
  CreditCard, 
  Search, 
  Copy, 
  Check, 
  ShoppingBag, 
  ExternalLink, 
  Share2,
  Calendar,
  Sparkles,
  X,
  ChevronRight,
  User
} from 'lucide-react';

interface WhatsAppAgendaProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  myWhatsappNumber: string;
  pixKey?: string;
  pickUpHours?: string;
  deliveryHours?: string;
  onShowToast?: (message: string) => void;
}

export default function WhatsAppAgenda({
  orders,
  onUpdateOrderStatus,
  myWhatsappNumber,
  pixKey = '',
  pickUpHours = '17:30 às 19:00',
  deliveryHours = '13:00 às 19:00',
  onShowToast = () => {}
}: WhatsAppAgendaProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'delivered' | 'cancelled'>('all');
  const [customMessage, setCustomMessage] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Filtra e ordena os pedidos (mais recentes primeiro)
  const filteredOrders = useMemo(() => {
    return orders
      .filter(order => {
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        if (!matchesStatus) return false;

        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        const nameMatch = order.customerName.toLowerCase().includes(term);
        const phoneMatch = order.customerPhone ? order.customerPhone.toLowerCase().includes(term) : false;
        const idMatch = order.id.toLowerCase().includes(term);
        const itemMatch = order.items.some(i => i.name.toLowerCase().includes(term));
        return nameMatch || phoneMatch || idMatch || itemMatch;
      })
      .sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
  }, [orders, statusFilter, searchTerm]);

  // Pedido selecionado atualmente
  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    return orders.find(o => o.id === selectedOrderId) || null;
  }, [orders, selectedOrderId]);

  // Contadores para os filtros
  const counts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    };
  }, [orders]);

  // Formata o número de telefone para o WhatsApp (DDI 55 + DDD + Número)
  const cleanPhoneForWhatsApp = (rawPhone?: string): string => {
    if (!rawPhone) return '';
    let digits = rawPhone.replace(/\D/g, '');
    if (!digits) return '';
    // Se o cliente digitou sem o DDI 55 (ex: 35999999999), adiciona 55
    if (digits.length === 10 || digits.length === 11) {
      digits = `55${digits}`;
    }
    return digits;
  };

  const cleanMyWhatsApp = useMemo(() => {
    let digits = (myWhatsappNumber || '').replace(/\D/g, '');
    if (digits.length === 10 || digits.length === 11) {
      digits = `55${digits}`;
    }
    return digits || '5535998579552';
  }, [myWhatsappNumber]);

  // Gera o texto completo e detalhado do pedido para envio
  const generateOrderSummaryText = (order: Order): string => {
    const isPickup = order.deliveryType === 'pickup' || 
      order.deliveryType === 'retirada' || 
      order.address?.street?.toUpperCase?.()?.includes('RETIRADA');

    let text = `📋 *PEDIDO #${order.id.slice(-6).toUpperCase()}*\n`;
    text += `👤 *Cliente:* ${order.customerName}\n`;
    if (order.customerPhone) {
      text += `📞 *Telefone:* ${order.customerPhone}\n`;
    }
    text += `🗓️ *Data:* ${order.deliveryDate} às ${order.deliveryTime}\n`;
    text += `📦 *Modalidade:* ${isPickup ? 'Retirada no Balcão' : 'Entrega em Domicílio'}\n`;
    
    if (order.paymentMethod) {
      text += `💳 *Pagamento:* ${order.paymentMethod}\n`;
    }

    text += `\n🛒 *ITENS DO PEDIDO:*\n`;
    order.items.forEach(item => {
      text += `• ${item.quantity}x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}\n`;
    });

    if (order.subtotal && order.subtotal !== order.total) {
      text += `\n*Subtotal:* R$ ${order.subtotal.toFixed(2)}`;
    }
    if (order.discountAmount && order.discountAmount > 0) {
      text += `\n*Desconto:* -R$ ${order.discountAmount.toFixed(2)}`;
    }
    if (!isPickup) {
      text += `\n*Taxa de entrega:* ${order.deliveryFee === 0 ? 'Grátis' : `R$ ${order.deliveryFee.toFixed(2)}`}`;
    }
    text += `\n💰 *VALOR TOTAL:* R$ ${order.total.toFixed(2)}\n`;

    if (isPickup) {
      text += `\n📍 *Local de Retirada:* Balcão da loja\n⏰ *Horário de Retirada:* ${pickUpHours}`;
    } else {
      text += `\n📍 *Endereço de Entrega:*\n${order.address.street}, ${order.address.number}`;
      if (order.address.complement) text += ` - ${order.address.complement}`;
      text += `\nBairro: ${order.address.neighborhood}`;
    }

    return text;
  };

  // Enviar pedido para o próprio WhatsApp do lojista
  const handleSendToMyWhatsApp = (order: Order) => {
    const text = generateOrderSummaryText(order);
    const url = `https://wa.me/${cleanMyWhatsApp}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    onShowToast("Abrindo WhatsApp com a ficha do pedido...");
  };

  // Abrir WhatsApp do cliente com mensagem personalizada ou pré-definida
  const handleSendToCustomerWhatsApp = (order: Order, message: string) => {
    const customerPhone = cleanPhoneForWhatsApp(order.customerPhone);
    if (!customerPhone) {
      onShowToast("Este cliente não possui telefone válido cadastrado.");
      return;
    }
    const url = `https://wa.me/${customerPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    onShowToast("Abrindo WhatsApp do cliente...");
  };

  // Mensagens pré-configuradas para o cliente
  const getPreConfiguredMessages = (order: Order) => {
    const isPickup = order.deliveryType === 'pickup' || 
      order.deliveryType === 'retirada' || 
      order.address?.street?.toUpperCase?.()?.includes('RETIRADA');

    const firstName = order.customerName.split(' ')[0] || order.customerName;
    const orderCode = order.id.slice(-6).toUpperCase();

    return {
      confirm: `Olá, *${firstName}*! 👋 Tudo bem?\n\nPassando para confirmar que seu pedido *#${orderCode}* foi recebido com sucesso e já está sendo preparado com muito carinho pela equipe da *Maná do Céu*! 🍞✨\n\n⏰ *Previsão:* ${order.deliveryDate} às ${order.deliveryTime}\n📦 *Modalidade:* ${isPickup ? 'Retirada no Balcão' : 'Entrega no seu endereço'}\n\nQualquer dúvida estamos à disposição! Muito obrigado pela preferência! ❤️`,
      
      outForDelivery: isPickup 
        ? `Olá, *${firstName}*! 🏪 Seu pedido *#${orderCode}* já está prontinho e quentinho aguardando por você no nosso balcão!\n\n⏰ *Horário para retirada:* ${pickUpHours}\n\nAté já!`
        : `Olá, *${firstName}*! 🛵 Seu pedido *#${orderCode}* acabou de sair para entrega!\n\n📍 *Endereço:* ${order.address.street}, ${order.address.number} - ${order.address.neighborhood}\n\nPor favor, fique atento(a) para receber nosso entregador. Bom apetite! ✨`,
      
      pixPayment: `Olá, *${firstName}*! Segue a nossa Chave Pix para o pagamento do seu pedido *#${orderCode}*:\n\n💰 *Valor Total:* R$ ${order.total.toFixed(2)}\n🔑 *Chave Pix:* ${pixKey || cleanMyWhatsApp}\n\nAssim que efetuar o pagamento, favor nos enviar o comprovante por aqui. Muito obrigado! 🙏`,
      
      thankYou: `Olá, *${firstName}*! Passando para agradecer pelo seu pedido na *Maná do Céu*! 🥰\n\nEsperamos que aprecie cada detalhe dos nossos pães e quitutes. Bom apetite e volte sempre! ❤️🍞`
    };
  };

  const handleCopySummary = (order: Order) => {
    const text = generateOrderSummaryText(order);
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    onShowToast("Ficha do pedido copiada!");
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      setIsUpdatingStatus(true);
      await onUpdateOrderStatus(orderId, newStatus);
      onShowToast(`Status alterado para: ${getStatusLabel(newStatus)}`);
    } catch (e) {
      onShowToast("Erro ao atualizar status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusLabel = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'confirmed': return 'Confirmado';
      case 'delivered': return 'Entregue / Concluído';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getStatusBadgeClass = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'confirmed':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'cancelled':
        return 'bg-red-100 text-red-900 border-red-300';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  // Cores dinâmicas para os avatares dos clientes
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-emerald-600',
      'bg-teal-600',
      'bg-amber-600',
      'bg-blue-600',
      'bg-indigo-600',
      'bg-rose-600',
      'bg-purple-600'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getInitials = (name: string) => {
    if (!name) return 'C';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="bg-[#EFEAE2] rounded-3xl shadow-xl border border-stone-300/80 overflow-hidden flex flex-col h-[calc(100vh-140px)] min-h-[580px] max-w-7xl mx-auto">
      {/* =========================================================================
          CABEÇALHO GERAL ESTILO WHATSAPP
         ========================================================================= */}
      <header className="bg-[#075E54] text-white px-4 py-3 shrink-0 flex items-center justify-between shadow-md z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-white/30 flex items-center justify-center text-white shrink-0 shadow-inner">
            <MessageCircle size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-bold text-base sm:text-lg leading-tight flex items-center gap-2">
              Agenda WhatsApp
              <span className="bg-emerald-400 text-emerald-950 font-bold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                Pedidos & Chat
              </span>
            </h2>
            <p className="text-xs text-emerald-100/90 leading-tight">
              {counts.all} {counts.all === 1 ? 'pedido cadastrado' : 'pedidos cadastrados'} • {counts.pending} pendente{counts.pending === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {/* Informações da Loja */}
        <div className="hidden sm:flex items-center gap-2 text-xs bg-white/10 border border-white/20 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
          <span>WhatsApp Loja: <strong className="font-mono">{myWhatsappNumber}</strong></span>
        </div>
      </header>

      {/* =========================================================================
          CORPO PRINCIPAL: DUAS COLUNAS NO DESKTOP, ALTERNÂNCIA NATIVA NO MOBILE
         ========================================================================= */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* =======================================================================
            COLUNA DA ESQUERDA: LISTA DE CLIENTES / PEDIDOS
            (No mobile: some quando há um pedido selecionado)
           ======================================================================= */}
        <aside className={`w-full md:w-[380px] lg:w-[420px] bg-white border-r border-stone-200 flex flex-col shrink-0 transition-all duration-200 ${
          selectedOrderId ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Barra de Pesquisa e Filtros */}
          <div className="p-3 bg-stone-50 border-b border-stone-200/80 space-y-2 shrink-0">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar cliente, telefone ou item..."
                className="w-full bg-white border border-stone-300 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#075E54] focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                  aria-label="Limpar busca"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filtros em carrossel horizontal touch-friendly */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {[
                { id: 'all', label: 'Todos', count: counts.all },
                { id: 'pending', label: 'Pendentes', count: counts.pending },
                { id: 'confirmed', label: 'Confirmados', count: counts.confirmed },
                { id: 'delivered', label: 'Entregues', count: counts.delivered },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id as any)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                    statusFilter === f.id
                      ? 'bg-[#075E54] text-white shadow-xs'
                      : 'bg-stone-200/80 text-stone-700 hover:bg-stone-300'
                  }`}
                >
                  <span>{f.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    statusFilter === f.id ? 'bg-white/20 text-white' : 'bg-stone-300 text-stone-800'
                  }`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Pedidos / Clientes com rolagem suave */}
          <div className="flex-1 overflow-y-auto divide-y divide-stone-100 overscroll-contain">
            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-stone-400 flex flex-col items-center justify-center h-full">
                <ShoppingBag size={40} className="mb-2 opacity-40 text-stone-500" />
                <p className="text-sm font-semibold text-stone-600">Nenhum pedido encontrado</p>
                <p className="text-xs mt-1 text-stone-400">
                  {searchTerm ? 'Tente buscar com outros termos.' : 'Aguardando novos pedidos dos clientes.'}
                </p>
              </div>
            ) : (
              filteredOrders.map(order => {
                const isSelected = order.id === selectedOrderId;
                const isPickup = order.deliveryType === 'pickup' || 
                  order.deliveryType === 'retirada' || 
                  order.address?.street?.toUpperCase?.()?.includes('RETIRADA');
                const itemsSummary = order.items.map(i => `${i.quantity}x ${i.name}`).join(', ');

                return (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`w-full p-3.5 text-left transition-all flex items-start gap-3 relative cursor-pointer active:bg-emerald-50 ${
                      isSelected 
                        ? 'bg-emerald-50/80 border-l-4 border-[#075E54]' 
                        : 'hover:bg-stone-50 bg-white'
                    }`}
                  >
                    {/* Avatar com Iniciais */}
                    <div className={`w-12 h-12 rounded-full ${getAvatarColor(order.customerName)} text-white font-bold flex items-center justify-center shrink-0 shadow-sm text-sm tracking-wider`}>
                      {getInitials(order.customerName)}
                    </div>

                    {/* Informações Centrais */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4 className="font-bold text-sm text-stone-900 truncate">
                          {order.customerName}
                        </h4>
                        <span className="text-[11px] text-stone-400 font-medium shrink-0">
                          {order.deliveryTime || 'A combinar'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-stone-600 mb-1 flex-wrap">
                        {order.customerPhone ? (
                          <span className="font-medium flex items-center gap-1 text-[#075E54]">
                            <Phone size={11} /> {order.customerPhone}
                          </span>
                        ) : (
                          <span className="text-stone-400 italic">Sem telefone</span>
                        )}
                        <span>•</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-md ${
                          isPickup ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
                        }`}>
                          {isPickup ? 'Retirada' : 'Entrega'}
                        </span>
                      </div>

                      {/* Prévia dos Itens */}
                      <p className="text-xs text-stone-500 truncate mb-1">
                        {itemsSummary}
                      </p>

                      {/* Linha Inferior com Total e Status */}
                      <div className="flex items-center justify-between pt-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadgeClass(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                        <span className="font-bold text-xs text-emerald-800">
                          R$ {order.total.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Chevron no mobile */}
                    <div className="md:hidden self-center text-stone-300">
                      <ChevronRight size={18} />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* =======================================================================
            COLUNA DA DIREITA: DETALHES DO PEDIDO & AÇÕES DE ENVIO WHATSAPP
            (No mobile: preenche 100% da tela quando há um pedido selecionado)
           ======================================================================= */}
        <main className={`flex-1 flex flex-col bg-[#EFEAE2] overflow-hidden ${
          !selectedOrderId ? 'hidden md:flex' : 'flex'
        }`}>
          {!selectedOrder ? (
            /* Tela Vazia no Desktop quando nada está selecionado */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-500">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-[#075E54] flex items-center justify-center mb-4 shadow-sm">
                <MessageCircle size={40} className="stroke-[2.5]" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-stone-800 mb-2">
                Central de Atendimento WhatsApp
              </h3>
              <p className="max-w-md text-sm text-stone-600 leading-relaxed">
                Selecione um cliente na lista ao lado para visualizar a ficha completa do pedido, enviar a confirmação para seu próprio WhatsApp ou conversar com o cliente com mensagens rápidas de 1 clique.
              </p>
            </div>
          ) : (
            /* Painel Completo do Pedido Selecionado */
            <>
              {/* Header da Conversa */}
              <div className="bg-[#f0f2f5] border-b border-stone-300/80 px-3 sm:px-4 py-2.5 flex items-center justify-between shrink-0 shadow-xs z-10">
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Botão de Voltar para a Lista no Mobile */}
                  <button
                    onClick={() => setSelectedOrderId(null)}
                    className="md:hidden p-2 -ml-1 text-[#075E54] hover:bg-stone-200 rounded-full transition-colors shrink-0"
                    aria-label="Voltar para a lista"
                  >
                    <ArrowLeft size={20} className="stroke-[2.5]" />
                  </button>

                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full ${getAvatarColor(selectedOrder.customerName)} text-white font-bold flex items-center justify-center shrink-0 text-sm shadow-xs`}>
                    {getInitials(selectedOrder.customerName)}
                  </div>

                  {/* Nome e Telefone */}
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm sm:text-base text-stone-900 truncate leading-tight">
                      {selectedOrder.customerName}
                    </h3>
                    <p className="text-xs text-stone-500 truncate flex items-center gap-1.5">
                      <span>Pedido #{selectedOrder.id.slice(-6).toUpperCase()}</span>
                      {selectedOrder.customerPhone && (
                        <>
                          <span>•</span>
                          <span className="font-medium text-[#075E54]">{selectedOrder.customerPhone}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Ações Rápidas no Header: Status e Chamar no WhatsApp */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Botão Chamar Cliente no WhatsApp */}
                  {selectedOrder.customerPhone && (
                    <button
                      onClick={() => handleSendToCustomerWhatsApp(selectedOrder, `Olá, ${selectedOrder.customerName.split(' ')[0]}!`)}
                      className="p-2 sm:px-3 sm:py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                      title="Abrir WhatsApp direto do cliente"
                    >
                      <Phone size={14} className="stroke-[2.5]" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </button>
                  )}

                  {/* Copiar Ficha */}
                  <button
                    onClick={() => handleCopySummary(selectedOrder)}
                    className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-200/80 rounded-xl transition-colors cursor-pointer"
                    title="Copiar Ficha do Pedido"
                  >
                    {copiedKey ? <Check size={18} className="text-emerald-600 stroke-[3]" /> : <Copy size={18} />}
                  </button>
                </div>
              </div>

              {/* Barra de Status Rápido do Pedido */}
              <div className="bg-white/80 border-b border-stone-200 px-3 py-2 flex items-center justify-between text-xs flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-stone-700">Status atual:</span>
                  <span className={`font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadgeClass(selectedOrder.status)}`}>
                    {getStatusLabel(selectedOrder.status)}
                  </span>
                </div>

                {/* Botões para alternar status com 1 toque */}
                <div className="flex items-center gap-1">
                  <span className="text-stone-400 text-[11px] hidden sm:inline">Mudar para:</span>
                  {selectedOrder.status !== 'confirmed' && (
                    <button
                      onClick={() => handleStatusChange(selectedOrder.id, 'confirmed')}
                      disabled={isUpdatingStatus}
                      className="px-2 py-1 bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 rounded-md font-semibold text-[11px] transition-all cursor-pointer"
                    >
                      Confirmar
                    </button>
                  )}
                  {selectedOrder.status !== 'delivered' && (
                    <button
                      onClick={() => handleStatusChange(selectedOrder.id, 'delivered')}
                      disabled={isUpdatingStatus}
                      className="px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 rounded-md font-semibold text-[11px] transition-all cursor-pointer"
                    >
                      Entregue
                    </button>
                  )}
                  {selectedOrder.status !== 'cancelled' && (
                    <button
                      onClick={() => handleStatusChange(selectedOrder.id, 'cancelled')}
                      disabled={isUpdatingStatus}
                      className="px-2 py-1 bg-red-50 text-red-800 border border-red-200 hover:bg-red-100 rounded-md font-semibold text-[11px] transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>

              {/* Área Central: Balão do Pedido e Mensagens com Rolagem */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 overscroll-contain">
                
                {/* Alerta / Dica Inicial */}
                <div className="flex justify-center">
                  <span className="bg-white/70 text-stone-600 text-[11px] font-medium px-3 py-1 rounded-lg border border-stone-200 shadow-2xs">
                    Pedido recebido em {selectedOrder.deliveryDate} às {selectedOrder.deliveryTime}
                  </span>
                </div>

                {/* Balão 1: A Ficha Completa do Pedido (Estilo Mensagem de WhatsApp) */}
                <div className="max-w-xl mx-auto bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-stone-200/90 relative text-stone-800">
                  {/* Cabeçalho do Balão */}
                  <div className="border-b border-stone-200 pb-2 mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#075E54] flex items-center justify-center font-bold">
                        📋
                      </div>
                      <h4 className="font-bold text-sm sm:text-base text-stone-900">
                        Ficha do Pedido #{selectedOrder.id.slice(-6).toUpperCase()}
                      </h4>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      R$ {selectedOrder.total.toFixed(2)}
                    </span>
                  </div>

                  {/* Dados do Cliente e Modalidade */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-stone-50 p-3 rounded-xl border border-stone-200 mb-3">
                    <div>
                      <p className="text-stone-500 font-medium">Cliente:</p>
                      <p className="font-bold text-stone-800 text-sm">{selectedOrder.customerName}</p>
                    </div>
                    <div>
                      <p className="text-stone-500 font-medium">Telefone de Contato:</p>
                      <p className="font-bold text-[#075E54] text-sm">
                        {selectedOrder.customerPhone || 'Não informado'}
                      </p>
                    </div>
                    <div>
                      <p className="text-stone-500 font-medium">Data & Horário:</p>
                      <p className="font-semibold text-stone-800">
                        {selectedOrder.deliveryDate} às {selectedOrder.deliveryTime}
                      </p>
                    </div>
                    <div>
                      <p className="text-stone-500 font-medium">Modalidade:</p>
                      <p className="font-semibold text-stone-800 flex items-center gap-1">
                        {selectedOrder.deliveryType === 'pickup' ? '🏪 Retirada no Balcão' : '🛵 Entrega em Domicílio'}
                      </p>
                    </div>
                  </div>

                  {/* Endereço ou Informação de Retirada */}
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-xs mb-3">
                    {selectedOrder.deliveryType === 'pickup' ? (
                      <div>
                        <p className="font-bold text-amber-950 flex items-center gap-1 mb-0.5">
                          <ShoppingBag size={14} className="text-amber-800" /> Retirada no Local:
                        </p>
                        <p className="text-amber-900">O cliente irá retirar no balcão da loja no horário: <strong>{pickUpHours}</strong>.</p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-bold text-stone-900 flex items-center gap-1 mb-0.5">
                          <MapPin size={14} className="text-emerald-700" /> Endereço de Entrega:
                        </p>
                        <p className="text-stone-800 font-medium">
                          {selectedOrder.address.street}, {selectedOrder.address.number}
                          {selectedOrder.address.complement && ` (${selectedOrder.address.complement})`}
                        </p>
                        <p className="text-stone-600">Bairro: {selectedOrder.address.neighborhood}</p>
                      </div>
                    )}
                  </div>

                  {/* Itens do Pedido */}
                  <div className="mb-3">
                    <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                      Itens Solicitados:
                    </p>
                    <div className="space-y-1.5 divide-y divide-stone-100">
                      {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs pt-1.5 first:pt-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-emerald-800 bg-emerald-50 w-5 h-5 rounded flex items-center justify-center text-[11px]">
                              {item.quantity}x
                            </span>
                            <span className="font-medium text-stone-800">{item.name}</span>
                          </div>
                          <span className="font-mono text-stone-600">
                            R$ {(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Resumo Financeiro */}
                  <div className="border-t border-stone-200 pt-2 text-xs space-y-1 bg-stone-50/60 p-2.5 rounded-xl">
                    {selectedOrder.subtotal && (
                      <div className="flex justify-between text-stone-500">
                        <span>Subtotal:</span>
                        <span>R$ {selectedOrder.subtotal.toFixed(2)}</span>
                      </div>
                    )}
                    {selectedOrder.discountAmount && selectedOrder.discountAmount > 0 ? (
                      <div className="flex justify-between text-emerald-700 font-medium">
                        <span>Desconto:</span>
                        <span>-R$ {selectedOrder.discountAmount.toFixed(2)}</span>
                      </div>
                    ) : null}
                    {selectedOrder.deliveryType !== 'pickup' && (
                      <div className="flex justify-between text-stone-500">
                        <span>Taxa de Entrega:</span>
                        <span>{selectedOrder.deliveryFee === 0 ? 'Grátis' : `R$ ${selectedOrder.deliveryFee.toFixed(2)}`}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm font-bold text-stone-900 pt-1 border-t border-stone-200">
                      <span>Total:</span>
                      <span className="text-base text-emerald-800 font-mono">
                        R$ {selectedOrder.total.toFixed(2)}
                      </span>
                    </div>
                    {selectedOrder.paymentMethod && (
                      <div className="pt-1 text-[11px] text-stone-500 flex items-center justify-between">
                        <span>Forma de Pagamento:</span>
                        <span className="font-semibold text-stone-700">{selectedOrder.paymentMethod}</span>
                      </div>
                    )}
                  </div>

                  {/* Rodapé com check duplo */}
                  <div className="flex justify-end items-center gap-1 mt-2 text-[10px] text-stone-400">
                    <span>Pedido gravado no sistema</span>
                    <CheckCheck size={14} className="text-blue-500" />
                  </div>
                </div>

                {/* ===============================================================
                    AÇÃO 1 PRINCIPAL: ENVIAR PEDIDO PARA O MEU PRÓPRIO WHATSAPP
                   =============================================================== */}
                <div className="max-w-xl mx-auto bg-gradient-to-r from-emerald-600 to-[#075E54] text-white p-4 rounded-2xl shadow-md space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <Share2 size={16} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">Enviar Pedido para Mim</h4>
                        <p className="text-[11px] text-emerald-100">
                          Abre seu WhatsApp ({myWhatsappNumber}) com o pedido formatado
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSendToMyWhatsApp(selectedOrder)}
                    className="w-full py-2.5 bg-white text-[#075E54] hover:bg-emerald-50 active:scale-[0.99] font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageCircle size={18} className="fill-[#075E54]" />
                    <span>📲 Enviar Pedido para o Meu WhatsApp</span>
                  </button>
                </div>

                {/* ===============================================================
                    AÇÃO 2: MENSAGENS PRONTAS PARA O CLIENTE (1 CLIQUE)
                   =============================================================== */}
                <div className="max-w-xl mx-auto bg-white rounded-2xl p-4 shadow-sm border border-stone-200/90 space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                    <h4 className="font-bold text-xs sm:text-sm text-stone-900 flex items-center gap-1.5">
                      <Sparkles size={16} className="text-amber-500" />
                      Mensagens Rápidas para o Cliente
                    </h4>
                    <span className="text-[11px] text-stone-400">1 toque no celular</span>
                  </div>

                  {selectedOrder.customerPhone ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* 1. Confirmar Pedido */}
                      <button
                        onClick={() => handleSendToCustomerWhatsApp(selectedOrder, getPreConfiguredMessages(selectedOrder).confirm)}
                        className="p-3 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 text-left transition-all group cursor-pointer active:scale-95"
                      >
                        <p className="font-bold text-xs text-blue-900 flex items-center gap-1.5 mb-1">
                          <span>✅ Confirmar Pedido</span>
                        </p>
                        <p className="text-[11px] text-blue-800/80 line-clamp-2 leading-tight">
                          "Olá! Seu pedido foi confirmado e já está sendo preparado..."
                        </p>
                      </button>

                      {/* 2. Saiu p/ Entrega ou Pronto p/ Retirada */}
                      <button
                        onClick={() => handleSendToCustomerWhatsApp(selectedOrder, getPreConfiguredMessages(selectedOrder).outForDelivery)}
                        className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 text-left transition-all group cursor-pointer active:scale-95"
                      >
                        <p className="font-bold text-xs text-emerald-900 flex items-center gap-1.5 mb-1">
                          <span>{selectedOrder.deliveryType === 'pickup' ? '🏪 Pronto para Retirada' : '🛵 Saiu para Entrega'}</span>
                        </p>
                        <p className="text-[11px] text-emerald-800/80 line-clamp-2 leading-tight">
                          {selectedOrder.deliveryType === 'pickup' 
                            ? '"Olá! Seu pedido já está quentinho e pronto no balcão..."'
                            : '"Olá! Seu pedido acabou de sair para entrega..."'}
                        </p>
                      </button>

                      {/* 3. Enviar Chave Pix */}
                      <button
                        onClick={() => handleSendToCustomerWhatsApp(selectedOrder, getPreConfiguredMessages(selectedOrder).pixPayment)}
                        className="p-3 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 text-left transition-all group cursor-pointer active:scale-95"
                      >
                        <p className="font-bold text-xs text-amber-950 flex items-center gap-1.5 mb-1">
                          <span>🔑 Cobrança Chave Pix</span>
                        </p>
                        <p className="text-[11px] text-amber-900/80 line-clamp-2 leading-tight">
                          "Segue nossa Chave Pix para pagamento do pedido..."
                        </p>
                      </button>

                      {/* 4. Agradecimento */}
                      <button
                        onClick={() => handleSendToCustomerWhatsApp(selectedOrder, getPreConfiguredMessages(selectedOrder).thankYou)}
                        className="p-3 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100/70 text-left transition-all group cursor-pointer active:scale-95"
                      >
                        <p className="font-bold text-xs text-purple-900 flex items-center gap-1.5 mb-1">
                          <span>❤️ Agradecimento</span>
                        </p>
                        <p className="text-[11px] text-purple-800/80 line-clamp-2 leading-tight">
                          "Muito obrigado por comprar na Maná do Céu! Volte sempre..."
                        </p>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-stone-100 rounded-xl text-xs text-stone-500 text-center">
                      Este cliente não cadastrou telefone de contato para envio direto.
                    </div>
                  )}
                </div>

              </div>

              {/* Barra Inferior Estilo Digitação do WhatsApp (Mensagem Personalizada) */}
              <div className="bg-[#f0f2f5] border-t border-stone-300 p-2.5 sm:p-3 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!customMessage.trim()) return;
                    handleSendToCustomerWhatsApp(selectedOrder, customMessage);
                    setCustomMessage('');
                  }}
                  className="max-w-xl mx-auto flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder={selectedOrder.customerPhone ? `Mensagem para ${selectedOrder.customerName.split(' ')[0]}...` : 'Cliente sem telefone...'}
                    disabled={!selectedOrder.customerPhone}
                    className="flex-1 bg-white border border-stone-300 rounded-full px-4 py-2.5 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#075E54] focus:border-transparent disabled:bg-stone-200 disabled:text-stone-400 shadow-2xs"
                  />
                  <button
                    type="submit"
                    disabled={!selectedOrder.customerPhone || !customMessage.trim()}
                    className="w-10 h-10 rounded-full bg-[#075E54] hover:bg-[#064e46] disabled:bg-stone-300 text-white flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-sm active:scale-95"
                    aria-label="Enviar mensagem no WhatsApp"
                  >
                    <Send size={18} className="translate-x-0.5" />
                  </button>
                </form>
              </div>
            </>
          )}
        </main>

      </div>
    </div>
  );
}
