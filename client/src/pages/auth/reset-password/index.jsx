import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Victory from "@/assets/victory.svg";
import { useAppStore } from "@/store";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { resetPassword, isResettingPassword } = useAppStore();

  const handleReset = async () => {
    if (!password.length) {
      toast.error("Password is required!");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords don't match!");
      return;
    }

    const success = await resetPassword(token, password);
    if (success) {
      navigate("/auth");
    }
  };

  return (
    <div className="h-[100vh] w-[100vw] flex items-center justify-center">
      <div className="h-[80vh] bg-white border-2 border-white text-opacity-90 shadow-2xl w-[80vw] md:w-[90vw] lg:w-[70vw] xl:w-[60vw] rounded-3xl flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-6 w-3/4 max-w-md">
          <img src={Victory} alt="Victory Emoji" className="h-[100px]" />
          <h1 className="text-4xl font-bold text-center">Reset Password</h1>
          <p className="font-medium text-center text-gray-600">
            Enter your new password
          </p>
          <Input
            placeholder="New Password"
            type="password"
            className="rounded-full p-6"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            placeholder="Confirm New Password"
            type="password"
            className="rounded-full p-6"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button
            className="rounded-full p-6 w-full"
            onClick={handleReset}
            disabled={isResettingPassword}
          >
            {isResettingPassword ? "Resetting..." : "Reset Password"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
