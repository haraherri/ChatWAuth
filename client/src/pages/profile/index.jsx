import { useAppStore } from "@/store";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { colors, getColor } from "@/lib/utils";
import { FaPlus, FaTrash } from "react-icons/fa";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import {
  REMOVE_PROFILE_IMAGE_ROUTES,
  UPDATE_PROFILE_ROUTES,
  UPLOAD_PROFILE_IMAGE_ROUTES,
} from "@/utils/constants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import ChangePassword from "./ChangePassword";

const Profile = () => {
  const navigate = useNavigate();
  const { userInfo, setUserInfo } = useAppStore();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [image, setImage] = useState(null);
  const [hovered, setHovered] = useState(false);
  const [selectedColor, setSelectedColor] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (userInfo.firstName) {
      setFirstName(userInfo.firstName);
    }
    if (userInfo.lastName) {
      setLastName(userInfo.lastName);
    }
    if (userInfo.color !== undefined) {
      setSelectedColor(userInfo.color);
    }
    if (userInfo.image) {
      setImage(userInfo.image);
    }
  }, [userInfo]);

  const validateProfile = () => {
    if (!firstName) {
      toast.error("First Name is required");
      return false;
    }
    if (!lastName) {
      toast.error("Last Name is required");
      return false;
    }
    return true;
  };

  const saveChanges = async () => {
    if (validateProfile()) {
      try {
        const response = await apiClient.put(
          UPDATE_PROFILE_ROUTES,
          {
            firstName,
            lastName,
            color: selectedColor,
          },
          { withCredentials: true }
        );
        if (response.status === 200 && response.data) {
          setUserInfo({ ...response.data });
          toast.success("Profile updated successfully!");
          navigate("/chat");
        }
      } catch (error) {
        if (error.response?.data?.error) {
          toast.error(error.response.data.error);
          return;
        }
      }
    }
  };
  const handleNavigate = () => {
    if (userInfo.profileSetup) {
      navigate("/chat");
    } else {
      toast.error("Please setup profile first!");
    }
  };

  const handleFileInputClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append("profile-image", file);

      const response = await apiClient.post(
        UPLOAD_PROFILE_IMAGE_ROUTES,
        formData,
        {
          withCredentials: true,
        }
      );

      if (response.status === 200 && response.data.user) {
        setUserInfo(response.data.user);
        toast.success(response.data.message);
      }
    } catch (error) {
      setImage(userInfo.image);

      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error("Failed to upload image");
      }
    }
  };

  const handleDeleteImage = async () => {
    try {
      const response = await apiClient.delete(REMOVE_PROFILE_IMAGE_ROUTES, {
        withCredentials: true,
      });
      if (response.status === 200) {
        setUserInfo({ ...userInfo, image: null });
        toast.success("Image deleted successfully!");
        setImage(null);
      }
    } catch (error) {
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
        return;
      }
    }
  };

  return (
    <div className="bg-[#1b1c24] min-h-screen flex items-center justify-center py-10">
      <div className="flex flex-col gap-10 w-[90vw] max-w-4xl">
        <div onClick={handleNavigate} className="cursor-pointer">
          <IoArrowBack className="text-4xl lg:text-6xl text-white/90" />
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <div className="flex items-center justify-center w-full mb-8">
            <TabsList className="bg-transparent rounded-none w-3/4">
              <TabsTrigger
                value="profile"
                className="w-full data-[state=active]:bg-transparent 
                            text-white/70 border-b-[1px] border-gray-700
                            rounded-none data-[state=active]:text-white 
                            data-[state=active]:font-semibold 
                            data-[state=active]:border-b-2
                            data-[state=active]:border-b-purple-500 
                            hover:text-white/90
                            p-4 transition-all duration-300
                            relative -mb-[1px]"
              >
                Profile Information
              </TabsTrigger>
              <TabsTrigger
                value="password"
                className="w-full data-[state=active]:bg-transparent 
                            text-white/70 border-b-[1px] border-gray-700
                            rounded-none data-[state=active]:text-white 
                            data-[state=active]:font-semibold 
                            data-[state=active]:border-b-2
                            data-[state=active]:border-b-purple-500 
                            hover:text-white/90
                            p-4 transition-all duration-300
                            relative -mb-[1px]"
              >
                Change Password
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="profile">
            <Card className="border-none bg-transparent shadow-none">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div
                    className="h-full w-32 md:w-48 md:h-48 relative flex justify-center items-center ml-32"
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                  >
                    <Avatar className="h-32 w-32 md:w-48 md:h-48 rounded-full overflow-hidden">
                      {image ? (
                        <AvatarImage
                          src={image}
                          alt="profile"
                          className="object-cover w-full h-full bg-black"
                        />
                      ) : (
                        <div
                          className={`h-32 w-32 uppercase md:w-48 md:h-48 text-5xl border-[1px] flex items-center justify-center rounded-full ${getColor(
                            selectedColor
                          )}`}
                        >
                          {firstName
                            ? firstName.split("").shift()
                            : userInfo.email.split("").shift()}
                        </div>
                      )}
                    </Avatar>
                    {hovered && (
                      <div
                        className="absolute inset-0 flex justify-center items-center bg-black/50 rounded-full cursor-pointer"
                        onClick={
                          image ? handleDeleteImage : handleFileInputClick
                        }
                      >
                        {image ? (
                          <FaTrash className="text-white text-3xl" />
                        ) : (
                          <FaPlus className="text-white text-3xl" />
                        )}
                      </div>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleImageChange}
                      name="profile-image"
                      accept=".png, .jpg, .jpeg, .svg, .webp"
                    />
                  </div>

                  <div className="flex flex-col gap-5 text-white">
                    <Input
                      placeholder="Email"
                      type="email"
                      disabled
                      value={userInfo.email}
                      className="rounded-lg p-6 bg-[#2c2e3b] border-none"
                    />
                    <Input
                      placeholder="First Name"
                      type="text"
                      onChange={(e) => setFirstName(e.target.value)}
                      value={firstName}
                      className="rounded-lg p-6 bg-[#2c2e3b] border-none"
                    />
                    <Input
                      placeholder="Last Name"
                      type="text"
                      onChange={(e) => setLastName(e.target.value)}
                      value={lastName}
                      className="rounded-lg p-6 bg-[#2c2e3b] border-none"
                    />
                    <div className="flex gap-5">
                      {colors.map((color, index) => (
                        <div
                          className={`${color} h-8 w-8 rounded-full cursor-pointer transition-all duration-300 
                            ${
                              selectedColor === index
                                ? "outline outline-white/70 outline-2"
                                : ""
                            }`}
                          key={index}
                          onClick={() => setSelectedColor(index)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <Button
                  className="h-16 w-full bg-purple-700 hover:bg-purple-900 transition-all duration-300 mt-8"
                  onClick={saveChanges}
                >
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password">
            <Card className="border-none bg-transparent shadow-none">
              <CardContent className="p-6">
                <ChangePassword />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
