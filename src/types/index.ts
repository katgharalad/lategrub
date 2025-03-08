export interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

export interface PaymentDetails {
  method: 'cash' | 'card' | 'other';
  status: 'pending' | 'completed';
}

export type OrderStatus = 'ordered' | 'waiting' | 'picked_up' | 'got_food' | 'walking' | 'delivered';

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
  paymentMethod?: string;
  paymentDetails?: PaymentDetails;
} 