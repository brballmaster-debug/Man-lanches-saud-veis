/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShoppingBag, Clock, Leaf, Plus, Minus, X, Info, ChevronRight, MapPin, LogIn, LogOut, Package, Settings, CheckCircle, Trash2, Activity, Smartphone, Banknote, CreditCard, BookOpen } from 'lucide-react';
import { products as defaultProducts } from './data';
import { Product, CartItem, InfoSection, Promotion } from './types';
import { auth, db, signInWithGoogle, logOut, signInAnonymously } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, runTransaction, collection, serverTimestamp, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import OrderHistory from './components/OrderHistory';
import AdminDashboard from './components/AdminDashboard';
import AuthModal from './components/AuthModal';
import CareGuide from './components/CareGuide';
import Logo from './components/Logo';

const DELIVERY_SLOTS = [
  '13:00', '13:15', '13:30', '13:45',
  '14:00', '14:15', '14:30', '14:45',
  '15:00', '15:15', '15:30', '15:45',
  '16:00', '16:15', '16:30', '16:45',
  '17:00', '17:15', '17:30', '17:45',
  '18:00', '18:15', '18:30', '18:45',
  '19:00'
];

const DAYS_PT = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

export default function App() {
  const [deadlineDay, setDeadlineDay] = useState(4);
  const [deadlineHour, setDeadlineHour] = useState(21);

  const getNextFridayDate = () => {
    // Get current time in Brasília (UTC-3)
    const now = new Date();
    // Using America/Sao_Paulo which is the standard for Brasília time
    const brTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    
    const day = brTime.getDay(); // 0 (Sun) to 6 (Sat)
    const hours = brTime.getHours();
    const minutes = brTime.getMinutes();
    const seconds = brTime.getSeconds();

    let daysToAdd = (5 - day + 7) % 7;

    const isPastDeadline = 
      (day === deadlineDay && (hours > deadlineHour || (hours === deadlineHour && (minutes > 0 || seconds > 0)))) ||
      (day > deadlineDay && day <= 5);

    if (isPastDeadline) {
      daysToAdd += 7;
    }

    const deliveryDate = new Date(brTime);
    deliveryDate.setDate(brTime.getDate() + daysToAdd);
    
    const d = deliveryDate.getDate().toString().padStart(2, '0');
    const m = (deliveryDate.getMonth() + 1).toString().padStart(2, '0');
    const y = deliveryDate.getFullYear();
    
    return `${d}/${m}/${y}`;
  };
  const deliveryDate = React.useMemo(() => getNextFridayDate(), [deadlineDay, deadlineHour]);

  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCareGuide, setShowCareGuide] = useState(false);
  const [slotCounts, setSlotCounts] = useState<Record<string, number>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const MAX_ORDERS_PER_SLOT = 1; // Limite de pedidos por horário

  useEffect(() => {
    let isInitialLoad = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);

      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.name) setCustomerName(prev => prev || userData.name);
            if (userData.address) setAddress(prev => ({ ...prev, ...userData.address }));
            
            if (userData.role === 'admin' || currentUser.email === 'brballmaster@gmail.com') {
              setIsAdmin(true);
            } else {
              setIsAdmin(false);
            }
          } else {
            // New user, check if email is admin
            if (currentUser.email === 'brballmaster@gmail.com') {
              setIsAdmin(true);
            } else {
              setIsAdmin(false);
            }
          }
        } catch (e) {
          console.error("Error fetching user data", e);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
        
        // Only try auto-login on initial load if no user is found
        if (isInitialLoad) {
          isInitialLoad = false;
          const params = new URLSearchParams(window.location.search);
          const source = params.get('ref') || params.get('source') || params.get('utm_source') || '';
          try {
            await signInAnonymously(source);
          } catch (error) {
            // Error is handled in firebase.ts
          }
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [lateSlotsBlocked, setLateSlotsBlocked] = useState(false);
  const [deliverySlotsEnabled, setDeliverySlotsEnabled] = useState(true);
  const [deliveryPickUpEnabled, setDeliveryPickUpEnabled] = useState(false);
  const [pickUpHours, setPickUpHours] = useState('17:30 às 19:00');
  const [deliveryHours, setDeliveryHours] = useState('13:00 às 19:00');
  const [deliveryFeeSetting, setDeliveryFeeSetting] = useState(5.00);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(50.00);
  const [homeTitle, setHomeTitle] = useState('Maná');
  const [homeSubtitle, setHomeSubtitle] = useState('Lanches Saudáveis');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoAspectRatio, setLogoAspectRatio] = useState<'16:9' | 'auto' | 'square'>('16:9');
  const [logoScale, setLogoScale] = useState<'md' | 'lg' | 'xl'>('lg');
  const [catalogTitle, setCatalogTitle] = useState('Nosso Catálogo');
  const [catalogSubtitle, setCatalogSubtitle] = useState('Escolha seus lanches e faça seu pedido com facilidade.');
  const [catalogBadge, setCatalogBadge] = useState('Produção limitada');
  const [whatsappNumber, setWhatsappNumber] = useState('5535998579552');
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [specialOfTheDay, setSpecialOfTheDay] = useState<any>(null);
  const [infoBannerData, setInfoBannerData] = useState<any>({
    title: '',
    sections: []
  });
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('Usuário aceitou a instalação');
    }
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  useEffect(() => {
    const storeRef = doc(db, 'settings', 'store');
    const unsubStore = onSnapshot(storeRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIsStoreOpen(data.isOpen !== false);
        setLateSlotsBlocked(data.lateSlotsBlocked === true);
        setDeliverySlotsEnabled(data.deliverySlotsEnabled !== false);
        setDeliveryPickUpEnabled(data.deliveryPickUpEnabled === true);
        setPickUpHours(data.pickUpHours || '17:30 às 19:00');
        setWhatsappNumber(data.whatsappNumber || '5535998579552');
        setDeadlineDay(data.deadlineDay !== undefined ? data.deadlineDay : 4);
        setDeadlineHour(data.deadlineHour !== undefined ? data.deadlineHour : 21);
        setDeliveryFeeSetting(data.deliveryFee !== undefined ? data.deliveryFee : 5.00);
        setFreeShippingThreshold(data.freeShippingThreshold !== undefined ? data.freeShippingThreshold : 50.00);
        setDeliveryHours(data.deliveryHours || '13:00 às 19:00');
        setPickUpHours(data.pickUpHours || '17:30 às 19:00');
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

    const specialRef = doc(db, 'settings', 'special');
    const unsubSpecial = onSnapshot(specialRef, (docSnap) => {
      if (docSnap.exists()) {
        setSpecialOfTheDay(docSnap.data());
      } else {
        setSpecialOfTheDay(null);
      }
    });

    const unsubInfoBanner = onSnapshot(doc(db, 'settings', 'info_banner'), (docSnap) => {
      if (docSnap.exists()) {
        setInfoBannerData(docSnap.data());
      }
    });

    const unsubPromo = onSnapshot(doc(db, 'settings', 'promotion'), (docSnap) => {
      if (docSnap.exists()) {
        setPromotion(docSnap.data() as Promotion);
      } else {
        setPromotion(null);
      }
    });

    const productsRef = collection(db, 'products');
    const unsubProducts = onSnapshot(productsRef, async (snapshot) => {
      if (snapshot.empty) {
        // Seed database with default products if empty
        try {
          for (const prod of defaultProducts) {
            await setDoc(doc(db, 'products', prod.id), prod);
          }
        } catch (e) {
          console.error("Error seeding products", e);
        }
      } else {
        const fetchedProducts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        setDbProducts(fetchedProducts);
      }
    });

    return () => {
      unsubStore();
      unsubSpecial();
      unsubInfoBanner();
      unsubPromo();
      unsubProducts();
    };
  }, []);

  // Listen to delivery slots for the current deliveryDate
  useEffect(() => {
    const formattedDate = deliveryDate.replace(/\//g, '-');
    const unsubscribes = DELIVERY_SLOTS.map(slot => {
      const slotId = `${formattedDate}_${slot}`;
      const slotRef = doc(db, 'delivery_slots', slotId);
      return onSnapshot(slotRef, (docSnap) => {
        if (docSnap.exists()) {
          setSlotCounts(prev => ({ ...prev, [slot]: docSnap.data().count }));
        } else {
          setSlotCounts(prev => ({ ...prev, [slot]: 0 }));
        }
      }, (error) => {
        console.error('Firestore Error: ', JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
          operationType: 'get',
          path: `delivery_slots/${slotId}`,
          authInfo: {
            userId: auth.currentUser?.uid,
            email: auth.currentUser?.email,
            emailVerified: auth.currentUser?.emailVerified,
            isAnonymous: auth.currentUser?.isAnonymous,
            tenantId: auth.currentUser?.tenantId,
            providerInfo: auth.currentUser?.providerData.map(provider => ({
              providerId: provider.providerId,
              displayName: provider.displayName,
              email: provider.email,
              photoUrl: provider.photoURL
            })) || []
          }
        }));
      });
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [deliveryDate]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Checkout form state
  const [customerName, setCustomerName] = useState(() => {
    return localStorage.getItem('mana_customerName') || '';
  });
  const [address, setAddress] = useState(() => {
    const savedAddress = localStorage.getItem('mana_address');
    return savedAddress ? JSON.parse(savedAddress) : {
      street: '',
      number: '',
      neighborhood: '',
      complement: ''
    };
  });
  const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'pix' | 'cartão' | null>(null);
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [isCheckoutStep, setIsCheckoutStep] = useState(false);
  const [isReviewStep, setIsReviewStep] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Save to localStorage whenever data changes
  React.useEffect(() => {
    localStorage.setItem('mana_customerName', customerName);
  }, [customerName]);

  React.useEffect(() => {
    localStorage.setItem('mana_address', JSON.stringify(address));
  }, [address]);

  const addToCart = (product: Product) => {
    const currentProduct = dbProducts.find(p => p.id === product.id) || product;
    const hasStock = currentProduct.stockQuantity === undefined || currentProduct.stockQuantity === null || currentProduct.stockQuantity > 0;
    
    if (currentProduct.isAvailable === false || !hasStock) {
      setToastMessage("Este produto está esgotado no momento.");
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }
    
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (typeof currentProduct.stockQuantity === 'number' && existing.quantity + 1 > currentProduct.stockQuantity) {
          setToastMessage(`Apenas ${currentProduct.stockQuantity} unidades disponíveis.`);
          setTimeout(() => setToastMessage(''), 3000);
          return prev;
        }
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        // Prevent increasing quantity if product is out of stock
        const currentProduct = dbProducts.find(p => p.id === productId);
        if (delta > 0 && currentProduct) {
          const hasStock = currentProduct.stockQuantity === undefined || currentProduct.stockQuantity === null || currentProduct.stockQuantity > 0;
          if (currentProduct.isAvailable === false || !hasStock) {
            setToastMessage("Este produto está esgotado no momento.");
            setTimeout(() => setToastMessage(''), 3000);
            return item;
          }
          if (typeof currentProduct.stockQuantity === 'number' && item.quantity + delta > currentProduct.stockQuantity) {
            setToastMessage(`Apenas ${currentProduct.stockQuantity} unidades disponíveis.`);
            setTimeout(() => setToastMessage(''), 3000);
            return item;
          }
        }
        const newQuantity = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const discountAmount = promotion?.isActive && subtotal >= (promotion.minAmount || 100) 
    ? subtotal * (promotion.percentage / 100) 
    : 0;
  const deliveryFee = deliveryType === 'pickup' ? 0 : (subtotal > 0 && subtotal < (freeShippingThreshold || 0) ? (deliveryFeeSetting || 0) : 0);
  const cartTotal = (subtotal || 0) - (discountAmount || 0) + (deliveryFee || 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleReviewOrder = () => {
    if (cart.length === 0) return;
    
    if (!isStoreOpen) {
      showToast('Desculpe, a loja está fechada no momento.');
      return;
    }

    if (!user) {
      if (isAuthReady) {
        setShowAuthModal(true);
      } else {
        showToast('Por favor, aguarde o carregamento do sistema...');
      }
      return;
    }

    if (!customerName || (deliveryType === 'delivery' && (!address.street || !address.number || !address.neighborhood)) || !paymentMethod || (deliverySlotsEnabled && !deliveryTime)) {
      const missingFields = [];
      if (!customerName) missingFields.push('Nome');
      if (deliveryType === 'delivery') {
        if (!address.street) missingFields.push('Rua');
        if (!address.number) missingFields.push('Número');
        if (!address.neighborhood) missingFields.push('Bairro');
      }
      if (!paymentMethod) missingFields.push('Meio de Pagamento');
      if (deliverySlotsEnabled && !deliveryTime) missingFields.push('Horário');
      
      showToast(`Por favor, preencha todos os campos obrigatórios (${missingFields.join(', ')}).`);
      return;
    }

    setIsReviewStep(true);
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || !isReviewStep) return;
    
    setIsProcessing(true);
    const formattedDate = deliveryDate.replace(/\//g, '-');
    const slotId = `${formattedDate}_${deliveryTime}`;
    const slotRef = doc(db, 'delivery_slots', slotId);

    try {
      await runTransaction(db, async (transaction) => {
        // Read slot if enabled
        let slotDoc = null;
        if (deliverySlotsEnabled) {
          slotDoc = await transaction.get(slotRef);
        }
        
        // Read all products to check stock
        const productRefs = cart.map(item => doc(db, 'products', item.product.id));
        const productDocs = await Promise.all(productRefs.map(ref => transaction.get(ref)));
        
        // Validate slot if enabled
        if (deliverySlotsEnabled && slotDoc) {
          let currentCount = 0;
          if (slotDoc.exists()) {
            currentCount = slotDoc.data().count;
          }
          if (currentCount >= MAX_ORDERS_PER_SLOT) {
            throw new Error('Horário esgotado');
          }

          // Write slot
          if (slotDoc.exists()) {
            transaction.update(slotRef, {
              count: currentCount + 1
            });
          } else {
            transaction.set(slotRef, {
              date: formattedDate,
              time: deliveryTime,
              count: 1
            });
          }
        }

        // Write product stock updates
        cart.forEach((item, index) => {
          const pDoc = productDocs[index];
          if (pDoc.exists()) {
            const pData = pDoc.data();
            if (typeof pData.stockQuantity === 'number' && pData.stockQuantity !== null) {
              if (pData.stockQuantity < item.quantity) {
                throw new Error(`Estoque insuficiente para ${pData.name}. Disponível: ${pData.stockQuantity}`);
              }
              transaction.update(productRefs[index], {
                stockQuantity: pData.stockQuantity - item.quantity
              });
            }
          }
        });

        // Update user name if it's an anonymous user or name is missing
        const userRef = doc(db, 'users', user.uid);
        transaction.update(userRef, { 
          name: customerName,
          address: address // Save address for future use
        });

        // Create order
        const newOrderRef = doc(collection(db, 'orders'));
        transaction.set(newOrderRef, {
          userId: user.uid,
          customerName,
          items: cart.map(item => ({
            productId: item.product.id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity
          })),
          subtotal,
          discountAmount,
          promotionName: promotion?.isActive && discountAmount > 0 ? promotion.name : null,
          deliveryFee,
          total: cartTotal,
          address: deliveryType === 'pickup' ? { street: 'RETIRADA NO LOCAL', number: '', neighborhood: '', complement: '' } : address,
          paymentMethod,
          deliveryType,
          deliveryDate,
          deliveryTime: deliverySlotsEnabled ? deliveryTime : 'A combinar',
          status: 'pending',
          createdAt: serverTimestamp()
        });
      });

      // Transaction successful, open WhatsApp
      let message = `Olá! Meu nome é *${customerName}* e gostaria de fazer o seguinte pedido:\n\n`;
      cart.forEach(item => {
        message += `${item.quantity}x ${item.product.name} - R$ ${(item.product.price * item.quantity).toFixed(2)}\n`;
      });
      
      message += `\n*Subtotal:* R$ ${subtotal.toFixed(2)}`;
      if (discountAmount > 0) {
        message += `\n*Desconto (${promotion?.name}):* -R$ ${discountAmount.toFixed(2)}`;
      }
      message += `\n*Taxa de entrega:* ${deliveryType === 'pickup' ? 'N/A (Retirada)' : (deliveryFee === 0 ? 'Grátis' : `R$ ${deliveryFee.toFixed(2)}`)}`;
      message += `\n*Total:* R$ ${cartTotal.toFixed(2)}\n`;
      
      if (deliveryType === 'pickup') {
        message += `\n🏪 *Informações da Retirada:*`;
        message += `\nJanela de Retirada: ${pickUpHours}`;
      } else {
        message += `\n📍 *Endereço de Entrega:*`;
        message += `\n${address.street}, ${address.number}`;
        if (address.complement) message += ` - ${address.complement}`;
        message += `\nBairro: ${address.neighborhood}`;
        if (!deliverySlotsEnabled) {
          message += `\nJanela de Entrega: ${deliveryHours}`;
        }
      }
      
      message += `\n\n💳 *Meio de Pagamento:* ${paymentMethod === 'dinheiro' ? 'Dinheiro' : paymentMethod === 'pix' ? 'PIX' : 'Cartão (na entrega)'}`;
      
      message += `\n\n⏰ *${deliveryType === 'pickup' ? 'Data da Retirada' : 'Data da Entrega'}:* ${deliveryDate}`;
      if (deliverySlotsEnabled) {
        message += ` às ${deliveryTime}`;
        if (deliveryType === 'delivery') {
          message += ` (dentro da janela ${deliveryHours})`;
        }
      }
      
      const encodedMessage = encodeURIComponent(message);
      const waUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
      setWhatsappUrl(waUrl);
      setShowSuccessModal(true);
      
      // Clear cart
      setCart([]);
      setIsCartOpen(false);
      setIsCheckoutStep(false);
      setDeliveryTime('');
      
    } catch (error: any) {
      if (error.message === 'Horário esgotado') {
        showToast('Desculpe, este horário acabou de ser preenchido. Por favor, escolha outro horário.');
        setDeliveryTime('');
      } else if (error.message?.includes('esgotado') || error.message?.includes('Estoque insuficiente')) {
        showToast(error.message);
      } else if (error.code === 'permission-denied' || error.message?.includes('permission')) {
        const errInfo = {
          error: error instanceof Error ? error.message : String(error),
          operationType: 'write',
          path: `orders`,
          authInfo: {
            userId: auth.currentUser?.uid,
            email: auth.currentUser?.email,
            emailVerified: auth.currentUser?.emailVerified,
            isAnonymous: auth.currentUser?.isAnonymous,
            tenantId: auth.currentUser?.tenantId,
            providerInfo: auth.currentUser?.providerData.map(provider => ({
              providerId: provider.providerId,
              displayName: provider.displayName,
              email: provider.email,
              photoUrl: provider.photoURL
            })) || []
          }
        };
        console.error('Firestore Error: ', JSON.stringify(errInfo));
        throw new Error(JSON.stringify(errInfo));
      } else {
        console.error("Erro ao processar pedido:", error);
        showToast('Ocorreu um erro ao processar seu pedido. Tente novamente.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const categories = Array.from(new Set(dbProducts.map(p => p.category)));

  return (
    <div className="min-h-screen pb-24">
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg z-[60] animate-in fade-in slide-in-from-top-4">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <header className="bg-mana-bg/95 backdrop-blur-sm border-b border-mana-gold/30 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center min-w-0">
            <Logo 
              customUrl={logoUrl}
              title={homeTitle}
              subtitle={homeSubtitle}
              aspectRatio={logoAspectRatio}
              scale={logoScale}
              className={
                !logoUrl
                  ? "h-12 sm:h-14 md:h-16 w-auto object-contain select-none py-0.5"
                  : logoAspectRatio === '16:9'
                    ? (logoScale === 'xl' 
                        ? "h-14 sm:h-18 md:h-22 max-w-[200px] sm:max-w-[280px] md:max-w-[360px] w-auto object-contain select-none py-0.5"
                        : logoScale === 'md'
                          ? "h-11 sm:h-13 md:h-16 max-w-[160px] sm:max-w-[220px] md:max-w-[280px] w-auto object-contain select-none py-0.5"
                          : "h-12 sm:h-16 md:h-20 max-w-[180px] sm:max-w-[260px] md:max-w-[320px] w-auto object-contain select-none py-0.5"
                      )
                    : "h-12 sm:h-16 md:h-20 max-w-[180px] sm:max-w-[220px] w-auto object-contain select-none py-0.5"
              }
              alt="Maná Lanches Saudáveis"
            />
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-mana-text hidden sm:block">
                  Olá, {user.displayName?.split(' ')[0]}
                </span>
                {isAdmin && (
                  <button 
                    onClick={() => setShowAdminDashboard(true)}
                    className="text-mana-text-light hover:text-mana-green transition-colors"
                    title="Painel Admin"
                  >
                    <Settings size={20} />
                  </button>
                )}
                <button 
                  onClick={() => setShowOrderHistory(true)}
                  className="text-mana-text-light hover:text-mana-green transition-colors"
                  title="Meus Pedidos"
                >
                  <Package size={20} />
                </button>
                <button 
                  onClick={logOut}
                  className="text-mana-text-light hover:text-mana-text transition-colors"
                  title="Sair"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-2 text-sm font-medium text-mana-green hover:text-mana-green-dark transition-colors"
              >
                <LogIn size={20} />
                <span className="hidden sm:block">Entrar</span>
              </button>
            )}

            {/* Atalho no Header para o Guia */}
            <button 
              onClick={() => setShowCareGuide(true)}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-mana-green hover:text-mana-green-dark bg-mana-green/10 hover:bg-mana-green/20 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all border border-mana-green/20"
              title="Guia de Conservação e Preparo"
            >
              <BookOpen size={16} />
              <span className="hidden md:inline">Guia de Conservação</span>
            </button>
            
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-mana-green hover:bg-mana-green/10 rounded-full transition-colors"
            >
              <ShoppingBag size={24} />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 bg-mana-gold text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Botão de Destaque: Guia de Conservação e Preparo */}
        <div className="mb-6">
          <button
            onClick={() => setShowCareGuide(true)}
            className="w-full bg-gradient-to-r from-emerald-50/90 via-white to-amber-50/80 hover:from-emerald-100 hover:via-white hover:to-amber-100 border border-mana-gold/30 hover:border-mana-green/50 p-4 sm:p-5 rounded-2xl flex items-center justify-between gap-4 transition-all duration-300 group shadow-sm hover:shadow-md text-left"
          >
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-mana-green text-white flex items-center justify-center shadow-md shadow-mana-green/20 group-hover:scale-105 transition-transform shrink-0">
                <BookOpen size={22} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-serif font-bold text-mana-green text-base sm:text-lg group-hover:text-mana-green-dark">
                    Guia de Conservação e Preparo
                  </h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-mana-gold/20 text-mana-gold px-2 py-0.5 rounded-full border border-mana-gold/30">
                    Dicas
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-mana-text-light mt-0.5 line-clamp-1 sm:line-clamp-none">
                  Aprenda as melhores formas de armazenar, aquecer e manter a frescura dos seus lanches saudáveis.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-mana-green font-bold text-xs sm:text-sm shrink-0 bg-mana-green/10 group-hover:bg-mana-green group-hover:text-white px-3 sm:px-4 py-2 rounded-xl transition-all">
              <span className="hidden xs:inline">Acessar</span>
              <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        </div>
        {infoBannerData.title && infoBannerData.sections?.length > 0 && (
          <div className="bg-mana-gold/10 border border-mana-gold/30 rounded-2xl p-6 mb-8">
            <h3 className="font-serif text-xl font-bold text-mana-green mb-4 flex items-center gap-2">
              <Info size={20} /> {infoBannerData.title}
            </h3>
            <div className="grid sm:grid-cols-2 gap-6 text-sm text-mana-text">
              {(infoBannerData.sections || []).map((section: InfoSection) => (
                <div key={section.id}>
                  <p className="font-semibold flex items-center gap-2">
                    {section.icon === 'clock' && <Clock size={16} />}
                    {section.icon === 'shopping-bag' && <ShoppingBag size={16} />}
                    {section.icon === 'map-pin' && <MapPin size={16} />}
                    {(!section.icon || section.icon === 'info') && <Info size={16} />}
                    {section.title}
                  </p>
                  <ul className="mt-2 space-y-1 text-mana-text-light whitespace-pre-line">
                    {section.content}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8 text-center">
          {catalogBadge && (
            <span className="inline-block bg-mana-gold/10 text-mana-gold text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest mb-2 border border-mana-gold/20">
              {catalogBadge}
            </span>
          )}
          <h2 className="font-serif text-2xl text-mana-text mb-2">{catalogTitle}</h2>
          <p className="text-mana-text-light text-sm">{catalogSubtitle}</p>
        </div>

        {promotion && promotion.isActive && (
          <div className="mb-8 bg-mana-green/10 border border-mana-green/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in zoom-in duration-500">
            <div className="flex items-center gap-4">
              <div className="bg-mana-green text-white p-3 rounded-full shadow-lg">
                <Leaf size={24} />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-mana-green">{promotion.name}</h3>
                <p className="text-mana-text-light text-sm">
                  Ganhe <span className="font-bold text-mana-green">{promotion.percentage}% de desconto</span> em compras acima de <span className="font-bold text-mana-green">R$ {promotion.minAmount.toFixed(2)}</span>!
                </p>
              </div>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl border border-mana-green/20 shadow-sm">
              <span className="text-xs text-mana-text-light uppercase tracking-wider block mb-1">Status do Desconto</span>
              {subtotal >= promotion.minAmount ? (
                <div className="flex items-center gap-2 text-mana-green font-bold">
                  <CheckCircle size={18} />
                  <span>Desconto Aplicado! (-R$ {discountAmount.toFixed(2)})</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-mana-gold font-medium">
                  <Clock size={18} />
                  <span>Faltam R$ {(promotion.minAmount - subtotal).toFixed(2)} para o desconto</span>
                </div>
              )}
            </div>
          </div>
        )}

        {specialOfTheDay && specialOfTheDay.isActive && (
          <div className="mb-10 bg-white rounded-2xl overflow-hidden shadow-md border border-mana-gold/30 flex flex-col md:flex-row animate-in fade-in slide-in-from-bottom-4 duration-500">
            {specialOfTheDay.imageUrl && (
              <div className="md:w-2/5 h-48 md:h-auto relative">
                <img 
                  src={specialOfTheDay.imageUrl} 
                  alt={specialOfTheDay.title} 
                  className="w-full h-full object-cover"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent md:hidden"></div>
              </div>
            )}
            <div className="p-6 md:w-3/5 flex flex-col justify-center">
              <div className="inline-block bg-mana-gold text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3 w-max shadow-sm">
                {specialOfTheDay.badgeText || 'Especial Maná da Semana'}
              </div>
              <h2 className="text-2xl font-serif font-bold text-mana-green mb-3">{specialOfTheDay.title}</h2>
              <p className="text-mana-text-light leading-relaxed whitespace-pre-line">{specialOfTheDay.description}</p>
            </div>
          </div>
        )}

        {categories.map(category => (
          <div key={category} className="mb-10">
            <h3 className="text-lg font-semibold text-mana-green mb-4 flex items-center gap-2 border-b border-mana-gold/20 pb-2">
              {category}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dbProducts.filter(p => p.category === category).map(product => {
                const isAvailable = product.isAvailable !== false;
                return (
                <div key={product.id} className={`bg-white rounded-2xl shadow-sm border border-mana-gold/10 overflow-hidden flex flex-col sm:flex-row transition-shadow ${isAvailable ? 'hover:shadow-md' : 'opacity-75 grayscale-[0.5]'}`}>
                  <div className="h-48 sm:h-auto sm:w-2/5 relative">
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {!isAvailable && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="bg-red-600 text-white font-bold px-4 py-1.5 rounded-full text-sm shadow-lg transform -rotate-12">
                          ESGOTADO
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-semibold text-mana-text text-lg leading-tight">{product.name}</h4>
                      <span className="font-bold text-mana-green whitespace-nowrap ml-2">
                        R$ {product.price.toFixed(2)}
                      </span>
                    </div>
                    {product.stockQuantity !== undefined && product.stockQuantity !== null && (
                      <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${product.stockQuantity <= 5 ? 'text-red-500' : 'text-mana-gold'}`}>
                        {product.stockQuantity > 0 ? `${product.stockQuantity} disponíveis` : 'Esgotado'}
                      </p>
                    )}
                    <p className="text-mana-text-light text-sm mb-3 flex-1 line-clamp-2">
                      {product.description}
                    </p>
                    
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                      <button 
                        onClick={() => setSelectedProduct(product)}
                        className="text-xs font-medium text-mana-gold flex items-center gap-1 hover:text-mana-green transition-colors"
                      >
                        <Info size={14} />
                        Detalhes
                      </button>
                      
                      <button 
                        onClick={() => isAvailable && addToCart(product)}
                        disabled={!isAvailable}
                        className={`${isAvailable ? 'bg-mana-green hover:bg-mana-green-dark' : 'bg-gray-400 cursor-not-allowed'} text-white px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1`}
                      >
                        <Plus size={16} />
                        {isAvailable ? 'Adicionar' : 'Esgotado'}
                      </button>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          </div>
        ))}
      </main>

      {/* Floating Cart Button (Mobile) */}
      {!isStoreOpen && (
        <div className="bg-red-500 text-white text-center py-2 font-medium sticky top-[73px] z-10 shadow-sm">
          A loja está fechada no momento. Não estamos aceitando novos pedidos.
        </div>
      )}

      {cartItemCount > 0 && !isCartOpen && (
        <div className="fixed bottom-6 left-0 right-0 px-4 z-20 md:hidden">
          <button 
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-mana-green text-white p-4 rounded-2xl shadow-lg flex items-center justify-between font-medium"
          >
            <div className="flex items-center gap-2">
              <div className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center">
                {cartItemCount}
              </div>
              <span>Ver Pedido</span>
            </div>
            <span>R$ {cartTotal.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Install App Banner */}
      {showInstallBanner && (
        <div className="fixed bottom-24 left-4 right-4 z-[60] animate-in slide-in-from-bottom-8 duration-500">
          <div className="bg-white rounded-2xl shadow-2xl border border-mana-gold/30 p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-mana-green/10 p-2 rounded-xl">
                <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" onError={(e) => e.currentTarget.src = 'https://picsum.photos/seed/mana/100/100'} />
              </div>
              <div>
                <p className="font-bold text-mana-text text-sm">Instalar App Maná</p>
                <p className="text-xs text-mana-text-light">Acesse mais rápido e em tela cheia!</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowInstallBanner(false)}
                className="p-2 text-mana-text-light hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
              <button 
                onClick={handleInstallClick}
                className="bg-mana-green text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg hover:bg-mana-green-dark transition-colors"
              >
                Instalar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-mana-bg rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="relative h-48">
              <img 
                src={selectedProduct.imageUrl} 
                alt={selectedProduct.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 right-3 bg-black/40 text-white p-1.5 rounded-full hover:bg-black/60 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-serif text-2xl font-bold text-mana-green">{selectedProduct.name}</h3>
                {selectedProduct.stockQuantity !== undefined && selectedProduct.stockQuantity !== null && (
                  <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-lg ${selectedProduct.stockQuantity <= 5 ? 'bg-red-100 text-red-600' : 'bg-mana-gold/10 text-mana-gold'}`}>
                    {selectedProduct.stockQuantity > 0 ? `${selectedProduct.stockQuantity} disponíveis` : 'Esgotado'}
                  </span>
                )}
              </div>
              <p className="text-mana-text mb-4">{selectedProduct.description}</p>
              
              {selectedProduct.ingredients && (
                <div className="bg-mana-bg border border-mana-gold/20 rounded-xl p-4 mb-4">
                  <h4 className="font-semibold text-mana-green flex items-center gap-2 mb-2">
                    <Leaf size={18} />
                    Ingredientes
                  </h4>
                  <p className="text-sm text-mana-text-light leading-relaxed">
                    {selectedProduct.ingredients}
                  </p>
                </div>
              )}

              {selectedProduct.nutrition && (
                <div className="bg-mana-green/5 border border-mana-green/20 rounded-xl p-4 mb-4">
                  <h4 className="font-semibold text-mana-green flex items-center gap-2 mb-2">
                    <Activity size={18} />
                    Informação Nutricional
                  </h4>
                  <p className="text-sm text-mana-text-light leading-relaxed">
                    {selectedProduct.nutrition}
                  </p>
                </div>
              )}

              <div className="bg-mana-gold/10 border border-mana-gold/30 rounded-xl p-4 mb-6">
                <h4 className="font-semibold text-mana-gold flex items-center gap-2 mb-2">
                  <Info size={18} />
                  Modo de Uso / Conservação
                </h4>
                <p className="text-sm text-mana-text-light leading-relaxed">
                  {selectedProduct.usage}
                </p>
              </div>
              
              <button 
                onClick={() => {
                  if (selectedProduct.isAvailable !== false) {
                    addToCart(selectedProduct);
                    setSelectedProduct(null);
                  }
                }}
                disabled={selectedProduct.isAvailable === false}
                className={`w-full ${selectedProduct.isAvailable !== false ? 'bg-mana-green hover:bg-mana-green-dark' : 'bg-gray-400 cursor-not-allowed'} text-white py-3 rounded-xl font-medium transition-colors`}
              >
                {selectedProduct.isAvailable !== false ? `Adicionar ao Pedido - R$ ${selectedProduct.price.toFixed(2)}` : 'Produto Esgotado'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Sidebar/Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="relative w-full max-w-md bg-mana-bg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-5 border-b border-mana-gold/20 flex items-center justify-between bg-white">
              <h2 className="font-serif text-xl font-bold text-mana-green flex items-center gap-2">
                <ShoppingBag size={20} />
                Seu Pedido
              </h2>
              <div className="flex items-center gap-2">
                {cart.length > 0 && !isCheckoutStep && (
                  <button 
                    onClick={() => setCart([])}
                    className="text-xs font-medium text-red-500 hover:text-red-700 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                    title="Limpar carrinho"
                  >
                    <Trash2 size={14} />
                    Limpar
                  </button>
                )}
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="text-mana-text-light hover:text-mana-text p-1"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-mana-text-light space-y-4">
                  <ShoppingBag size={48} className="text-mana-gold/40" />
                  <p>Seu carrinho está vazio.</p>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="text-mana-green font-medium hover:underline"
                  >
                    Voltar ao catálogo
                  </button>
                </div>
              ) : !isCheckoutStep ? (
                <div className="space-y-4">
                  {cart.map(item => {
                    const currentProduct = dbProducts.find(p => p.id === item.product.id);
                    const isAvailable = currentProduct ? currentProduct.isAvailable !== false : true;
                    return (
                    <div key={item.product.id} className={`flex gap-4 bg-white p-3 rounded-xl border border-mana-gold/10 ${!isAvailable ? 'opacity-75 grayscale-[0.5]' : ''}`}>
                      <div className="relative">
                        <img 
                          src={item.product.imageUrl} 
                          alt={item.product.name} 
                          className="w-16 h-16 rounded-lg object-cover"
                          referrerPolicy="no-referrer"
                        />
                        {!isAvailable && (
                          <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                            <span className="text-white text-[10px] font-bold px-1 text-center leading-tight">
                              ESGOTADO
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-mana-text text-sm leading-tight">{item.product.name}</h4>
                            <span className="text-mana-green font-semibold text-sm">
                              R$ {item.product.price.toFixed(2)}
                            </span>
                            {!isAvailable && (
                              <p className="text-red-500 text-xs font-semibold mt-0.5">Remova este item para continuar</p>
                            )}
                          </div>
                          <button 
                            onClick={() => updateQuantity(item.product.id, -item.quantity)}
                            className="text-red-400 hover:text-red-600 p-1 transition-colors"
                            title="Remover do carrinho"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-3 bg-mana-bg rounded-lg border border-mana-gold/20 px-2 py-1">
                            <button 
                              onClick={() => updateQuantity(item.product.id, -1)}
                              className="text-mana-text-light hover:text-mana-green"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.product.id, 1)}
                              disabled={!isAvailable}
                              className={`text-mana-text-light ${!isAvailable ? 'opacity-50 cursor-not-allowed' : 'hover:text-mana-green'}`}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <span className="text-sm font-bold text-mana-text">
                            R$ {(item.product.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
              ) : !isReviewStep ? (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                    <h3 className="font-semibold text-mana-green mb-3 flex items-center gap-2">
                      <MapPin size={18} /> Dados de Entrega
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-mana-text-light mb-1">Seu Nome *</label>
                        <input 
                          type="text" 
                          value={customerName}
                          onChange={e => setCustomerName(e.target.value)}
                          className="w-full bg-white border border-mana-gold/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-mana-green focus:ring-1 focus:ring-mana-green"
                          placeholder="Como quer ser chamado?"
                        />
                      </div>

                      {deliveryPickUpEnabled && (
                        <div className="grid grid-cols-2 gap-2 mt-4">
                          <button
                            onClick={() => setDeliveryType('delivery')}
                            className={`py-3 rounded-xl text-sm font-bold transition-all border flex items-center justify-center gap-2 ${
                              deliveryType === 'delivery' 
                                ? 'bg-mana-green text-white border-mana-green shadow-md shadow-mana-green/20' 
                                : 'bg-white text-mana-text border-mana-gold/30 hover:border-mana-green'
                            }`}
                          >
                            <MapPin size={18} />
                            Entrega
                          </button>
                          <button
                            onClick={() => setDeliveryType('pickup')}
                            className={`py-3 rounded-xl text-sm font-bold transition-all border flex items-center justify-center gap-2 ${
                              deliveryType === 'pickup' 
                                ? 'bg-mana-green text-white border-mana-green shadow-md shadow-mana-green/20' 
                                : 'bg-white text-mana-text border-mana-gold/30 hover:border-mana-green'
                            }`}
                          >
                            <ShoppingBag size={18} />
                            Retirada
                          </button>
                        </div>
                      )}

                      {deliveryType === 'pickup' ? (
                        <div className="bg-mana-gold/5 border border-mana-gold/30 rounded-xl p-4 mt-4 text-center animate-in fade-in zoom-in duration-300">
                          <div className="bg-mana-gold/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 text-mana-gold">
                            <Clock size={24} />
                          </div>
                          <h3 className="font-serif text-lg font-bold text-mana-green mb-1">Informações da Retirada</h3>
                          <p className="text-sm text-mana-text font-medium mb-1">Horário: <span className="text-mana-gold">{pickUpHours}</span></p>
                          <p className="text-[11px] text-mana-text-light px-2 leading-tight">Compareça ao local no horário informado para retirar o seu pedido!</p>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2">
                              <label className="block text-xs font-medium text-mana-text-light mb-1">Rua *</label>
                              <input 
                                type="text" 
                                value={address.street}
                                onChange={e => setAddress({...address, street: e.target.value})}
                                className="w-full bg-white border border-mana-gold/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-mana-green focus:ring-1 focus:ring-mana-green"
                              />
                            </div>
                            <div className="col-span-1">
                              <label className="block text-xs font-medium text-mana-text-light mb-1">Número *</label>
                              <input 
                                type="text" 
                                value={address.number}
                                onChange={e => setAddress({...address, number: e.target.value})}
                                className="w-full bg-white border border-mana-gold/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-mana-green focus:ring-1 focus:ring-mana-green"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-mana-text-light mb-1">Bairro *</label>
                              <input 
                                type="text" 
                                value={address.neighborhood}
                                onChange={e => setAddress({...address, neighborhood: e.target.value})}
                                className="w-full bg-white border border-mana-gold/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-mana-green focus:ring-1 focus:ring-mana-green"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-mana-text-light mb-1">Complemento</label>
                              <input 
                                type="text" 
                                value={address.complement}
                                onChange={e => setAddress({...address, complement: e.target.value})}
                                className="w-full bg-white border border-mana-gold/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-mana-green focus:ring-1 focus:ring-mana-green"
                                placeholder="Apto, Bloco..."
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-mana-gold/20">
                    <h3 className="font-semibold text-mana-green mb-3 flex items-center gap-2">
                       <CreditCard size={18} /> Meio de Pagamento *
                    </h3>
                    <div className="grid grid-cols-3 gap-2 mb-6">
                      {[
                        { id: 'pix', label: 'PIX', icon: <Smartphone size={14} /> },
                        { id: 'dinheiro', label: 'Dinheiro', icon: <Banknote size={14} /> },
                        { id: 'cartão', label: 'Cartão', icon: <CreditCard size={14} /> }
                      ].map(method => (
                        <button
                          key={method.id}
                          onClick={() => setPaymentMethod(method.id as any)}
                          className={`py-3 rounded-xl text-sm font-medium transition-all border flex flex-col items-center justify-center gap-1 ${
                            paymentMethod === method.id 
                              ? 'bg-mana-green text-white border-mana-green shadow-md shadow-mana-green/20' 
                              : 'bg-white text-mana-text border-mana-gold/30 hover:border-mana-green'
                          }`}
                        >
                          {method.icon}
                          <span>{method.label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="bg-mana-bg border border-mana-gold/20 rounded-xl p-3 mb-4 flex gap-3">
                      <Info size={20} className="text-mana-gold shrink-0 mt-0.5" />
                      <div className="text-xs text-mana-text-light leading-relaxed">
                        <p className="font-semibold text-mana-green mb-1">Regra de Entrega:</p>
                        <p>Pedidos feitos até <span className="font-bold">{DAYS_PT[deadlineDay]} às {deadlineHour.toString().padStart(2, '0')}h</span> são entregues nesta sexta. Após esse horário, a entrega será na próxima sexta-feira.</p>
                      </div>
                    </div>

                    {deliverySlotsEnabled ? (
                      <>
                        <h3 className="font-semibold text-mana-green mb-3 flex items-center gap-2">
                          <Clock size={18} /> {deliveryType === 'pickup' ? 'Escolha o Horário de Retirada' : 'Escolha o Horário de Entrega'} ({deliveryDate}) *
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                          {DELIVERY_SLOTS.map(slot => {
                            const count = slotCounts[slot] || 0;
                            const isLateSlot = slot >= '16:15';
                            const isBlocked = isLateSlot && lateSlotsBlocked;
                            const isFull = count >= MAX_ORDERS_PER_SLOT || isBlocked;
                            const available = MAX_ORDERS_PER_SLOT - count;
                            
                            return (
                              <button
                                key={slot}
                                onClick={() => !isFull && setDeliveryTime(slot)}
                                disabled={isFull}
                                className={`py-2 rounded-lg text-sm font-medium transition-colors border flex flex-col items-center justify-center ${
                                  isFull 
                                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                    : deliveryTime === slot 
                                      ? 'bg-mana-green text-white border-mana-green' 
                                      : 'bg-white text-mana-text border-mana-gold/30 hover:border-mana-green'
                                }`}
                              >
                                <span>{slot}</span>
                                <span className={`text-[10px] ${isFull ? 'text-red-400' : deliveryTime === slot ? 'text-white/80' : 'text-mana-green'}`}>
                                  {isBlocked && isAdmin ? `Bloqueado (${available})` : isFull ? 'Esgotado' : isAdmin ? `${available} vagas` : '\u00A0'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="bg-mana-green/5 border border-mana-green/20 rounded-xl p-4">
                        <h3 className="font-semibold text-mana-green mb-1 flex items-center gap-2">
                          <Clock size={18} /> {deliveryType === 'pickup' ? 'Data da Retirada' : 'Data da Entrega'}
                        </h3>
                        <p className="text-sm text-mana-text">Seu pedido {deliveryType === 'pickup' ? 'estará disponível para retirada' : 'será entregue'} na <span className="font-bold">{deliveryDate}</span>.</p>
                        <p className="text-xs text-mana-text-light mt-1">
                          {deliveryType === 'pickup' 
                            ? `Horário: ${pickUpHours}` 
                            : `Horário: ${deliveryHours}`
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                    <h3 className="font-semibold text-mana-green mb-4 flex items-center gap-2">
                      <CheckCircle size={18} /> Revisão do Pedido
                    </h3>
                    
                    <div className="bg-mana-bg rounded-2xl p-4 border border-mana-gold/10 space-y-4 mb-6">
                      <div className="flex items-start gap-3">
                        <MapPin size={16} className="text-mana-gold shrink-0 mt-1" />
                        <div>
                          <p className="text-xs font-bold text-mana-green uppercase tracking-wider mb-1">Entregar para:</p>
                          <p className="text-sm text-mana-text font-medium">{customerName}</p>
                          {deliveryType === 'delivery' ? (
                            <p className="text-xs text-mana-text-light mt-1">
                              {address.street}, {address.number} - {address.neighborhood}
                              {address.complement && ` (${address.complement})`}
                            </p>
                          ) : (
                            <p className="text-xs text-mana-text-light mt-1">Retirada no Local: {pickUpHours}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <CreditCard size={16} className="text-mana-gold shrink-0 mt-1" />
                        <div>
                          <p className="text-xs font-bold text-mana-green uppercase tracking-wider mb-1">Pagamento:</p>
                          <p className="text-sm text-mana-text font-medium capitalize">{paymentMethod}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <Clock size={16} className="text-mana-gold shrink-0 mt-1" />
                        <div>
                          <p className="text-xs font-bold text-mana-green uppercase tracking-wider mb-1">{deliveryType === 'delivery' ? 'Previsão de Entrega:' : 'Previsão de Retirada:'}</p>
                          <p className="text-sm text-mana-text font-medium">
                            {deliveryDate} {deliveryTime && `às ${deliveryTime}`}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-bold text-mana-green uppercase tracking-wider px-1">Itens do Pedido:</p>
                      {cart.map(item => (
                        <div key={item.product.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-mana-gold/10">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-mana-text">{item.product.name}</h4>
                            <p className="text-xs text-mana-text-light">R$ {item.product.price.toFixed(2)} / un</p>
                          </div>
                          <div className="flex items-center gap-3 bg-mana-bg rounded-lg px-2 py-1 border border-mana-gold/20">
                            <button 
                              onClick={() => updateQuantity(item.product.id, -1)}
                              className="text-mana-text-light hover:text-mana-green p-0.5"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="text-xs font-bold min-w-[1rem] text-center">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.product.id, 1)}
                              className="text-mana-text-light hover:text-mana-green p-0.5"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <div className="ml-4 text-right min-w-[4rem]">
                            <span className="text-sm font-bold text-mana-text">
                              R$ {(item.product.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-5 bg-white border-t border-mana-gold/20">
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between items-center text-mana-text-light">
                    <span>Subtotal</span>
                    <span>R$ {subtotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center text-mana-green font-medium">
                      <span>Desconto ({promotion?.name})</span>
                      <span>-R$ ${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-mana-text-light">
                    <span>Taxa de entrega</span>
                    <span>{deliveryFee === 0 ? 'Grátis' : `R$ ${deliveryFee.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="font-semibold text-mana-text">Total do pedido</span>
                    <span className="font-serif text-2xl font-bold text-mana-green">
                      R$ {cartTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                {!isCheckoutStep ? (
                  <button 
                    onClick={() => setIsCheckoutStep(true)}
                    disabled={cart.some(item => {
                      const p = dbProducts.find(p => p.id === item.product.id);
                      return p && p.isAvailable === false;
                    })}
                    className={`w-full text-white py-4 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg ${
                      cart.some(item => {
                        const p = dbProducts.find(p => p.id === item.product.id);
                        return p && p.isAvailable === false;
                      }) ? 'bg-gray-400 cursor-not-allowed' : 'bg-mana-green hover:bg-mana-green-dark shadow-mana-green/20'
                    }`}
                  >
                    Continuar para Entrega
                    <ChevronRight size={20} />
                  </button>
                ) : !isReviewStep ? (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setIsCheckoutStep(false)}
                      className="px-4 py-4 rounded-xl font-semibold text-mana-green bg-mana-green/10 hover:bg-mana-green/20 transition-colors"
                    >
                      Voltar
                    </button>
                    <button 
                      onClick={handleReviewOrder}
                      className="flex-1 text-white py-4 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg bg-mana-green hover:bg-mana-green-dark shadow-mana-green/20"
                    >
                      Revisar Pedido
                      <ChevronRight size={20} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setIsReviewStep(false)}
                      className="px-4 py-4 rounded-xl font-semibold text-mana-green bg-mana-green/10 hover:bg-mana-green/20 transition-colors"
                    >
                      Voltar
                    </button>
                    <button 
                      onClick={handleCheckout}
                      disabled={isProcessing}
                      className={`flex-1 text-white py-4 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg ${
                        isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-mana-green hover:bg-mana-green-dark shadow-mana-green/20'
                      }`}
                    >
                      {isProcessing ? 'Processando...' : 'Confirmar e Enviar'}
                      {!isProcessing && <ChevronRight size={20} />}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Modals & Pages */}
      {showOrderHistory && <OrderHistory onClose={() => setShowOrderHistory(false)} />}
      {showAdminDashboard && <AdminDashboard onClose={() => setShowAdminDashboard(false)} products={dbProducts} />}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showCareGuide && <CareGuide onClose={() => setShowCareGuide(false)} logoUrl={logoUrl} homeTitle={homeTitle} />}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl max-w-sm w-full p-8 shadow-2xl border border-mana-gold/20 animate-in zoom-in-95 duration-300 text-center">
            <div className="w-20 h-20 bg-mana-green/10 text-mana-green rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} />
            </div>
            <h3 className="text-2xl font-serif font-bold text-mana-green mb-3">Pedido Recebido!</h3>
            <p className="text-mana-text-light mb-8">
              Seu pedido foi salvo em nosso sistema. Agora, clique no botão abaixo para nos enviar os detalhes pelo WhatsApp e confirmar sua entrega.
            </p>
            <div className="flex flex-col gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2"
              >
                <ShoppingBag size={20} />
                Enviar no WhatsApp
              </a>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-3 text-mana-text-light font-medium hover:text-mana-text transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
