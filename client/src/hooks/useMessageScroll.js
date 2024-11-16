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
      container.scrollTop = container.scrollHeight;
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 100);
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
    if (messages.length > 0 && isInitialLoad) {
      scrollToBottom();
      const timer = setTimeout(() => {
        scrollToBottom();
        setIsInitialLoad(false);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [messages, isInitialLoad]);

  useEffect(() => {
    if (!isInitialLoad && messages.length > previousMessageCount) {
      const latestMessage = messages[messages.length - 1];
      const isCurrentUserMessage = latestMessage?.sender === userInfo?.id;

      if (isCurrentUserMessage || shouldAutoScroll) {
        scrollToBottom("smooth");
        if (
          latestMessage?.messageType === "file" &&
          latestMessage?.fileUrl?.match(/\.(jpg|jpeg|png|gif)$/i)
        ) {
          setTimeout(() => {
            scrollToBottom("smooth");
          }, 200);
        }
      }
    }
    setPreviousMessageCount(messages.length);
  }, [messages, userInfo?.id, shouldAutoScroll, isInitialLoad]);

  useEffect(() => {
    setIsInitialLoad(true);
    setPreviousMessageCount(0);
  }, [messages[0]?._id]);

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
