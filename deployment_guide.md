# 🚀 SSMS Deployment Guide

This document provides a step-by-step guide to deploying the **SSMS (Smart Staff Management System)**. Since the backend and frontend are hosted at different locations, we will configure them to communicate with each other securely.

---

## 🛠 Prerequisites
1.  **MongoDB Atlas**: Create a cluster and get your `MONGODB_URI`.
2.  **GitHub Repository**: Push your code to GitHub (monorepo structure `/backend` and `/frontend`).
3.  **Deployment Platforms**:
    *   **Backend**: [Render](https://render.com) (Recommended) or [Vercel](https://vercel.com).
    *   **Frontend**: [Vercel](https://vercel.com) or [Netlify](https://netlify.com).

---

## 💾 1. Database Setup (MongoDB Atlas)
1.  Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2.  Create a new Cluster (the "M0" free tier is sufficient).
3.  Go to **Database Access** and create a user with "Read and Write to any database" permissions.
4.  Go to **Network Access** and select "Allow Access from Anywhere" (`0.0.0.0/0`) during deployment.
5.  Click **Connect** → **Drivers** and copy your **Connection String** (e.g., `mongodb+srv://user:pass@cluster.mongodb.net/ssms?retryWrites=true&w=majority`).

---

## ⚙️ 2. Backend Deployment (e.g., on Render)

### Step 1: Create a New Web Service
1.  Connect your GitHub repository.
2.  Set the **Root Directory** to `backend`.
3.  Set the **Environment** to `Node`.

### Step 2: Configure Build & Start Commands
*   **Build Command**: `npm install && npm run build`
*   **Start Command**: `npm start`

### Step 3: Add Environment Variables
Add the following variables in the Render dashboard:
*   `MONGODB_URI`: Your Atlas connection string.
*   `JWT_SECRET`: A very long random string.
*   `NODE_ENV`: `production`
*   `FRONTEND_URL`: The URL where your frontend will be deployed (e.g., `https://ssms-app.vercel.app`).
*   `PORT`: `5001` (Render usually sets this automatically, but good to have).

---

## 🎨 3. Frontend Deployment (e.g., on Vercel)

### Step 1: Create a New Project
1.  Connect your GitHub repository.
2.  Select the **Root Directory** as `frontend`.
3.  Vercel will detect it as a **Vite** project.

### Step 2: Add Environment Variables
Add this variable before deploying:
*   `VITE_API_URL`: Your deployed backend URL (e.g., `https://ssms-api.render.com`).

### Step 3: Deploy
1. Click **Deploy**.
2. Once finished, copy the **Production URL**.
3. **Crucial**: Go back to your **Backend settings** and update the `FRONTEND_URL` variable with this new frontend URL.

---

## 🌱 4. Seeding the Admin Account
Once the backend is deployed, you need to create the initial admin user. You can do this from your local machine:

1.  Open your local `backend/.env`.
2.  Temporarily change `MONGODB_URI` to point to your **Atlas database**.
3.  Run the seed command:
    ```bash
    npm run seed
    ```
4.  The system will create the Super Admin account in your online database.
5.  **Log in online** using the email/password defined in your seed options.

---

## ✅ Deployment Checklist

- [ ] **CORS**: Backend `FRONTEND_URL` matches the actual frontend domain.
- [ ] **API URL**: Frontend `VITE_API_URL` points to the production backend URL (no trailing slash).
- [ ] **Auth**: `NODE_ENV` is set to `production` on backend for secure cookie handling.
- [ ] **MongoDB**: Atlas Network Access allows connections from the backend server IP.

---

## 🔒 Security Post-Deployment
1.  **Change Passwords**: Change the default admin password immediately.
2.  **IP Restriction**: If possible, restrict MongoDB Network Access to the specific IP address of your backend server for better security.
