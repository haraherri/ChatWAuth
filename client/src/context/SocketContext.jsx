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
        const { selectedChatData, selectedChatType, addMessage } =
          useAppStore.getState();

        if (message.sender._id !== userInfo.id) {
          if (selectedChatType === "contact") {
            if (
              selectedChatData._id === message.sender._id ||
              selectedChatData._id === message.recipient._id
            ) {
              addMessage(message);
            }
          } else if (selectedChatType === "channel") {
            if (selectedChatData._id === message.room) {
              addMessage(message);
            }
          }
        }
      };

      const handleMessageSent = (response) => {
        if (response.status === "success") {
          const { selectedChatData, selectedChatType, addMessage } =
            useAppStore.getState();

          if (response.message.sender._id === userInfo.id) {
            if (selectedChatType === "contact") {
              if (selectedChatData._id === response.message.recipient._id) {
                addMessage(response.message);
              }
            } else if (selectedChatType === "channel") {
              if (selectedChatData._id === response.message.room) {
                addMessage(response.message);
              }
            }
          }
        } else {
          toast.error("Failed to send message");
        }
      };
      const handleMessageDeleted = (data) => {
        const { updateMessage } = useAppStore.getState();
        updateMessage(data.messageId, {
          deletedAt: data.deletedAt,
          deletedBy: data.deletedBy,
        });
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

      // Room handlers
      socket.current.on("newRoom", handleNewRoom);
      socket.current.on("userJoinedRoom", handleUserJoinedRoom);
      socket.current.on("userLeftRoom", handleUserLeftRoom);
      socket.current.on("roomError", handleRoomError);

      return () => {
        socket.current.off("newMessage");
        socket.current.off("messageSent");
        socket.current.off("messageDeleted");
        socket.current.off("newRoom");
        socket.current.off("userJoinedRoom");
        socket.current.off("userLeftRoom");
        socket.current.off("roomError");
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
