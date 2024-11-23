import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store";
import { useNavigate } from "react-router-dom";
import { LogOut, User, Menu } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

const Header = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { userInfo, setUserInfo } = useAppStore();

  const handleLogout = async () => {
    try {
      await apiClient.post("/api/admin/logout", {}, { withCredentials: true });
      setUserInfo(undefined);
      navigate("/admin/login");
      toast.success("Logged out successfully");
    } catch (error) {
      if (error.response?.data?.error) {
        toast.error(error.response.data.error || "Logout failed!");
        return;
      }
    }
  };

  return (
    <header className="border-b h-14 px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Admin Dashboard</h1>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground hidden sm:inline">
          {userInfo?.email}
        </span>
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
