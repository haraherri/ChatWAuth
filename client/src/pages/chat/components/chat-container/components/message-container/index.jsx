import { useEffect } from "react";
import moment from "moment";
import { useAppStore } from "@/store";
import { useMessageScroll } from "@/hooks/useMessageScroll";
import { useMessageHandlers } from "@/hooks/useMessageHandlers";
import { ChannelMessage } from "./ChannelMessage";
import { DMMessage } from "./DMMessage";
import { ImagePreviewModal } from "./ImagePreviewModal";

const MessageContainer = () => {
  const {
    selectedChatType,
    selectedChatData,
    userInfo,
    selectedChatMessages,
    setSelectedChatMessages,
  } = useAppStore();

  const { containerRef, scrollRef, scrollToBottom, shouldAutoScroll } =
    useMessageScroll(selectedChatMessages);

  const {
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
  } = useMessageHandlers(
    setSelectedChatMessages,
    selectedChatType,
    selectedChatData
  );

  useEffect(() => {
    if (selectedChatData._id) {
      const initMessages = async () => {
        const messageCount = await fetchMessages();
        if (selectedChatType === "channel") {
          await fetchPinnedMessages();
        }
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      };
      initMessages();
    }
  }, [selectedChatType, selectedChatData]);

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
          {selectedChatType === "contact" ? (
            <DMMessage
              message={message}
              selectedChatData={selectedChatData}
              onImageClick={handleImageClick}
              onImageLoad={(senderId) =>
                handleImageLoad(senderId, userInfo, scrollToBottom)
              }
              onFileDownload={handleFileDownload}
            />
          ) : (
            <ChannelMessage
              message={message}
              userInfo={userInfo}
              onImageClick={handleImageClick}
              onImageLoad={(senderId) =>
                handleImageLoad(senderId, userInfo, scrollToBottom)
              }
              onFileDownload={handleFileDownload}
              onDeleteMessage={handleDeleteMessage}
              onPinMessage={handlePinMessage}
            />
          )}
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
        onDownload={handleImageDownload}
      />
    </>
  );
};

export default MessageContainer;
