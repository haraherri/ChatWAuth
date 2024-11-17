import React, { useState } from "react";
import { MoreHorizontal, Pencil, Trash, RotateCcw } from "lucide-react";
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
      await apiClient.patch(`/api/admin/rooms/${room._id}/status`);
      toast.success("Room deleted successfully");
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete room");
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleRestore = async () => {
    setIsLoading(true);
    try {
      await apiClient.post(`/api/admin/rooms/${room._id}/restore`);
      toast.success("Room restored successfully");
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to restore room");
    } finally {
      setIsLoading(false);
      setIsRestoreDialogOpen(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!isDeleted ? (
            <>
              <DropdownMenuItem
                onClick={() => navigate(`/admin/rooms/edit/${room._id}`)}
                className="cursor-pointer"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsDeleteDialogOpen(true)}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem
              onClick={() => setIsRestoreDialogOpen(true)}
              className="cursor-pointer"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Restore
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        isLoading={isLoading}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        roomName={room.name}
      />

      <RestoreDialog
        isOpen={isRestoreDialogOpen}
        isLoading={isLoading}
        onClose={() => setIsRestoreDialogOpen(false)}
        onConfirm={handleRestore}
        roomName={room.name}
      />
    </>
  );
};

export default RoomActions;
