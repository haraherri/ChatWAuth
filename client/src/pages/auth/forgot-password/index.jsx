import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import Victory from "@/assets/victory.svg";
import { useNavigate } from "react-router-dom";
import { FORGOT_PASSWORD_ROUTES } from "@/utils/constants";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!email.length) {
      toast.error("Email is required!");
      return;
    }

    try {
      setIsSending(true);
      const response = await apiClient.post(FORGOT_PASSWORD_ROUTES, { email });
      if (response.status === 200) {
        toast.success("Reset instructions sent to your email!");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Failed to send reset email";
      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="h-[100vh] w-[100vw] flex items-center justify-center">
      <div className="h-[80vh] bg-white border-2 border-white text-opacity-90 shadow-2xl w-[80vw] md:w-[90vw] lg:w-[70vw] xl:w-[60vw] rounded-3xl flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-6 w-3/4 max-w-md">
          <img src={Victory} alt="Victory Emoji" className="h-[100px]" />
          <h1 className="text-4xl font-bold text-center">Forgot Password?</h1>
          <p className="font-medium text-center text-gray-600">
            Enter your email address to receive password reset instructions
          </p>
          <Input
            placeholder="Email"
            type="email"
            className="rounded-full p-6 mt-4"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button
            className="rounded-full p-6 w-full"
            onClick={handleSubmit}
            disabled={isSending}
          >
            {isSending ? "Sending..." : "Send Reset Link"}
          </Button>
          <Button
            variant="link"
            onClick={() => navigate("/auth")}
            className="mt-2"
          >
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
