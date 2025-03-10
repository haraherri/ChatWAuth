import { useAppStore } from "@/store";
import React, { useEffect, useRef } from "react";
import { Avatar, AvatarImage } from "./ui/avatar";
import { getColor } from "@/lib/utils";
import moment from "moment";
import { useSocket } from "@/context/SocketContext";

const ContactList = ({ contacts, isChannel = false }) => {
  const {
    setSelectedChatType,
    selectedChatData,
    setSelectedChatData,
    userInfo,
    getUserStatus,
    updateUserStatus,
  } = useAppStore();

  const { socket } = useSocket();
  const previousContacts = useRef([]); // save previous contacts to compare with new contacts

  useEffect(() => {
    // when contacts change, emit getUserStatus for new contacts
    if (!isChannel && socket && contacts) {
      const newContacts = contacts.filter(
        (contact) =>
          !previousContacts.current.some(
            (prevContact) => prevContact._id === contact._id
          )
      );

      newContacts.forEach((contact) => {
        socket.emit("getUserStatus", contact._id);
      });
      previousContacts.current = contacts;
    }
  }, [contacts, isChannel, socket]);

  useEffect(() => {
    const handleUserStatusUpdate = (data) => {
      updateUserStatus(data.userId, data.isOnline, data.lastActive);
    };

    if (socket) {
      socket.on("userStatusUpdate", handleUserStatusUpdate);
    }

    return () => {
      if (socket) {
        socket.off("userStatusUpdate", handleUserStatusUpdate);
      }
    };
  }, [socket, updateUserStatus]); 

  const handleClick = (contact) => {
    if (isChannel) setSelectedChatType("channel");
    else setSelectedChatType("contact");
    if (!selectedChatData || selectedChatData._id !== contact._id) {
      setSelectedChatData(contact);
    }
  };

  const renderLastMessage = (contact) => {
    if (!contact.lastMessage || !contact.lastMessage.sender) return null;

    let messagePreview = "";
    const isCurrentUser = contact.lastMessage.sender?._id === userInfo.id;

    if (contact.lastMessage.deletedAt) {
      messagePreview = "Message was deleted";
    } else {
      switch (contact.lastMessage.messageType) {
        case "text":
          messagePreview = contact.lastMessage.content;
          break;
        case "image":
          messagePreview = "Sent an image";
          break;
        case "file":
          messagePreview = "Sent a file";
          break;
        default:
          messagePreview = "";
      }
    }
    return (
      <div className="flex flex-col text-sm">
        <div className="flex items-center gap-2 text-neutral-400 pr-3">
          {isChannel && !isCurrentUser && contact.lastMessage.sender && (
            <span className="font-medium text-neutral-300 max-w-[80px] truncate">
              {contact.lastMessage.sender.firstName}:
            </span>
          )}
          <span className="truncate flex-1">{messagePreview}</span>
          <span className="text-xs shrink-0 ml-1">
            • {moment(contact.lastMessage.createdAt).fromNow()}
          </span>
        </div>
      </div>
    );
  };
  return (
    <div className="mt-5">
      {contacts.map((contact) => (
        <div
          key={contact._id}
          className={`pl-10 py-3 transition-all duration-300 cursor-pointer ${
            selectedChatData && selectedChatData._id === contact._id
              ? "bg-[#8417ff] hover:bg-[#8417ff]"
              : "hover:bg-[#f1f1f111]"
          }`}
          onClick={() => handleClick(contact)}
        >
          <div className="flex gap-5 items-start">
            <div className="flex-shrink-0">
              {!isChannel ? (
                <Avatar
                  className="h-10 w-10 rounded-full overflow-hidden"
                  isOnline={getUserStatus(contact._id)?.isOnline}
                >
                  {contact.image ? (
                    <AvatarImage
                      src={contact.image}
                      alt="profile"
                      className="object-cover w-full h-full bg-black"
                    />
                  ) : (
                    <div
                      className={`
                      ${
                        selectedChatData && selectedChatData._id === contact._id
                          ? "bg-[#ffffff22] border border-white/50 text-white"
                          : getColor(contact.color)
                      }
                      h-10 w-10 uppercase text-lg border-[1px] flex items-center justify-center rounded-full`}
                    >
                      {contact.firstName
                        ? contact.firstName.split("").shift()
                        : contact.email.split("").shift()}
                    </div>
                  )}
                </Avatar>
              ) : (
                <div className="bg-[#ffffff22] h-10 w-10 flex items-center justify-center rounded-full">
                  #
                </div>
              )}
            </div>

            <div className="flex flex-col flex-grow min-w-0">
              <span className="text-neutral-300">
                {isChannel
                  ? contact.name
                  : `${contact.firstName} ${contact.lastName}`}
              </span>
              {renderLastMessage(contact)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ContactList;
