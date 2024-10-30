import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

const UserForm = () => {
  const navigate = useNavigate();
  const { _id } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "user",
  });

  const isEditMode = Boolean(_id);

  useEffect(() => {
    if (isEditMode) {
      fetchUserData();
    }
  }, [_id]);

  const fetchUserData = async () => {
    try {
      const response = await apiClient.get(`api/admin/users/${_id}`, {
        withCredentials: true,
      });
      const { password, ...userData } = response.data;
      setFormData(userData);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to fetch user data");
      navigate("/admin/users");
    }
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isEditMode) {
        const { firstName, lastName } = formData;
        await apiClient.put(
          `api/admin/users/${_id}`,
          { firstName, lastName },
          { withCredentials: true }
        );
        toast.success("User updated successfully");
      } else {
        await apiClient.post("/api/admin/users", formData, {
          withCredentials: true,
        });
        toast.success("User created successfully");
      }
      navigate("/admin/users");
    } catch (error) {
      toast.error(error.response?.data?.error || "Operation failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditMode ? "Edit User" : "Add New User"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Enter first name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Enter last name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter email"
              required
              disabled={isEditMode} // Disable email khi edit
              className={isEditMode ? "bg-gray-100" : ""} // Style để show rõ là disabled
            />
            {isEditMode && (
              <p className="text-sm text-muted-foreground mt-1">
                Email cannot be changed after user creation
              </p>
            )}
          </div>

          {!isEditMode && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter password"
                required
              />
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/users")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : isEditMode ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default UserForm;
