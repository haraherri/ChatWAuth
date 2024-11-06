import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import MultipleSelector from "@/components/ui/multipleselect";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/lib/api-client";
import { getColor } from "@/lib/utils";
import { useAppStore } from "@/store";
import { Loader2, Users } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const RoomMembersDialog = () => {
  const { selectedChatData, updateChannel, userInfo } = useAppStore();
  const [open, setOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [contacts, setContacts] = useState([]);

  const canManageRoom = useMemo(() => {
    return ["admin", "moderator"].includes(userInfo?.role);
  }, [userInfo?.role]);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await apiClient.get("api/contacts/get-all-contacts", {
          withCredentials: true,
        });

        const existingMemberIds = new Set(
          selectedChatData.members.map((member) => member._id)
        );

        const filteredContacts = response.data.contacts.filter(
          (contact) => !existingMemberIds.has(contact.value)
        );

        setContacts(filteredContacts);
      } catch (error) {
        toast.error(error.response?.data?.error || "Failed to fetch contacts");
      }
    };

    if (open && canManageRoom) {
      fetchContacts();
    }
  }, [open, selectedChatData, canManageRoom]);

  const handleAddMembers = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.post(
        `/api/rooms/${selectedChatData._id}/members`,
        { userIds: selectedUsers.map((user) => user.value) },
        { withCredentials: true }
      );
      updateChannel(response.data.room);
      setSelectedUsers([]);
      toast.success("Members added successfully");
      setOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to add members");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (userId === userInfo?._id && userInfo?.role === "moderator") {
      toast.error("Moderators cannot remove themselves from the room");
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiClient.delete(
        `/api/rooms/${selectedChatData._id}/members/${userId}`,
        { withCredentials: true }
      );
      updateChannel(response.data.room);
      toast.success("Member removed successfully");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to remove member");
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedChatData) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {canManageRoom && (
        <DialogTrigger asChild>
          <button className="text-neutral-500 hover:text-white focus:outline-none duration-300 transition-all flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span>Members</span>
          </button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px] bg-[#1a1b1e] border-[#2f303b]">
        <DialogHeader>
          <DialogTitle className="text-neutral-200">
            Channel Members - {selectedChatData.name}
          </DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="members" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="members">Current Members</TabsTrigger>
            {canManageRoom && (
              <TabsTrigger value="add">Add Members</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="members">
            <ScrollArea className="h-[300px]">
              {selectedChatData.members.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center justify-between p-2 hover:bg-[#2f303b] rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      {member.image ? (
                        <AvatarImage src={member.image} />
                      ) : (
                        <div
                          className={`h-8 w-8 uppercase text-sm flex items-center justify-center rounded-full ${getColor(
                            member.color
                          )}`}
                        >
                          {member.firstName
                            ? member.firstName.split("").shift()
                            : member.email.split("").shift()}
                        </div>
                      )}
                    </Avatar>
                    <div>
                      <p className="text-sm text-neutral-200">
                        {member.firstName
                          ? `${member.firstName} ${member.lastName}`
                          : member.email}
                      </p>
                    </div>
                  </div>
                  {canManageRoom &&
                    selectedChatData.creator !== member._id &&
                    !(
                      userInfo?.role === "moderator" &&
                      userInfo?._id === member._id
                    ) && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveMember(member._id)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Remove"
                        )}
                      </Button>
                    )}
                </div>
              ))}
            </ScrollArea>
          </TabsContent>

          {canManageRoom && (
            <TabsContent value="add">
              <div className="space-y-4">
                <MultipleSelector
                  options={contacts}
                  selectedValues={selectedUsers}
                  onChange={setSelectedUsers}
                  isDisabled={isLoading}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleAddMembers}
                    disabled={selectedUsers.length === 0 || isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Add Members
                  </Button>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default RoomMembersDialog;
