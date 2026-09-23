import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Order, UserDocument, Product, InfoSection, CareGuideData, CareGuideItem, defaultCareGuideData } from '../types';
import { X, Package, Users, Settings, Search, CheckCircle, XCircle, Trash2, Power, Clock, Upload, Utensils, Plus, Archive, Info, ShoppingBag, MapPin, Leaf, Copy, Filter, ArrowUpDown, BookOpen, Snowflake, Flame, Thermometer, Lightbulb, Heart, RotateCcw, AlertCircle, Check, Image as ImageIcon, Sliders, Eye } from 'lucide-react';
import Logo from './Logo';

interface AdminDashboardProps {
  onClose: () => void;
  products: Product[];
}

export default function AdminDashboard({ onClose, products }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'customers' | 'settings' | 'menu' | 'stock' | 'checkout' | 'care_guide'>('dashboard');
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserDocument[]>([]);
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [lateSlotsBlocked, setLateSlotsBlocked] = useState(false);
  const [deliverySlotsEnabled, setDeliverySlotsEnabled] = useState(true);
  const [deliveryPickUpEnabled, setDeliveryPickUpEnabled] = useState(false);
  const [pickUpHours, setPickUpHours] = useState('17:30 às 19:00');
  const [deliveryHours, setDeliveryHours] = useState('13:00 às 19:00');
  const [deliveryFee, setDeliveryFee] = useState(5.00);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(50.00);
  const [homeTitle, setHomeTitle] = useState('Maná');
  const [homeSubtitle, setHomeSubtitle] = useState('Lanches Saudáveis');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoAspectRatio, setLogoAspectRatio] = useState<'16:9' | 'auto' | 'square'>('16:9');
  const [logoScale, setLogoScale] = useState<'md' | 'lg' | 'xl'>('lg');
  const [previewBg, setPreviewBg] = useState<'creme' | 'white' | 'dark'>('creme');
  const [catalogTitle, setCatalogTitle] = useState('Nosso Catálogo');
  const [catalogSubtitle, setCatalogSubtitle] = useState('Escolha seus lanches e faça seu pedido com facilidade.');
  const [catalogBadge, setCatalogBadge] = useState('Produção limitada');
  const [whatsappNumber, setWhatsappNumber] = useState('5535998579552');
  const [deliveryDeadlineDay, setDeliveryDeadlineDay] = useState(4);
  const [deliveryDeadlineHour, setDeliveryDeadlineHour] = useState(21);
  const [loading, setLoading] = useState(true);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showConfirmClearOrders, setShowConfirmClearOrders] = useState(false);
  const [showConfirmClearCustomers, setShowConfirmClearCustomers] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  const [specialTitle, setSpecialTitle] = useState('');
  const [specialBadgeText, setSpecialBadgeText] = useState('Especial Maná da Semana');
  const [specialDescription, setSpecialDescription] = useState('');
  const [specialImageUrl, setSpecialImageUrl] = useState('');
  const [specialIsActive, setSpecialIsActive] = useState(false);
  const [savingSpecial, setSavingSpecial] = useState(false);
  
  const [infoBannerTitle, setInfoBannerTitle] = useState('');
  const [infoBannerSections, setInfoBannerSections] = useState<InfoSection[]>([]);
  const [savingInfoBanner, setSavingInfoBanner] = useState(false);
  
  const [promoName, setPromoName] = useState('');
  const [promoPercentage, setPromoPercentage] = useState(10);
  const [promoMinAmount, setPromoMinAmount] = useState(100);
  const [promoIsActive, setPromoIsActive] = useState(false);
  const [savingPromo, setSavingPromo] = useState(false);

  const [careGuideData, setCareGuideData] = useState<CareGuideData>(defaultCareGuideData);
  const [savingCareGuide, setSavingCareGuide] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [stockSearchTerm, setStockSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>('all');
  const [userSortField, setUserSortField] = useState<'orders' | 'name' | 'date'>('date');
  const [userSortDirection, setUserSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  useEffect(() => {
    const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(fetchedOrders);
      setLoading(false);
    });

    const qUsers = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      const fetchedUsers = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as UserDocument[];
      setUsers(fetchedUsers);
    });

    const unsubStore = onSnapshot(doc(db, 'settings', 'store'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIsStoreOpen(data.isOpen !== false);
        setLateSlotsBlocked(data.lateSlotsBlocked === true);
        setDeliverySlotsEnabled(data.deliverySlotsEnabled !== false);
        setDeliveryPickUpEnabled(data.deliveryPickUpEnabled === true);
        setPickUpHours(data.pickUpHours || '17:30 às 19:00');
        setWhatsappNumber(data.whatsappNumber || '5535998579552');
        setDeliveryDeadlineDay(data.deadlineDay !== undefined ? data.deadlineDay : 4);
        setDeliveryDeadlineHour(data.deadlineHour !== undefined ? data.deadlineHour : 21);
        setDeliveryFee(data.deliveryFee !== undefined ? data.deliveryFee : 5.00);
        setFreeShippingThreshold(data.freeShippingThreshold !== undefined ? data.freeShippingThreshold : 50.00);
        setDeliveryHours(data.deliveryHours || '13:00 às 19:00');
        setHomeTitle(data.homeTitle || 'Maná');
        setHomeSubtitle(data.homeSubtitle || 'Lanches Saudáveis');
        setLogoUrl(data.logoUrl || '');
        setLogoAspectRatio(data.logoAspectRatio || '16:9');
        setLogoScale(data.logoScale || 'lg');
        setCatalogTitle(data.catalogTitle || 'Nosso Catálogo');
        setCatalogSubtitle(data.catalogSubtitle || 'Escolha seus lanches e faça seu pedido com facilidade.');
        setCatalogBadge(data.catalogBadge || 'Produção limitada');
      } else {
        setIsStoreOpen(true);
        setLateSlotsBlocked(false);
        setDeliverySlotsEnabled(true);
      }
    });

    const unsubSpecial = onSnapshot(doc(db, 'settings', 'special'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSpecialTitle(data.title || '');
        setSpecialBadgeText(data.badgeText || 'Especial Maná da Semana');
        setSpecialDescription(data.description || '');
        setSpecialImageUrl(data.imageUrl || '');
        setSpecialIsActive(data.isActive || false);
      }
    });

    const unsubInfoBanner = onSnapshot(doc(db, 'settings', 'info_banner'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setInfoBannerTitle(data.title || 'Informações Importantes');
        setInfoBannerSections(data.sections || []);
      } else {
        setInfoBannerTitle('Informações Importantes');
        setInfoBannerSections([
          {
            id: '1',
            title: 'Pedidos e Entregas',
            content: '• Verifique o prazo limite no carrinho\n• Entregas às sextas-feiras das 13h às 19h',
            icon: 'clock'
          },
          {
            id: '2',
            title: 'Taxa de Entrega',
            content: '• Frete GRÁTIS nas compras acima de R$ 50\n• Para compras menores fixo em R$ 5,00',
            icon: 'shopping-bag'
          }
        ]);
      }
    });

    const unsubPromo = onSnapshot(doc(db, 'settings', 'promotion'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPromoName(data.name || '');
        setPromoPercentage(data.percentage || 10);
        setPromoMinAmount(data.minAmount || 100);
        setPromoIsActive(data.isActive || false);
      }
    });

    const unsubCareGuide = onSnapshot(doc(db, 'settings', 'care_guide'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as CareGuideData;
        setCareGuideData({
          ...defaultCareGuideData,
          ...data,
          items: data.items || defaultCareGuideData.items,
          importantBullets: data.importantBullets || defaultCareGuideData.importantBullets,
          manaWayPoints: data.manaWayPoints || defaultCareGuideData.manaWayPoints
        });
      } else {
        setCareGuideData(defaultCareGuideData);
      }
    });

    return () => {
      unsubOrders();
      unsubUsers();
      unsubStore();
      unsubSpecial();
      unsubInfoBanner();
      unsubPromo();
      unsubCareGuide();
    };
  }, []);

  const toggleStoreStatus = async () => {
    try {
      await setDoc(doc(db, 'settings', 'store'), { isOpen: !isStoreOpen }, { merge: true });
      showToast(`Loja ${!isStoreOpen ? 'aberta' : 'fechada'} com sucesso.`);
    } catch (error) {
      console.error("Error toggling store status:", error);
      showToast("Erro ao alterar status da loja.");
    }
  };

  const toggleLateSlots = async () => {
    try {
      await setDoc(doc(db, 'settings', 'store'), { lateSlotsBlocked: !lateSlotsBlocked }, { merge: true });
      showToast(`Horários após 16:15 ${!lateSlotsBlocked ? 'bloqueados' : 'liberados'} com sucesso.`);
    } catch (error) {
      console.error("Error toggling late slots:", error);
      showToast("Erro ao alterar status dos horários.");
    }
  };

  const toggleDeliverySlots = async () => {
    try {
      await setDoc(doc(db, 'settings', 'store'), { deliverySlotsEnabled: !deliverySlotsEnabled }, { merge: true });
      showToast(`Agendamento por horário ${!deliverySlotsEnabled ? 'ativado' : 'desativado'} com sucesso.`);
    } catch (error) {
      console.error("Error toggling delivery slots:", error);
      showToast("Erro ao alterar status do agendamento.");
    }
  };

  const saveWhatsappNumber = async () => {
    try {
      await setDoc(doc(db, 'settings', 'store'), { 
        whatsappNumber,
        deadlineDay: deliveryDeadlineDay,
        deadlineHour: deliveryDeadlineHour,
        deliveryPickUpEnabled,
        pickUpHours,
        deliveryHours,
        deliveryFee,
        freeShippingThreshold,
        homeTitle,
        homeSubtitle,
        logoUrl,
        logoAspectRatio,
        logoScale,
        catalogTitle,
        catalogSubtitle,
        catalogBadge
      }, { merge: true });
      showToast("Configurações atualizadas com sucesso.");
    } catch (error) {
      console.error("Error saving settings:", error);
      showToast("Erro ao salvar configurações.");
    }
  };

  const toggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'client' : 'admin';
    setIsUpdatingRole(userId);
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      showToast(`Usuário agora é ${newRole === 'admin' ? 'Administrador' : 'Cliente'}.`);
    } catch (error) {
      console.error("Error updating user role:", error);
      showToast("Erro ao atualizar privilégios.");
    } finally {
      setIsUpdatingRole(null);
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
      showToast("Status atualizado com sucesso.");
    } catch (error) {
      console.error("Error updating order:", error);
      showToast("Erro ao atualizar pedido.");
    }
  };

  const clearDeliverySlots = async () => {
    try {
      const slotsSnapshot = await getDocs(collection(db, 'delivery_slots'));
      const deletePromises = slotsSnapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);
      setShowConfirmClear(false);
      showToast("Dia encerrado com sucesso. Horários limpos.");
    } catch (error) {
      console.error("Error clearing slots:", error);
      showToast("Erro ao encerrar o dia.");
    }
  };

  const clearAllOrders = async () => {
    try {
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const deletePromises = ordersSnapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);
      setShowConfirmClearOrders(false);
      showToast("Todos os pedidos foram apagados com sucesso.");
    } catch (error) {
      console.error("Error clearing orders:", error);
      showToast("Erro ao apagar pedidos.");
    }
  };

  const clearAllCustomers = async () => {
    try {
      // Don't delete the main admin
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const deletePromises = usersSnapshot.docs
        .filter(d => d.data().email !== 'brballmaster@gmail.com')
        .map(d => deleteDoc(d.ref));
      
      await Promise.all(deletePromises);
      setShowConfirmClearCustomers(false);
      showToast("Lista de clientes limpa (exceto admin principal).");
    } catch (error) {
      console.error("Error clearing customers:", error);
      showToast("Erro ao limpar clientes.");
    }
  };

  const saveSpecial = async () => {
    setSavingSpecial(true);
    try {
      await setDoc(doc(db, 'settings', 'special'), {
        title: specialTitle,
        badgeText: specialBadgeText,
        description: specialDescription,
        imageUrl: specialImageUrl,
        isActive: specialIsActive
      });
      showToast("Especial da semana atualizado!");
    } catch (error) {
      console.error("Error saving special:", error);
      showToast("Erro ao atualizar especial.");
    } finally {
      setSavingSpecial(false);
    }
  };

  const saveInfoBanner = async () => {
    setSavingInfoBanner(true);
    try {
      await setDoc(doc(db, 'settings', 'info_banner'), {
        title: infoBannerTitle,
        sections: infoBannerSections
      });
      showToast("Banner de informações atualizado!");
    } catch (error) {
      console.error("Error saving info banner:", error);
      showToast("Erro ao salvar informações.");
    } finally {
      setSavingInfoBanner(false);
    }
  };

  const savePromotion = async () => {
    setSavingPromo(true);
    try {
      await setDoc(doc(db, 'settings', 'promotion'), {
        name: promoName,
        percentage: promoPercentage,
        minAmount: promoMinAmount,
        isActive: promoIsActive
      });
      showToast("Promoção atualizada!");
    } catch (error) {
      console.error("Error saving promotion:", error);
      showToast("Erro ao atualizar promoção.");
    } finally {
      setSavingPromo(false);
    }
  };

  const addInfoSection = () => {
    const newSection: InfoSection = {
      id: Date.now().toString(),
      title: '',
      content: '',
      icon: 'info'
    };
    setInfoBannerSections([...infoBannerSections, newSection]);
  };

  const removeInfoSection = (id: string) => {
    setInfoBannerSections(infoBannerSections.filter(s => s.id !== id));
  };

  const updateInfoSection = (id: string, field: keyof InfoSection, value: string) => {
    setInfoBannerSections(infoBannerSections.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const saveCareGuide = async () => {
    setSavingCareGuide(true);
    try {
      await setDoc(doc(db, 'settings', 'care_guide'), careGuideData, { merge: true });
      showToast("Guia de Conservação & Preparo salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar Guia de Conservação:", error);
      showToast("Erro ao salvar o Guia de Conservação.");
    } finally {
      setSavingCareGuide(false);
    }
  };

  const handleAddGuideCard = () => {
    const newCard: CareGuideItem = {
      id: Date.now().toString(),
      title: 'NOVO PRODUTO',
      subtitle: 'Produto congelado',
      storageType: 'Freezer.',
      storageIcon: 'freezer',
      prepareTitle: 'Preparo (direto do congelador):',
      prepareIcon: 'flame',
      airFryer: '180 °C por 6 a 8 minutos.',
      oven: 'Pré-aquecer a 180 °C e assar por 10 a 12 minutos.',
      notes: '',
      flavors: '',
      tip: ''
    };
    setCareGuideData(prev => ({
      ...prev,
      items: [...prev.items, newCard]
    }));
    showToast("Novo card adicionado ao Guia!");
  };

  const handleRemoveGuideCard = (id: string) => {
    setCareGuideData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const handleUpdateGuideCard = (id: string, field: keyof CareGuideItem, value: any) => {
    setCareGuideData(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const handleResetGuideToDefault = () => {
    if (window.confirm("Deseja restaurar todos os cards e textos para o modelo original do encarte Maná?")) {
      setCareGuideData(defaultCareGuideData);
      showToast("Modelo padrão restaurado. Clique em Salvar para gravar.");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        const MAX_DIMENSION = 800;
        if (width > height && width > MAX_DIMENSION) {
          height *= MAX_DIMENSION / width;
          width = MAX_DIMENSION;
        } else if (height > MAX_DIMENSION) {
          width *= MAX_DIMENSION / height;
          height = MAX_DIMENSION;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setSpecialImageUrl(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Se for arquivo vetorial SVG, lê direto como Data URL mantendo nitidez infinita
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoUrl(event.target.result as string);
          showToast("Logo vetorial (SVG) carregada com sucesso!");
        }
      };
      reader.readAsDataURL(file);
      return;
    }

    // Para PNG/WebP/JPEG, redimensiona se for muito grande e salva como PNG com transparência
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_DIMENSION = 600;
        if (width > height && width > MAX_DIMENSION) {
          height *= MAX_DIMENSION / width;
          width = MAX_DIMENSION;
        } else if (height > MAX_DIMENSION) {
          width *= MAX_DIMENSION / height;
          height = MAX_DIMENSION;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/png');
          setLogoUrl(dataUrl);
          showToast("Logo carregada com sucesso!");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProduct) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        const MAX_DIMENSION = 800;
        if (width > height && width > MAX_DIMENSION) {
          height *= MAX_DIMENSION / width;
          width = MAX_DIMENSION;
        } else if (height > MAX_DIMENSION) {
          width *= MAX_DIMENSION / height;
          height = MAX_DIMENSION;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setEditingProduct({ ...editingProduct, imageUrl: dataUrl });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const saveProduct = async () => {
    if (!editingProduct) return;
    setSavingProduct(true);
    try {
      if (editingProduct.id) {
        await setDoc(doc(db, 'products', editingProduct.id), editingProduct);
        showToast("Produto atualizado com sucesso!");
      } else {
        const newProductRef = doc(collection(db, 'products'));
        const newProduct = { ...editingProduct, id: newProductRef.id, isAvailable: true };
        await setDoc(newProductRef, newProduct);
        showToast("Produto adicionado com sucesso!");
      }
      setEditingProduct(null);
    } catch (error) {
      console.error("Error saving product:", error);
      showToast("Erro ao salvar produto.");
    } finally {
      setSavingProduct(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setProductToDelete(product);
    }
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'products', productToDelete.id));
      showToast("Produto excluído com sucesso!");
      setProductToDelete(null);
    } catch (error) {
      console.error("Error deleting product:", error);
      showToast("Erro ao excluir produto.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddProduct = () => {
    setEditingProduct({
      id: '',
      name: '',
      price: 0,
      description: '',
      usage: '',
      imageUrl: '',
      category: '',
      nutrition: ''
    });
  };

  const copyOrderToClipboard = (order: Order) => {
    let text = `PEDIDO #${order.id.slice(-6).toUpperCase()}\n`;
    text += `Cliente: ${order.customerName}\n`;
    text += `Data: ${order.deliveryDate} às ${order.deliveryTime}\n\n`;
    text += `ITENS:\n`;
    order.items.forEach(item => {
      text += `${item.quantity}x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}\n`;
    });
    text += `\nTOTAL: R$ ${order.total.toFixed(2)}\n`;
    text += `Endereço: ${order.address.street}, ${order.address.number} - ${order.address.neighborhood}`;
    
    navigator.clipboard.writeText(text);
    showToast("Resumo copiado!");
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Group orders by delivery time
  const groupedOrders = filteredOrders.reduce((acc, order) => {
    const time = order.deliveryTime || 'Sem horário';
    if (!acc[time]) acc[time] = [];
    acc[time].push(order);
    return acc;
  }, {} as Record<string, Order[]>);

  const sortedTimes = Object.keys(groupedOrders).sort();

  const filteredUsers = React.useMemo(() => {
    const base = users.filter(u => 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return [...base].sort((a, b) => {
      let valA: any;
      let valB: any;

      if (userSortField === 'orders') {
        valA = orders.filter(o => o.userId === a.uid).length;
        valB = orders.filter(o => o.userId === b.uid).length;
      } else if (userSortField === 'name') {
        valA = (a.name || 'Visitante').toLowerCase();
        valB = (b.name || 'Visitante').toLowerCase();
      } else {
        valA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        valB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      }

      if (valA < valB) return userSortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return userSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [users, searchTerm, orders, userSortField, userSortDirection]);

  // Dashboard Metrics
  const totalRevenue = orders
    .filter(o => o.status === 'delivered')
    .reduce((acc, o) => acc + o.total, 0);
  
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  const confirmedOrdersCount = orders.filter(o => o.status === 'confirmed').length;
  
  const topProducts = React.useMemo(() => {
    const counts: Record<string, { name: string, count: number, revenue: number }> = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!counts[item.productId]) {
          counts[item.productId] = { name: item.name, count: 0, revenue: 0 };
        }
        counts[item.productId].count += item.quantity;
        counts[item.productId].revenue += item.price * item.quantity;
      });
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [orders]);

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center p-4 bg-black/50 backdrop-blur-sm">
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg z-[60] animate-in fade-in slide-in-from-top-4">
          {toastMessage}
        </div>
      )}

      {showConfirmClear && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="font-bold text-xl text-red-600 mb-2">Encerrar o Dia</h3>
            <p className="text-mana-text mb-6">Tem certeza que deseja encerrar o dia? Isso limpará todos os horários agendados atuais e não pode ser desfeito.</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowConfirmClear(false)}
                className="px-4 py-2 rounded-lg font-medium text-mana-text hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={clearDeliverySlots}
                className="px-4 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Sim, Encerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmClearOrders && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="font-bold text-xl text-red-600 mb-2">Zerar Pedidos</h3>
            <p className="text-mana-text mb-6">Tem certeza que deseja apagar TODOS os pedidos? Esta ação não pode ser desfeita e todo o histórico será perdido.</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowConfirmClearOrders(false)}
                className="px-4 py-2 rounded-lg font-medium text-mana-text hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={clearAllOrders}
                className="px-4 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Sim, Apagar Tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmClearCustomers && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="font-bold text-xl text-red-600 mb-2">Limpar Clientes</h3>
            <p className="text-mana-text mb-6">Tem certeza que deseja apagar a lista de clientes? O administrador principal não será removido.</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowConfirmClearCustomers(false)}
                className="px-4 py-2 rounded-lg font-medium text-mana-text hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={clearAllCustomers}
                className="px-4 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Sim, Limpar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-6xl bg-mana-bg h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-mana-gold/20 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Logo customUrl={logoUrl} variant="icon" className="h-9 w-9 select-none" alt="Maná Lanches Saudáveis" />
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-mana-green leading-tight">
                Painel Administrativo
              </h2>
              <p className="text-xs text-mana-text-light hidden sm:block">Maná Lanches Saudáveis</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-mana-text-light hover:text-mana-text hover:bg-mana-bg rounded-full transition-all duration-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-mana-gold/20 bg-white px-4 sm:px-6 overflow-x-auto no-scrollbar sticky top-[65px] sm:top-[77px] z-10">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-4 px-6 font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'dashboard' ? 'border-mana-green text-mana-green' : 'border-transparent text-mana-text-light hover:text-mana-text'
            }`}
          >
            <ShoppingBag size={18} />
            Resumo
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-4 px-6 font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'orders' ? 'border-mana-green text-mana-green' : 'border-transparent text-mana-text-light hover:text-mana-text'
            }`}
          >
            <Package size={18} />
            Pedidos
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`py-4 px-6 font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'menu' ? 'border-mana-green text-mana-green' : 'border-transparent text-mana-text-light hover:text-mana-text'
            }`}
          >
            <Utensils size={18} />
            Cardápio
          </button>
          <button
            onClick={() => setActiveTab('stock')}
            className={`py-4 px-6 font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'stock' ? 'border-mana-green text-mana-green' : 'border-transparent text-mana-text-light hover:text-mana-text'
            }`}
          >
            <Archive size={18} />
            Estoque
          </button>
          <button
            onClick={() => setActiveTab('checkout')}
            className={`py-4 px-6 font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'checkout' ? 'border-mana-green text-mana-green' : 'border-transparent text-mana-text-light hover:text-mana-text'
            }`}
          >
            <ShoppingBag size={18} />
            Entregas & Checkout
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`py-4 px-6 font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'customers' ? 'border-mana-green text-mana-green' : 'border-transparent text-mana-text-light hover:text-mana-text'
            }`}
          >
            <Users size={18} />
            Clientes
          </button>
          <button
            onClick={() => setActiveTab('care_guide')}
            className={`py-4 px-6 font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'care_guide' ? 'border-mana-green text-mana-green' : 'border-transparent text-mana-text-light hover:text-mana-text'
            }`}
          >
            <BookOpen size={18} />
            Guia de Preparo
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-4 px-6 font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'settings' ? 'border-mana-green text-mana-green' : 'border-transparent text-mana-text-light hover:text-mana-text'
            }`}
          >
            <Settings size={18} />
            Configurações
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-mana-bg">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-mana-green"></div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-2xl border border-mana-gold/20 shadow-sm">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="bg-mana-green/10 p-3 rounded-xl text-mana-green">
                          <ShoppingBag size={24} />
                        </div>
                        <span className="text-mana-text-light font-medium">Receita Total</span>
                      </div>
                      <h4 className="text-2xl font-bold text-mana-green">R$ {totalRevenue.toFixed(2)}</h4>
                      <p className="text-xs text-mana-text-light mt-1">Apenas pedidos entregues</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-mana-gold/20 shadow-sm">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                          <Package size={24} />
                        </div>
                        <span className="text-mana-text-light font-medium">Total Pedidos</span>
                      </div>
                      <h4 className="text-2xl font-bold text-mana-text">{orders.length}</h4>
                      <p className="text-xs text-mana-text-light mt-1">{pendingOrdersCount} pendentes / {confirmedOrdersCount} confirmados</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-mana-gold/20 shadow-sm">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="bg-purple-50 p-3 rounded-xl text-purple-600">
                          <Users size={24} />
                        </div>
                        <span className="text-mana-text-light font-medium">Clientes</span>
                      </div>
                      <h4 className="text-2xl font-bold text-mana-text">{users.length}</h4>
                      <p className="text-xs text-mana-text-light mt-1">Usuários cadastrados</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-mana-gold/20 shadow-sm">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="bg-mana-gold/10 p-3 rounded-xl text-mana-gold">
                          <Clock size={24} />
                        </div>
                        <span className="text-mana-text-light font-medium">Loja</span>
                      </div>
                      <h4 className={`text-2xl font-bold ${isStoreOpen ? 'text-mana-green' : 'text-red-500'}`}>
                        {isStoreOpen ? 'Aberta' : 'Fechada'}
                      </h4>
                      <p className="text-xs text-mana-text-light mt-1">Status atual do sistema</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Products */}
                    <div className="bg-white p-6 rounded-2xl border border-mana-gold/20 shadow-sm">
                      <h3 className="font-serif text-xl font-bold text-mana-green mb-4 flex items-center gap-2">
                        <Utensils size={20} /> Mais Vendidos
                      </h3>
                      <div className="space-y-4">
                        {topProducts.length > 0 ? (
                          topProducts.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-mana-bg rounded-xl border border-mana-gold/10">
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 bg-mana-gold/20 text-mana-gold rounded-full flex items-center justify-center text-xs font-bold">
                                  {idx + 1}
                                </span>
                                <span className="font-medium text-mana-text">{item.name}</span>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-mana-green">{item.count} un.</p>
                                <p className="text-[10px] text-mana-text-light">R$ {item.revenue.toFixed(2)}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-mana-text-light py-4">Nenhum dado disponível.</p>
                        )}
                      </div>
                    </div>

                    {/* Recent Orders Quick View */}
                    <div className="bg-white p-6 rounded-2xl border border-mana-gold/20 shadow-sm">
                      <h3 className="font-serif text-xl font-bold text-mana-green mb-4 flex items-center gap-2">
                        <Clock size={20} /> Pedidos Recentes
                      </h3>
                      <div className="space-y-3">
                        {orders.slice(0, 5).map((order) => (
                          <div key={order.id} className="flex items-center justify-between p-3 border-b border-mana-gold/10 last:border-0">
                            <div>
                              <p className="font-medium text-mana-text text-sm">{order.customerName}</p>
                              <p className="text-[10px] text-mana-text-light">#{order.id.slice(-6).toUpperCase()} • {order.deliveryTime}</p>
                            </div>
                            <div className="text-right">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {order.status === 'pending' ? 'Pendente' : 
                                 order.status === 'confirmed' ? 'Confirmado' :
                                 order.status === 'delivered' ? 'Entregue' : 'Cancelado'}
                              </span>
                              <p className="text-xs font-bold text-mana-text mt-1">R$ {order.total.toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                        {orders.length === 0 && (
                          <p className="text-center text-mana-text-light py-4">Nenhum pedido recente.</p>
                        )}
                        {orders.length > 5 && (
                          <button 
                            onClick={() => setActiveTab('orders')}
                            className="w-full text-center text-sm text-mana-green font-medium hover:underline pt-2"
                          >
                            Ver todos os pedidos
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-mana-text-light" size={20} />
                      <input
                        type="text"
                        placeholder="Buscar pedidos por nome ou ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-mana-gold/30 focus:outline-none focus:ring-2 focus:ring-mana-green bg-white"
                      />
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="px-4 py-3 rounded-xl border border-mana-gold/30 focus:outline-none focus:ring-2 focus:ring-mana-green bg-white text-sm font-medium"
                      >
                        <option value="all">Todos os Status</option>
                        <option value="pending">Pendentes</option>
                        <option value="confirmed">Confirmados</option>
                        <option value="delivered">Entregues</option>
                        <option value="cancelled">Cancelados</option>
                      </select>
                      <button
                        onClick={() => setShowConfirmClearOrders(true)}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-medium transition-colors border border-red-200"
                      >
                        <Trash2 size={20} />
                        <span className="hidden sm:inline">Zerar Pedidos</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-8">
                    {sortedTimes.length === 0 ? (
                      <p className="text-center text-mana-text-light py-10">Nenhum pedido encontrado.</p>
                    ) : (
                      sortedTimes.map(time => (
                        <div key={time} className="bg-mana-gold/5 rounded-2xl p-4 border border-mana-gold/20">
                          <h3 className="text-xl font-bold text-mana-green mb-4 border-b border-mana-gold/20 pb-2 flex items-center gap-2">
                            <Clock size={20} /> Entrega: {time}
                            <span className="text-sm font-normal text-mana-text-light bg-white border border-mana-gold/30 px-2 py-0.5 rounded-full ml-2">
                              {groupedOrders[time].length} pedido(s)
                            </span>
                          </h3>
                          <div className="grid gap-4">
                            {groupedOrders[time].map((order, index) => (
                              <div key={order.id} className="bg-white rounded-xl p-5 shadow-sm border border-mana-gold/20 flex flex-col md:flex-row gap-6">
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-bold text-lg text-mana-green flex items-center gap-2">
                                      <span className="bg-mana-green text-white text-sm px-2 py-0.5 rounded-md">
                                        Pedido #{index + 1}
                                      </span>
                                      {order.customerName}
                                    </h3>
                                    <span className="text-sm text-mana-text-light font-mono" title="ID do Sistema">
                                      ID: {order.id.slice(-6).toUpperCase()}
                                    </span>
                                    <button 
                                      onClick={() => copyOrderToClipboard(order)}
                                      className="p-1.5 text-mana-gold hover:bg-mana-gold/10 rounded-lg transition-colors"
                                      title="Copiar Resumo"
                                    >
                                      <Copy size={16} />
                                    </button>
                                  </div>
                                  <p className="text-sm text-mana-text-light mb-4">
                                    Data: {order.deliveryDate}
                                  </p>
                                  
                                  <div className="space-y-1 mb-4">
                                    {order.items.map((item, idx) => (
                                      <div key={idx} className="text-sm flex justify-between">
                                        <span>{item.quantity}x {item.name}</span>
                                        <span className="text-mana-text-light">R$ {(item.price * item.quantity).toFixed(2)}</span>
                                      </div>
                                    ))}
                                  </div>
                                  
                                  <div className="flex justify-between items-center pt-4 border-t border-mana-gold/10">
                                    <span className="text-sm text-mana-text-light">Total (com entrega)</span>
                                    <span className="font-bold text-mana-green">R$ {order.total.toFixed(2)}</span>
                                  </div>
                                </div>
                                
                                <div className="w-full md:w-48 flex flex-col gap-2 justify-center border-t md:border-t-0 md:border-l border-mana-gold/10 pt-4 md:pt-0 md:pl-6">
                                  <p className="text-xs font-semibold text-mana-text-light uppercase tracking-wider mb-2">Status do Pedido</p>
                                  <select
                                    value={order.status}
                                    onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                                    className={`w-full p-2 rounded-lg border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-mana-green
                                      ${order.status === 'pending' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : ''}
                                      ${order.status === 'confirmed' ? 'bg-blue-50 border-blue-200 text-blue-800' : ''}
                                      ${order.status === 'delivered' ? 'bg-green-50 border-green-200 text-green-800' : ''}
                                      ${order.status === 'cancelled' ? 'bg-red-50 border-red-200 text-red-800' : ''}
                                    `}
                                  >
                                    <option value="pending">Pendente</option>
                                    <option value="confirmed">Confirmado</option>
                                    <option value="delivered">Entregue</option>
                                    <option value="cancelled">Cancelado</option>
                                  </select>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'customers' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-mana-text-light" size={20} />
                      <input
                        type="text"
                        placeholder="Buscar clientes por nome ou email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-mana-gold/30 focus:outline-none focus:ring-2 focus:ring-mana-green bg-white"
                      />
                    </div>
                    <button
                      onClick={() => setShowConfirmClearCustomers(true)}
                      className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 size={18} />
                      Limpar Clientes
                    </button>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-mana-gold/20 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                          <tr className="bg-mana-gold/10 border-b border-mana-gold/20">
                            <th 
                              className="p-4 font-semibold text-mana-green cursor-pointer hover:bg-mana-gold/5 transition-colors"
                              onClick={() => {
                                if (userSortField === 'name') setUserSortDirection(userSortDirection === 'asc' ? 'desc' : 'asc');
                                else { setUserSortField('name'); setUserSortDirection('asc'); }
                              }}
                            >
                              <div className="flex items-center gap-2">
                                Nome
                                {userSortField === 'name' && <ArrowUpDown size={14} />}
                              </div>
                            </th>
                            <th className="p-4 font-semibold text-mana-green">Email/Origem</th>
                            <th className="p-4 font-semibold text-mana-green">Papel</th>
                            <th className="p-4 font-semibold text-mana-green">Ações</th>
                            <th 
                              className="p-4 font-semibold text-mana-green cursor-pointer hover:bg-mana-gold/5 transition-colors"
                              onClick={() => {
                                if (userSortField === 'orders') setUserSortDirection(userSortDirection === 'asc' ? 'desc' : 'asc');
                                else { setUserSortField('orders'); setUserSortDirection('desc'); }
                              }}
                            >
                              <div className="flex items-center gap-2">
                                Pedidos
                                {userSortField === 'orders' && <ArrowUpDown size={14} />}
                              </div>
                            </th>
                            <th 
                              className="p-4 font-semibold text-mana-green cursor-pointer hover:bg-mana-gold/5 transition-colors"
                              onClick={() => {
                                if (userSortField === 'date') setUserSortDirection(userSortDirection === 'asc' ? 'desc' : 'asc');
                                else { setUserSortField('date'); setUserSortDirection('desc'); }
                              }}
                            >
                              <div className="flex items-center gap-2">
                                Data de Cadastro
                                {userSortField === 'date' && <ArrowUpDown size={14} />}
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map(u => {
                            const userOrdersCount = orders.filter(o => o.userId === u.uid).length;
                            return (
                            <tr key={u.uid} className="border-b border-mana-gold/10 last:border-0 hover:bg-mana-bg/50 transition-colors">
                              <td className="p-4">
                                <div className="flex flex-col">
                                  <span className="text-mana-text font-medium">{u.name || 'Visitante'}</span>
                                  {u.isAnonymous && (
                                    <span className="text-[10px] text-mana-gold font-bold uppercase tracking-wider">Anônimo</span>
                                  )}
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex flex-col">
                                  <span className="text-mana-text-light text-sm">{u.email || 'Sem email'}</span>
                                  {u.source && (
                                    <span className="text-[10px] text-mana-green font-medium">Origem: {u.source}</span>
                                  )}
                                </div>
                              </td>
                              <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                                  {u.role === 'admin' ? 'Admin' : 'Cliente'}
                                </span>
                              </td>
                              <td className="p-4">
                                <button
                                  onClick={() => toggleUserRole(u.uid, u.role)}
                                  disabled={isUpdatingRole === u.uid || u.email === 'brballmaster@gmail.com'}
                                  className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                                    u.role === 'admin' 
                                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                                      : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                  {isUpdatingRole === u.uid ? '...' : u.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                                </button>
                              </td>
                              <td className="p-4">
                                <span className="text-sm font-bold text-mana-green">{userOrdersCount}</span>
                              </td>
                              <td className="p-4 text-mana-text-light text-sm">
                                {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString('pt-BR') : 'N/A'}
                              </td>
                            </tr>
                          )})}
                        </tbody>
                      </table>
                    </div>
                    {filteredUsers.length === 0 && (
                      <p className="text-center text-mana-text-light py-10">Nenhum cliente encontrado.</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'menu' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-serif text-2xl font-bold text-mana-green">Gerenciar Cardápio</h3>
                    {!editingProduct && (
                      <button
                        onClick={handleAddProduct}
                        className="bg-mana-green hover:bg-mana-green-dark text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                      >
                        <Plus size={18} />
                        Novo Produto
                      </button>
                    )}
                  </div>

                  {editingProduct ? (
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-mana-gold/20">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-serif text-xl font-bold text-mana-green">
                          {editingProduct.id ? `Editando: ${editingProduct.name}` : 'Novo Produto'}
                        </h4>
                        <button 
                          onClick={() => setEditingProduct(null)}
                          className="text-mana-text-light hover:text-mana-text p-2"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-mana-text mb-1">Nome do Produto</label>
                            <input
                              type="text"
                              value={editingProduct.name}
                              onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                              className="w-full px-4 py-2 rounded-lg border border-mana-gold/30 focus:outline-none focus:ring-2 focus:ring-mana-green bg-white"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-mana-text mb-1">Preço (R$)</label>
                              <input
                                type="number"
                                step="0.01"
                                value={editingProduct.price}
                                onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})}
                                className="w-full px-4 py-2 rounded-lg border border-mana-gold/30 focus:outline-none focus:ring-2 focus:ring-mana-green bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-mana-text mb-1">Categoria</label>
                              <input
                                type="text"
                                value={editingProduct.category}
                                onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                                className="w-full px-4 py-2 rounded-lg border border-mana-gold/30 focus:outline-none focus:ring-2 focus:ring-mana-green bg-white"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-mana-text mb-1">Descrição</label>
                            <textarea
                              value={editingProduct.description}
                              onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                              rows={3}
                              className="w-full px-4 py-2 rounded-lg border border-mana-gold/30 focus:outline-none focus:ring-2 focus:ring-mana-green bg-white resize-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-mana-text mb-1">Modo de Preparo / Uso</label>
                            <textarea
                              value={editingProduct.usage}
                              onChange={(e) => setEditingProduct({...editingProduct, usage: e.target.value})}
                              rows={3}
                              className="w-full px-4 py-2 rounded-lg border border-mana-gold/30 focus:outline-none focus:ring-2 focus:ring-mana-green bg-white resize-none"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-mana-text mb-1">Ingredientes (Opcional)</label>
                            <textarea
                              value={editingProduct.ingredients || ''}
                              onChange={(e) => setEditingProduct({...editingProduct, ingredients: e.target.value})}
                              rows={3}
                              className="w-full px-4 py-2 rounded-lg border border-mana-gold/30 focus:outline-none focus:ring-2 focus:ring-mana-green bg-white resize-none"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-mana-text mb-1">Informação Nutricional (Opcional)</label>
                            <textarea
                              value={editingProduct.nutrition || ''}
                              onChange={(e) => setEditingProduct({...editingProduct, nutrition: e.target.value})}
                              rows={2}
                              className="w-full px-4 py-2 rounded-lg border border-mana-gold/30 focus:outline-none focus:ring-2 focus:ring-mana-green bg-white resize-none"
                              placeholder="Ex: 250kcal, 15g Proteína, 30g Carb..."
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-6">
                        <label className="block text-sm font-medium text-mana-text mb-1">Imagem do Produto</label>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <div className="flex-1">
                            <input
                              type="url"
                              value={editingProduct.imageUrl}
                              onChange={(e) => setEditingProduct({...editingProduct, imageUrl: e.target.value})}
                              placeholder="Colar URL da imagem..."
                              className="w-full px-4 py-2 rounded-lg border border-mana-gold/30 focus:outline-none focus:ring-2 focus:ring-mana-green bg-white"
                            />
                          </div>
                          <div className="flex items-center justify-center text-sm font-medium text-mana-text-light">OU</div>
                          <div className="relative flex-1">
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={handleProductImageUpload}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="w-full px-4 py-2 rounded-lg border border-mana-gold/30 bg-mana-bg text-mana-text flex items-center justify-center gap-2 hover:bg-mana-gold/10 transition-colors">
                              <Upload size={18} />
                              <span>Enviar do Computador</span>
                            </div>
                          </div>
                        </div>
                      </div>

                        {editingProduct.imageUrl && (
                          <div className="mt-4 border border-mana-gold/20 rounded-lg overflow-hidden h-40 relative w-40">
                            <img src={editingProduct.imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/400x400?text=Imagem+Inv%C3%A1lida')} />
                            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">Preview</div>
                          </div>
                        )}

                        <div className="pt-4 border-t border-mana-gold/20 flex justify-end gap-3">
                          <button
                            onClick={() => setEditingProduct(null)}
                            className="px-6 py-2 rounded-lg font-medium text-mana-text hover:bg-gray-100 transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={saveProduct}
                            disabled={savingProduct}
                            className="bg-mana-green hover:bg-mana-green-dark text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-70 flex items-center gap-2"
                          >
                            {savingProduct ? (
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <CheckCircle size={18} />
                            )}
                            Salvar Produto
                          </button>
                        </div>
                      </div>
                    ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {products.map(product => (
                        <div key={product.id} className="bg-white rounded-xl p-4 shadow-sm border border-mana-gold/20 flex gap-4 items-center">
                          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-mana-gold/10">
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-mana-green">{product.name}</h4>
                            <p className="text-sm text-mana-text-light">{product.category}</p>
                            <p className="font-medium text-mana-text mt-1">R$ {product.price.toFixed(2)}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingProduct(product)}
                              className="p-2 bg-mana-gold/10 text-mana-gold hover:bg-mana-gold hover:text-white rounded-lg transition-colors"
                              title="Editar Produto"
                            >
                              <Settings size={20} />
                            </button>
                            <button
                              onClick={() => deleteProduct(product.id)}
                              className="p-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                              title="Excluir Produto"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'stock' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h3 className="font-serif text-2xl font-bold text-mana-green">Gerenciar Estoque</h3>
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-mana-text-light" size={18} />
                      <input
                        type="text"
                        placeholder="Buscar no estoque..."
                        value={stockSearchTerm}
                        onChange={(e) => setStockSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-mana-gold/30 focus:outline-none focus:ring-2 focus:ring-mana-green bg-white text-sm"
                      />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-mana-gold/20 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left min-w-[700px]">
                        <thead className="bg-mana-bg border-b border-mana-gold/20">
                          <tr>
                            <th className="p-4 font-serif text-mana-green font-bold">Produto</th>
                            <th className="p-4 font-serif text-mana-green font-bold">Categoria</th>
                            <th className="p-4 font-serif text-mana-green font-bold text-center">Quantidade</th>
                            <th className="p-4 font-serif text-mana-green font-bold text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-mana-gold/10">
                          {products
                            .filter(p => p.name.toLowerCase().includes(stockSearchTerm.toLowerCase()) || p.category.toLowerCase().includes(stockSearchTerm.toLowerCase()))
                            .map(product => {
                            const hasStock = product.stockQuantity === undefined || product.stockQuantity === null || product.stockQuantity > 0;
                            const isAvailable = product.isAvailable !== false && hasStock;
                            return (
                              <tr key={product.id} className="hover:bg-mana-bg/50 transition-colors">
                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-mana-gold/10">
                                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                    </div>
                                    <span className="font-medium text-mana-text">{product.name}</span>
                                  </div>
                                </td>
                                <td className="p-4 text-mana-text-light">{product.category}</td>
                                <td className="p-4 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="∞"
                                    value={product.stockQuantity ?? ''}
                                    onChange={async (e) => {
                                      const val = e.target.value;
                                      const newStock = val === '' ? null : parseInt(val, 10);
                                      try {
                                        await updateDoc(doc(db, 'products', product.id), { stockQuantity: newStock });
                                      } catch (error) {
                                        console.error("Error updating stock quantity:", error);
                                        showToast("Erro ao atualizar quantidade.");
                                      }
                                    }}
                                    className="w-20 px-2 py-1 text-center border border-mana-gold/30 rounded-lg focus:outline-none focus:border-mana-green focus:ring-1 focus:ring-mana-green bg-white"
                                  />
                                </td>
                                <td className="p-4 text-right">
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                      type="checkbox" 
                                      className="sr-only peer"
                                      checked={product.isAvailable !== false}
                                      onChange={async (e) => {
                                        try {
                                          await updateDoc(doc(db, 'products', product.id), { isAvailable: e.target.checked });
                                          showToast(`Status de ${product.name} atualizado.`);
                                        } catch (error) {
                                          console.error("Error updating stock:", error);
                                          showToast("Erro ao atualizar status.");
                                        }
                                      }}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mana-green"></div>
                                    <span className={`ml-3 text-sm font-medium ${isAvailable ? 'text-mana-green' : 'text-red-500'}`}>
                                      {isAvailable ? 'Em Estoque' : 'Esgotado'}
                                    </span>
                                  </label>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              
              {activeTab === 'checkout' && (
                <div className="space-y-6 animate-in fade-in duration-500 pb-20">
                  {/* Status Geral */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button 
                      onClick={toggleStoreStatus}
                      className={`flex items-center justify-between p-6 rounded-2xl border transition-all ${
                        isStoreOpen 
                        ? 'bg-mana-green/5 border-mana-green/20 text-mana-green hover:bg-mana-green/10' 
                        : 'bg-red-50 border-red-100 text-red-600 hover:bg-red-100'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${isStoreOpen ? 'bg-mana-green text-white' : 'bg-red-600 text-white'}`}>
                          <Power size={24} />
                        </div>
                        <div className="text-left">
                          <h3 className="font-bold text-lg">Loja está {isStoreOpen ? 'Aberta' : 'Fechada'}</h3>
                          <p className="text-sm opacity-80">Clique para {isStoreOpen ? 'fechar' : 'abrir'} o sistema</p>
                        </div>
                      </div>
                    </button>

                    <button 
                      onClick={toggleLateSlots}
                      className={`flex items-center justify-between p-6 rounded-2xl border transition-all ${
                        lateSlotsBlocked 
                        ? 'bg-red-50 border-red-100 text-red-600' 
                        : 'bg-mana-green/5 border-mana-green/20 text-mana-green'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${lateSlotsBlocked ? 'bg-red-600 text-white' : 'bg-mana-green text-white'}`}>
                          <Clock size={24} />
                        </div>
                        <div className="text-left">
                          <h3 className="font-bold text-lg">Horários Tarde: {lateSlotsBlocked ? 'Bloqueados' : 'Liberados'}</h3>
                          <p className="text-sm opacity-80">Slots após 16:15</p>
                        </div>
                      </div>
                      <div className={`w-12 h-6 rounded-full relative transition-colors ${lateSlotsBlocked ? 'bg-red-600' : 'bg-mana-green'}`}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${lateSlotsBlocked ? 'left-7' : 'left-1'}`} />
                      </div>
                    </button>
                  </div>

                  {/* Configurações de Frete e Horários */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-mana-gold/20">
                    <h3 className="font-serif text-xl font-bold text-mana-green mb-4">Frete e Horários</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-mana-text mb-1">Taxa de Entrega (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={deliveryFee}
                          onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-2 rounded-lg border border-mana-gold/30 focus:outline-none focus:ring-2 focus:ring-mana-green bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-mana-text mb-1">Valor Mínimo p/ Frete Grátis (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={freeShippingThreshold}
                          onChange={(e) => setFreeShippingThreshold(parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-2 rounded-lg border border-mana-gold/30 focus:outline-none focus:ring-2 focus:ring-mana-green bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="bg-mana-gold/10 p-2 rounded-lg text-mana-gold">
                          <MapPin size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-mana-text">Opção de Retirada</h4>
                          <p className="text-xs text-mana-text-light">Permitir que o cliente retire o pedido no local</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setDeliveryPickUpEnabled(!deliveryPickUpEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${deliveryPickUpEnabled ? 'bg-mana-green' : 'bg-gray-200'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${deliveryPickUpEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-mana-text mb-1">Janela de Entrega</label>
                        <input
                          type="text"
                          value={deliveryHours}
                          onChange={(e) => setDeliveryHours(e.target.value)}
                          placeholder="Ex: das 13:00 às 19:00"
                          className="w-full px-4 py-2 rounded-lg border border-mana-gold/30 focus:outline-none focus:ring-2 focus:ring-mana-green bg-white"
                        />
                        <p className="text-xs text-mana-text-light mt-2">
                          Esta informação aparecerá para o cliente quando ele selecionar "Entrega".
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-mana-text mb-1">Janela de Retirada</label>
                        <input
                          type="text"
                          value={pickUpHours}
                          onChange={(e) => setPickUpHours(e.target.value)}
                          placeholder="Ex: das 17:30 às 19:00"
                          className="w-full px-4 py-2 rounded-lg border border-mana-gold/30 focus:outline-none focus:ring-2 focus:ring-mana-green bg-white"
                        />
                        <p className="text-xs text-mana-text-light mt-2">
                          Esta informação aparecerá para o cliente quando ele selecionar "Retirada".
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Agendamento Status */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-mana-gold/20">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${deliverySlotsEnabled ? 'bg-mana-green/10 text-mana-green' : 'bg-red-50 text-red-600'}`}>
                          <Clock size={24} />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-mana-text">Agendamento por Horário</h3>
                          <p className="text-sm text-mana-text-light">Exibir slots de 15min na sexta-feira</p>
                        </div>
                      </div>
                      <button 
                        onClick={toggleDeliverySlots}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${deliverySlotsEnabled ? 'bg-mana-green' : 'bg-gray-200'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${deliverySlotsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-mana-gold/20 bg-mana-bg rounded-xl gap-4">
                      <div className="flex-1">
                        <h4 className="font-bold text-mana-green">Encerrar o Dia</h4>
                        <p className="text-sm text-mana-text-light mt-1">Limpa todos os agendamentos feitos para hoje (libera os horários).</p>
                      </div>
                      <button 
                        onClick={() => setShowConfirmClear(true)}
                        className="bg-white hover:bg-mana-gold/5 text-mana-gold border border-mana-gold/30 px-6 py-2.5 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap shadow-sm"
                      >
                        <Power size={18} />
                        Limpar Horários
                      </button>
                    </div>
                  </div>

                  {/* Regras de Prazo de Entrega */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-mana-gold/20">
                    <h3 className="font-serif text-xl font-bold text-mana-green mb-4">Regras de Prazo de Entrega</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-mana-text mb-1">Dia Limite para Pedidos (Semana Atual)</label>
                        <select
                          value={deliveryDeadlineDay}
                          onChange={(e) => setDeliveryDeadlineDay(parseInt(e.target.value))}
                          className="w-full px-4 py-2 rounded-lg border border-mana-gold/30 focus:outline-none focus:ring-2 focus:ring-mana-green bg-white"
                        >
                          <option value={0}>Domingo</option>
                          <option value={1}>Segunda-feira</option>
                          <option value={2}>Terça-feira</option>
                          <option value={3}>Quarta-feira</option>
                          <option value={4}>Quinta-feira</option>
                          <option value={5}>Sexta-feira</option>
                          <option value={6}>Sábado</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-mana-text mb-1">Horário Limite (0-23h)</label>
                        <input
                          type="number"
                          min="0"
                          max="23"
                          value={deliveryDeadlineHour}
                          onChange={(e) => setDeliveryDeadlineHour(parseInt(e.target.value))}
                          className="w-full px-4 py-2 rounded-lg border border-mana-gold/30 focus:outline-none focus:ring-2 focus:ring-mana-green bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp de Pedidos */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-mana-gold/20">
                    <h3 className="font-serif text-xl font-bold text-mana-green mb-4">Número para Recebimento de Pedidos</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-mana-text mb-1">WhatsApp (com DDD e 55)</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={whatsappNumber}
                            onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, ''))}
                            placeholder="Ex: 5535998579552"
                            className="flex-1 px-4 py-2 rounded-lg border border-mana-gold/30 focus:outline-none focus:ring-2 focus:ring-mana-green bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Banner de Informações da Entrega */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-mana-gold/20">
                    <h3 className="font-serif text-xl font-bold text-mana-green mb-4">Banner de Informações da Entrega</h3>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-mana-text mb-1">Título do Banner</label>
                        <input
                          type="text"
                          value={infoBannerTitle}
                          onChange={(e) => setInfoBannerTitle(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-mana-gold/30 focus:outline-none focus:ring-2 focus:ring-mana-green bg-white"
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-mana-text">Seções</h4>
                          <button 
                            onClick={addInfoSection}
                            className="text-mana-green hover:bg-mana-green/10 px-3 py-1 rounded-lg text-sm font-bold transition-colors flex items-center gap-1"
                          >
                            <Plus size={16} /> Adicionar Seção
                          </button>
                        </div>

                        {infoBannerSections.map((section) => (
                          <div key={section.id} className="p-4 border border-mana-gold/10 bg-mana-bg rounded-xl relative group">
                            <button 
                              onClick={() => removeInfoSection(section.id)}
                              className="absolute top-2 right-2 text-red-500 hover:bg-red-50 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={16} />
                            </button>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-mana-text-light uppercase mb-1">Título</label>
                                <input
                                  type="text"
                                  value={section.title}
                                  onChange={(e) => updateInfoSection(section.id, 'title', e.target.value)}
                                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-mana-gold/30 bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-mana-text-light uppercase mb-1">Ícone</label>
                                <select
                                  value={section.icon}
                                  onChange={(e) => updateInfoSection(section.id, 'icon', e.target.value)}
                                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-mana-gold/30 bg-white"
                                >
                                  <option value="clock">Relógio</option>
                                  <option value="shopping-bag">Sacola</option>
                                  <option value="map-pin">Localização</option>
                                  <option value="info">Informação</option>
                                </select>
                              </div>
                              <div className="sm:col-span-2">
                                <label className="block text-xs font-bold text-mana-text-light uppercase mb-1">Conteúdo</label>
                                <textarea
                                  value={section.content}
                                  onChange={(e) => updateInfoSection(section.id, 'content', e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-mana-gold/30 bg-white resize-none"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end pt-4 border-t border-mana-gold/20">
                        <button
                          onClick={saveInfoBanner}
                          disabled={savingInfoBanner}
                          className="bg-mana-gold hover:bg-mana-gold-dark text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-70 flex items-center gap-2"
                        >
                          {savingInfoBanner ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle size={18} />}
                          Salvar Banner
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Promotion Settings */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-mana-gold/20">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="bg-mana-green/10 p-2 rounded-lg text-mana-green">
                          <Leaf size={24} />
                        </div>
                        <div>
                          <h4 className="font-serif text-xl font-bold text-mana-green">Promoção de Desconto</h4>
                          <p className="text-xs text-mana-text-light">Configure descontos automáticos por valor de compra</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setPromoIsActive(!promoIsActive)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${promoIsActive ? 'bg-mana-green' : 'bg-gray-200'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${promoIsActive ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-mana-text mb-1">Nome da Promoção (Ex: Semana da Criança)</label>
                        <input
                          type="text"
                          value={promoName}
                          onChange={(e) => setPromoName(e.target.value)}
                          placeholder="Digite o nome que aparecerá para o cliente"
                          className="w-full px-4 py-2 rounded-lg border border-mana-gold/30 focus:outline-none focus:ring-2 focus:ring-mana-green bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-mana-text mb-1">Porcentagem de Desconto</label>
                          <select
                            value={promoPercentage}
                            onChange={(e) => setPromoPercentage(parseInt(e.target.value))}
                            className="w-full px-4 py-2 rounded-lg border border-mana-gold/30 focus:outline-none focus:ring-2 focus:ring-mana-green bg-white"
                          >
                            {[5, 10, 15, 20, 25, 30, 40, 50].map(p => (
                              <option key={p} value={p}>{p}%</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-mana-text mb-1">Valor Mínimo (R$)</label>
                          <input
                            type="number"
                            value={promoMinAmount}
                            onChange={(e) => setPromoMinAmount(parseFloat(e.target.value) || 0)}
                            className="w-full px-4 py-2 rounded-lg border border-mana-gold/30 focus:outline-none focus:ring-2 focus:ring-mana-green bg-white"
                          />
                        </div>
                      </div>

                      <button
                        onClick={savePromotion}
                        disabled={savingPromo}
                        className="w-full bg-mana-green hover:bg-mana-green-dark text-white py-3 rounded-xl font-bold transition-all shadow-md shadow-mana-green/20 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {savingPromo ? 'Salvando...' : 'Salvar Promoção'}
                      </button>
                    </div>
                  </div>

                  {/* Banner Especial */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-mana-gold/20">
                    <h3 className="font-serif text-xl font-bold text-mana-green mb-4">Banner: Especial Maná da Semana</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-4">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={specialIsActive}
                            onChange={(e) => setSpecialIsActive(e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mana-green"></div>
                        </label>
                        <span className="font-medium text-mana-text">Ativar Banner na Tela Inicial</span>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-mana-text mb-1">Texto da Etiqueta (Badge)</label>
                        <input
                          type="text"
                          value={specialBadgeText}
                          onChange={(e) => setSpecialBadgeText(e.target.value)}
                          placeholder="Ex: Especial Maná da Semana"
                          className="w-full px-4 py-2 rounded-lg border border-mana-gold/30 focus:outline-none focus:ring-2 focus:ring-mana-green bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-mana-text mb-1">Título do Especial</label>
                        <input
                          type="text"
                          value={specialTitle}
                          onChange={(e) => setSpecialTitle(e.target.value)}
                          placeholder="Ex: Combo Família"
                          className="w-full px-4 py-2 rounded-lg border border-mana-gold/30 focus:outline-none focus:ring-2 focus:ring-mana-green bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-mana-text mb-1">Descrição / Informações</label>
                        <textarea
                          value={specialDescription}
                          onChange={(e) => setSpecialDescription(e.target.value)}
                          placeholder="Descreva o especial da semana..."
                          rows={3}
                          className="w-full px-4 py-2 rounded-lg border border-mana-gold/30 focus:outline-none focus:ring-2 focus:ring-mana-green bg-white resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-mana-text mb-1">Imagem do Banner</label>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <div className="flex-1">
                            <input
                              type="url"
                              value={specialImageUrl}
                              onChange={(e) => setSpecialImageUrl(e.target.value)}
                              placeholder="Colar URL da imagem..."
                              className="w-full px-4 py-2 rounded-lg border border-mana-gold/30 focus:outline-none focus:ring-2 focus:ring-mana-green bg-white"
                            />
                          </div>
                          <div className="flex items-center justify-center text-sm font-medium text-mana-text-light">OU</div>
                          <div className="relative flex-1">
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="w-full px-4 py-2 rounded-lg border border-mana-gold/30 bg-mana-bg text-mana-text flex items-center justify-center gap-2 hover:bg-mana-gold/10 transition-colors">
                              <Upload size={18} />
                              <span>Enviar do Computador</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {specialImageUrl && (
                        <div className="mt-4 border border-mana-gold/20 rounded-lg overflow-hidden h-40 relative">
                          <img src={specialImageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/800x400?text=Imagem+Inv%C3%A1lida')} />
                          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">Preview da Imagem</div>
                        </div>
                      )}

                      <div className="pt-4 border-t border-mana-gold/20 flex justify-end">
                        <button
                          onClick={saveSpecial}
                          disabled={savingSpecial}
                          className="bg-mana-green hover:bg-mana-green-dark text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-70 flex items-center gap-2"
                        >
                          {savingSpecial ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <CheckCircle size={18} />
                          )}
                          Salvar Banner
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Floating Save Button */}
                  <div className="fixed bottom-8 right-8 z-50">
                    <button
                      onClick={saveWhatsappNumber}
                      className="bg-mana-green hover:bg-mana-green-dark text-white p-4 rounded-full shadow-2xl flex items-center gap-2 transition-all transform hover:scale-105"
                      title="Salvar todas as configurações desta aba"
                    >
                      <CheckCircle size={24} />
                      <span className="font-bold pr-2">Salvar Configurações</span>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  {/* Personalização da Página Inicial e Identidade Visual */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-mana-gold/20">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-serif text-xl font-bold text-mana-green">Personalização da Loja & Identidade Visual</h3>
                        <p className="text-xs text-mana-text-light mt-1">Configure os textos de apresentação da loja, catálogo e logotipo oficial.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-mana-text mb-1">Título do Header (Maná)</label>
                        <input
                          type="text"
                          value={homeTitle}
                          onChange={(e) => setHomeTitle(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-mana-gold/30 focus:outline-none focus:ring-2 focus:ring-mana-green bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-mana-text mb-1">Subtítulo do Header</label>
                        <input
                          type="text"
                          value={homeSubtitle}
                          onChange={(e) => setHomeSubtitle(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-mana-gold/30 focus:outline-none focus:ring-2 focus:ring-mana-green bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-mana-text mb-1">Título do Catálogo</label>
                        <input
                          type="text"
                          value={catalogTitle}
                          onChange={(e) => setCatalogTitle(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-mana-gold/30 focus:outline-none focus:ring-2 focus:ring-mana-green bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-mana-text mb-1">Subtítulo do Catálogo</label>
                        <input
                          type="text"
                          value={catalogSubtitle}
                          onChange={(e) => setCatalogSubtitle(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-mana-gold/30 focus:outline-none focus:ring-2 focus:ring-mana-green bg-white"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-mana-text mb-1">Etiqueta do Catálogo (Ex: Produção limitada)</label>
                        <input
                          type="text"
                          value={catalogBadge}
                          onChange={(e) => setCatalogBadge(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-mana-gold/30 focus:outline-none focus:ring-2 focus:ring-mana-green bg-white"
                        />
                      </div>

                      {/* Logotipo da Aplicação */}
                      <div className="md:col-span-2 pt-6 border-t border-mana-gold/20">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <label className="text-base font-bold text-mana-green">Logotipo da Aplicação & Cabeçalho</label>
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                                Suporte a 16:9
                              </span>
                            </div>
                            <p className="text-xs text-mana-text-light mt-0.5">
                              Envie ou cole a imagem da sua logo. O espaço no cabeçalho foi otimizado especialmente para proporções horizontais 16:9, sem espremer ou distorcer.
                            </p>
                          </div>
                          {logoUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setLogoUrl('');
                                showToast("Logo padrão restaurada. Lembre-se de salvar.");
                              }}
                              className="text-xs text-red-600 hover:text-red-800 font-semibold underline self-start sm:self-auto transition-colors flex items-center gap-1"
                            >
                              <RotateCcw size={13} />
                              Restaurar Logo Padrão
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                          {/* Coluna de Controles (Upload, URL, Formato e Tamanho) */}
                          <div className="lg:col-span-7 space-y-4">
                            <div>
                              <label className="block text-xs font-semibold text-mana-text mb-1">
                                Link direto da imagem (URL externa):
                              </label>
                              <input
                                type="text"
                                value={logoUrl}
                                onChange={(e) => setLogoUrl(e.target.value)}
                                placeholder="https://exemplo.com/minha-logo-16-9.png"
                                className="w-full px-4 py-2 text-sm rounded-lg border border-mana-gold/30 focus:outline-none focus:ring-2 focus:ring-mana-green bg-white shadow-inner"
                              />
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                              <label className="relative inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-mana-gold/40 bg-mana-bg hover:bg-mana-gold/15 text-mana-green font-semibold text-xs cursor-pointer transition-colors shadow-sm">
                                <Upload size={16} className="text-mana-gold" />
                                <span>Enviar Imagem (Computador / Celular)</span>
                                <input
                                  type="file"
                                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                  onChange={handleLogoUpload}
                                  className="sr-only"
                                />
                              </label>
                              <span className="text-[11px] text-mana-text-light">
                                Ideal: 16:9 com fundo transparente (.png, .webp, .svg)
                              </span>
                            </div>

                            {/* Seletor de Formato da Logo */}
                            <div className="pt-2">
                              <label className="block text-xs font-semibold text-mana-text mb-2">
                                Formato e Proporção do Logotipo:
                              </label>
                              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                <button
                                  type="button"
                                  onClick={() => setLogoAspectRatio('16:9')}
                                  className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                                    logoAspectRatio === '16:9'
                                      ? 'border-mana-green bg-mana-green/10 ring-2 ring-mana-green/30'
                                      : 'border-mana-gold/30 bg-white hover:bg-mana-bg'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-mana-green">16:9 Widescreen</span>
                                    <span className="text-[10px] font-bold bg-mana-green text-white px-1.5 py-0.5 rounded">
                                      Amplo
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-mana-text-light leading-tight">
                                    Espaço horizontal expandido. Ideal para banners, letreiros e logos 16:9.
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setLogoAspectRatio('square')}
                                  className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                                    logoAspectRatio === 'square'
                                      ? 'border-mana-green bg-mana-green/10 ring-2 ring-mana-green/30'
                                      : 'border-mana-gold/30 bg-white hover:bg-mana-bg'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-mana-green">Quadrada / Ícone</span>
                                    <span className="text-[10px] font-medium text-mana-text-light px-1.5 py-0.5 rounded bg-gray-100">
                                      1:1
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-mana-text-light leading-tight">
                                    Formato padrão compacto para ícones circulares ou quadrados.
                                  </span>
                                </button>
                              </div>
                            </div>

                            {/* Seletor de Escala / Tamanho no Cabeçalho */}
                            <div className="pt-1">
                              <label className="block text-xs font-semibold text-mana-text mb-2">
                                Tamanho da Logo no Cabeçalho:
                              </label>
                              <div className="inline-flex rounded-lg border border-mana-gold/30 bg-white p-1 gap-1">
                                <button
                                  type="button"
                                  onClick={() => setLogoScale('md')}
                                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                    logoScale === 'md'
                                      ? 'bg-mana-green text-white shadow-sm'
                                      : 'text-mana-text-light hover:text-mana-text'
                                  }`}
                                >
                                  Médio
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setLogoScale('lg')}
                                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                    logoScale === 'lg'
                                      ? 'bg-mana-green text-white shadow-sm'
                                      : 'text-mana-text-light hover:text-mana-text'
                                  }`}
                                >
                                  Grande (Ideal 16:9)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setLogoScale('xl')}
                                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                    logoScale === 'xl'
                                      ? 'bg-mana-green text-white shadow-sm'
                                      : 'text-mana-text-light hover:text-mana-text'
                                  }`}
                                >
                                  Extra Grande
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Coluna de Prévia Ampla 16:9 em Tempo Real */}
                          <div className="lg:col-span-5 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Eye size={14} className="text-mana-gold" />
                                <span className="text-xs uppercase font-bold text-mana-green tracking-wide">
                                  Prévia no Cabeçalho (16:9)
                                </span>
                              </div>
                              {/* Alternador de Fundo para Testar Transparência */}
                              <div className="flex items-center gap-1 bg-white border border-mana-gold/30 rounded-lg p-0.5">
                                <button
                                  type="button"
                                  onClick={() => setPreviewBg('creme')}
                                  title="Fundo Creme Maná"
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                                    previewBg === 'creme' ? 'bg-[#FAF7F0] text-mana-green shadow-xs border border-mana-gold/30' : 'text-gray-500'
                                  }`}
                                >
                                  Creme
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPreviewBg('white')}
                                  title="Fundo Branco"
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                                    previewBg === 'white' ? 'bg-white text-gray-900 shadow-xs border border-gray-300' : 'text-gray-500'
                                  }`}
                                >
                                  Branco
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPreviewBg('dark')}
                                  title="Fundo Escuro"
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                                    previewBg === 'dark' ? 'bg-gray-800 text-white shadow-xs' : 'text-gray-500'
                                  }`}
                                >
                                  Escuro
                                </button>
                              </div>
                            </div>

                            {/* Caixa de Simulação com Proporção 16:9 Ampla */}
                            <div className={`w-full aspect-[16/9] rounded-2xl border-2 border-dashed border-mana-gold/50 flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors shadow-sm ${
                              previewBg === 'creme' ? 'bg-[#FAF7F0]' : previewBg === 'white' ? 'bg-white' : 'bg-gray-900'
                            }`}>
                              {/* Badge de Proporção */}
                              <div className="absolute top-2 left-2.5 bg-black/40 backdrop-blur-xs text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                                16:9 • {logoAspectRatio === '16:9' ? 'Widescreen Ativo' : 'Padrão'}
                              </div>

                              <div className="w-full h-full flex items-center justify-center p-1">
                                <Logo 
                                  customUrl={logoUrl} 
                                  aspectRatio={logoAspectRatio}
                                  scale={logoScale}
                                  className={
                                    !logoUrl
                                      ? "h-14 sm:h-16 w-auto object-contain select-none"
                                      : logoAspectRatio === '16:9'
                                        ? (logoScale === 'xl'
                                            ? "h-full max-h-24 w-auto max-w-full object-contain select-none"
                                            : logoScale === 'md'
                                              ? "h-full max-h-16 w-auto max-w-full object-contain select-none"
                                              : "h-full max-h-20 w-auto max-w-full object-contain select-none"
                                          )
                                        : "h-14 sm:h-16 w-auto object-contain select-none"
                                  } 
                                  alt="Prévia Maná" 
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-mana-text-light px-1">
                              <span>
                                {logoUrl ? '✓ Logo personalizada configurada' : '✓ Logotipo oficial padrão ativo'}
                              </span>
                              <span className="font-medium text-mana-gold">
                                {logoAspectRatio === '16:9' ? 'Área ampla 16:9 liberada' : 'Área 1:1'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-mana-gold/20 flex justify-end">
                      <button
                        type="button"
                        onClick={saveWhatsappNumber}
                        className="bg-mana-green hover:bg-mana-green-dark text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-mana-green/20 flex items-center gap-2 text-sm"
                      >
                        <CheckCircle size={18} />
                        <span>Salvar Personalização</span>
                      </button>
                    </div>
                  </div>

                  {/* Danger Zone moved to bottom of settings */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-red-100">
                    <h3 className="font-serif text-xl font-bold text-red-600 mb-4 flex items-center gap-2">
                      <Trash2 size={20} /> Zona de Perigo
                    </h3>
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-red-200 bg-red-50 rounded-xl gap-4">
                        <div className="flex-1">
                          <h4 className="font-bold text-red-800">Limpar Histórico de Pedidos</h4>
                          <p className="text-sm text-red-600 mt-1">Exclui permanentemente todos os pedidos concluídos/cancelados do banco de dados.</p>
                        </div>
                        <button 
                          onClick={() => setShowConfirmClearOrders(true)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap shadow-sm"
                        >
                          <Trash2 size={18} />
                          Limpar Pedidos
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Floating Save Button */}
                  <div className="fixed bottom-8 right-8 z-50">
                    <button
                      onClick={saveWhatsappNumber}
                      className="bg-mana-green hover:bg-mana-green-dark text-white p-4 rounded-full shadow-2xl flex items-center gap-2 transition-all transform hover:scale-105"
                      title="Salvar todas as configurações desta aba"
                    >
                      <CheckCircle size={24} />
                      <span className="font-bold pr-2">Salvar Configurações</span>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'care_guide' && (
                <div className="space-y-6 animate-in fade-in duration-500 pb-20">
                  {/* Topo da Aba */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-mana-gold/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-serif text-xl sm:text-2xl font-bold text-mana-green flex items-center gap-2">
                        <BookOpen size={24} /> Guia Maná (Conservação & Preparo)
                      </h3>
                      <p className="text-xs sm:text-sm text-mana-text-light mt-1">
                        Edite os cards dos produtos, orientações de air fryer/forno/freezer, avisos importantes e dados do encarte oficial.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleResetGuideToDefault}
                        className="px-4 py-2 text-xs font-semibold text-mana-text-light hover:text-mana-text bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex items-center gap-1.5"
                        title="Restaura os dados originais do encarte"
                      >
                        <RotateCcw size={14} />
                        Restaurar Padrão
                      </button>

                      <button
                        type="button"
                        onClick={saveCareGuide}
                        disabled={savingCareGuide}
                        className="bg-mana-green hover:bg-mana-green-dark text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md shadow-mana-green/20 flex items-center gap-2 disabled:opacity-50"
                      >
                        <CheckCircle size={18} />
                        <span>{savingCareGuide ? 'Salvando...' : 'Salvar Guia'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Bloco 1: Textos do Cabeçalho e Introdução */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-mana-gold/20 space-y-4">
                    <h4 className="font-serif font-bold text-mana-green text-base border-b border-mana-gold/20 pb-2">
                      Cabeçalho & Apresentação do Guia
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-mana-text mb-1">Título do Guia</label>
                        <input
                          type="text"
                          value={careGuideData.headerTitle}
                          onChange={(e) => setCareGuideData(prev => ({ ...prev, headerTitle: e.target.value }))}
                          placeholder="Ex: GUIA MANÁ"
                          className="w-full px-3 py-2 text-sm rounded-lg border border-mana-gold/30 focus:ring-2 focus:ring-mana-green bg-white"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-mana-text mb-1">Subtítulo / Mensagem de Boas-Vindas</label>
                        <textarea
                          rows={2}
                          value={careGuideData.headerSubtitle}
                          onChange={(e) => setCareGuideData(prev => ({ ...prev, headerSubtitle: e.target.value }))}
                          placeholder="Ex: Sabor e equilíbrio na sua rotina. Obrigada por escolher a Maná! ♥"
                          className="w-full px-3 py-2 text-sm rounded-lg border border-mana-gold/30 focus:ring-2 focus:ring-mana-green bg-white"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-xs font-bold text-mana-text mb-1">Frase Introdutória</label>
                        <input
                          type="text"
                          value={careGuideData.introText}
                          onChange={(e) => setCareGuideData(prev => ({ ...prev, introText: e.target.value }))}
                          placeholder="Ex: Confira abaixo como conservar e preparar os seus lanchinhos."
                          className="w-full px-3 py-2 text-sm rounded-lg border border-mana-gold/30 focus:ring-2 focus:ring-mana-green bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bloco 2: Cards Editáveis de Produtos */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-mana-gold/20 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-mana-gold/20 pb-4">
                      <div>
                        <h4 className="font-serif font-bold text-mana-green text-lg">
                          Cards de Produtos ({careGuideData.items.length})
                        </h4>
                        <p className="text-xs text-mana-text-light">
                          Cada card representa um lanche no encarte com suas regras de conservação e preparo.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddGuideCard}
                        className="bg-mana-green hover:bg-mana-green-dark text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all self-start sm:self-auto"
                      >
                        <Plus size={16} />
                        Adicionar Novo Card
                      </button>
                    </div>

                    <div className="space-y-6">
                      {careGuideData.items.map((item, index) => (
                        <div 
                          key={item.id}
                          className="rounded-2xl border border-mana-gold/30 bg-[#FAF8F3] p-5 relative transition-all hover:border-mana-green/40 shadow-sm"
                        >
                          {/* Topo do Card de Produto */}
                          <div className="flex items-center justify-between gap-3 pb-3 mb-4 border-b border-mana-gold/20">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-mana-green text-white text-xs font-bold flex items-center justify-center">
                                {index + 1}
                              </span>
                              <span className="font-serif font-bold text-mana-green text-base">
                                {item.title || 'Produto sem título'}
                              </span>
                              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-mana-gold/15 text-mana-gold">
                                {item.subtitle || 'Subtítulo'}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveGuideCard(item.id)}
                              className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                              title="Excluir este card"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          {/* Campos do Card */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                            <div>
                              <label className="block font-bold text-mana-text mb-1">Título do Produto</label>
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) => handleUpdateGuideCard(item.id, 'title', e.target.value)}
                                placeholder="Ex: MINI PIZZAS"
                                className="w-full px-3 py-2 rounded-lg border border-mana-gold/30 bg-white font-semibold"
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-mana-text mb-1">Subtítulo do Produto</label>
                              <input
                                type="text"
                                value={item.subtitle}
                                onChange={(e) => handleUpdateGuideCard(item.id, 'subtitle', e.target.value)}
                                placeholder="Ex: Produto congelado ou Produto fresco"
                                className="w-full px-3 py-2 rounded-lg border border-mana-gold/30 bg-white"
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-mana-text mb-1">Ícone de Conservação</label>
                              <select
                                value={item.storageIcon || 'freezer'}
                                onChange={(e) => handleUpdateGuideCard(item.id, 'storageIcon', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-mana-gold/30 bg-white"
                              >
                                <option value="freezer">Floco de Neve (Freezer)</option>
                                <option value="thermometer">Termômetro (Local Fresco)</option>
                              </select>
                            </div>

                            <div className="sm:col-span-2 lg:col-span-3">
                              <label className="block font-bold text-mana-text mb-1">Instrução de Conservar</label>
                              <input
                                type="text"
                                value={item.storageType}
                                onChange={(e) => handleUpdateGuideCard(item.id, 'storageType', e.target.value)}
                                placeholder="Ex: Freezer. ou Mantenha na embalagem original bem fechada..."
                                className="w-full px-3 py-2 rounded-lg border border-mana-gold/30 bg-white"
                              />
                            </div>

                            <div className="sm:col-span-2 lg:col-span-3 pt-2">
                              <label className="inline-flex items-center gap-2 cursor-pointer font-bold text-mana-green">
                                <input
                                  type="checkbox"
                                  checked={item.readyToEat || false}
                                  onChange={(e) => handleUpdateGuideCard(item.id, 'readyToEat', e.target.checked)}
                                  className="rounded text-mana-green focus:ring-mana-green w-4 h-4"
                                />
                                <span>Produto pronto para consumo imediato (Ex: Bolachinhas, dispensando aquecimento)</span>
                              </label>
                            </div>

                            {!item.readyToEat && (
                              <>
                                <div>
                                  <label className="block font-bold text-mana-text mb-1">Título da Seção de Preparo</label>
                                  <input
                                    type="text"
                                    value={item.prepareTitle || ''}
                                    onChange={(e) => handleUpdateGuideCard(item.id, 'prepareTitle', e.target.value)}
                                    placeholder="Ex: Preparo (direto do congelador): ou Para consumir:"
                                    className="w-full px-3 py-2 rounded-lg border border-mana-gold/30 bg-white"
                                  />
                                </div>

                                <div>
                                  <label className="block font-bold text-mana-text mb-1">Ícone de Preparo</label>
                                  <select
                                    value={item.prepareIcon || 'flame'}
                                    onChange={(e) => handleUpdateGuideCard(item.id, 'prepareIcon', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-mana-gold/30 bg-white"
                                  >
                                    <option value="flame">Chama / Fogo</option>
                                    <option value="utensils">Talheres (Para consumir)</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block font-bold text-mana-text mb-1">Air Fryer (Tempo/Graus)</label>
                                  <input
                                    type="text"
                                    value={item.airFryer || ''}
                                    onChange={(e) => handleUpdateGuideCard(item.id, 'airFryer', e.target.value)}
                                    placeholder="Ex: 180 °C por 6 a 8 minutos."
                                    className="w-full px-3 py-2 rounded-lg border border-mana-gold/30 bg-white"
                                  />
                                </div>

                                <div>
                                  <label className="block font-bold text-mana-text mb-1">Forno Convencional (Tempo/Graus)</label>
                                  <input
                                    type="text"
                                    value={item.oven || ''}
                                    onChange={(e) => handleUpdateGuideCard(item.id, 'oven', e.target.value)}
                                    placeholder="Ex: Pré-aquecer a 180 °C e assar por 10 a 12 minutos."
                                    className="w-full px-3 py-2 rounded-lg border border-mana-gold/30 bg-white"
                                  />
                                </div>

                                <div>
                                  <label className="block font-bold text-mana-text mb-1">Descongelamento na Geladeira</label>
                                  <input
                                    type="text"
                                    value={item.thawRefrigerator || ''}
                                    onChange={(e) => handleUpdateGuideCard(item.id, 'thawRefrigerator', e.target.value)}
                                    placeholder="Ex: Retire da embalagem e deixe na geladeira por algumas horas..."
                                    className="w-full px-3 py-2 rounded-lg border border-mana-gold/30 bg-white"
                                  />
                                </div>

                                <div>
                                  <label className="block font-bold text-mana-text mb-1">Micro-ondas</label>
                                  <input
                                    type="text"
                                    value={item.microwave || ''}
                                    onChange={(e) => handleUpdateGuideCard(item.id, 'microwave', e.target.value)}
                                    placeholder="Ex: Retire da embalagem e aqueça por 30 a 40 segundos..."
                                    className="w-full px-3 py-2 rounded-lg border border-mana-gold/30 bg-white"
                                  />
                                </div>

                                <div className="sm:col-span-2 lg:col-span-3">
                                  <label className="block font-bold text-mana-text mb-1">Observações de Preparo (Ex: Ponto do queijo ou da massa)</label>
                                  <input
                                    type="text"
                                    value={item.notes || ''}
                                    onChange={(e) => handleUpdateGuideCard(item.id, 'notes', e.target.value)}
                                    placeholder="Ex: (O tempo pode variar de acordo com o aparelho. Estarão prontas quando o queijo derreter...)"
                                    className="w-full px-3 py-2 rounded-lg border border-mana-gold/30 bg-white"
                                  />
                                </div>

                                <div className="sm:col-span-2 lg:col-span-3">
                                  <label className="block font-bold text-amber-800 mb-1">Aviso de Evitar Micro-ondas (Opcional)</label>
                                  <input
                                    type="text"
                                    value={item.avoidMicrowaveNotice || ''}
                                    onChange={(e) => handleUpdateGuideCard(item.id, 'avoidMicrowaveNotice', e.target.value)}
                                    placeholder="Ex: Dica: evite o micro-ondas para manter a textura perfeita e a massa no ponto."
                                    className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-amber-50/50"
                                  />
                                </div>
                              </>
                            )}

                            <div>
                              <label className="block font-bold text-mana-text mb-1">Sabores (Exibido na tarja cinza)</label>
                              <input
                                type="text"
                                value={item.flavors || ''}
                                onChange={(e) => handleUpdateGuideCard(item.id, 'flavors', e.target.value)}
                                placeholder="Ex: Sabores: queijo com tomate | frango com queijo"
                                className="w-full px-3 py-2 rounded-lg border border-mana-gold/30 bg-white"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="block font-bold text-mana-text mb-1">Dica de Consumo (Exibido com ícone de lâmpada)</label>
                              <input
                                type="text"
                                value={item.tip || ''}
                                onChange={(e) => handleUpdateGuideCard(item.id, 'tip', e.target.value)}
                                placeholder="Ex: Dica: consuma ainda morno para uma experiência mais saborosa!"
                                className="w-full px-3 py-2 rounded-lg border border-mana-gold/30 bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bloco 3: Seções Finais do Encarte */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-mana-gold/20 space-y-6">
                    <h4 className="font-serif font-bold text-mana-green text-base border-b border-mana-gold/20 pb-2">
                      Cards Inferiores & Rodapé do Encarte
                    </h4>

                    {/* Card 1: Importante */}
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs uppercase text-mana-text tracking-wide flex items-center gap-1.5">
                          <AlertCircle size={16} className="text-mana-gold" />
                          Tópicos de "IMPORTANTE"
                        </span>
                        <button
                          type="button"
                          onClick={() => setCareGuideData(prev => ({ ...prev, importantBullets: [...prev.importantBullets, 'Novo aviso importante...'] }))}
                          className="text-xs text-mana-green hover:underline font-bold"
                        >
                          + Adicionar Tópico
                        </button>
                      </div>

                      {careGuideData.importantBullets.map((bullet, bIdx) => (
                        <div key={bIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={bullet}
                            onChange={(e) => {
                              const newBullets = [...careGuideData.importantBullets];
                              newBullets[bIdx] = e.target.value;
                              setCareGuideData(prev => ({ ...prev, importantBullets: newBullets }));
                            }}
                            className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-mana-gold/30 bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newBullets = careGuideData.importantBullets.filter((_, i) => i !== bIdx);
                              setCareGuideData(prev => ({ ...prev, importantBullets: newBullets }));
                            }}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Remover"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Card 2: O Jeito Maná */}
                    <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs uppercase text-mana-green tracking-wide flex items-center gap-1.5">
                          <Check size={16} className="text-mana-green" />
                          Tópicos de "O JEITO MANÁ"
                        </span>
                        <button
                          type="button"
                          onClick={() => setCareGuideData(prev => ({ ...prev, manaWayPoints: [...prev.manaWayPoints, 'Novo ponto forte Maná...'] }))}
                          className="text-xs text-mana-green hover:underline font-bold"
                        >
                          + Adicionar Tópico
                        </button>
                      </div>

                      {careGuideData.manaWayPoints.map((point, pIdx) => (
                        <div key={pIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={point}
                            onChange={(e) => {
                              const newPoints = [...careGuideData.manaWayPoints];
                              newPoints[pIdx] = e.target.value;
                              setCareGuideData(prev => ({ ...prev, manaWayPoints: newPoints }));
                            }}
                            className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-mana-gold/30 bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newPoints = careGuideData.manaWayPoints.filter((_, i) => i !== pIdx);
                              setCareGuideData(prev => ({ ...prev, manaWayPoints: newPoints }));
                            }}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Remover"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}

                      <div>
                        <label className="block text-xs font-bold text-mana-green mb-1">Frase Afetuosa em Destaque</label>
                        <input
                          type="text"
                          value={careGuideData.manaWayNote}
                          onChange={(e) => setCareGuideData(prev => ({ ...prev, manaWayNote: e.target.value }))}
                          placeholder="Ex: Feito com cuidado, para você. ♥"
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-mana-gold/30 bg-white font-medium italic"
                        />
                      </div>
                    </div>

                    {/* Card 3: Instagram e Rodapé */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-mana-text mb-1">Perfil do Instagram (Card 3)</label>
                        <input
                          type="text"
                          value={careGuideData.instagramHandle}
                          onChange={(e) => setCareGuideData(prev => ({ ...prev, instagramHandle: e.target.value }))}
                          placeholder="Ex: @manalanches"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-mana-gold/30 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-mana-text mb-1">Frase Final do Rodapé (com folhinhas)</label>
                        <input
                          type="text"
                          value={careGuideData.footerThankYou}
                          onChange={(e) => setCareGuideData(prev => ({ ...prev, footerThankYou: e.target.value }))}
                          placeholder="Ex: Obrigada por fazer parte deste começo! ♥"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-mana-gold/30 bg-white font-serif italic"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-mana-gold/20">
                      <button
                        type="button"
                        onClick={saveCareGuide}
                        disabled={savingCareGuide}
                        className="bg-mana-green hover:bg-mana-green-dark text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md flex items-center gap-2"
                      >
                        <CheckCircle size={18} />
                        <span>{savingCareGuide ? 'Gravando...' : 'Salvar Alterações do Guia'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Floating Save Button para care_guide */}
                  <div className="fixed bottom-8 right-8 z-50">
                    <button
                      onClick={saveCareGuide}
                      disabled={savingCareGuide}
                      className="bg-mana-green hover:bg-mana-green-dark text-white p-4 rounded-full shadow-2xl flex items-center gap-2 transition-all transform hover:scale-105 disabled:opacity-50"
                      title="Salvar alterações do Guia"
                    >
                      <CheckCircle size={24} />
                      <span className="font-bold pr-2">{savingCareGuide ? 'Salvando...' : 'Salvar Guia'}</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {/* Modal de Confirmação de Exclusão de Produto */}
      {productToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-mana-gold/20 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-serif font-bold text-mana-green text-center mb-2">Excluir Produto?</h3>
            <p className="text-mana-text-light text-center mb-6">
              Tem certeza que deseja excluir <span className="font-bold text-mana-text">"{productToDelete.name}"</span>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setProductToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 rounded-xl border border-mana-gold/30 text-mana-text font-medium hover:bg-mana-bg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteProduct}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 shadow-lg shadow-red-500/20 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Excluir'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
