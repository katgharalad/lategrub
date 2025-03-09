import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PageLayout from '../components/PageLayout';
import { createOrder } from '../lib/firebase';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'main' | 'drink' | 'side';
}

const menuItems: MenuItem[] = [
  // Main dishes
  { id: 'm1', name: 'SMASHED PUB BURGER', description: 'House seasoned smash burger on a pretzel bun, topped with grilled onions, colby jack cheese and garlic aioli', price: 10.35, category: 'main' },
  { id: 'm2', name: 'SMASHED RODEO BURGER', description: 'House seasoned smash burger on a pretzel bun, topped with crispy onions, hickory BBQ sauce, bacon and cheddar cheese', price: 10.35, category: 'main' },
  { id: 'm3', name: 'BEYOND PUB BURGER ', description: 'Beyond Burger on a pretzel bun topped with avocado, lettuce, tomato, and a roasted garlic vegan aioli ', price: 10.35, category: 'main' },
  { id: 'm4', name: 'CHICKEN OR VEGAN TENDERS', description: 'Southern Fried Chicken Tenders or Vegan Tenders with hot sauce, bbq sauce or ranch for dipping', price: 10.35, category: 'main' },
  { id: 'm5', name: 'BUFFALO CHICKEN SALAD', description: 'Mixed Greens topped with grilled or crispy chicken, cucumbers, carrots, celery and a buffalo ranch dressing', price: 10.35, category: 'main' },
  { id: 'm6', name: 'HOUSE SALAD', description: 'Mixed greens topped with grilled or crispy chicken, with fresh cucumber, grape tomatoes, red onions, carrots, cheddar cheese and ranch or balsamic dressing', price: 10.35, category: 'main' },
  { id: 'm7', name: 'BUFFALO RANCH CHICKEN WRAP', description: 'Choose grilled or crispy chicken on a flour tortilla, topped with buffalo ranch dressing, pepper jack cheese, blue cheese crumbles, lettuce and tomatoes', price: 10.35, category: 'main' },
  { id: 'm8', name: 'NASHVILLE HOT CHICKEN SANDWICH ', description: 'Southern fried chicken on a pretzel bun topped with Nashville hot sauce, sliced pickles boursin and smoked gouda spread and coleslaw', price: 10.35, category: 'main' },
  
  // Drinks
  { id: 'd1', name: 'Pepsi', description: 'Classic cola', price: 2.25, category: 'drink' },
  { id: 'd2', name: 'Sprite', description: 'Lemon-lime soda', price: 2.25, category: 'drink' },
  { id: 'd3', name: 'Diet Pepsi', description: 'Diet soda', price: 2.25, category: 'drink' },
  { id: 'd4', name: 'Root Beer', description: 'Mug Root Beer', price: 2.25, category: 'drink' },
  
  // Sides
  { id: 's1', name: 'French Fries', description: 'Crispy golden fries', price: 3.10, category: 'side' },
  { id: 's2', name: 'Side Salad', description: 'Crispy battered onion rings', price: 3.10, category: 'side' },
  { id: 's3', name: 'Fresh Fruit Cup', description: 'Spicy chicken wings', price: 3.10, category: 'side' },
  { id: 's4', name: 'Sautéed Vegetable', description: 'Cheese sticks with marinara sauce', price: 3.10, category: 'side' },
];

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
}

const commonLocations: Location[] = [
  { 
    id: 'hayes',
    name: 'Hayes',
    lat: 40.7128,
    lng: -74.0060,
    address: 'Hayes Hall'
  },
  {
    id: 'welch',
    name: 'Welch',
    lat: 40.7129,
    lng: -74.0061,
    address: 'Welch Hall'
  },
  {
    id: 'smith',
    name: 'Smith',
    lat: 40.7130,
    lng: -74.0062,
    address: 'Smith Hall'
  },
  {
    id: 'frat',
    name: 'Frat House',
    lat: 40.7131,
    lng: -74.0063,
    address: 'Frat House'
  },
  {
    id: 'stuy',
    name: 'Stuyvesant',
    lat: 40.7132,
    lng: -74.0064,
    address: 'Stuyvesant Hall'
  }
];

const PlaceOrder: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [roomNumber, setRoomNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'barter'>('cash');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [showPaymentInput, setShowPaymentInput] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderNotes, setOrderNotes] = useState('');
  const [defaultAddress, setDefaultAddress] = useState('');

  // Fetch user's default address
  useEffect(() => {
    if (user) {
      const fetchUserProfile = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setDefaultAddress(userData.address || '');
            if (!deliveryAddress && userData.address) {
              setDeliveryAddress(userData.address);
            }
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      };
      fetchUserProfile();
    }
  }, [user]);

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    setDeliveryAddress(`${location.name} Hall`);
  };

  const handleRoomNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRoomNumber(value);
    if (selectedLocation) {
      setDeliveryAddress(`${selectedLocation.name} Hall ${value}`);
    }
  };

  const handleItemSelect = (itemId: string) => {
    setSelectedItems(prev => {
      const existing = prev.find(item => item.id === itemId);
      if (existing) {
        return prev.map(item => 
          item.id === itemId 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      const menuItem = menuItems.find(item => item.id === itemId);
      if (!menuItem) return prev;
      return [...prev, { 
        id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: 1 
      }];
    });
  };

  const handleQuantityChange = (itemId: string, change: number) => {
    setSelectedItems(prev => {
      const existing = prev.find(item => item.id === itemId);
      if (!existing) return prev;
      
      const newQuantity = existing.quantity + change;
      if (newQuantity <= 0) {
        return prev.filter(item => item.id !== itemId);
      }
      
      return prev.map(item => 
        item.id === itemId 
          ? { ...item, quantity: newQuantity }
          : item
      );
    });
  };

  const handlePaymentMethodSelect = (method: 'cash' | 'barter') => {
    setPaymentMethod(method);
    setShowPaymentInput(true);
    setPaymentDetails('');
  };

  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => {
      const menuItem = menuItems.find(mi => mi.id === item.id);
      return total + (menuItem?.price || 0) * item.quantity;
    }, 0);
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      setError('Please log in to place an order');
      return;
    }

    if (!selectedItems.length) {
      setError('Please select at least one item');
      return;
    }

    if (!deliveryAddress.trim()) {
      setError('Please enter a delivery address');
      return;
    }

    if (!paymentMethod) {
      setError('Please select a payment method');
      return;
    }

    try {
      setIsPlacingOrder(true);
      console.log('Starting order creation...');

      const orderItems = selectedItems.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity
      }));

      const total = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      const order = {
        customerId: user.uid,
        items: orderItems,
        total,
        deliveryAddress: deliveryAddress.trim(),
        notes: orderNotes.trim() || undefined,
        paymentMethod,
        paymentDetails: paymentDetails.trim() || undefined
      };

      console.log('Order object created:', order);
      const orderId = await createOrder(order);
      console.log('Order created with ID:', orderId);

      // Reset form
      setSelectedItems([]);
      setDeliveryAddress('');
      setSelectedLocation(null);
      setRoomNumber('');
      setOrderNotes('');
      setPaymentDetails('');
      setPaymentMethod('cash');
      setShowPaymentInput(false);
      setError('');

      // Navigate to customer dashboard
      navigate('/customer');
    } catch (error: any) {
      console.error('Error placing order:', error);
      setError(error.message || 'Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Menu Sections */}
        <div className="space-y-6">
          {/* Main Dishes */}
          <section>
            <h2 className="text-xl font-bold mb-4">Main Dishes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {menuItems.filter(item => item.category === 'main').map(item => (
                <div key={item.id} className="bg-background-card rounded-xl p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-text-secondary">{item.description}</p>
                      <p className="text-primary mt-1">${item.price}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {selectedItems.find(si => si.id === item.id) ? (
                        <>
                          <button
                            onClick={() => handleQuantityChange(item.id, -1)}
                            className="w-8 h-8 rounded-full bg-background-dark flex items-center justify-center"
                          >
                            -
                          </button>
                          <span>{selectedItems.find(si => si.id === item.id)?.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item.id, 1)}
                            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center"
                          >
                            +
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleItemSelect(item.id)}
                          className="px-4 py-2 bg-primary rounded-lg text-sm"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Drinks */}
          <section>
            <h2 className="text-xl font-bold mb-4">Drinks</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {menuItems.filter(item => item.category === 'drink').map(item => (
                <div key={item.id} className="bg-background-card rounded-xl p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-text-secondary">{item.description}</p>
                      <p className="text-primary mt-1">${item.price}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {selectedItems.find(si => si.id === item.id) ? (
                        <>
                          <button
                            onClick={() => handleQuantityChange(item.id, -1)}
                            className="w-8 h-8 rounded-full bg-background-dark flex items-center justify-center"
                          >
                            -
                          </button>
                          <span>{selectedItems.find(si => si.id === item.id)?.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item.id, 1)}
                            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center"
                          >
                            +
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleItemSelect(item.id)}
                          className="px-4 py-2 bg-primary rounded-lg text-sm"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Sides */}
          <section>
            <h2 className="text-xl font-bold mb-4">Sides</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {menuItems.filter(item => item.category === 'side').map(item => (
                <div key={item.id} className="bg-background-card rounded-xl p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-text-secondary">{item.description}</p>
                      <p className="text-primary mt-1">${item.price}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {selectedItems.find(si => si.id === item.id) ? (
                        <>
                          <button
                            onClick={() => handleQuantityChange(item.id, -1)}
                            className="w-8 h-8 rounded-full bg-background-dark flex items-center justify-center"
                          >
                            -
                          </button>
                          <span>{selectedItems.find(si => si.id === item.id)?.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item.id, 1)}
                            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center"
                          >
                            +
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleItemSelect(item.id)}
                          className="px-4 py-2 bg-primary rounded-lg text-sm"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Delivery Address */}
        <div className="bg-background-card rounded-xl p-4">
          <h2 className="text-xl font-bold mb-4">Delivery Address</h2>
          
          {defaultAddress && (
            <div className="mb-4">
              <button
                onClick={() => {
                  setDeliveryAddress(defaultAddress);
                  setSelectedLocation(null);
                  setRoomNumber('');
                }}
                className="w-full bg-background-dark text-text-primary py-3 px-4 rounded-xl hover:bg-background-dark/70 transition-colors text-left"
              >
                <span className="text-sm font-medium text-text-secondary">Use Default Address:</span>
                <p className="mt-1">{defaultAddress}</p>
              </button>
            </div>
          )}
          
          {/* Quick Select Locations */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-text-secondary mb-2">Select Hall</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {commonLocations.map(location => (
                <button
                  key={location.id}
                  onClick={() => handleLocationSelect(location)}
                  className={`py-2 px-3 rounded-lg text-sm transition-colors ${
                    selectedLocation?.id === location.id
                      ? 'bg-primary text-white'
                      : 'bg-background-dark text-text-primary hover:bg-background-dark/70'
                  }`}
                >
                  {location.name}
                </button>
              ))}
            </div>
          </div>

          {/* Room Number Input */}
          {selectedLocation && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-text-secondary mb-2">Room Number</h3>
              <input
                type="text"
                value={roomNumber}
                onChange={handleRoomNumberChange}
                placeholder="Enter room number..."
                className="w-full bg-background-dark rounded-lg p-3 text-text-primary placeholder-text-secondary"
              />
            </div>
          )}

          {/* Custom Address Input */}
          <div>
            <h3 className="text-sm font-medium text-text-secondary mb-2">Or Enter Custom Address</h3>
            <textarea
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Enter your delivery address..."
              className="w-full bg-background-dark rounded-lg p-3 text-text-primary placeholder-text-secondary"
              rows={3}
            />
          </div>
        </div>

        {/* Order Notes */}
        <div className="bg-background-card rounded-xl p-4">
          <h2 className="text-xl font-bold mb-4">Special Requests</h2>
          <textarea
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            placeholder="Add any special requests, allergies, or preferences (e.g., extra sauce, no onions, etc.)"
            className="w-full bg-background-dark rounded-lg p-3 text-text-primary placeholder-text-secondary min-h-[100px]"
            rows={4}
          />
        </div>

        {/* Payment Method */}
        <div className="bg-background-card rounded-xl p-4">
          <h2 className="text-xl font-bold mb-4">Payment Method</h2>
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => handlePaymentMethodSelect('cash')}
              className={`flex-1 py-3 rounded-lg ${
                paymentMethod === 'cash' ? 'bg-primary' : 'bg-background-dark'
              }`}
            >
              Cash
            </button>
            <button
              onClick={() => handlePaymentMethodSelect('barter')}
              className={`flex-1 py-3 rounded-lg ${
                paymentMethod === 'barter' ? 'bg-primary' : 'bg-background-dark'
              }`}
            >
              Barter
            </button>
          </div>

          {showPaymentInput && (
            <div className="mt-4">
              <input
                type="text"
                value={paymentDetails}
                onChange={(e) => setPaymentDetails(e.target.value)}
                placeholder={
                  paymentMethod === 'cash'
                    ? "Enter the amount you'll have ready"
                    : "Describe what you're offering to barter"
                }
                className="w-full bg-background-dark rounded-lg p-3 text-text-primary placeholder-text-secondary"
              />
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Order Summary and Place Order Button */}
        <div className="bg-background-card rounded-xl p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Order Summary</h2>
            <span className="text-2xl font-bold text-primary">${calculateTotal().toFixed(2)}</span>
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder || selectedItems.length === 0}
            className={`w-full py-3 px-4 rounded-lg text-white font-medium ${
              isPlacingOrder || selectedItems.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
          </button>
        </div>
      </div>
    </PageLayout>
  );
};

export default PlaceOrder; 