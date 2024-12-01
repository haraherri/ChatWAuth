import { getOriginalFilename } from "@/utils/helper";
import { Download, FileIcon } from "lucide-react";
import moment from "moment";

export const DMMessage = ({
  message,
  selectedChatData,
  onImageClick,
  onImageLoad,
  onFileDownload,
}) => {
  const isSender = message.sender === selectedChatData._id;

  const renderContent = () => {
    if (message.messageType === "text") {
      return (
        <div
          className={`${
            !isSender
              ? "bg-[#8417ff] text-[#ffffff] border-[#8417ff]/50 font-bold"
              : "bg-[#2a2b33]/5 text-white/80 border-[#ffffff]/20 font-bold"
          } border inline-block p-4 rounded my-1 max-w-[50%] break-words`}
          style={{
            borderRadius: isSender
              ? "20px 20px 20px 0px"
              : "20px 20px 0px 20px",
          }}
        >
          {message.content}
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
              onLoad={() => onImageLoad(message.sender)}
            />
          </div>
        );
      }

      return (
        <div
          className={`${
            !isSender
              ? "bg-[#8417ff] text-[#ffffff]"
              : "bg-[#2a2b33]/5 text-white/80"
          } border rounded p-3 inline-flex items-center gap-2 hover:opacity-80`}
        >
          <FileIcon size={20} />
          <div className="flex flex-col">
            <span className="text-sm">
              {getOriginalFilename(message.fileUrl)}
            </span>
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
    <div className={`mt-5 ${isSender ? "text-left" : "text-right"}`}>
      {renderContent()}
      <div className="text-xs text-gray-600">
        {moment(message.createdAt).format("LT")}
      </div>
    </div>
  );
};
