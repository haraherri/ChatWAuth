import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/api-client";
import Victory from "@/assets/victory.svg";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { VERIFY_EMAIL_ROUTES } from "@/utils/constants";

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState(null);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await apiClient.get(`${VERIFY_EMAIL_ROUTES}/${token}`);
        if (response.status === 200) {
          setIsVerifying(false);
          toast.success("Email verified successfully!");
          setTimeout(() => {
            navigate("/auth");
          }, 3000);
        }
      } catch (error) {
        setIsVerifying(false);
        const errorMessage =
          error.response?.data?.error || "Verification failed";
        setVerificationError(errorMessage);
        toast.error(errorMessage);
      }
    };
    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="h-[100vh] w-[100vw] flex items-center justify-center">
      <div className="h-[80vh] bg-white border-2 border-white text-opacity-90 shadow-2xl w-[80vw] md:w-[90vw] lg:w-[70vw] xl:w-[60vw] rounded-3xl flex flex-col items-center justify-center gap-6">
        <img src={Victory} alt="Victory Emoji" className="h-[100px]" />

        {isVerifying ? (
          <>
            <h1 className="text-4xl font-bold text-center">
              Verifying your email...
            </h1>
            <p className="font-medium text-center text-gray-600">
              Please wait while we verify your email address
            </p>
          </>
        ) : verificationError ? (
          <>
            <h1 className="text-4xl font-bold text-center text-red-500">
              Verification Failed
            </h1>
            <p className="font-medium text-center text-gray-600">
              {verificationError}
            </p>
            <Button
              className="rounded-full p-6 mt-4"
              onClick={() => navigate("/auth")}
            >
              Back to Login
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-4xl font-bold text-center text-green-500">
              Email Verified!
            </h1>
            <p className="font-medium text-center text-gray-600">
              Your email has been successfully verified. You will be redirected
              to login page shortly.
            </p>
            <Button
              className="rounded-full p-6 mt-4"
              onClick={() => navigate("/auth")}
            >
              Proceed to Login
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
