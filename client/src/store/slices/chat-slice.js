export const createChatSlice = (set, get) => ({
  selectedChatType: undefined,
  selectedChatData: undefined,
  selectedChatMessages: [],
  directMessagesContacts: [],
  channels: [],
  pinnedMessages: [],
  setChannels: (channels) => set({ channels }),
  setPinnedMessages: (pinnedMessages) => set({ pinnedMessages }),
  setSelectedChatType: (selectedChatType) => set({ selectedChatType }),
  setSelectedChatData: (selectedChatData) => set({ selectedChatData }),
  setSelectedChatMessages: (selectedChatMessages) =>
    set({ selectedChatMessages }),
  setDirectMessagesContacts: (directMessagesContacts) =>
    set({ directMessagesContacts }),
  addChannel: (channel) => {
    const channels = get().channels;
    const channelExists = channels.some(
      (existingChannel) => existingChannel._id === channel._id
    );
    if (!channelExists) {
      set({ channels: [channel, ...channels] });
    }
  },
  updateChannel: (updatedChannel) => {
    const channels = get().channels.map((channel) =>
      channel._id === updatedChannel._id ? updatedChannel : channel
    );
    set({ channels });

    const selectedChatData = get().selectedChatData;
    if (selectedChatData?._id === updatedChannel._id) {
      set({ selectedChatData: updatedChannel });
    }
  },
  removeChannel: (channelId) => {
    const channels = get().channels.filter(
      (channel) => channel._id !== channelId
    );
    set({ channels });

    const selectedChatData = get().selectedChatData;
    if (selectedChatData?._id === channelId) {
      set({
        selectedChatData: undefined,
        selectedChatType: undefined,
        selectedChatMessages: [],
      });
    }
  },
  updateMessagePinStatus: (messageId, isPinned, pinnedBy, pinnedAt) => {
    const selectedChatMessages = get().selectedChatMessages.map((message) =>
      message._id === messageId
        ? { ...message, isPinned, pinnedBy, pinnedAt }
        : message
    );

    set({ selectedChatMessages });
  },
  closeChat: () =>
    set({
      selectedChatData: undefined,
      selectedChatType: undefined,
      selectedChatMessages: [],
    }),
  addMessage: (message) => {
    const selectedChatMessages = get().selectedChatMessages;
    const selectedChatType = get().selectedChatType;

    set({
      selectedChatMessages: [
        ...selectedChatMessages,
        {
          ...message,
          recipient:
            selectedChatType === "channel"
              ? message.recipient
              : message.recipient._id,
          sender:
            selectedChatType === "channel"
              ? message.sender
              : message.sender._id,
        },
      ],
    });
  },
  updateMessage: (messageId, updates) => {
    const selectedChatMessages = get().selectedChatMessages.map((message) =>
      message._id === messageId ? { ...message, ...updates } : message
    );

    set({ selectedChatMessages });
  },
});
