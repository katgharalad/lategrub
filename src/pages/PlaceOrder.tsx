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
  category: 'main' | 'drink' | 'side';
}

const menuItems: MenuItem[] = [
  // Main dishes
  { id: 'm1', name: 'SMASHED PUB BURGER', description: 'House seasoned smash burger on a pretzel bun, topped with grilled onions, colby jack cheese and garlic aioli', category: 'main' },
  { id: 'm2', name: 'SMASHED RODEO BURGER', description: 'House seasoned smash burger on a pretzel bun, topped with crispy onions, hickory BBQ sauce, bacon and cheddar cheese', category: 'main' },
  { id: 'm3', name: 'BEYOND PUB BURGER ', description: 'Beyond Burger on a pretzel bun topped with avocado, lettuce, tomato, and a roasted garlic vegan aioli ', category: 'main' },
  { id: 'm4', name: 'CHICKEN OR VEGAN TENDERS', description: 'Southern Fried Chicken Tenders or Vegan Tenders with hot sauce, bbq sauce or ranch for dipping', category: 'main' },
  { id: 'm5', name: 'BUFFALO CHICKEN SALAD', description: 'Mixed Greens topped with grilled or crispy chicken, cucumbers, carrots, celery and a buffalo ranch dressing', category: 'main' },
  { id: 'm6', name: 'HOUSE SALAD', description: 'Mixed greens topped with grilled or crispy chicken, with fresh cucumber, grape tomatoes, red onions, carrots, cheddar cheese and ranch or balsamic dressing', category: 'main' },
  { id: 'm7', name: 'BUFFALO RANCH CHICKEN WRAP', description: 'Choose grilled or crispy chicken on a flour tortilla, topped with buffalo ranch dressing, pepper jack cheese, blue cheese crumbles, lettuce and tomatoes', category: 'main' },
  { id: 'm8', name: 'NASHVILLE HOT CHICKEN SANDWICH ', description: 'Southern fried chicken on a pretzel bun topped with Nashville hot sauce, sliced pickles boursin and smoked gouda spread and coleslaw', category: 'main' },
  
  // Drinks
  { id: 'd1', name: 'Pepsi', description: 'Classic cola', category: 'drink' },
  { id: 'd2', name: 'Sprite', description: 'Lemon-lime soda', category: 'drink' },
  { id: 'd3', name: 'Diet Pepsi', description: 'Diet soda', category: 'drink' },
  { id: 'd4', name: 'Root Beer', description: 'Mug Root Beer', category: 'drink' },
  
  // Sides
  { id: 's1', name: 'French Fries', description: 'Crispy golden fries', category: 'side' },
  { id: 's2', name: 'Side Salad', description: 'Crispy battered onion rings', category: 'side' },
  { id: 's3', name: 'Fresh Fruit Cup', description: 'Spicy chicken wings', category: 'side' },
  { id: 's4', name: 'Sautéed Vegetable', description: 'Cheese sticks with marinara sauce', category: 'side' },
];

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  icePreference?: 'ice' | 'no_ice';
  tenderType?: 'chicken' | 'vegan';
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

interface OrderPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  order: {
    items: OrderItem[];
    deliveryAddress: string;
    notes?: string;
    paymentMethod: 'cash' | 'barter';
    paymentDetails?: string;
  };
}

const OrderPreviewModal: React.FC<OrderPreviewModalProps> = ({ isOpen, onClose, onConfirm, order }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background-card rounded-xl p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Order Preview</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Items</h3>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{item.name}</span>
                    {item.icePreference && (
                      <span className="text-sm text-text-secondary ml-2">
                        ({item.icePreference === 'ice' ? 'With Ice' : 'No Ice'})
                      </span>
                    )}
                    {item.tenderType && (
                      <span className="text-sm text-text-secondary ml-2">
                        ({item.tenderType.charAt(0).toUpperCase() + item.tenderType.slice(1)})
                      </span>
                    )}
                  </div>
                  <span>x{item.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-background-dark rounded-lg p-4 mb-4">
            <h3 className="text-sm font-medium mb-2">Delivery Address:</h3>
            <p className="text-sm">{order.deliveryAddress}</p>
          </div>

          {/* Special Requests */}
          {order.notes && (
            <div className="bg-background-dark rounded-lg p-4 mb-4">
              <h3 className="text-sm font-medium mb-2">Special Requests:</h3>
              <p className="text-sm">{order.notes}</p>
            </div>
          )}

          {/* Payment Information */}
          <div className="bg-background-dark rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium mb-2">Payment Information:</h3>
            <p className="text-sm capitalize">Method: {order.paymentMethod}</p>
            {order.paymentDetails && (
              <p className="text-sm mt-1">
                {order.paymentMethod === 'cash' ? `Amount: $${order.paymentDetails}` : `Barter Details: ${order.paymentDetails}`}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 rounded-lg bg-background-dark text-text-primary hover:bg-background-dark/70 transition-colors"
            >
              Edit Order
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2 px-4 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
            >
              Place Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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
  const [showPreview, setShowPreview] = useState(false);

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

  const handleItemSelect = (itemId: string, icePreference?: 'ice' | 'no_ice', tenderType?: 'chicken' | 'vegan') => {
    setSelectedItems(prev => {
      const existing = prev.find(item => item.id === itemId);
      
      if (existing) {
        // If item exists and we're updating ice preference or tender type
        if (icePreference || tenderType) {
          return prev.map(item => 
            item.id === itemId
              ? { 
                  ...item, 
                  icePreference: icePreference || item.icePreference,
                  tenderType: tenderType || item.tenderType,
                  name: tenderType 
                    ? `CHICKEN OR VEGAN TENDERS (${tenderType.charAt(0).toUpperCase() + tenderType.slice(1)})`
                    : item.name
                }
              : item
          );
        }
        // If item exists and we're just adding quantity
        return prev.map(item => 
          item.id === itemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      // If item doesn't exist, create new item
      const menuItem = menuItems.find(item => item.id === itemId);
      if (!menuItem) return prev;
      
      return [...prev, { 
        id: menuItem.id,
        name: tenderType 
          ? `${menuItem.name} (${tenderType.charAt(0).toUpperCase() + tenderType.slice(1)})`
          : menuItem.name,
        quantity: 1,
        icePreference: menuItem.category === 'drink' ? (icePreference || 'ice') : undefined,
        tenderType: tenderType
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

    // Show preview instead of placing order immediately
    setShowPreview(true);
  };

  const handleConfirmOrder = async () => {
    if (!user) {
      setError('Please log in to place an order');
      return;
    }

    try {
      setIsPlacingOrder(true);
      console.log('Starting order creation...');

      const orderItems = selectedItems.map(item => {
        const cleanItem: any = {
          name: item.name,
          quantity: item.quantity
        };
        
        // Only add icePreference if it exists
        if (item.icePreference) {
          cleanItem.icePreference = item.icePreference;
        }
        
        // Only add tenderType if it exists
        if (item.tenderType) {
          cleanItem.tenderType = item.tenderType;
        }
        
        return cleanItem;
      });

      const order: any = {
        customerId: user.uid,
        items: orderItems,
        deliveryAddress: deliveryAddress.trim(),
        status: 'ordered',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Only add optional fields if they have content
      if (orderNotes.trim()) {
        order.notes = orderNotes.trim();
      }

      // Add payment info
      order.paymentMethod = paymentMethod;
      if (paymentDetails.trim()) {
        order.paymentDetails = paymentDetails.trim();
      }

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
      setShowPreview(false);

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
                  <div className="flex flex-col space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-text-secondary">{item.description}</p>
                      </div>
                      {selectedItems.find(si => si.id === item.id) ? (
                        <div className="flex items-center space-x-2">
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
                        </div>
                      ) : (
                        <button
                          onClick={() => handleItemSelect(item.id)}
                          className="px-4 py-2 bg-primary rounded-lg text-sm text-white hover:bg-primary-dark transition-colors"
                        >
                          Add
                        </button>
                      )}
                    </div>
                    
                    {selectedItems.find(si => si.id === item.id) && item.id === 'm4' && (
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-text-secondary">Type:</span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleItemSelect(item.id, undefined, 'chicken')}
                            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                              selectedItems.find(si => si.id === item.id)?.tenderType === 'chicken'
                                ? 'bg-primary text-white'
                                : 'bg-background-dark text-text-primary hover:bg-background-hover'
                            }`}
                          >
                            Chicken
                          </button>
                          <button
                            onClick={() => handleItemSelect(item.id, undefined, 'vegan')}
                            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                              selectedItems.find(si => si.id === item.id)?.tenderType === 'vegan'
                                ? 'bg-primary text-white'
                                : 'bg-background-dark text-text-primary hover:bg-background-hover'
                            }`}
                          >
                            Vegan
                          </button>
                        </div>
                      </div>
                    )}
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
                  <div className="flex flex-col space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-text-secondary">{item.description}</p>
                      </div>
                      {selectedItems.find(si => si.id === item.id) ? (
                        <div className="flex items-center space-x-2">
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
                        </div>
                      ) : (
                        <button
                          onClick={() => handleItemSelect(item.id, 'ice')}
                          className="px-4 py-2 bg-primary rounded-lg text-sm text-white hover:bg-primary-dark transition-colors"
                        >
                          Add
                        </button>
                      )}
                    </div>
                    
                    {selectedItems.find(si => si.id === item.id) && (
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-text-secondary">Ice:</span>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleItemSelect(item.id, 'ice')}
                            className={`px-3 py-1 rounded-full text-xs transition-colors ${
                              selectedItems.find(si => si.id === item.id)?.icePreference === 'ice'
                                ? 'bg-primary text-white'
                                : 'bg-background-dark text-text-primary hover:bg-background-hover'
                            }`}
                          >
                            With Ice
                          </button>
                          <button
                            onClick={() => handleItemSelect(item.id, 'no_ice')}
                            className={`px-3 py-1 rounded-full text-xs transition-colors ${
                              selectedItems.find(si => si.id === item.id)?.icePreference === 'no_ice'
                                ? 'bg-primary text-white'
                                : 'bg-background-dark text-text-primary hover:bg-background-hover'
                            }`}
                          >
                            No Ice
                          </button>
                        </div>
                      </div>
                    )}
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

        {/* Order Preview Modal */}
        <OrderPreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          onConfirm={handleConfirmOrder}
          order={{
            items: selectedItems,
            deliveryAddress,
            notes: orderNotes,
            paymentMethod,
            paymentDetails
          }}
        />

        {/* Place Order Button */}
        <div className="bg-background-card rounded-xl p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Order Summary</h2>
            <span className="text-2xl font-bold text-primary">
              {paymentMethod === 'cash' ? 
                (paymentDetails ? `$${paymentDetails}` : 'Enter cash amount') :
                (paymentDetails ? `Barter: ${paymentDetails}` : 'Enter barter details')}
            </span>
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
            {isPlacingOrder ? 'Placing Order...' : 'Review Order'}
          </button>
        </div>
      </div>
    </PageLayout>
  );
};

export default PlaceOrder; 