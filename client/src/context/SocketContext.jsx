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

      const handleNewRoom = (room) => {
        const { addChannel } = useAppStore.getState();
        addChannel(room);
        console.log(`Received new room: ${room._id}`);
      };

      const handleJoinedRoom = (roomId) => {
        console.log(`Joined room: ${roomId}`);
      };

      const handleLeftRoom = (roomId) => {
        console.log(`Left room: ${roomId}`);
      };

      const handleRoomError = (error) => {
        toast.error(error);
      };

      socket.current.on("connect", () => {
        console.log("Connected to socket server");
      });

      // Existing message handlers
      socket.current.on("newMessage", handleNewMessage);
      socket.current.on("messageSent", handleMessageSent);

      // New room handlers
      socket.current.on("newRoom", handleNewRoom);
      socket.current.on("joinedRoom", handleJoinedRoom);
      socket.current.on("leftRoom", handleLeftRoom);
      socket.current.on("roomError", handleRoomError);

      return () => {
        socket.current.off("newMessage");
        socket.current.off("messageSent");
        socket.current.off("newRoom");
        socket.current.off("joinedRoom");
        socket.current.off("leftRoom");
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
