# LateGrub - Late Night Food Delivery App

A modern food delivery application built with React, TypeScript, and Firebase, featuring a beautiful dark theme UI inspired by energy flow visualizations.

## Features

-  Beautiful dark theme UI with energy flow visualizations
-  Real-time order tracking
-  Live chat between customers and delivery personnel
-  Secure authentication with Firebase
-  Responsive design for all devices
-  Role-based access control (Customer/Delivery)

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Firebase (Auth, Firestore, Storage)
- React Router v6

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Firebase project

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/lategrub.git
   cd lategrub
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a Firebase project and enable:
   - Authentication (Email/Password)
   - Cloud Firestore
   - Storage

4. Copy `.env.example` to `.env` and fill in your Firebase configuration:
   ```bash
   cp .env.example .env
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication and choose Email/Password provider
3. Create a Cloud Firestore database
4. Enable Storage
5. Copy your Firebase configuration to `.env` file

### Development

- Start development server:
  ```bash
  npm run dev
  ```

- Build for production:
  ```bash
  npm run build
  ```

- Preview production build:
  ```bash
  npm run preview
  ```

## Project Structure

```
src/
├── components/        # Reusable UI components
├── pages/            # Page components
├── lib/              # Utilities and Firebase setup
├── assets/           # Static assets
└── types/            # TypeScript type definitions
```

## Key Components

### Customer Flow
- Landing Page (/)
- Customer Dashboard (/customer)
- Order Tracking (/track-order/:orderId)
- Chat (/chat/:orderId)

### Delivery Flow
- Delivery Dashboard (/delivery)
- Order Management
- Chat with Customers

### Shared Components
- Authentication (Login/Signup)
- Real-time Order Tracking
- Chat Interface
- Energy Flow Visualizations

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Design inspiration from modern energy monitoring dashboards
- Icons from Heroicons
- UI components styled with Tailwind CSS 
