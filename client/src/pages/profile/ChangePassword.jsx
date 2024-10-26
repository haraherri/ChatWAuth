import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CHANGE_PASSWORD_ROUTES } from "@/utils/constants";
import { apiClient } from "@/lib/api-client";

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validatePasswords = () => {
    if (!currentPassword) {
      toast.error("Current password is required");
      return false;
    }
    if (!newPassword) {
      toast.error("New password is required");
      return false;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return false;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleChangePassword = async () => {
    if (!validatePasswords()) return;

    setIsLoading(true);
    try {
      const response = await apiClient.put(
        CHANGE_PASSWORD_ROUTES,
        {
          currentPassword,
          newPassword,
        },
        { withCredentials: true }
      );

      if (response.status === 200) {
        toast.success("Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error("Failed to change password");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 text-white w-full">
      <Input
        type="password"
        placeholder="Current Password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        className="rounded-lg p-6 bg-[#2c2e3b] border-none"
      />
      <Input
        type="password"
        placeholder="New Password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        className="rounded-lg p-6 bg-[#2c2e3b] border-none"
      />
      <Input
        type="password"
        placeholder="Confirm New Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className="rounded-lg p-6 bg-[#2c2e3b] border-none"
      />
      <Button
        className="h-16 w-full bg-purple-700 hover:bg-purple-900 transition-all duration-300"
        onClick={handleChangePassword}
        disabled={isLoading}
      >
        {isLoading ? "Changing Password..." : "Change Password"}
      </Button>
    </div>
  );
};

export default ChangePassword;
