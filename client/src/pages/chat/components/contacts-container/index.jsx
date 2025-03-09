import React, { useEffect } from "react";
import ProfileInfo from "./components/profile-info";
import NewDM from "./components/new-dm";
import { apiClient } from "@/lib/api-client";
import {
  GET_DM_CONTACTS_ROUTES,
  GET_USER_CHANNEL_ROUTES,
} from "@/utils/constants";
import { useAppStore } from "@/store";
import ContactList from "@/components/contact-list";
import CreateChannel from "./components/create-channel";

const ContactsContainer = () => {
  const {
    directMessagesContacts,
    setDirectMessagesContacts,
    channels,
    setChannels,
    userInfo,
  } = useAppStore();
  const canManageChannels =
    userInfo?.role === "moderator" || userInfo?.role === "admin";

  useEffect(() => {
    const getContacts = async () => {
      const response = await apiClient.get(GET_DM_CONTACTS_ROUTES, {
        withCredentials: true,
      });
      if (response.data.contacts) {
        setDirectMessagesContacts(response.data.contacts);
      }
    };
    const getChannels = async () => {
      const response = await apiClient.get(GET_USER_CHANNEL_ROUTES, {
        withCredentials: true,
      });
      if (response.data.rooms) {
        setChannels(response.data.rooms);
      }
    };
    getContacts();
    getChannels();
  }, [setChannels, setDirectMessagesContacts]);

  return (
    <div className="relative md:w-[35vw] lg:w-[30vw] xl:w-[20vw] bg-[#1b1c24] border-r-2 border-[#2f303b] w-full">
      <div className="pt-3">
        <Logo />
      </div>
      <div className="my-5">
        <div className="flex items-center justify-between pr-10">
          <Title text="Direct Messages" />
          <NewDM />
        </div>
        <div className="max-h-[38vh] overflow-y-auto scrollbar-hidden">
          <ContactList contacts={directMessagesContacts} />
        </div>
      </div>
      <div className="my-5">
        <div className="flex items-center justify-between pr-10">
          <Title text="Channels" />
          {canManageChannels && <CreateChannel />}
        </div>
        <div className="max-h-[38vh] overflow-y-auto scrollbar-hidden">
          <ContactList contacts={channels} isChannel={true} />
        </div>
      </div>
      <ProfileInfo />
    </div>
  );
};

export default ContactsContainer;

const Logo = () => {
  return (
    <div className="flex p-5 justify-start items-center gap-3">
      <svg
        width="80"
        height="40"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="60" cy="60" r="50" fill="url(#gradOuter)" />
        <circle cx="60" cy="60" r="30" fill="url(#gradInner)" />
        <path
          d="M60 35L75 60L60 85L45 60L60 35Z"
          fill="white"
          stroke="#3A0CA3"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <line
          x1="60"
          y1="15"
          x2="60"
          y2="105"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeDasharray="5 5"
        />
        <defs>
          <linearGradient id="gradOuter" x1="0" y1="0" x2="120" y2="120">
            <stop
              offset="0%"
              style={{ stopColor: "#8338ec", stopOpacity: 1 }}
            />
            <stop
              offset="100%"
              style={{ stopColor: "#3A0CA3", stopOpacity: 1 }}
            />
          </linearGradient>
          <linearGradient id="gradInner" x1="30" y1="30" x2="90" y2="90">
            <stop
              offset="0%"
              style={{ stopColor: "#4361ee", stopOpacity: 1 }}
            />
            <stop
              offset="100%"
              style={{ stopColor: "#4cc9f0", stopOpacity: 1 }}
            />
          </linearGradient>
        </defs>
      </svg>
      <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-400">
        ChatWAuth
      </span>
    </div>
  );
};

const Title = ({ text }) => {
  return (
    <h6 className="uppercase tracking-widest text-neutral-400 pl-10 font-light text-opacity-90 text-sm">
      {" "}
      {text}{" "}
    </h6>
  );
};
