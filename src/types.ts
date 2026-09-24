export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  usage: string;
  ingredients?: string;
  imageUrl: string;
  category: string;
  isAvailable?: boolean;
  stockQuantity?: number | null;
  nutrition?: string;
  isFeatured?: boolean;
  isPopular?: boolean;
  tags?: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discountAmount?: number;
  couponCode?: string;
  total: number;
  address: {
    street: string;
    number: string;
    neighborhood: string;
    complement?: string;
  };
  deliveryDate: string;
  deliveryTime: string;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  createdAt: any; // Firestore Timestamp
}

export interface Coupon {
  code: string;           // Ex: 'MANA10', 'BEMVINDO'
  discountType: 'percentage' | 'fixed'; // '%' ou 'R$'
  discountValue: number;  // Ex: 10 para 10% ou 5 para R$ 5,00
  minOrderValue?: number; // Valor mínimo de subtotal (opcional)
  isActive: boolean;
}

export const defaultCoupons: Coupon[] = [
  {
    code: 'MANA10',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValue: 20,
    isActive: true,
  },
  {
    code: 'BEMVINDO',
    discountType: 'fixed',
    discountValue: 5,
    minOrderValue: 25,
    isActive: true,
  },
  {
    code: 'MANA15',
    discountType: 'percentage',
    discountValue: 15,
    minOrderValue: 50,
    isActive: true,
  }
];

export interface UserDocument {
  uid: string;
  name?: string;
  email: string;
  role: 'admin' | 'client';
  address?: any;
  createdAt: any;
  source?: string;
  isAnonymous?: boolean;
}

export interface InfoSection {
  id: string;
  title: string;
  content: string;
  icon?: 'clock' | 'shopping-bag' | 'info' | 'map-pin';
}

export interface Promotion {
  isActive: boolean;
  name: string;
  percentage: number;
  minAmount: number;
}

export interface CareGuideItem {
  id: string;
  title: string;
  subtitle: string;
  storageType: string;
  storageIcon?: 'freezer' | 'thermometer';
  prepareTitle?: string;
  prepareIcon?: 'flame' | 'utensils';
  airFryer?: string;
  oven?: string;
  thawRefrigerator?: string;
  microwave?: string;
  readyToEat?: boolean;
  notes?: string;
  flavors?: string;
  tip?: string;
  avoidMicrowaveNotice?: string;
}

export interface CareGuideData {
  headerTitle: string;
  headerSubtitle: string;
  introText: string;
  items: CareGuideItem[];
  importantBullets: string[];
  manaWayPoints: string[];
  manaWayNote: string;
  routineText: string;
  instagramHandle: string;
  footerThankYou: string;
}

export const defaultCareGuideData: CareGuideData = {
  headerTitle: 'GUIA MANÁ',
  headerSubtitle: 'Sabor e equilíbrio na sua rotina.\nObrigada por escolher a Maná! ♥',
  introText: 'Confira abaixo como conservar e preparar os seus lanchinhos.',
  items: [
    {
      id: '1',
      title: 'MINI PIZZAS',
      subtitle: 'Produto congelado',
      storageType: 'Freezer.',
      storageIcon: 'freezer',
      prepareTitle: 'Preparo (direto do congelador, não descongele):',
      prepareIcon: 'flame',
      airFryer: '180 °C por 6 a 8 minutos.',
      oven: 'Pré-aquecer a 180 °C e assar por 10 a 12 minutos.',
      notes: '(O tempo pode variar de acordo com o aparelho. Estarão prontas quando o queijo derreter e a massa estiver dourada).',
      flavors: 'Sabores: queijo com tomate | frango com queijo'
    },
    {
      id: '2',
      title: 'BOLINHO DE CACAU',
      subtitle: 'Produto congelado',
      storageType: 'Freezer.',
      storageIcon: 'freezer',
      prepareTitle: 'Para consumir:',
      prepareIcon: 'utensils',
      thawRefrigerator: 'Retire da embalagem e deixe na geladeira por algumas horas (ou na noite anterior).',
      microwave: 'Retire da embalagem e aqueça por 30 a 40 segundos (pode variar conforme o equipamento).',
      tip: 'Dica: consuma ainda morno para uma experiência mais saborosa!'
    },
    {
      id: '3',
      title: 'PÃOZINHO DE BATATA COM FRANGO',
      subtitle: 'Produto congelado',
      storageType: 'Freezer.',
      storageIcon: 'freezer',
      prepareTitle: 'Preparo (direto do congelador):',
      prepareIcon: 'flame',
      airFryer: '160–180 °C (verifique a partir de 8 minutos).',
      oven: 'Pré-aquecer a 180 °C e verifique a partir de 10 minutos.',
      avoidMicrowaveNotice: 'Dica: evite o micro-ondas para manter a textura perfeita e a massa no ponto.'
    },
    {
      id: '4',
      title: 'BOLACHINHA DE CACAU',
      subtitle: 'Produto fresco',
      storageType: 'Mantenha na embalagem original bem fechada, num local fresco e ao abrigo da luz.',
      storageIcon: 'thermometer',
      readyToEat: true
    }
  ],
  importantBullets: [
    'Não recongele produtos que já foram descongelados.',
    'Os tempos de preparo são sugestões e podem variar conforme a potência do seu equipamento.',
    'Para conferir a lista completa de ingredientes de cada produto, consulte o nosso catálogo.'
  ],
  manaWayPoints: [
    'Sem adição de açúcar',
    'Receitas pensadas para mais equilíbrio',
    'Produção artesanal'
  ],
  manaWayNote: 'Feito com cuidado, para você. ♥',
  routineText: 'Sabor e equilíbrio na sua rotina.',
  instagramHandle: '@manalanches',
  footerThankYou: 'Obrigada por fazer parte deste começo! ♥'
};
