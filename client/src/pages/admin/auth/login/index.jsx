// src/pages/admin/auth/login/index.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAppStore } from "@/store";
import { apiClient } from "@/lib/api-client";

import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ADMIN_LOGIN_ROUTES } from "@/utils/admin-constants";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { setUserInfo } = useAppStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    if (!email.trim()) {
      toast.error("Email is required!");
      return false;
    }
    if (!password.trim()) {
      toast.error("Password is required!");
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await apiClient.post(
        ADMIN_LOGIN_ROUTES,
        { email, password },
        { withCredentials: true }
      );

      if (response.data.user.id) {
        setUserInfo(response.data.user);
        navigate("/admin/users");
        toast.success("Login successful!");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Login failed";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate("/admin/forgot-password");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="space-y-1">
          <h2 className="text-2xl font-bold text-center">Admin Login</h2>
          <p className="text-sm text-muted-foreground text-center">
            Enter your credentials to access admin panel
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="w-full"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button className="w-full" onClick={handleLogin} disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </Button>
          <Button
            variant="link"
            className="text-sm"
            onClick={handleForgotPassword}
            disabled={isLoading}
          >
            Forgot password?
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminLogin;
