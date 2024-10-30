import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, RotateCw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import UserActions from "./UserAction";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const UserList = () => {
  const navigate = useNavigate();
  const [activeUsers, setActiveUsers] = useState([]);
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [currentTab, setCurrentTab] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentTab === "active") {
      fetchActiveUsers();
    } else {
      fetchDeletedUsers();
    }
  }, [currentTab]);

  const fetchActiveUsers = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/api/admin/users", {
        withCredentials: true,
      });
      setActiveUsers(response.data);
    } catch (error) {
      toast.error("Failed to fetch active users");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDeletedUsers = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/api/admin/users/deleted", {
        withCredentials: true,
      });
      setDeletedUsers(response.data.users);
    } catch (error) {
      toast.error("Failed to fetch deleted users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    if (currentTab === "active") {
      fetchActiveUsers();
    } else {
      fetchDeletedUsers();
    }
  };

  const currentUsers = currentTab === "active" ? activeUsers : deletedUsers;
  const filteredUsers = currentUsers.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Users Management</CardTitle>
          {currentTab === "active" && (
            <Button
              onClick={() => navigate("/admin/users/add")}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add User
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
              <TabsTrigger value="active">Active Users</TabsTrigger>
              <TabsTrigger value="deleted">Deleted Users</TabsTrigger>
            </TabsList>
            <Button variant="outline" size="icon" onClick={handleRefresh}>
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
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
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                {currentTab === "deleted" && <TableHead>Deleted At</TableHead>}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user._id}>
                  <TableCell className="font-medium">
                    {`${user.firstName} ${user.lastName}`}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="capitalize">{user.role}</TableCell>
                  {currentTab === "deleted" && (
                    <TableCell>
                      {new Date(user.deletedAt).toLocaleDateString()}
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <UserActions
                      user={user}
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

export default UserList;
