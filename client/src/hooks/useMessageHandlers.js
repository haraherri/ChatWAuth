import { useState } from "react";
import { toast } from "sonner";
import { useSocket } from "@/context/SocketContext";
import { apiClient } from "@/lib/api-client";
import { GET_ALL_MESSAGES_ROUTES } from "@/utils/constants";
import { getOriginalFilename } from "@/utils/helper";

export const useMessageHandlers = (
  setSelectedChatMessages,
  selectedChatType,
  selectedChatData
) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const socket = useSocket();

  const handleDeleteMessage = async (messageId) => {
    try {
      socket.emit("deleteMessage", {
        messageId,
        roomId: selectedChatData._id,
      });
    } catch (error) {
      toast.error("Failed to delete message");
    }
  };

  const handlePinMessage = async (messageId, isPinned) => {
    try {
      socket.emit("pinMessage", {
        messageId,
        roomId: selectedChatData._id,
        isPinned,
      });
    } catch (error) {
      toast.error("Failed to pin message");
    }
  };

  const fetchPinnedMessages = async () => {
    try {
      const response = await apiClient.get(
        `/api/rooms/${selectedChatData._id}/pinned-messages`,
        { withCredentials: true }
      );
      if (response?.data?.success) {
        socket.emit("getPinnedMessages", selectedChatData._id);
      }
    } catch (error) {
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      }
    }
  };
  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const handleImageLoad = (senderId, userInfo, scrollToBottom) => {
    if (senderId === userInfo.id) {
      scrollToBottom("smooth");
    }
  };

  const handleImageDownload = async (imageUrl) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = imageUrl.split("/").pop();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading image:", error);
      toast.error("Failed to download image");
    }
  };

  const handleFileDownload = async (fileUrl) => {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = getOriginalFilename(fileUrl);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    }
  };

  const fetchMessages = async () => {
    try {
      let response;
      if (selectedChatType === "contact") {
        response = await apiClient.post(
          GET_ALL_MESSAGES_ROUTES,
          {
            userId2: selectedChatData._id,
          },
          { withCredentials: true }
        );
      } else if (selectedChatType === "channel") {
        response = await apiClient.get(
          `/api/rooms/${selectedChatData._id}/messages`,
          { withCredentials: true }
        );
      }

      if (response?.data?.messages) {
        setSelectedChatMessages(response.data.messages);
        return response.data.messages.length;
      }
      return 0;
    } catch (error) {
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      }
      return 0;
    }
  };

  return {
    selectedImage,
    setSelectedImage,
    handleDeleteMessage,
    handlePinMessage,
    handleImageClick,
    handleImageLoad,
    handleImageDownload,
    handleFileDownload,
    fetchMessages,
    fetchPinnedMessages,
  };
};
