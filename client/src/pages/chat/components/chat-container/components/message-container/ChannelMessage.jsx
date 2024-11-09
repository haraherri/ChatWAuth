import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileIcon, MoreHorizontal, Pin, Trash2 } from "lucide-react";
import moment from "moment";
import { getColor } from "@/lib/utils";

export const ChannelMessage = ({
  message,
  userInfo,
  onImageClick,
  onImageLoad,
  onFileDownload,
  onDeleteMessage,
}) => {
  const isCurrentUser = message.sender._id === userInfo.id;

  const renderAvatar = () => (
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
            className={`uppercase text-xs ${getColor(message.sender.color)}`}
          >
            {message.sender.firstName?.charAt(0)}
          </AvatarFallback>
        )}
      </Avatar>
      <span className="text-sm text-white/80">
        {message.sender.firstName} {message.sender.lastName}
      </span>
    </>
  );

  const renderDropdownMenu = () => (
    <div
      className={`${
        isCurrentUser ? "order-first" : "order-last"
      } opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 self-center`}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-1 hover:bg-gray-700/50 rounded">
            <MoreHorizontal className="h-4 w-4 text-gray-400" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={isCurrentUser ? "start" : "end"}
          className="w-40"
        >
          <DropdownMenuItem className="gap-2 cursor-pointer">
            <Pin className="h-4 w-4" />
            <span>Pin message</span>
          </DropdownMenuItem>
          {(userInfo.role === "admin" || userInfo.role === "moderator") && (
            <DropdownMenuItem
              className="gap-2 text-red-500 focus:text-red-500 cursor-pointer"
              onClick={() => onDeleteMessage(message._id)}
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete message</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const renderContent = () => {
    if (message.messageType === "text") {
      return (
        <div
          className={`${
            isCurrentUser
              ? "bg-[#8417ff] text-[#ffffff] border-[#8417ff]/50"
              : "bg-[#2a2b33]/5 text-white/80 border-[#ffffff]/20"
          } border p-4 rounded my-1 break-words font-bold flex-grow`}
          style={{
            borderRadius: !isCurrentUser
              ? "20px 20px 20px 0px"
              : "20px 20px 0px 20px",
          }}
        >
          {message.deletedAt ? (
            <span className="italic text-gray-400">
              This message has been deleted.
            </span>
          ) : (
            message.content
          )}
        </div>
      );
    }

    if (message.messageType === "file") {
      if (message.fileUrl?.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return (
          <div className="max-w-[300px] inline-block">
            <img
              src={message.fileUrl}
              alt="Image message"
              className="rounded-lg border border-gray-600 hover:scale-105 transition-transform cursor-pointer"
              onClick={() => onImageClick(message.fileUrl)}
              onLoad={() => onImageLoad(message.sender._id)}
            />
          </div>
        );
      }

      return (
        <div
          className={`${
            isCurrentUser
              ? "bg-[#8417ff] text-[#ffffff]"
              : "bg-[#2a2b33]/5 text-white/80"
          } border rounded p-3 inline-flex items-center gap-2 hover:opacity-80`}
        >
          <FileIcon size={20} />
          <div className="flex flex-col">
            <span className="text-sm">{message.fileUrl.split("/").pop()}</span>
          </div>
          <button
            onClick={() => onFileDownload(message.fileUrl)}
            className="ml-2 cursor-pointer hover:scale-110"
          >
            <Download size={18} />
          </button>
        </div>
      );
    }
  };

  return (
    <div className={`mt-5 group ${isCurrentUser ? "text-right" : "text-left"}`}>
      <div className="flex items-center gap-2 mb-1">
        {!isCurrentUser && renderAvatar()}
      </div>

      <div className="inline-flex items-start gap-2 max-w-[50%] relative">
        {renderDropdownMenu()}
        {renderContent()}
      </div>

      <div className="text-xs text-gray-600">
        {moment(message.createdAt).format("LT")}
      </div>
    </div>
  );
};
