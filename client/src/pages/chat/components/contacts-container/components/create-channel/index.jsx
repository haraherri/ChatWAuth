import React, { useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { FaPlus, FaSpinner } from "react-icons/fa";
import { Input } from "@/components/ui/input";
import Lottie from "react-lottie";
import { apiClient } from "@/lib/api-client";
import {
  CREATE_CHANNEL_ROUTES,
  GET_ALL_CONTACTS_ROUTES,
  SEARCH_CONTACTS_ROUTES,
} from "@/utils/constants";
import { toast } from "sonner";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/button";
import MultipleSelector from "@/components/ui/multipleselect";
import { UserX } from "lucide-react";

const CreateChannel = () => {
  const { setSelectedChatType, setSelectedChatData, addChannel } =
    useAppStore();
  const [newChannelModal, setNewChannelModal] = useState(false);
  const [searchedContacts, setSearchedContacts] = useState([]);
  const [allContacts, setAllContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [channelName, setChannelName] = useState("");

  useEffect(() => {
    const getContacts = async () => {
      const response = await apiClient.get(GET_ALL_CONTACTS_ROUTES, {
        withCredentials: true,
      });
      const formattedContacts = response.data.contacts.map((contact) => ({
        value: contact.value,
        label: contact.label,
        email: contact.email,
        image: contact.image,
        lastLogin: contact.lastLogin,
        role: contact.role,
      }));
      setAllContacts(formattedContacts);
    };
    getContacts();
  }, []);

  const handleSearch = async (value) => {
    if (!value?.trim()) {
      setSearchedContacts(allContacts);
      return allContacts;
    }

    try {
      const response = await apiClient.post(
        SEARCH_CONTACTS_ROUTES,
        { searchTerm: value },
        { withCredentials: true }
      );

      const formattedContacts = response.data.contacts.map((contact) => ({
        value: contact._id,
        label:
          contact.firstName && contact.lastName
            ? `${contact.firstName} ${contact.lastName}`.trim()
            : contact.email,
        email: contact.email,
        image: contact.image,
      }));

      setSearchedContacts(formattedContacts);
      return formattedContacts;
    } catch (error) {
      console.error(error);
      setSearchedContacts(allContacts);
      return allContacts;
    }
  };
  const createChannel = async () => {
    try {
      if (channelName.length > 0 && selectedContacts.length > 0) {
        const response = await apiClient.post(
          CREATE_CHANNEL_ROUTES,
          {
            name: channelName,
            memberIds: selectedContacts.map((contact) => contact.value),
          },
          { withCredentials: true }
        );
        if (response.status === 201) {
          addChannel(response.data.rooms);
          setSelectedContacts([]);
          setChannelName("");
          setNewChannelModal(false);
        }
      }
    } catch (error) {
      console.log({ error });
    }
  };
  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <FaPlus
              onClick={() => setNewChannelModal(true)}
              className="text-opacity-90 text-neutral-400 font-light text-start hover:text-neutral-100 cursor-pointer transition-all duration-300"
            />
          </TooltipTrigger>
          <TooltipContent className="bg-[#1c1b1e] border-none mb-2 p-3 text-white">
            Create New Channel
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Dialog open={newChannelModal} onOpenChange={setNewChannelModal}>
        <DialogContent className="bg-[#181920] h-[400px] border-none w-[400px] flex text-white flex-col">
          <DialogHeader>
            <DialogTitle className="text-center">
              Please fill up the detailed for new group
            </DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <div>
            <Input
              placeholder="Channel Name"
              className="rounded-lg p-6 bg-[#2c2e3b] border-none"
              onChange={(e) => setChannelName(e.target.value)}
              value={channelName}
            />
          </div>
          <div>
            <MultipleSelector
              key={`selector-${selectedContacts.length}`}
              className="rounded-lg border-none py-2 text-white bg-[#2c2e3b] min-h-[100px] max-h-[150px] overflow-y-auto"
              defaultOptions={allContacts}
              onSearch={handleSearch}
              placeholder="Search Contacts"
              value={selectedContacts}
              onChange={setSelectedContacts}
              delay={300}
              commandProps={{
                className: "bg-[#2c2e3b] max-h-[200px] w-full",
              }}
              badgeClassName="bg-purple-600 hover:bg-purple-700 transition-colors inline-flex items-center"
              emptyIndicator={
                <div className="flex flex-col items-center justify-center w-full py-6 text-gray-400">
                  <div className="w-12 h-12 mb-4 rounded-full bg-gray-600 flex items-center justify-center">
                    <UserX className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-center">
                    No contacts found
                  </p>
                  <p className="text-xs opacity-70 text-center">
                    Try searching with a different term
                  </p>
                </div>
              }
              loadingIndicator={
                <div className="flex items-center justify-center py-4">
                  <FaSpinner className="w-6 h-6 text-purple-500" />
                </div>
              }
            />
          </div>
          <Button
            className="w-full bg-purple-700 hover:bg-purple-900 transition-all duration-300"
            onClick={createChannel}
          >
            Create Channel Chat
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreateChannel;
