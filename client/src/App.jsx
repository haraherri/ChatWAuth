import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/auth";
import Chat from "./pages/chat";
import Profile from "./pages/profile";
import VerifyEmail from "./pages/auth/verify-email";
import ForgotPassword from "./pages/auth/forgot-password";
import ResetPassword from "./pages/auth/reset-password";
import CheckEmail from "./pages/auth/check-email";
import { useAppStore } from "./store";
import { apiClient } from "./lib/api-client";
import { GET_USER_INFO } from "./utils/constants";
import AdminForgotPassword from "./pages/admin/auth/forgot-password";
import AdminResetPassword from "./pages/admin/auth/reset-password";
import AdminLogin from "./pages/admin/auth/login";
import AdminChangePassword from "./pages/admin/auth/change-password";
import UserList from "./pages/admin/users/components/UserList";
import AdminLayout from "./pages/admin/components/Layout";
import UserForm from "./pages/admin/users/components/UserForm";
import RoomList from "./pages/admin/rooms/components/RoomList";
import RoomForm from "./pages/admin/rooms/components/RoomForm";

const PrivateRoute = ({ children }) => {
  const { userInfo } = useAppStore();
  const isAuthenticated = !!userInfo && userInfo.isEmailVerified;
  return isAuthenticated ? children : <Navigate to="/auth" />;
};
const AuthRoute = ({ children }) => {
  const { userInfo } = useAppStore();
  const isAuthenticated = !!userInfo;
  return isAuthenticated ? <Navigate to="/chat" /> : children;
};
const AdminRoute = ({ children }) => {
  const { userInfo } = useAppStore();
  const isAdminAuth = !!userInfo && userInfo.role === "admin";
  return isAdminAuth ? children : <Navigate to="/admin/login" />;
};

const AdminAuthRoute = ({ children }) => {
  const { userInfo } = useAppStore();
  const isAdminAuth = !!userInfo && userInfo.role === "admin";
  return isAdminAuth ? <Navigate to="/admin/users" /> : children;
};

const App = () => {
  const { userInfo, setUserInfo } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserData = async () => {
      try {
        const response = await apiClient.get(GET_USER_INFO, {
          withCredentials: true,
        });
        if (response.status === 200 && response.data.id) {
          if (!response.data.isEmailVerified) {
            setUserInfo(undefined);
            clearAuthCookies();
            return;
          }
          setUserInfo({
            ...response.data,
            role: response.data.role,
          });
        } else {
          setUserInfo(undefined);
          clearAuthCookies();
        }
      } catch (error) {
        setUserInfo(undefined);
        clearAuthCookies();
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    getUserData();
  }, [setUserInfo]);

  const clearAuthCookies = () => {
    document.cookie = "jwt=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  };
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Routes */}
        <Route
          path="/auth"
          element={
            <AuthRoute>
              <Auth />
            </AuthRoute>
          }
        />
        <Route
          path="/verify-email/:token"
          element={
            <AuthRoute>
              <VerifyEmail />
            </AuthRoute>
          }
        />
        <Route
          path="/check-email"
          element={
            <AuthRoute>
              <CheckEmail />
            </AuthRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <AuthRoute>
              <ForgotPassword />
            </AuthRoute>
          }
        />
        <Route
          path="/reset-password/:token"
          element={
            <AuthRoute>
              <ResetPassword />
            </AuthRoute>
          }
        />

        {/* Admin Auth Routes */}
        <Route
          path="/admin/login"
          element={
            <AdminAuthRoute>
              <AdminLogin />
            </AdminAuthRoute>
          }
        />
        <Route
          path="/admin/forgot-password"
          element={
            <AdminAuthRoute>
              <AdminForgotPassword />
            </AdminAuthRoute>
          }
        />
        <Route
          path="/admin/reset-password/:token"
          element={
            <AdminAuthRoute>
              <AdminResetPassword />
            </AdminAuthRoute>
          }
        />

        {/* Protected Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route path="users" element={<UserList />} />
          <Route path="users/add" element={<UserForm />} />
          <Route path="users/edit/:_id" element={<UserForm />} />
          <Route path="change-password" element={<AdminChangePassword />} />

          <Route path="rooms" element={<RoomList />} />
          <Route path="rooms/add" element={<RoomForm />} />
          <Route path="rooms/edit/:roomId" element={<RoomForm />} />
        </Route>

        {/* Protected User Routes */}
        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <Chat />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />

        {/* Default Route */}
        <Route path="*" element={<Navigate to="/auth" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
