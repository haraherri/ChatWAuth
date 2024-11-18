import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { apiClient } from "@/lib/api-client";
import MultipleSelector from "@/components/ui/multipleselect";
import {
  GET_ALL_CONTACTS_ROUTES,
  SEARCH_CONTACTS_ROUTES,
} from "@/utils/constants";
import { FaSpinner } from "react-icons/fa";
import { UserX } from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(1, "Room name is required"),
  memberIds: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
      })
    )
    .min(1, "At least one member is required"),
});
const RoomForm = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [users, setUsers] = useState([]);
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      memberIds: [],
    },
  });

  useEffect(() => {
    const initializeData = async () => {
      await fetchUsers(); // Fetch users first
      if (roomId) {
        await fetchRoomDetails(); // Then fetch room details if needed
      }
    };
    initializeData();
  }, [roomId]);

  const handleSearch = async (value) => {
    try {
      if (!value?.trim()) {
        // Return all users except admins when search is empty
        const filteredUsers = users.filter((user) => user.role !== "admin");
        setSearchedUsers(filteredUsers);
        return filteredUsers;
      }

      const response = await apiClient.post(
        SEARCH_CONTACTS_ROUTES,
        { searchTerm: value },
        { withCredentials: true }
      );

      const formattedUsers = response.data.contacts
        .filter((contact) => contact.role !== "admin")
        .map((contact) => ({
          value: contact._id,
          label:
            contact.firstName && contact.lastName
              ? `${contact.firstName} ${contact.lastName}`.trim()
              : contact.email,
          email: contact.email,
          image: contact.image,
        }));

      setSearchedUsers(formattedUsers);
      return formattedUsers;
    } catch (error) {
      console.error(error);
      return []; // Return empty array on error instead of users state
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get(GET_ALL_CONTACTS_ROUTES, {
        withCredentials: true,
      });
      const formattedContacts = response.data.contacts
        .filter((contact) => contact.role !== "admin")
        .map((contact) => ({
          value: contact.value || contact._id,
          label: contact.label || contact.email,
          email: contact.email,
          image: contact.image,
          role: contact.role,
        }));
      setUsers(formattedContacts);
      setSearchedUsers(formattedContacts);
    } catch (error) {
      toast.error("Failed to fetch contacts");
    }
  };

  const fetchRoomDetails = async () => {
    try {
      const response = await apiClient.get(`/api/admin/rooms/${roomId}`, {
        withCredentials: true,
      });
      const room = response.data.data.room;
      const selectedMembers = room.members.map((member) => ({
        value: member._id,
        label:
          member.firstName && member.lastName
            ? `${member.firstName} ${member.lastName}`.trim()
            : member.email,
        email: member.email,
        image: member.image,
        role: member.role,
      }));

      form.reset({
        name: room.name,
        memberIds: selectedMembers,
      });
    } catch (error) {
      toast.error("Failed to fetch room details");
      navigate("/admin/rooms");
    }
  };

  const onSubmit = async (values) => {
    setIsLoading(true);
    try {
      if (roomId) {
        const response = await apiClient.get(`/api/admin/rooms/${roomId}`, {
          withCredentials: true,
        });
        const originalMembers = response.data.data.room.members.map(
          (member) => member._id
        );

        const newMemberIds = values.memberIds.map((member) => member.value);

        console.log("Original members from API:", originalMembers);
        console.log("New members from form:", newMemberIds);

        const addMembers = newMemberIds.filter(
          (id) => !originalMembers.includes(id)
        );

        const removeMembers = originalMembers.filter(
          (id) => !newMemberIds.includes(id)
        );

        console.log("Members to add:", addMembers);
        console.log("Members to remove:", removeMembers);

        await apiClient.put(
          `/api/admin/rooms/${roomId}`,
          {
            name: values.name,
            addMembers,
            removeMembers,
          },
          { withCredentials: true }
        );

        toast.success("Room updated successfully");
        navigate("/admin/rooms");
      } else {
        await apiClient.post(
          "/api/admin/rooms",
          {
            name: values.name,
            memberIds: values.memberIds.map((member) => member.value),
          },
          { withCredentials: true }
        );
        toast.success("Room created successfully");
      }
      navigate("/admin/rooms");
    } catch (error) {
      toast.error(error.response?.data?.error || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{roomId ? "Edit Room" : "Create Room"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter room name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="memberIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Members</FormLabel>
                  <FormControl>
                    <MultipleSelector
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Search and select members"
                      defaultOptions={users}
                      onSearch={handleSearch}
                      delay={300}
                      triggerSearchOnFocus={true}
                      className="min-h-[42px] max-h-[200px] overflow-y-auto
    scrollbar-thin scrollbar-thumb-gray-400/40 hover:scrollbar-thumb-gray-400/60
    scrollbar-track-transparent
    [&::-webkit-scrollbar]:w-2
    [&::-webkit-scrollbar-thumb]:rounded-full
    [&::-webkit-scrollbar-track]:bg-transparent
    [&::-webkit-scrollbar-thumb]:bg-gray-400/40
    [&::-webkit-scrollbar-thumb:hover]:bg-gray-400/60
    [&_*::-webkit-scrollbar]:w-2
    [&_*::-webkit-scrollbar-thumb]:rounded-full
    [&_*::-webkit-scrollbar-track]:bg-transparent
    [&_*::-webkit-scrollbar-thumb]:bg-gray-400/40
    [&_*::-webkit-scrollbar-thumb:hover]:bg-gray-400/60"
                      commandProps={{
                        className:
                          "bg-background max-h-[200px] w-full rounded-xl border-none shadow-lg",
                      }}
                      badgeClassName={cn(
                        "bg-purple-600/90 hover:bg-purple-700/90 transition-all",
                        "text-white text-xs font-medium",
                        "rounded-xl px-3 py-1.5",
                        "inline-flex items-center gap-1.5",
                        "animate-in fade-in-0 zoom-in-95",
                        "group shadow-sm",
                        "border border-purple-500/20"
                      )}
                      inputProps={{
                        className:
                          "flex-1 px-3 py-2 text-sm bg-transparent focus:outline-none placeholder:text-muted-foreground/70 rounded-xl",
                      }}
                      emptyIndicator={
                        <div className="flex flex-col items-center justify-center w-full py-8 text-muted-foreground/70">
                          <div className="w-14 h-14 mb-4 rounded-full bg-muted/20 flex items-center justify-center">
                            <UserX className="w-7 h-7" />
                          </div>
                          <p className="text-sm font-medium text-center">
                            No users found
                          </p>
                          <p className="text-xs opacity-70 text-center mt-1">
                            Try searching with a different term
                          </p>
                        </div>
                      }
                      loadingIndicator={
                        <div className="flex items-center justify-center py-6">
                          <div className="animate-spin">
                            <FaSpinner className="w-6 h-6 text-purple-500" />
                          </div>
                        </div>
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/rooms")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : roomId ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default RoomForm;
