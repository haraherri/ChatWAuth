import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/store";
import { GET_ALL_MESSAGES_ROUTES } from "@/utils/constants";
import { Download, FileIcon } from "lucide-react";
import moment from "moment";
import React, { useEffect, useRef } from "react";
import { toast } from "sonner";

const MessageContainer = () => {
  const scrollRef = useRef();
  const {
    selectedChatType,
    selectedChatData,
    userInfo,
    selectedChatMessages,
    setSelectedChatMessages,
  } = useAppStore();

  useEffect(() => {
    const getMessages = async () => {
      try {
        const response = await apiClient.post(
          GET_ALL_MESSAGES_ROUTES,
          {
            userId2: selectedChatData._id,
          },
          { withCredentials: true }
        );
        if (response.data.messages) {
          setSelectedChatMessages(response.data.messages);
        }
      } catch (error) {
        if (error.response?.data?.error) {
          toast.error(error.response.data.error);
          return;
        }
      }
    };
    if (selectedChatData._id) {
      if (selectedChatType === "contact") getMessages();
    }
  }, [selectedChatType, selectedChatData, setSelectedChatMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedChatMessages]);

  const renderMessages = () => {
    let lastDate = null;
    return selectedChatMessages.map((message) => {
      const messageDate = moment(message.createdAt).format("MMM Do YY");
      const showDate = messageDate !== lastDate;
      lastDate = messageDate;
      return (
        <div key={message._id}>
          {showDate && (
            <div className="text-center text-gray-500 my-2">
              {moment(message.createdAt).format("LL")}
            </div>
          )}
          {selectedChatType === "contact" && renderDMMessages(message)}
        </div>
      );
    });
  };

  const renderDMMessages = (message) => (
    <div
      className={`mt-5 ${
        message.sender !== selectedChatData._id ? "text-left" : "text-right"
      }`}
    >
      {message.messageType === "text" && (
        <div
          className={`${
            message.sender !== selectedChatData._id
              ? "bg-[#8417ff] text-[#ffffff] border-[#8417ff]/50 font-bold"
              : "bg-[#2a2b33]/5 text-white/80 border-[#ffffff]/20 font-bold"
          } border inline-block p-4 rounded my-1 max-w-[50%] break-words`}
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
              onClick={() => window.open(message.fileUrl, "_blank")}
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
            <Download
              size={18}
              className="ml-2 cursor-pointer hover:scale-110"
              onClick={() => window.open(message.fileUrl, "_blank")}
            />
          </div>
        )}

      <div className="text-xs text-gray-600">
        {moment(message.createdAt).format("LT")}
      </div>
    </div>
  );
  return (
    <div className="flex-1 overflow-y-auto scrollbar-hidden p-4 px-8 md:w-[65vw] lg:w-[70vw] xl:w-[80vw] w-full ">
      {renderMessages()}
      <div ref={scrollRef}></div>
    </div>
  );
};

export default MessageContainer;
