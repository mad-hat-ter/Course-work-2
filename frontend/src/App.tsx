import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Auth';
import { Profile } from './pages/Profile';
import { Shifts } from './pages/Shifts';
import { Manageprofiles } from './pages/Manageprofiles';
import { ManageProfileForm } from './pages/ManageProfileForm';
import { Statistics } from './pages/Statistics';
import { ManageStatistics } from './pages/ManageStatistics';
import { Schedule } from './pages/Schedule';
import { ScheduleForm } from './pages/ScheduleForm';
import { MainLayout } from './layouts/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleRoute } from './components/RoleRoute';
import { DatePickerProvider } from './providers/DatePickerProvider';

const App: React.FC = () => {
  return (
    <DatePickerProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
          <Route path="/profile" element={<Profile />} />
          <Route
            path="/shifts"
            element={
              <RoleRoute path="/shifts">
                <Shifts />
              </RoleRoute>
            }
          />
          <Route path="/schedule" element={<Schedule />} />
          <Route
            path="/schedule/add"
            element={
              <RoleRoute path="/schedule/add">
                <ScheduleForm mode="create" />
              </RoleRoute>
            }
          />
          <Route
            path="/schedule/edit/:scheduleId"
            element={
              <RoleRoute path="/schedule/edit">
                <ScheduleForm mode="edit" />
              </RoleRoute>
            }
          />
          <Route
            path="/statistics"
            element={
              <RoleRoute path="/statistics">
                <Statistics />
              </RoleRoute>
            }
          />
          <Route
            path="/manage-statistics"
            element={
              <RoleRoute path="/manage-statistics">
                <ManageStatistics />
              </RoleRoute>
            }
          />
          <Route
            path="/manageprofiles"
            element={
              <RoleRoute path="/manageprofiles">
                <Manageprofiles />
              </RoleRoute>
            }
          />
          <Route
            path="/manageprofiles/edit/:userId"
            element={
              <RoleRoute path="/manageprofiles/edit">
                <ManageProfileForm mode="edit" />
              </RoleRoute>
            }
          />
          <Route
            path="/manageprofiles/add"
            element={
              <RoleRoute path="/manageprofiles/add">
                <ManageProfileForm mode="create" />
              </RoleRoute>
            }
          />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
    </DatePickerProvider>
  );
};

export default App;
