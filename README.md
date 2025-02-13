# ChatWAuth - Real-time Chat Application with Authentication

## 🌟 Overview

ChatWAuth is a modern, feature-rich real-time chat application built with a robust tech stack including React, Node.js, and Socket.IO. The application offers secure authentication, real-time messaging, and a rich set of features for an engaging chat experience.

## ✨ Features

### Core Features
- 🔐 Secure user authentication and authorization
- 💬 Real-time messaging using Socket.IO
- 📅 Message timestamp and date formatting
- 😊 Emoji support in messages
- 📊 Analytics and data visualization
- 👥 Channel/Group chat support
- 📎 File sharing & attachment support
- 📌 Message pinning functionality
- 🔄 Real-time channel member management
- 🎨 User color themes & avatars
- 📱 Responsive design for all devices

### Security Features
- 🔒 JWT-based authentication
- 🔑 Bcrypt password hashing
- 🛡️ Protected routes and API endpoints
- 📧 Email verification system

## 🚀 Tech Stack

### Frontend (Client)
- **Core**: React.js with Vite
- **State Management**: Zustand
- **Styling**: TailwindCSS with animations
- **UI Components**: Radix UI primitives
- **Form Handling**: React Hook Form with Zod validation
- **Real-time Communication**: Socket.IO Client
- **Routing**: React Router DOM
- **Date Handling**: date-fns & Moment.js
- **Charts**: Recharts

### Backend (Server)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.IO
- **Authentication**: JWT & Bcrypt
- **Email Service**: Nodemailer
- **File Upload**: Multer
- **Task Scheduling**: Node-cron
- **Message Queue**: Kafka
- **Environment**: dotenv

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Setup Steps

1. **Clone the repository**
```bash
git clone https://github.com/haraherri/ChatWAuth.git
cd ChatWAuth
```

2. **Install dependencies for both client and server**
```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

3. **Environment Configuration**

Create `.env` files in both client and server directories:

For client (.env):
```
VITE_SERVER_URL=http://localhost:8081
```

For server (.env):
```
PORT=
JWT_SECRET_KEY=
ORIGIN=
URL=
CONNECTION_URL=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
MAILTRAP_HOST=
MAILTRAP_PORT=
MAILTRAP_USER=
MAILTRAP_PASS=
ADMIN_EMAIL=
ADMIN_PASSWORD=
NODE_ENV=
KAFKA_BROKERS=
KAFKA_CLIENT_ID=
ENABLE_KAFKA=
```

4. **Start the application**

In the server directory:
```bash
npm run start
```

In the client directory:
```bash
npm run dev
```

## 🎯 Usage

1. **Admin First Access**
   - The system automatically creates a default admin account during first deployment
   - Access credentials:
     - Email: Configured in `.env` file (`ADMIN_EMAIL`)
     - Password: Configured in `.env` file (`ADMIN_PASSWORD`)
   - For security, change the default password immediately after first login

2. **Regular User Access**
   - Register new account through the signin/signup page
   - Complete email verification process
   - Log in to and update your profile information before using

3. **Using Chat Features**
   - Join or create chat rooms based on permissions
   - Engage in room-based or private conversations
   - Share files and manage messages
   - Use moderation tools (if authorized)

4. **System Management**
   - Access admin dashboard for system configuration
   - Manage users and chat rooms
   - Monitor system activities

For detailed documentation about specific features and configurations, refer to our user guide.

## 🛠️ Development

#### Frontend (client)
- Built with **Vite** and **React 18**
- Real-time communication using **Socket.IO Client**
- Form handling with **React Hook Form** and **Zod** validation
- State management using **Zustand**
- UI components from **Radix UI**
- Styling with **TailwindCSS**
- Charts and data visualization using **Recharts**

#### Backend (server)
- **Node.js** with **Express.js** framework
- Real-time WebSocket server using **Socket.IO**
- MongoDB database with **Mongoose** ODM
- Authentication using **JWT** and **bcrypt**
- File upload handling with **Multer**
- Email services using **Nodemailer**
- Message queuing with **Kafka** (optional)
- Scheduled tasks using **node-cron**
- CORS and cookie handling


## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📝 License

This project is licensed under the ISC License.

## 👤 Author

**haraherri**
- GitHub: [@haraherri](https://github.com/haraherri)

## 📮 Contact

For any queries or support, please create an issue in the repository.

Made with ❤️ by haraherri