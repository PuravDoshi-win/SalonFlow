import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import JoinQueue from './pages/JoinQueue';
import QueueStatus from './pages/QueueStatus';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import BarberDashboard from './pages/BarberDashboard';
import AdminDashboard from './pages/AdminDashboard';
import TVDisplay from './pages/TVDisplay';
import Profile from './pages/Profile';

export default function App() {
  return (
    <Routes>
      {/* Standalone Full-screen Waiting Area TV */}
      <Route path="/display" element={<TVDisplay />} />

      {/* Auth Screens */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Main Layout Screens */}
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/join" element={<JoinQueue />} />
        <Route path="/status/:id" element={<QueueStatus />} />

        {/* Customer Protected */}
        <Route element={<ProtectedRoute allowedRoles={['customer', 'admin', 'receptionist', 'barber']} />}>
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Receptionist Protected */}
        <Route element={<ProtectedRoute allowedRoles={['receptionist', 'admin']} />}>
          <Route path="/reception" element={<ReceptionistDashboard />} />
        </Route>

        {/* Barber Protected */}
        <Route element={<ProtectedRoute allowedRoles={['barber', 'admin']} />}>
          <Route path="/barber" element={<BarberDashboard />} />
        </Route>

        {/* Owner / Admin Protected */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Route>

      {/* Catch-all redirect to Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
