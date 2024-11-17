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
import { GET_ALL_CONTACTS_ROUTES } from "@/utils/constants";

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
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      memberIds: [],
    },
  });

  useEffect(() => {
    fetchUsers();
    if (roomId) {
      fetchRoomDetails();
    }
  }, [roomId]);

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get(GET_ALL_CONTACTS_ROUTES, {
        withCredentials: true,
      });
      const contacts = response.data.contacts.filter(
        (contact) => contact.role !== "admin"
      );
      setUsers(contacts);
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
            ? `${member.firstName} ${member.lastName}`
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
                      placeholder="Select members"
                      options={users}
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
