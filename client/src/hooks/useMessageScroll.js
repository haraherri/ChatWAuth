import { useAppStore } from "@/store";
import { useEffect, useRef, useState } from "react";

export const useMessageScroll = (messages) => {
  const containerRef = useRef(null);
  const scrollRef = useRef(null);
  const { userInfo } = useAppStore();
  const [previousMessageCount, setPreviousMessageCount] = useState(0);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const scrollToBottom = (behavior = "auto") => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShouldAutoScroll(isNearBottom);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);

  useEffect(() => {
    if (messages.length > previousMessageCount) {
      const latestMessage = messages[messages.length - 1];
      const isCurrentUserMessage = latestMessage?.sender === userInfo?.id;
      if (isCurrentUserMessage || shouldAutoScroll) {
        scrollToBottom("smooth");
      }
    }
    setPreviousMessageCount(messages.length);
  }, [messages]);

  return {
    containerRef,
    scrollRef,
    scrollToBottom,
    shouldAutoScroll,
  };
};
