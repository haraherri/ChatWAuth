import { Textarea } from "@/components/ui/textarea";
import { useSocket } from "@/context/SocketContext";
import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/store";
import { UPLOAD_FILE_ROUTES } from "@/utils/constants";
import EmojiPicker from "emoji-picker-react";
import React, { useEffect, useRef, useState } from "react";
import { GrAttachment } from "react-icons/gr";
import { IoSend } from "react-icons/io5";
import { RiEmojiStickerLine } from "react-icons/ri";
import { toast } from "sonner";

const MessageBar = () => {
  const emojiRef = useRef();
  const fileInputRef = useRef();
  const socket = useSocket();
  const { selectedChatData, selectedChatType, userInfo } = useAppStore();
  const [message, setMessage] = useState("");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const handleSendMessage = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    if (trimmedMessage.length > 4000) {
      toast.error("Message cannot be longer than 4000 characters");
      return;
    }

    const messageData = {
      sender: userInfo.id,
      content: trimmedMessage,
      messageType: "text",
      fileUrl: undefined,
    };
    if (selectedChatType === "contact") {
      messageData.recipient = selectedChatData._id;
    } else if (selectedChatType === "channel") {
      messageData.room = selectedChatData._id;
    }

    socket.emit("sendMessage", messageData);
    setMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAddEmoji = (emoji) => {
    setMessage((msg) => msg + emoji.emoji);
  };

  const handleAttachmentClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleAttachmentChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const chatId = selectedChatData?._id;
      if (!chatId) return;

      formData.append(
        selectedChatType === "contact" ? "recipient" : "room",
        chatId
      );

      const { data } = await apiClient.post(UPLOAD_FILE_ROUTES, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (data?.fileData) {
        const messageData = {
          sender: userInfo.id,
          messageType: "file",
          fileUrl: data.fileData.fileUrl,
          file: {
            originalName: data.fileData.originalName,
            size: data.fileData.size,
            type: data.fileData.type,
          },
          [selectedChatType === "contact" ? "recipient" : "room"]: chatId,
        };

        socket.emit("sendMessage", messageData);

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (error) {
      console.error("File upload error:", error);
      toast.error(
        error.response?.data?.error || "Error uploading file. Please try again."
      );
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setEmojiPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [emojiRef]);

  return (
    <div className="h-[12vh] bg-[#1c1d25] flex justify-center items-center px-8 mb-6 gap-6">
      <div className="flex-1 flex items-center bg-[#2a2b33] rounded-xl overflow-hidden pr-2 h-[56px]">
        <div className="flex-1 relative flex items-center h-full">
          <Textarea
            placeholder="Enter Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            style={{
              height: "100%",
              maxHeight: "100%",
            }}
          />
        </div>

        <div className="flex items-center gap-2 px-1">
          <button
            className="text-neutral-500 hover:text-white focus:outline-none duration-300 transition-all p-2 rounded-full hover:bg-[#3a3b43]"
            onClick={handleAttachmentClick}
          >
            <GrAttachment className="text-xl" />
          </button>
          <input
            type="file"
            className="hidden"
            onChange={handleAttachmentChange}
            ref={fileInputRef}
          />

          <div className="relative">
            <button
              className="text-neutral-500 hover:text-white focus:outline-none duration-300 transition-all p-2 rounded-full hover:bg-[#3a3b43]"
              onClick={() => setEmojiPickerOpen(true)}
            >
              <RiEmojiStickerLine className="text-xl" />
            </button>
            <div className="absolute bottom-16 right-0" ref={emojiRef}>
              <EmojiPicker
                theme="dark"
                open={emojiPickerOpen}
                onEmojiClick={handleAddEmoji}
                autoFocusSearch={false}
              />
            </div>
          </div>
        </div>
      </div>

      <button
        className="bg-[#8417ff] rounded-xl flex items-center justify-center p-4 h-[56px] w-[56px] hover:bg-[#741bda] focus:outline-none duration-300 transition-all"
        onClick={handleSendMessage}
      >
        <IoSend className="text-xl" />
      </button>
    </div>
  );
};

export default MessageBar;
