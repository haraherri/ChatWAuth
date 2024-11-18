import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, RotateCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import RoomActions from "./RoomAction";
import { apiClient } from "@/lib/api-client";

const RoomList = () => {
  const navigate = useNavigate();
  const [activeRooms, setActiveRooms] = useState([]);
  const [deletedRooms, setDeletedRooms] = useState([]);
  const [currentTab, setCurrentTab] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentTab === "active") {
      fetchActiveRooms();
    } else {
      fetchDeletedRooms();
    }
  }, [currentTab]);

  const fetchActiveRooms = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/api/admin/rooms", {
        withCredentials: true,
      });
      setActiveRooms(response.data.data.rooms);
    } catch (error) {
      toast.error("Failed to fetch active rooms");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDeletedRooms = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/api/admin/rooms/deleted", {
        withCredentials: true,
      });
      setDeletedRooms(response.data.data.rooms);
    } catch (error) {
      toast.error("Failed to fetch deleted rooms");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    if (currentTab === "active") {
      fetchActiveRooms();
    } else {
      fetchDeletedRooms();
    }
  };

  const currentRooms = currentTab === "active" ? activeRooms : deletedRooms;
  const filteredRooms = Array.isArray(currentRooms)
    ? currentRooms.filter((room) =>
        room.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Rooms Management</CardTitle>
          {currentTab === "active" && (
            <Button
              onClick={() => navigate("/admin/rooms/add")}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Room
            </Button>
          )}
        </div>
        <Tabs
          value={currentTab}
          onValueChange={setCurrentTab}
          className="w-full"
        >
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="active">Active Rooms</TabsTrigger>
              <TabsTrigger value="deleted">Deleted Rooms</TabsTrigger>
            </TabsList>
            <Button variant="outline" size="icon" onClick={handleRefresh}>
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search rooms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </Tabs>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-4">Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Creator</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Pinned Messages</TableHead>
                {currentTab === "deleted" && <TableHead>Deleted At</TableHead>}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRooms.map((room) => (
                <TableRow key={room._id}>
                  <TableCell className="font-medium">{room.name}</TableCell>
                  <TableCell>
                    {`${room.creator.firstName} ${room.creator.lastName}`}
                  </TableCell>
                  <TableCell>{room.members.length} members</TableCell>
                  <TableCell>{room.pinnedMessagesCount}</TableCell>
                  {currentTab === "deleted" && (
                    <TableCell>
                      {new Date(room.deletedAt).toLocaleDateString()}
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <RoomActions
                      room={room}
                      onRefresh={handleRefresh}
                      isDeleted={currentTab === "deleted"}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default RoomList;
