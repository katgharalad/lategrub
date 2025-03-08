rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isCustomer() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'customer';
    }
    
    function isDeliveryPerson() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'delivery';
    }
    
    // User profiles
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if request.auth.uid == userId;
    }
    
    // Orders
    match /orders/{orderId} {
      // Allow read if user is authenticated
      allow read: if isAuthenticated();
      
      // Allow customers to create orders
      allow create: if isAuthenticated() && 
        request.resource.data.customerId == request.auth.uid &&
        request.resource.data.status == 'ordered';
      
      // Allow updates based on role and conditions
      allow update: if isAuthenticated() && (
        // Customer can update their own orders
        request.auth.uid == resource.data.customerId ||
        
        // Delivery person can accept unassigned orders
        (isDeliveryPerson() && 
         resource.data.deliveryPersonId == null && 
         request.resource.data.deliveryPersonId == request.auth.uid &&
         request.resource.data.status == 'waiting') ||
        
        // Assigned delivery person can update order status
        (isDeliveryPerson() && 
         resource.data.deliveryPersonId == request.auth.uid)
      );
    }
    
    // Messages (as a top-level collection)
    match /messages/{messageId} {
      allow read: if isAuthenticated() && (
        (isCustomer() && get(/databases/$(database)/documents/orders/$(resource.data.orderId)).data.customerId == request.auth.uid) ||
        (isDeliveryPerson() && (
          get(/databases/$(database)/documents/orders/$(resource.data.orderId)).data.deliveryPersonId == request.auth.uid ||
          get(/databases/$(database)/documents/orders/$(resource.data.orderId)).data.deliveryPersonId == null
        ))
      );
      allow create: if isAuthenticated();
    }
  }
}