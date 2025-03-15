export interface OrderItem {
  name: string;
  quantity: number;
}

export interface PaymentDetails {
  method: 'cash' | 'barter';
  details?: string;
}

export type OrderStatus = 'ordered' | 'waiting' | 'got_food' | 'walking' | 'delivered';

export interface Order {
  id: string;
  customerName: string;
  customerId: string;
  deliveryPersonId?: string;
  deliveryAddress: string;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
  paymentMethod: 'cash' | 'barter';
  paymentDetails?: string;
} 