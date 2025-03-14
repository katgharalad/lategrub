export interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  icePreference?: 'ice' | 'no-ice';
}

export interface PaymentDetails {
  method: 'cash' | 'card' | 'other';
  status: 'pending' | 'completed';
}

export type OrderStatus = 'ordered' | 'waiting' | 'got_food' | 'walking' | 'delivered';

export interface Order {
  id: string;
  customerName: string;
  customerId: string;
  deliveryPersonId?: string;
  deliveryAddress: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
  paymentMethod?: 'cash' | 'barter';
  paymentDetails?: string;
} 