import { Product } from './types';

export const products: Product[] = [
  {
    id: '1',
    name: 'Mini pizza - Queijo com tomate',
    price: 6.00,
    description: 'Mini pizza individual. Opção mais saudável para o dia a dia.',
    usage: 'Manter refrigerado. Aquecer no forno ou airfryer por 5 a 10 minutos antes de consumir.',
    ingredients: 'Farinha de trigo integral, farinha de trigo, água, queijo muçarela, tomate, molho de tomate, óleo vegetal, fermento biológico seco, chia, linhaça, gergelim, sal e orégano.',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800',
    category: 'Salgados'
  },
  {
    id: '2',
    name: 'Mini pizza - Frango com queijo',
    price: 6.00,
    description: 'Mini pizza individual. Praticidade sem abrir mão do sabor.',
    usage: 'Manter refrigerado. Aquecer no forno ou airfryer por 5 a 10 minutos antes de consumir.',
    ingredients: 'Farinha de trigo integral, farinha de trigo, água, frango desfiado, queijo muçarela, molho de tomate, óleo vegetal, fermento biológico seco, chia, linhaça, gergelim, sal e orégano.',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800',
    category: 'Salgados'
  },
  {
    id: '3',
    name: 'Pãozinho de batata (kit com 4)',
    price: 12.00,
    description: 'Kit com 4 unidades. Delicioso recheio de frango.',
    usage: 'Manter refrigerado. Aquecer levemente no micro-ondas (15s) ou forno antes de consumir para maior maciez.',
    ingredients: 'Batata inglesa, frango desfiado, farinha de trigo integral, farinha de trigo, ovos, molho de tomate, óleo vegetal, fermento biológico seco, chia, linhaça, gergelim, açafrão, sal e alho.',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800',
    category: 'Salgados'
  },
  {
    id: '4',
    name: 'Bolinho de cacau (kit com 4)',
    price: 10.00,
    description: 'Kit com 4 unidades. Produção limitada, garanta o seu!',
    usage: 'Conservar em local fresco e arejado ou sob refrigeração. Pronto para consumo.',
    ingredients: 'Farinha de trigo integral, farinha de trigo, farelo de aveia, ovos, manteiga, tâmaras, cacau 50%, chocolate 50% (recheio) e fermento químico.',
    imageUrl: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&q=80&w=800',
    category: 'Doces'
  },
  {
    id: '5',
    name: 'Bolachinha de cacau (100g)',
    price: 6.00,
    description: 'Porção de 100g. Perfeita para o lanche da tarde.',
    usage: 'Conservar em recipiente fechado em local fresco e seco para manter a crocância.',
    ingredients: 'Farinha de trigo integral, farinha de trigo, farinha de aveia, água, chocolate em pó 50% e tâmaras.',
    imageUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&q=80&w=800',
    category: 'Doces'
  }
];
