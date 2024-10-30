import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  KeyRound,
  UserCog,
  RotateCw,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import DeleteDialog from "./DeleteDialog";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import RoleDialog from "./RoleDialog";
import RestoreDialog from "./RestoreDialog";

const UserActions = ({ user, onRefresh, isDeleted }) => {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const handleEdit = () => {
    navigate(`/admin/users/edit/${user._id}`);
  };

  const handleResetPassword = async () => {
    try {
      await apiClient.post(
        `api/admin/users/${user._id}/reset-password`,
        {},
        { withCredentials: true }
      );
      toast.success("Password reset email sent");
    } catch (error) {
      toast.error("Failed to reset password");
    }
  };
  const handleRoleUpdate = () => {
    setShowRoleDialog(true);
  };
  if (isDeleted) {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowRestoreDialog(true)}
          className="text-green-600 hover:text-green-700"
        >
          <RotateCw className="mr-2 h-4 w-4" />
          Restore
        </Button>

        <RestoreDialog
          open={showRestoreDialog}
          onClose={() => setShowRestoreDialog(false)}
          userId={user._id}
          onSuccess={() => {
            setShowRestoreDialog(false);
            onRefresh();
          }}
        />
      </>
    );
  }
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleResetPassword}>
            <KeyRound className="mr-2 h-4 w-4" />
            Reset Password
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleRoleUpdate}>
            <UserCog className="mr-2 h-4 w-4" />
            Change Role
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Dialog */}
      <DeleteDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        userId={user._id}
        onSuccess={() => {
          setShowDeleteDialog(false);
          onRefresh();
        }}
      />

      {/* Role Dialog */}
      <RoleDialog
        open={showRoleDialog}
        onClose={() => setShowRoleDialog(false)}
        user={user}
        onSuccess={() => {
          setShowRoleDialog(false);
          onRefresh();
        }}
      />
    </>
  );
};
export default UserActions;
