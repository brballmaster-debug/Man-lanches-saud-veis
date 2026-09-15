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
