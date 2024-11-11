import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pin, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/store";
import { useSocket } from "@/context/SocketContext";
import { ChannelMessage } from "../message-container/ChannelMessage";
import PinnedMessage from "../message-container/PinnedMessage";

const PinnedMessagesDialog = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const socket = useSocket();
  const { selectedChatData, userInfo, pinnedMessages, setPinnedMessages } =
    useAppStore();

  const handleScrollToMessage = (messageId) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
      messageElement.classList.add("bg-white/5");
      setTimeout(() => {
        messageElement.classList.remove("bg-white/5");
      }, 2000);
    }
    setOpen(false);
  };

  const fetchPinnedMessages = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(
        `/api/rooms/${selectedChatData._id}/pinned-messages`,
        { withCredentials: true }
      );
      if (response?.data?.success) {
        setPinnedMessages(response.data.pinnedMessages);
        console.log(response.data.pinnedMessages);
      }
    } catch (error) {
      console.error("Failed to fetch pinned messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (socket) {
      socket.on("pinnedMessages", (messages) => {
        setPinnedMessages(messages);
      });

      socket.on("messagePin", (data) => {
        // Thay vì gọi fetchPinnedMessages()
        const { messageId, action, pinnedBy, pinnedAt } = data;
        const isPinned = action === "pinned";

        // Update message trong store
        const { updateMessage } = useAppStore.getState();
        updateMessage(messageId, { isPinned, pinnedBy, pinnedAt });
      });

      return () => {
        socket.off("pinnedMessages");
        socket.off("messagePin");
      };
    }
  }, [socket, selectedChatData]);

  const handlePinMessage = async (messageId, isPinned) => {
    try {
      socket.emit("pinMessage", {
        messageId,
        roomId: selectedChatData._id,
        isPinned,
      });
    } catch (error) {
      console.error("Failed to pin/unpin message:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-neutral-500 hover:text-white hover:bg-white/10"
        >
          <Pin className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-[#1e1f24] text-white border-[#2f303b]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pin className="h-5 w-5" />
            Pinned Messages ({pinnedMessages.length}/10)
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-white/70" />
            </div>
          ) : pinnedMessages.length === 0 ? (
            <div className="text-center py-8 text-white/70">
              No pinned messages in this room
            </div>
          ) : (
            pinnedMessages.map((message) => (
              <PinnedMessage
                key={message._id}
                message={message}
                userInfo={userInfo}
                onPinMessage={handlePinMessage}
                onScrollToMessage={handleScrollToMessage}
              />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PinnedMessagesDialog;
