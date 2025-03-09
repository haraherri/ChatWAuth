import { useAppStore } from "@/store";
import { HOST } from "@/utils/constants";
import { createContext, useContext, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const socket = useRef();
  const { userInfo } = useAppStore();

  useEffect(() => {
    if (userInfo) {
      socket.current = io(HOST, {
        withCredentials: true,
        query: {
          userId: userInfo.id,
        },
      });

      const handleNewMessage = (message) => {
        const {
          selectedChatType,
          selectedChatData,
          addMessage,
          updateLastMessage,
          sortContactsByLastMessage,
          sortChannelsByLastMessage,
          userInfo,
        } = useAppStore.getState();

        // Xử lý tin nhắn DM
        if (!message.room) {
          // Nếu là tin nhắn DM
          const contactId =
            message.sender._id === userInfo.id
              ? message.recipient._id
              : message.sender._id;

          // Cập nhật tin nhắn cuối và sắp xếp lại danh sách
          updateLastMessage(contactId, message, "contact");
          sortContactsByLastMessage();

          // Thêm tin nhắn vào cuộc trò chuyện nếu đang mở
          if (
            selectedChatType === "contact" &&
            selectedChatData?._id === contactId
          ) {
            addMessage(message);
          }
        }
        // Xử lý tin nhắn channel
        else {
          const channelId = message.room;

          // Cập nhật tin nhắn cuối và sắp xếp lại danh sách
          updateLastMessage(channelId, message, "channel");
          sortChannelsByLastMessage();

          // Thêm tin nhắn vào cuộc trò chuyện nếu đang mở
          if (
            selectedChatType === "channel" &&
            selectedChatData?._id === channelId
          ) {
            addMessage(message);
          }
        }
      };

      const handleMessageSent = (response) => {
        if (response.status === "success") {
          const {
            selectedChatData,
            selectedChatType,
            addMessage,
            updateLastMessage,
            sortContactsByLastMessage,
            sortChannelsByLastMessage,
          } = useAppStore.getState();

          const message = response.message;

          // Xử lý tin nhắn DM
          if (!message.room) {
            updateLastMessage(message.recipient._id, message, "contact");
            sortContactsByLastMessage();

            if (
              selectedChatType === "contact" &&
              selectedChatData?._id === message.recipient._id
            ) {
              addMessage(message);
            }
          }
          // Xử lý tin nhắn channel
          else {
            updateLastMessage(message.room, message, "channel");
            sortChannelsByLastMessage();

            if (
              selectedChatType === "channel" &&
              selectedChatData?._id === message.room
            ) {
              addMessage(message);
            }
          }
        }
      };

      const handleMessageDeleted = (data) => {
        const { updateMessage } = useAppStore.getState();
        updateMessage(data.messageId, {
          deletedAt: data.deletedAt,
          deletedBy: data.deletedBy,
        });
      };
      const handleMessagePin = (data) => {
        const { updateMessagePinStatus } = useAppStore.getState();
        updateMessagePinStatus(
          data.messageId,
          data.action === "pinned",
          data.pinnedBy,
          data.pinnedAt
        );
      };

      const handlePinnedMessages = (messages) => {
        const { setPinnedMessages } = useAppStore.getState();
        setPinnedMessages(messages);
      };
      const handleNewRoom = (room) => {
        const { addChannel } = useAppStore.getState();
        addChannel(room);
        console.log(`Received new room: ${room._id}`);
      };

      const handleUserJoinedRoom = (data) => {
        const { updateChannel } = useAppStore.getState();
        const updatedChannel = {
          ...data.room,
          members: data.room.members,
        };
        updateChannel(updatedChannel);

        if (data.room.members.some((member) => member._id === userInfo.id)) {
          const { addChannel } = useAppStore.getState();
          addChannel(data.room);
        }

        toast.success(`New members joined the room`);
      };

      const handleRoomUpdated = (updatedRoom) => {
        const { updateChannel } = useAppStore.getState();
        updateChannel(updatedRoom);
        toast.success("Room has been updated");
      };

      const handleAddedToRoom = (room) => {
        const { addChannel } = useAppStore.getState();
        addChannel(room);
        toast.success("You have been added to a new room");
      };

      const handleRemovedFromRoom = (roomId) => {
        const { removeChannel } = useAppStore.getState();
        socket.current.emit("leave_room", roomId);
        removeChannel(roomId);
        toast.info("You have been removed from the room");
      };

      const handleUserLeftRoom = (data) => {
        const { updateChannel, removeChannel } = useAppStore.getState();

        if (data.userId === userInfo.id) {
          socket.current.emit("leave_room", data.roomId);
          removeChannel(data.roomId);
          toast.info("You have been removed from the room");
          return;
        }

        const updatedChannel = {
          ...data.room,
          members: data.room.members,
        };
        updateChannel(updatedChannel);

        toast.info(`A member has left the room`);
        console.log(`User left room: ${data.room._id}`);
      };

      const handleRoomError = (error) => {
        toast.error(error);
      };

      socket.current.on("connect", () => {
        console.log("Connected to socket server");
      });

      // Message handlers
      socket.current.on("newMessage", handleNewMessage);
      socket.current.on("messageSent", handleMessageSent);
      socket.current.on("messageDeleted", handleMessageDeleted);
      socket.current.on("messagePin", handleMessagePin);
      socket.current.on("pinnedMessages", handlePinnedMessages);
      socket.current.on("pinMessageError", (error) => toast.error(error.error));
      socket.current.on("roomUpdated", handleRoomUpdated);
      socket.current.on("addedToRoom", handleAddedToRoom);
      socket.current.on("removedFromRoom", handleRemovedFromRoom);

      // Room handlers
      socket.current.on("newRoom", handleNewRoom);
      socket.current.on("userJoinedRoom", handleUserJoinedRoom);
      socket.current.on("userLeftRoom", handleUserLeftRoom);
      socket.current.on("roomError", handleRoomError);

      return () => {
        socket.current.off("newMessage");
        socket.current.off("messageSent");
        socket.current.off("messageDeleted");
        socket.current.off("messagePin");
        socket.current.off("pinnedMessages");
        socket.current.off("pinMessageError");
        socket.current.off("newRoom");
        socket.current.off("userJoinedRoom");
        socket.current.off("userLeftRoom");
        socket.current.off("roomError");
        socket.current.off("roomUpdated");
        socket.current.off("addedToRoom");
        socket.current.off("removedFromRoom");
        socket.current.disconnect();
      };
    }
  }, [userInfo]);

  return (
    <SocketContext.Provider value={socket.current}>
      {children}
    </SocketContext.Provider>
  );
};
