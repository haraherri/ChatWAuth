import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Pin, MoreHorizontal, MessageSquare, FileIcon } from "lucide-react";
import moment from "moment";

const PinnedMessage = ({
  message,
  userInfo,
  onPinMessage,
  onScrollToMessage,
}) => {
  const getColor = (color) => {
    const colors = [
      "bg-red-500",
      "bg-orange-500",
      "bg-yellow-500",
      "bg-green-500",
      "bg-blue-500",
      "bg-indigo-500",
      "bg-purple-500",
      "bg-pink-500",
    ];
    return colors[color % colors.length];
  };

  const renderMessageContent = () => {
    if (message.messageType === "text") {
      return (
        <div className="bg-[#2a2b33]/50 text-white/80 border border-[#ffffff]/10 p-3 rounded-lg break-words">
          {message.content}
        </div>
      );
    }

    if (message.messageType === "file") {
      if (message.fileUrl?.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return (
          <div className="max-w-[200px]">
            <img
              src={message.fileUrl}
              alt="Pinned image"
              className="rounded-lg border border-[#ffffff]/10"
            />
          </div>
        );
      }

      return (
        <div className="bg-[#2a2b33]/50 text-white/80 border border-[#ffffff]/10 p-3 rounded-lg flex items-center gap-2">
          <FileIcon size={16} />
          <span className="text-sm truncate max-w-[150px]">
            {message.fileUrl.split("/").pop()}
          </span>
        </div>
      );
    }
  };

  return (
    <div className="py-3 px-2 hover:bg-[#2a2b33]/30 rounded-lg transition-colors group">
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          {message.sender.image ? (
            <AvatarImage src={message.sender.image} />
          ) : (
            <AvatarFallback className={`${getColor(message.sender.color)}`}>
              {message.sender.firstName?.charAt(0)}
            </AvatarFallback>
          )}
        </Avatar>

        <div className="flex-grow min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-sm">
                {message.sender.firstName} {message.sender.lastName}
              </span>
              <span className="text-xs text-white/50 ml-2">
                {moment(message.pinnedAt).format("MMM D, YYYY [at] h:mm A")}
              </span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all">
                  <MoreHorizontal className="h-4 w-4 text-white/70" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  className="gap-2 cursor-pointer"
                  onClick={() => onScrollToMessage(message._id)}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>See in chat</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2 cursor-pointer text-red-400 focus:text-red-400"
                  onClick={() => onPinMessage(message._id, false)}
                >
                  <Pin className="h-4 w-4" />
                  <span>Unpin message</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-1">{renderMessageContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default PinnedMessage;
