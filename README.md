# SSMS — Smart Staff Management System

A robust, full-stack staff management portal designed for modern workplaces. SSMS focuses on security, anti-manipulation, and intuitive management of employees, attendance, and payroll.

## 🚀 Key Features

### 🛡️ Security & Anti-Manipulation
- **Geofencing (Location-Based Access)**: Restricts check-in and check-out to a specific radius (e.g., 200m) around the office using GPS data and the Haversine formula.
- **Device Authorization (Device Binding)**: Every employee is locked to their first-used device. Attendance cannot be marked from unauthorized phones or browsers, preventing "proxy" entries.
- **Server-Side Verification**: All time calculations and GPS validations happen on the server to prevent device clock or location spoofing.
- **Daily QR Tokens**: Unique daily tokens ensure employees are physically present to scan and mark attendance.

### 👥 For Administrators
- **Real-time Monitoring**: Track check-ins, check-outs, and late arrivals.
- **Employee Management**: Create, update, or suspend employee profiles.
- **Office Management**: Configure the office geofence coordinates and radius.
- **Payroll & Leaves**: Automated salary calculations based on work hours, including overtime and deductions.

### 📱 For Employees
- **Easy Check-In/Out**: One-tap attendance marking via QR scanning.
- **Dashboard**: View this month's salary, work hours, and attendance history.
- **Profile**: manage contact details and view designation.

## 🛠️ Technology Stack
- **Frontend**: React, Tailwind CSS, Lucide Icons, Axios.
- **Backend**: Node.js, Express, Mongoose (MongoDB).
- **Security**: JWT Authentication, Bcrypt password hashing, Geolocation API.

## 📦 Getting Started

### Prerequisites
- Node.js (v14+)
- MongoDB (Local or Atlas)

### Installation
1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/SSMS.git
   cd SSMS
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   npm install
   # Create a .env file based on .env.example (set MONGODB_URI, JWT_SECRET, etc.)
   npm run dev
   ```

3. **Seed the Admin User** (run once after the backend is configured):
   ```bash
   cd backend
   npm run seed
   ```
   This creates the initial Super Admin account using the credentials defined in your `.env` file.
   Default credentials (override via environment variables before seeding):

   | Field    | Default Value                 |
   |----------|-------------------------------|
   | Email    | `admin@ssms.com` |
   | Password | `Admin@123`              |

   > ⚠️ **Change the default password** after first login, especially in production.

4. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 📬 Contact
Built and maintained by **SSMS Team**.
Repository: [https://github.com/your-username/SSMS.git](https://github.com/your-username/SSMS.git)
