import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Victory from "@/assets/victory.svg";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const { sendResetPasswordLink, isSendingResetLink } = useAppStore();

  const handleSubmit = async () => {
    if (!email.length) {
      toast.error("Email is required!");
      return;
    }

    const success = await sendResetPasswordLink(email);
    if (success) {
      setEmail("");
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
            disabled={isSendingResetLink}
          >
            {isSendingResetLink ? "Sending..." : "Send Reset Link"}{" "}
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
