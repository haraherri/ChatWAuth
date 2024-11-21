import React, { useState } from "react";
import {
  MoreHorizontal,
  Pencil,
  Trash,
  RotateCcw,
  RotateCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import DeleteDialog from "./DeleteDialog";
import RestoreDialog from "./RestoreDialog";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/api-client";

const RoomActions = ({ room, onRefresh, isDeleted }) => {
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await apiClient.patch(
        `/api/admin/rooms/${room._id}/status`,
        {},
        { withCredentials: true }
      );
      toast.success("Room deleted successfully");
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete room");
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleRestore = async () => {
    setIsLoading(true);
    try {
      await apiClient.post(
        `/api/admin/rooms/${room._id}/restore`,
        {},
        { withCredentials: true }
      );
      toast.success("Room restored successfully");
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to restore room");
    } finally {
      setIsLoading(false);
      setIsRestoreDialogOpen(false);
    }
  };

  if (isDeleted) {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsRestoreDialogOpen(true)}
          className="text-green-600 hover:text-green-700"
        >
          <RotateCw className="mr-2 h-4 w-4" />
          Restore
        </Button>

        <RestoreDialog
          isOpen={isRestoreDialogOpen}
          isLoading={isLoading}
          onClose={() => setIsRestoreDialogOpen(false)}
          onConfirm={handleRestore}
          roomName={room.name}
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
          <DropdownMenuItem
            onClick={() => navigate(`/admin/rooms/edit/${room._id}`)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-red-600"
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        isLoading={isLoading}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        roomName={room.name}
      />
    </>
  );
};

export default RoomActions;
