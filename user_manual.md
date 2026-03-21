# 📘 Smart Staff Management System (SSMS) — Complete User Manual

> **Version:** 1.0 | **Last Updated:** 15 March 2026
> **No coding knowledge required.** This guide explains every feature with screenshots.

---

## 📋 Table of Contents

1. [What is SSMS?](#what-is-ssms)
2. [How to Start the System](#how-to-start-the-system)
3. [Login Credentials](#login-credentials)
4. [Admin Guide — Full Instructions](#-admin-guide)
   - [Dashboard](#1-dashboard)
   - [Managing Employees](#2-managing-employees)
   - [Attendance Records](#3-attendance-records)
   - [Payroll & Leave Management](#4-payroll--leave-management)
   - [Settings & Rules](#5-settings--rules)
5. [Employee Guide — Full Instructions](#-employee-guide)
   - [Employee Dashboard](#1-employee-dashboard)
   - [Marking Attendance (Check In / Check Out)](#2-marking-attendance)
   - [Leave Now (Early Exit)](#3-leave-now--early-exit)
   - [Leave Requests](#4-leave-requests)
   - [My Profile](#5-my-profile)
6. [Automation Features (Everything That Works Automatically)](#-automation-features)
7. [Work Hours & Salary Rules Explained](#-work-hours--salary-rules)
8. [Frequently Asked Questions](#-frequently-asked-questions)

---

## What is SSMS?

SSMS (Smart Staff Management System) is a complete staff management solution that helps companies:

| Feature | What It Does |
|---------|-------------|
| 👤 **Employee Management** | Add, edit, delete staff members |
| 📅 **Attendance Tracking** | One-click daily attendance with GPS location |
| 💰 **Salary Calculation** | Auto-calculate salary with overtime & deductions |
| 📊 **Analytics** | Track department attendance, absences, performance |
| 🏖️ **Leave Management** | Employees request leaves, admin approves/rejects |
| 🎯 **Custom Work Hours** | Set different schedules for each employee |
| ⚙️ **Deduction Rules** | Auto-deduct salary for late arrivals, absences |
| 📅 **Holiday Calendar** | Manage company holidays |

---

## How to Start the System

> [!IMPORTANT]
> You need to open **two terminal windows** to run the system. Here's how:

### Step 1: Start the Backend (Server)
Open a terminal and type these commands one by one:
```
cd ssms/backend
npm run dev
```
Wait until you see: `Server running in development mode on port 5001` and `MongoDB Connected`

### Step 2: Start the Frontend (Website)
Open a **second** terminal and type:
```
cd ssms/frontend
npm run dev
```
Wait until you see: `Local: http://localhost:5173`

### Step 3: Open the Website
Open your web browser (Chrome, Safari, etc.) and go to:
```
http://localhost:5173
```

> [!TIP]
> Both terminals must stay open while you use the system. Don't close them.

---

## Login Credentials

| Who | Email | Password |
|-----|-------|----------|
| **Admin / Owner** | `admin@ssms.com` | `Admin@123` |
| **Employees** | *(The email you set when adding them)* | *(The password you set when adding them)* |

![Login Page](/Users/bharatsutariya/.gemini/antigravity/brain/ca19098d-8056-4b84-a7e0-3c61b033d705/ssms_login.png)

### How to Login:
1. Open `http://localhost:5173` in your browser
2. Type your **Email** in the first box
3. Type your **Password** in the second box
4. Click **"Sign In"**
5. If you are **Admin** → you will see the Admin Dashboard
6. If you are **Employee** → you will see the Employee Portal

---

## 👔 Admin Guide

### 1. Dashboard

After logging in as Admin, you will see the Dashboard:

![Admin Dashboard](/Users/bharatsutariya/.gemini/antigravity/brain/ca19098d-8056-4b84-a7e0-3c61b033d705/ssms_admin_dashboard.png)

**What you see here:**

| Card | Meaning |
|------|---------|
| **Total Employees** | How many staff members are registered |
| **Present Today** | How many people checked in today |
| **Absent Today** | How many people did NOT check in today |
| **Late Today** | How many people checked in after 9:15 AM |

**Other sections:**
- **Today's Check-Ins** — Shows who checked in and at what time
- **Department Attendance** — Bar chart showing attendance per department
- **Green Badge** — "QR Codes Auto-Generated Daily" means the system is automated (no manual action needed)

---

### 2. Managing Employees

Click **"Employees"** in the left sidebar to manage your staff.

![Employees Page](/Users/bharatsutariya/.gemini/antigravity/brain/ca19098d-8056-4b84-a7e0-3c61b033d705/ssms_admin_employees.png)

#### ➕ Adding a New Employee

1. Click the blue **"+ Add Employee"** button (top right)
2. A form will appear:

![Add Employee Form](/Users/bharatsutariya/.gemini/antigravity/brain/ca19098d-8056-4b84-a7e0-3c61b033d705/ssms_add_employee.png)

3. Fill in ALL the fields:

| Field | What to Enter | Example |
|-------|--------------|---------|
| **Employee ID** | A unique ID for this person | `SSMS-1002` |
| **Full Name** | Their full name | `Priya Sharma` |
| **Email** | Their email (they will use this to login) | `priya@company.com` |
| **Phone** | Phone number | `9876543210` |
| **Department** | Select from dropdown | `Engineering` |
| **Designation** | Their job title | `Frontend Developer` |
| **Monthly Salary (₹)** | How much they earn monthly | `35000` |
| **Work Hrs/Day** | How many hours they work daily | `9 hrs (Full-time)` |
| **Joining Date** | When they joined | Select date |
| **Login Password** | Password for them to login | `priya@123` |
| **Role** | Their access level | `Employee` |

> [!IMPORTANT]
> **Work Hrs/Day** is the key field! Each employee can have different hours:
> - **4 hrs** = Part-time worker
> - **6 hrs** = Part-time worker
> - **8 hrs** = Standard full-time
> - **9 hrs** = Full-time (default)
> - **10 hrs** = Extended shift
> - **12 hrs** = Night/long shift

4. Click **"Create Employee"**
5. ✅ Done! The employee can now login with their email and password

> [!TIP]
> **Remember to share the email and password with the employee!** They need it to login and mark attendance.

#### ✏️ Editing an Employee
1. Find the employee in the table
2. Click the **pencil icon (✏️)** on their row
3. Change whatever you need
4. Click **"Update Employee"**

#### 🗑️ Deleting an Employee
1. Find the employee in the table
2. Click the **trash icon (🗑️)** on their row
3. The employee will be removed from the system

#### 🔍 Searching
Type a name, Employee ID, or department in the **search box** to filter the list.

---

### 3. Attendance Records

Click **"Attendance"** in the left sidebar.

![Attendance Records](/Users/bharatsutariya/.gemini/antigravity/brain/ca19098d-8056-4b84-a7e0-3c61b033d705/ssms_admin_attendance.png)

**What you can do here:**
- **See all attendance** — Every check-in and check-out by all employees
- **Search** — Type name or Employee ID to find specific records
- **Filter by date** — Use the date picker to see records for a specific day
- **Export CSV** — Click the **"Export CSV"** button to download all data as an Excel-compatible file

**Each row shows:**
| Column | Meaning |
|--------|---------|
| **Employee** | Who checked in |
| **Date** | What day |
| **Check In** | What time they arrived |
| **Check Out** | What time they left |
| **Hours** | How many hours they worked |
| **Status** | Present / Late / Half Day |

---

### 4. Payroll & Leave Management

Click **"Payroll & Leave"** in the left sidebar.

![Payroll & Leave](/Users/bharatsutariya/.gemini/antigravity/brain/ca19098d-8056-4b84-a7e0-3c61b033d705/ssms_admin_payroll.png)

This page has **two tabs**: Payroll and Leaves.

#### 💰 Payroll Tab
1. Select an employee from the dropdown
2. System shows their complete **payslip**:
   - **Base Salary** — Their monthly salary
   - **Work Hours/Day** — Their scheduled work hours
   - **Overtime Pay** — Extra pay for working more than their scheduled hours (1.5x rate)
   - **Deductions** — Money deducted for late arrivals, absences, etc.
   - **Net Salary** — Final amount they should receive
   - **Attendance Summary** — How many days were present, late, absent, half-day

#### 📋 Leaves Tab
Shows all leave requests from employees:
- Click **✅ Approve** to approve a leave request
- Click **❌ Reject** to reject a leave request
- View the reason, dates, and type of leave

---

### 5. Settings & Rules

Click **"Settings"** in the left sidebar.

![Settings Page](/Users/bharatsutariya/.gemini/antigravity/brain/ca19098d-8056-4b84-a7e0-3c61b033d705/ssms_admin_settings.png)

This page has three sections:

#### ⚡ Automation Status
A green box at the top confirms: **"Daily QR Codes — Fully Automated"**
This means the system automatically generates attendance tokens for every employee at midnight. You don't need to do anything!

#### 📏 Salary Deduction Rules
Create rules to automatically deduct salary for:

| Example Rule | Trigger | Deduction |
|-------------|---------|-----------|
| Late Penalty | When someone comes after 9:15 AM | ₹500 per late day |
| Absent Cut | When someone doesn't come | Full day salary deducted |
| Half Day Deduction | When someone works < half hours | 50% of daily salary |

**How to add a rule:**
1. Click **"+ Add Rule"**
2. Fill in:
   - **Rule Name** — e.g., "Late Penalty"
   - **Trigger** — What causes this deduction (Late / Half Day / Absent)
   - **Deduction Type** — Fixed Amount (₹), Percentage (%), or Full Day Cut
   - **Value** — The amount (e.g., 500 for ₹500, or 50 for 50%)
3. Click **"Create Rule"**

#### 📅 Holiday Calendar
Add company holidays so the system knows when people should be off:
1. Click **"+ Add Holiday"**
2. Enter: Holiday Name, Date, and Type (Public/Company/Optional)
3. Click **"Add Holiday"**
4. To remove a holiday, click the **trash icon (🗑️)**

---

## 📱 Employee Guide

### 1. Employee Dashboard

After logging in as an Employee, you see your personal dashboard:

![Employee Dashboard](/Users/bharatsutariya/.gemini/antigravity/brain/ca19098d-8056-4b84-a7e0-3c61b033d705/ssms_employee_dashboard.png)

**What you see:**
- Your **salary information**
- Your **recent attendance** history
- Your **payslip breakdown** for the current month
- Your **work hours** statistics

> [!NOTE]
> You can ONLY see your own data. Other employees' data is hidden.

---

### 2. Marking Attendance

Tap **"Scan QR"** in the bottom navigation bar.

![Attendance Page](/Users/bharatsutariya/.gemini/antigravity/brain/ca19098d-8056-4b84-a7e0-3c61b033d705/ssms_employee_scan.png)

#### Checking In (Start of Day):
1. When you arrive at work, open the app
2. Tap **"Scan QR"** tab at the bottom
3. Press the big green button: **"Mark Present — Check In"**
4. Allow location access if your phone/browser asks
5. ✅ Done! Your attendance is marked with exact time + GPS location

**What happens behind the scenes:**
- The system uses your unique daily token (auto-generated at midnight)
- Your GPS location is recorded
- If you check in **after 9:15 AM**, you are marked as **"Late"**
- You can only check in **once per day** — the button won't work twice

#### Checking Out (End of Day):
After checking in, two buttons appear:
- 🔵 **"Check Out — End Day"** — for normal end-of-day checkout
- 🟡 **"Leave Now — Early Exit"** — for leaving before your full hours

**Live Working Timer:** You'll see a green box showing exactly how long you've been working (e.g., "3h 24m 15s")

1. At the end of your day, press **"Check Out — End Day"**
2. Your total hours are calculated automatically
3. If you worked **more than your scheduled hours** → overtime is recorded
4. If you worked **less than half your hours** → marked as "Half Day"

---

### 3. Leave Now — Early Exit

If you need to leave work early:

1. Press the amber **"Leave Now — Early Exit"** button
2. A confirmation popup will appear: *"Are you sure you want to leave early?"*
3. Click **"OK"** to confirm
4. Your exact exit time is recorded
5. The system calculates how many hours you worked

> [!WARNING]
> **Less than half your scheduled hours = Half Day**
>
> For example:
> - If you're a **9-hour employee** and leave after **3 hours** → Half Day (< 4.5 hrs)
> - If you're a **6-hour employee** and leave after **4 hours** → Present (> 3 hrs)
> - If you're a **8-hour employee** and leave after **3 hours** → Half Day (< 4 hrs)

---

### 4. Leave Requests

Tap **"Leaves"** in the bottom navigation bar.

![Leave Requests](/Users/bharatsutariya/.gemini/antigravity/brain/ca19098d-8056-4b84-a7e0-3c61b033d705/ssms_employee_leaves.png)

#### Requesting a Leave:
1. Select **Leave Type** from dropdown:
   - **Sick Leave** — When you are ill
   - **Casual Leave** — Personal work
   - **Paid Leave** — Pre-approved paid time off
   - **Unpaid Leave** — Leave without pay
2. Select **Start Date** and **End Date**
3. Write a **Reason** (e.g., "Doctor appointment")
4. Click **"Submit"**

#### Viewing Status:
- **Pending** (Yellow) — Admin hasn't responded yet
- **Approved** (Green) — Your leave is approved ✅
- **Rejected** (Red) — Leave was rejected ❌

---

### 5. My Profile

Tap **"Profile"** in the bottom navigation bar.

![My Profile](/Users/bharatsutariya/.gemini/antigravity/brain/ca19098d-8056-4b84-a7e0-3c61b033d705/ssms_employee_profile.png)

**Your profile shows:**
| Field | Example |
|-------|---------|
| Email | priya@company.com |
| Phone | 9876543210 |
| Designation | Frontend Developer |
| Department | Engineering |
| Work Hours / Day | 9 hours |
| Joining Date | 15 March 2026 |
| Monthly Salary | ₹35,000 |
| Status | Active |

> [!NOTE]
> You **cannot edit** your profile yourself. Contact your HR admin to update any information.

---

## ⚡ Automation Features

Everything below happens **automatically** — no manual action needed from anyone:

| Feature | How It Works | When |
|---------|-------------|------|
| **Daily QR Tokens** | Unique attendance tokens are generated for each employee | Every day at 12:01 AM |
| **Late Detection** | If employee checks in after 9:15 AM → marked "Late" | On every check-in |
| **Half Day Detection** | If worked less than half scheduled hours → "Half Day" | On check-out |
| **Overtime Calculation** | If worked more than scheduled hours → overtime recorded | On check-out |
| **Salary Calculation** | Base salary + overtime - deductions = net pay | Calculated on demand |
| **Deduction Rules** | Auto-apply salary cuts based on rules you created | During salary calculation |
| **GPS Tracking** | Location captured during check-in and check-out | Automatic |
| **Token Refresh** | Old tokens expire, new ones created daily | Every midnight |

---

## 💰 Work Hours & Salary Rules Explained

### How Work Hours Affect Salary

Each employee has their own **Work Hours/Day** setting. Here's how it impacts everything:

| Employee | Hours/Day | Half Day If... | Overtime If... | Hourly Rate |
|----------|-----------|----------------|----------------|-------------|
| Rahul (₹27,000/mo) | 9 hrs | < 4.5 hrs worked | > 9 hrs worked | ₹100/hr |
| Priya (₹35,000/mo) | 8 hrs | < 4 hrs worked | > 8 hrs worked | ₹145.83/hr |
| Amit (₹18,000/mo) | 6 hrs | < 3 hrs worked | > 6 hrs worked | ₹100/hr |
| Sita (₹45,000/mo) | 10 hrs | < 5 hrs worked | > 10 hrs worked | ₹150/hr |

### How Overtime Pay Works
- Overtime rate = **1.5× your hourly rate**
- Hourly rate = Monthly Salary ÷ (30 days × your work hours)
- Example: If Priya (₹35,000, 8hrs) works 10 hours one day:
  - Overtime = 2 hours × (₹145.83 × 1.5) = **₹437.49 extra pay**

### How Deduction Rules Work
Admin creates rules, and the system auto-applies them during salary calculation:

**Example Rules:**
- "Late Penalty" → ₹500 deducted each time an employee is late
- "Absent Cut" → Full day salary deducted for each absence
- "Half Day Deduction" → 50% of daily salary for each half day

**Example Calculation:**
```
Employee: Priya (₹35,000/month, 8 hrs/day)

Month: March 2026
├── Present Days: 20
├── Late Days: 3
├── Absent Days: 2
├── Half Days: 1
├── Overtime: 5 hours
│
├── Base Salary:           ₹35,000
├── Overtime Pay:          +₹1,093  (5hrs × ₹145.83 × 1.5)
├── Late Penalty (3×₹500): -₹1,500
├── Absent Cut (2 days):   -₹2,333  (2 × ₹35,000/30)
├── Half Day Cut (1 day):  -₹583    (0.5 × ₹35,000/30)
│
└── FINAL SALARY:          ₹31,677
```

---

## ❓ Frequently Asked Questions

### For Admin

**Q: How do I add a new employee?**
Go to Employees → Click "+ Add Employee" → Fill the form → Click "Create Employee" → Share email & password with the employee.

**Q: Do I need to generate QR codes every day?**
No! The system does it automatically at midnight. You don't need to do anything.

**Q: How do I check who is present today?**
Go to Dashboard. It shows Present/Absent/Late counts and the list of check-ins.

**Q: How do I change an employee's work hours?**
Go to Employees → Click the edit (✏️) icon → Change "Work Hrs/Day" → Click "Update Employee".

**Q: How do I download attendance reports?**
Go to Attendance → Click "Export CSV" → An Excel-compatible file will download.

**Q: How do I add a company holiday?**
Go to Settings → Scroll to "Holiday Calendar" → Click "+ Add Holiday" → Fill in the details.

**Q: What if I forget the admin password?**
The default admin password is `Admin@123`. You can change it in the database.

---

### For Employees

**Q: How do I mark my attendance?**
Open the app → Tap "Scan QR" at the bottom → Press the green "Mark Present" button. That's it!

**Q: Can I mark attendance twice in one day?**
No. Each token can only be used once per day. The system prevents duplicate entries.

**Q: What if I need to leave early?**
Press the amber "Leave Now — Early Exit" button. It will record your exit time.

**Q: How do I know if I was marked late?**
After checking in, a tag appears showing your status (Present, Late, etc.).

**Q: How do I apply for leave?**
Go to "Leaves" → Select leave type → Pick dates → Write reason → Submit. Your admin will approve or reject.

**Q: Can I see my salary details?**
Yes! Go to the Dashboard. It shows your monthly payslip with full breakdown.

**Q: Can other employees see my data?**
No. Each employee can only see their own data. Your salary, attendance, and leaves are private.

**Q: What is the "Leave Now" button for?**
It's for when you need to leave work before your shift ends. It records the current time and calculates your hours worked.

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| **"Cannot connect"** or blank page | Make sure both terminals are running (backend + frontend) |
| **"Invalid credentials"** | Check email and password. Admin default: `admin@ssms.com` / `Admin@123` |
| **"Already checked in today"** | You can only mark attendance once per day |
| **GPS not working** | Allow location permission in your browser |
| **Page not loading** | Refresh the page (Ctrl+R or Cmd+R) |
| **Employee can't login** | Make sure you created them with a password. Check spelling of email. |

---

> [!TIP]
> **Quick Summary of Daily Workflow:**
> 
> **Admin (Morning):**
> 1. Login → Check Dashboard for attendance overview
> 2. Review any leave requests → Approve or Reject
> 
> **Employee (Morning):**
> 1. Login → Go to "Scan QR" → Press "Mark Present"
> 
> **Employee (Evening):**
> 1. Go to "Scan QR" → Press "Check Out — End Day" (or "Leave Now" if early)
> 
> **Admin (Month End):**
> 1. Go to "Payroll & Leave" → Check each employee's salary
> 2. Go to "Attendance" → Export CSV for records
