import React from "react";
import Victory from "@/assets/victory.svg";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const CheckEmail = () => {
  const navigate = useNavigate();

  return (
    <div className="h-[100vh] w-[100vw] flex items-center justify-center">
      <div className="h-[80vh] bg-white border-2 border-white text-opacity-90 shadow-2xl w-[80vw] md:w-[90vw] lg:w-[70vw] xl:w-[60vw] rounded-3xl flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <img src={Victory} alt="Victory Emoji" className="h-[100px]" />
          <h1 className="text-4xl font-bold text-center">Check Your Email</h1>
          <p className="font-medium text-center text-gray-600 max-w-md">
            We've sent you a verification link to your email address. Please
            check your inbox and click the link to verify your account.
          </p>
          <Button
            className="rounded-full p-6 mt-4"
            onClick={() => navigate("/auth")}
          >
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CheckEmail;
