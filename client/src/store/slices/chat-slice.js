export const createChatSlice = (set, get) => ({
  selectedChatType: undefined,
  selectedChatData: undefined,
  selectedChatMessages: [],
  directMessagesContacts: [],
  channels: [],
  pinnedMessages: [],
  highlightedMessageId: null,
  setHighlightedMessageId: (messageId) =>
    set({ highlightedMessageId: messageId }),
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
  resetChat: () =>
    set({
      selectedChatType: undefined,
      selectedChatData: undefined,
      selectedChatMessages: [],
      directMessagesContacts: [],
      channels: [],
      pinnedMessages: [],
      highlightedMessageId: null,
    }),
  sortContactsByLastMessage: () => {
    const contacts = [...get().directMessagesContacts].sort((a, b) => {
      return (
        new Date(b.lastMessage?.createdAt || 0) -
        new Date(a.lastMessage?.createdAt || 0)
      );
    });
    set({ directMessagesContacts: contacts });
  },

  sortChannelsByLastMessage: () => {
    const channelList = [...get().channels].sort((a, b) => {
      return (
        new Date(b.lastMessage?.createdAt || 0) -
        new Date(a.lastMessage?.createdAt || 0)
      );
    });
    set({ channels: channelList });
  },

  updateLastMessage: (id, message, type) => {
    if (type === "contact") {
      const contacts = get().directMessagesContacts.map((contact) => {
        if (contact._id === id) {
          return { ...contact, lastMessage: message };
        }
        return contact;
      });
      set({ directMessagesContacts: contacts });
    } else if (type === "channel") {
      const channels = get().channels.map((channel) => {
        if (channel._id === id) {
          return { ...channel, lastMessage: message };
        }
        return channel;
      });
      set({ channels: channels });
    }
  },
});
