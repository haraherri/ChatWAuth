import { apiClient } from "@/lib/api-client";
import {
  FORGOT_PASSWORD_ROUTES,
  RESET_PASSWORD_ROUTES,
  VERIFY_EMAIL_ROUTES,
} from "@/utils/constants";
import { toast } from "sonner";

// store/slices/auth-slice.js
export const createAuthSlice = (set) => ({
  // State
  userInfo: undefined,
  isVerifyingEmail: false,
  isResettingPassword: false,
  isSendingResetLink: false,
  emailVerificationError: null,

  // Actions
  setUserInfo: (userInfo) => set({ userInfo }),

  // Email Verification
  verifyEmail: async (token) => {
    set({ isVerifyingEmail: true, emailVerificationError: null });
    try {
      const response = await apiClient.get(`${VERIFY_EMAIL_ROUTES}/${token}`);
      if (response.status === 200) {
        set({ isVerifyingEmail: false });
        toast.success("Email verified successfully!");
        return true;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Verification failed";
      set({
        isVerifyingEmail: false,
        emailVerificationError: errorMessage,
      });
      toast.error(errorMessage);
      return false;
    }
  },

  // Reset Password
  resetPassword: async (token, password) => {
    set({ isResettingPassword: true });
    try {
      const response = await apiClient.post(
        `${RESET_PASSWORD_ROUTES}/${token}`,
        { password }
      );
      if (response.status === 200) {
        set({ isResettingPassword: false });
        toast.success("Password reset successfully!");
        return true;
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Failed to reset password";
      set({ isResettingPassword: false });
      toast.error(errorMessage);
      return false;
    }
  },

  // Forgot Password
  sendResetPasswordLink: async (email) => {
    set({ isSendingResetLink: true });
    try {
      const response = await apiClient.post(FORGOT_PASSWORD_ROUTES, { email });
      if (response.status === 200) {
        set({ isSendingResetLink: false });
        toast.success("Reset instructions sent to your email!");
        return true;
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Failed to send reset email";
      set({ isSendingResetLink: false });
      toast.error(errorMessage);
      return false;
    }
  },
});
