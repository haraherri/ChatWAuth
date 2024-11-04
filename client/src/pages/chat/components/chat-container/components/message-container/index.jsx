import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { apiClient } from "@/lib/api-client";
import { getColor } from "@/lib/utils";
import { useAppStore } from "@/store";
import { GET_ALL_MESSAGES_ROUTES } from "@/utils/constants";
import { Download, FileIcon, X } from "lucide-react";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const MessageContainer = () => {
  const containerRef = useRef(null);
  const scrollRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previousMessageCount, setPreviousMessageCount] = useState(0);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const {
    selectedChatType,
    selectedChatData,
    userInfo,
    selectedChatMessages,
    setSelectedChatMessages,
  } = useAppStore();

  const scrollToBottom = (behavior = "auto") => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShouldAutoScroll(isNearBottom);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);

  useEffect(() => {
    if (selectedChatMessages.length > previousMessageCount) {
      const latestMessage =
        selectedChatMessages[selectedChatMessages.length - 1];
      const isCurrentUserMessage = latestMessage?.sender === userInfo?.id;
      if (isCurrentUserMessage || shouldAutoScroll) {
        scrollToBottom("smooth");
      }
    }
    setPreviousMessageCount(selectedChatMessages.length);
  }, [selectedChatMessages]);

  useEffect(() => {
    const getMessages = async () => {
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
          setPreviousMessageCount(response.data.messages.length);
          setTimeout(() => {
            scrollToBottom();
          }, 100);
        }
      } catch (error) {
        if (error.response?.data?.error) {
          toast.error(error.response.data.error);
        }
      }
    };

    if (selectedChatData._id) {
      getMessages();
    }
  }, [selectedChatType, selectedChatData, setSelectedChatMessages]);

  const handleImageLoad = (senderId) => {
    if (senderId === userInfo.id) {
      console.log(userInfo.id);
      scrollToBottom("smooth");
    }
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
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
      a.download = fileUrl.split("/").pop();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    }
  };

  const ImagePreviewModal = ({ imageUrl, onClose }) => (
    <Dialog open={!!imageUrl} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[90vw] max-h-[90vh] p-0 bg-transparent border-none">
        <div className="relative w-full h-full">
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            <button
              onClick={() => handleImageDownload(imageUrl)}
              className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
            >
              <Download className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
          <img
            src={imageUrl}
            alt="Preview"
            className="max-w-full max-h-[85vh] object-contain mx-auto"
          />
        </div>
      </DialogContent>
    </Dialog>
  );

  const renderDMMessages = (message) => (
    <div
      className={`mt-5 ${
        message.sender === selectedChatData._id ? "text-left" : "text-right"
      }`}
    >
      {message.messageType === "text" && (
        <div
          className={`${
            message.sender !== selectedChatData._id
              ? " bg-[#8417ff] text-[#ffffff] border-[#8417ff]/50 font-bold"
              : " bg-[#2a2b33]/5 text-white/80 border-[#ffffff]/20 font-bold"
          } border inline-block p-4 rounded my-1 max-w-[50%] break-words`}
          style={{
            borderRadius:
              message.sender === selectedChatData._id
                ? "20px 20px 20px 0px" // Sender's message
                : "20px 20px 0px 20px", // Receiver's message
          }}
        >
          {message.content}
        </div>
      )}
      {message.messageType === "file" &&
        message.fileUrl?.match(/\.(jpg|jpeg|png|gif)$/i) && (
          <div className="max-w-[300px] inline-block">
            <img
              src={message.fileUrl}
              alt="Image message"
              className="rounded-lg border border-gray-600 hover:scale-105 transition-transform cursor-pointer"
              onClick={() => handleImageClick(message.fileUrl)}
              onLoad={() => handleImageLoad(message.sender)}
            />
          </div>
        )}

      {message.messageType === "file" &&
        !message.fileUrl?.match(/\.(jpg|jpeg|png|gif)$/i) && (
          <div
            className={`${
              message.sender !== selectedChatData._id
                ? "bg-[#8417ff] text-[#ffffff]"
                : "bg-[#2a2b33]/5 text-white/80"
            } border rounded p-3 inline-flex items-center gap-2 hover:opacity-80`}
          >
            <FileIcon size={20} />
            <div className="flex flex-col">
              <span className="text-sm">
                {message.fileUrl.split("/").pop()}
              </span>
            </div>
            <button
              onClick={() => handleFileDownload(message.fileUrl)}
              className="ml-2 cursor-pointer hover:scale-110"
            >
              <Download size={18} />
            </button>
          </div>
        )}

      <div className="text-xs text-gray-600">
        {moment(message.createdAt).format("LT")}
      </div>
    </div>
  );

  const renderChannelMessages = (message) => (
    <div
      className={`mt-5 ${
        message.sender._id === userInfo.id ? "text-right" : "text-left"
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        {message.sender._id !== userInfo.id && (
          <>
            <Avatar className="h-6 w-6">
              {message.sender.image ? (
                <AvatarImage
                  src={message.sender.image}
                  alt="profile"
                  className="object-cover w-full h-full"
                />
              ) : (
                <AvatarFallback
                  className={`uppercase text-xs ${getColor(
                    message.sender.color
                  )}`}
                >
                  {message.sender.firstName?.charAt(0)}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="text-sm text-white/80">
              {message.sender.firstName} {message.sender.lastName}
            </span>
          </>
        )}
      </div>

      {message.messageType === "text" && (
        <div
          className={`${
            message.sender._id === userInfo.id
              ? "bg-[#8417ff] text-[#ffffff] border-[#8417ff]/50"
              : "bg-[#2a2b33]/5 text-white/80 border-[#ffffff]/20"
          } border inline-block p-4 rounded my-1 max-w-[50%] break-words font-bold`}
          style={{
            borderRadius:
              message.sender._id !== userInfo.id
                ? "20px 20px 20px 0px"
                : "20px 20px 0px 20px",
          }}
        >
          {message.content}
        </div>
      )}

      {message.messageType === "file" &&
        message.fileUrl?.match(/\.(jpg|jpeg|png|gif)$/i) && (
          <div className="max-w-[300px] inline-block">
            <img
              src={message.fileUrl}
              alt="Image message"
              className="rounded-lg border border-gray-600 hover:scale-105 transition-transform cursor-pointer"
              onClick={() => handleImageClick(message.fileUrl)}
              onLoad={() => handleImageLoad(message.sender._id)}
            />
          </div>
        )}

      {message.messageType === "file" &&
        !message.fileUrl?.match(/\.(jpg|jpeg|png|gif)$/i) && (
          <div
            className={`${
              message.sender._id === userInfo.id
                ? "bg-[#8417ff] text-[#ffffff]"
                : "bg-[#2a2b33]/5 text-white/80"
            } border rounded p-3 inline-flex items-center gap-2 hover:opacity-80`}
          >
            <FileIcon size={20} />
            <div className="flex flex-col">
              <span className="text-sm">
                {message.fileUrl.split("/").pop()}
              </span>
            </div>
            <button
              onClick={() => handleFileDownload(message.fileUrl)}
              className="ml-2 cursor-pointer hover:scale-110"
            >
              <Download size={18} />
            </button>
          </div>
        )}

      <div className="text-xs text-gray-600">
        {moment(message.createdAt).format("LT")}
      </div>
    </div>
  );

  const renderMessages = () => {
    let lastDate = null;
    return selectedChatMessages.map((message, index) => {
      const messageDate = moment(message.createdAt).format("MMM Do YY");
      const showDate = messageDate !== lastDate;
      lastDate = messageDate;

      return (
        <div key={`${message._id}-${index}`}>
          {showDate && (
            <div className="text-center text-gray-500 my-2">
              {moment(message.createdAt).format("LL")}
            </div>
          )}
          {selectedChatType === "contact"
            ? renderDMMessages(message)
            : renderChannelMessages(message)}
        </div>
      );
    });
  };

  return (
    <>
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto scrollbar-hidden p-4 px-8 md:w-[65vw] lg:w-[70vw] xl:w-[80vw] w-full"
      >
        {renderMessages()}
        <div ref={scrollRef} />
      </div>

      <ImagePreviewModal
        imageUrl={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </>
  );
};

export default MessageContainer;
