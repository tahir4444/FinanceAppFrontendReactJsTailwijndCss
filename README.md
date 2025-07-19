# Finance App Frontend (React)

This is the web frontend for the Finance App, built with React and Vite. It provides a user-friendly interface for interacting with the backend services. Although the project is named `todo-app-frontend` in its `package.json`, it is a full-featured client for the finance application.

## Table of Contents

- [Features](#features)
- [Pages and Components](#pages-and-components)
- [Technologies Used](#technologies-used)
- [Setup and Installation](#setup-and-installation)

## Features

## Features

## Features

- **User Authentication:** Login and registration pages.
- **Dashboard:** A central dashboard to display key information.
- **Expense Management:** A dedicated page to view, add, edit, and delete expenses.
- **To-Do List:** A page for managing to-do items.
- **User Management:** An interface for administrators to manage users.
- **Role Management:** An interface for managing user roles and permissions.
- **Protected Routes:** Ensures that only authenticated users can access certain pages.

## Pages and Components

The application is structured into pages and reusable components:

- **Pages:**
  - `LoginPage.jsx`: Handles user login.
  - `RegisterPage.jsx`: Handles user registration.
  - `DashboardPage.jsx`: The main dashboard after login.
  - `ExpensesPage.jsx`: Manages expenses.
  - `TodosPage.jsx`: Manages to-do items.
  - `UsersManager.jsx`: Manages users (likely for admins).
  - `RolesManager.jsx`: Manages roles and permissions (likely for admins).
- **Components:**
  - The `components` directory contains reusable UI elements like forms, tables, and layout components (e.g., `Navbar.jsx`).
- **Services:**
  - The `services` directory contains modules for communicating with the backend API (e.g., `auth.service.js`, `expense.service.js`).
- **Context:**
  - `AuthContext.jsx` is used for managing global authentication state.

## Technologies Used

- **Framework:** React, Vite
- **UI:** Material UI, React-Bootstrap, React Icons
- **Routing:** `react-router-dom`
- **State Management:** React Context API
- **Form Handling:** `react-hook-form`
- **HTTP Client:** `axios`
- **Notifications:** `react-hot-toast`

## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd FinanceAppFrontendReactJs
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Configure API endpoint:**
    Make sure the `axios` base URL in `src/services/axios.js` (or a similar configuration file) points to the correct backend server address.
4.  **Start the development server:**
    ```bash
    npm run dev
    ```
