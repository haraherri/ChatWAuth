import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

const RoleDialog = ({ open, onClose, user, onSuccess }) => {
  const [role, setRole] = useState(user?.role || "user");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (role === user.role) {
      onClose();
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.put(
        `api/admin/users/${user._id}`,
        { role },
        { withCredentials: true }
      );
      toast.success("Role updated successfully");
      onSuccess?.();
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error("Cannot change your own role");
      } else {
        toast.error(error.response?.data?.error || "Failed to update role");
      }
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change User Role</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RoleDialog;
