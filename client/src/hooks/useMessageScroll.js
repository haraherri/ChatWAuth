import { useAppStore } from "@/store";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

export const useMessageScroll = (messages) => {
  const containerRef = useRef(null);
  const scrollRef = useRef(null);
  const { userInfo } = useAppStore();
  const [previousMessageCount, setPreviousMessageCount] = useState(0);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const scrollToBottom = (behavior = "auto") => {
    if (containerRef.current) {
      const container = containerRef.current;
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
    }
  };

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShouldAutoScroll(isNearBottom);
    }
  };

  // Handle initial load
  useLayoutEffect(() => {
    if (messages.length > 0 && isInitialLoad) {
      scrollToBottom();
      setIsInitialLoad(false);
    }
  }, [messages, isInitialLoad]);

  // Handle new messages
  useEffect(() => {
    if (!isInitialLoad && messages.length > previousMessageCount) {
      const latestMessage = messages[messages.length - 1];
      const isCurrentUserMessage = latestMessage?.sender === userInfo?.id;

      if (
        latestMessage?.messageType === "file" &&
        latestMessage?.fileUrl?.match(/\.(jpg|jpeg|png|gif)$/i)
      ) {
        const img = new Image();
        img.onload = () => {
          if (isCurrentUserMessage || shouldAutoScroll) {
            scrollToBottom("smooth");
          }
        };
        img.src = latestMessage.fileUrl;
      } else {
        if (isCurrentUserMessage || shouldAutoScroll) {
          scrollToBottom("smooth");
        }
      }
    }
    setPreviousMessageCount(messages.length);
  }, [messages, userInfo?.id, shouldAutoScroll, isInitialLoad]);

  // Reset initial load state when changing chats
  useEffect(() => {
    setIsInitialLoad(true);
    setPreviousMessageCount(0);
  }, [messages[0]?._id]); // Reset when first message changes (indicates chat change)

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);

  return {
    containerRef,
    scrollRef,
    scrollToBottom,
    shouldAutoScroll,
  };
};
