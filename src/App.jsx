import { useEffect, useRef, useState } from "react";
import "./App.css";
import { supabase } from "./supabase";
import Auth from "./components/Auth";
import MessageMenu from "./components/MessageMenu";
import UserProfile from "./components/UserProfile";
import { isMobile, isUserOnline, getReplyPreview } from "./utils/chatUtils";

const SITE_URL = "https://iriska-messenger.vercel.app";

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [myChats, setMyChats] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [showSidebar, setShowSidebar] = useState(() => !isMobile());
  const [replyTo, setReplyTo] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [forwardMessage, setForwardMessage] = useState(null);
  const [hiddenMessageIds, setHiddenMessageIds] = useState([]);
  const [hiddenChatIds, setHiddenChatIds] = useState([]);
  const [deletedChatIds, setDeletedChatIds] = useState([]);
  const [blockedUserIds, setBlockedUserIds] = useState([]);
  const [actionChat, setActionChat] = useState(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [isChatOptionsOpen, setIsChatOptionsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceLocked, setIsVoiceLocked] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voicePlayer, setVoicePlayer] = useState({ id: null, playing: false });
  const [circlePlayer, setCirclePlayer] = useState({ id: null, playing: false });
  const [isCircleRecorderOpen, setIsCircleRecorderOpen] = useState(false);
  const [isCircleRecording, setIsCircleRecording] = useState(false);
  const [circleSeconds, setCircleSeconds] = useState(0);
  const [circlePreviewUrl, setCirclePreviewUrl] = useState(null);
  const [circleBlob, setCircleBlob] = useState(null);
  const [circleFilter, setCircleFilter] = useState("smooth");
  const [isCircleLocked, setIsCircleLocked] = useState(false);
  const [circleRecordHint, setCircleRecordHint] = useState("");
    const [typingUser, setTypingUser] = useState(null);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [isChatSearchOpen, setIsChatSearchOpen] = useState(false);
  const [messageSearch, setMessageSearch] = useState("");
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [isBlockedUsersOpen, setIsBlockedUsersOpen] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("iriska_theme") || "dark");
  const [hideOnline, setHideOnline] = useState(() => localStorage.getItem("iriska_hide_online") === "1");
  const [notificationSound, setNotificationSound] = useState(() => localStorage.getItem("iriska_notification_sound") || "qweek");
  const [chatFontSize, setChatFontSize] = useState(() => localStorage.getItem("iriska_chat_font_size") || "normal");
  const [bubbleStyle, setBubbleStyle] = useState(() => localStorage.getItem("iriska_bubble_style") || "round");
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [isMyProfileOpen, setIsMyProfileOpen] = useState(false);
  const [chatWallpaper, setChatWallpaper] = useState(() => localStorage.getItem("iriska_chat_wallpaper") || "aurora");
  const [profileCover, setProfileCover] = useState(() => localStorage.getItem("iriska_profile_cover") || "aurora");
  const [profileDescription, setProfileDescription] = useState(() => localStorage.getItem("iriska_profile_description") || "");
  const [profileStatus, setProfileStatus] = useState(() => localStorage.getItem("iriska_profile_status") || "В сети");
  const [profileNickname, setProfileNickname] = useState(() => localStorage.getItem("iriska_profile_nickname") || "");
  const [profileHeaderImageUrl, setProfileHeaderImageUrl] = useState(() => localStorage.getItem("iriska_profile_header_image_url") || "");
  const [profileHeaderPreviewUrl, setProfileHeaderPreviewUrl] = useState("");
  const [chatHeaderImageUrl, setChatHeaderImageUrl] = useState(() => localStorage.getItem("iriska_chat_header_image_url") || "");
  const [chatHeaderPreviewUrl, setChatHeaderPreviewUrl] = useState("");
  const [privateChatBackgrounds, setPrivateChatBackgrounds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("iriska_private_chat_backgrounds") || "{}");
    } catch {
      return {};
    }
  });
  const [privateChatBackgroundPreviewUrl, setPrivateChatBackgroundPreviewUrl] = useState("");

  const [callState, setCallState] = useState({
    status: "idle",
    type: "audio",
    callId: null,
    chatId: null,
    peerUser: null,
    offer: null,
  });
  const [isCallMuted, setIsCallMuted] = useState(false);
  const [isCallCameraOff, setIsCallCameraOff] = useState(false);
  const [isCallSelfFullScreen, setIsCallSelfFullScreen] = useState(false);
  const [callFacingMode, setCallFacingMode] = useState("user");
  const [circleFacingMode, setCircleFacingMode] = useState("user");
  const [callAudioUnlocked, setCallAudioUnlocked] = useState(false);

  const [newPassword, setNewPassword] = useState("");

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesRef = useRef([]);
  const isAtBottomRef = useRef(true);
  const selectedChatRef = useRef(null);
  const selectedUserRef = useRef(null);
  const sessionRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const messageTapRef = useRef({ id: null, time: 0 });
  const chatLongPressTimerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const voiceChunksRef = useRef([]);
  const shouldSendVoiceRef = useRef(true);
  const recordingTouchStartYRef = useRef(null);
  const recordingMouseStartYRef = useRef(null);
  const recordingStartedAtRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const activeAudioRef = useRef(null);
  const activeCircleVideoRef = useRef(null);
  const circleVideoRef = useRef(null);
  const circleStreamRef = useRef(null);
  const circleRecorderRef = useRef(null);
  const circleChunksRef = useRef([]);
  const circleStartedAtRef = useRef(null);
  const circleTimerRef = useRef(null);
  const circleTouchStartRef = useRef({ x: 0, y: 0 });
  const circleMouseStartRef = useRef({ x: 0, y: 0 });
  const circleHoldTimerRef = useRef(null);
  const circleCancelRef = useRef(false);
  const circleLockedRef = useRef(false);
  const typingTimeoutRef = useRef(null);
  const lastTypingUpdateRef = useRef(0);
  const isRecordingRef = useRef(false);
  const isVoiceLockedRef = useRef(false);
  const hiddenChatIdsRef = useRef([]);
  const deletedChatIdsRef = useRef([]);
  const blockedUserIdsRef = useRef([]);
  const notificationAudioRef = useRef(null);
  const appTouchStartRef = useRef({ x: 0, y: 0 });
  const callStateRef = useRef(callState);
  const peerConnectionRef = useRef(null);
  const localCallStreamRef = useRef(null);
  const remoteCallStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const callLastTapRef = useRef(0);
  const circleLastTapRef = useRef(0);
  const processedCallSignalsRef = useRef(new Set());
  const callListenStartedAtRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    isAtBottomRef.current = isAtBottom;
  }, [isAtBottom]);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    isVoiceLockedRef.current = isVoiceLocked;
  }, [isVoiceLocked]);

  useEffect(() => {
    hiddenChatIdsRef.current = hiddenChatIds;
  }, [hiddenChatIds]);

  useEffect(() => {
    deletedChatIdsRef.current = deletedChatIds;
  }, [deletedChatIds]);

  useEffect(() => {
    blockedUserIdsRef.current = blockedUserIds;
  }, [blockedUserIds]);

  useEffect(() => {
    if (!session?.user?.id) {
      setHiddenMessageIds([]);
      setHiddenChatIds([]);
      setDeletedChatIds([]);
      setBlockedUserIds([]);
      return;
    }

    const savedHiddenMessages = localStorage.getItem(
      `iriska_hidden_messages_${session.user.id}`
    );
    const savedHiddenChats = localStorage.getItem(
      `iriska_hidden_chats_${session.user.id}`
    );
    const savedDeletedChats = localStorage.getItem(
      `iriska_deleted_chats_${session.user.id}`
    );
    const savedBlockedUsers = localStorage.getItem(
      `iriska_blocked_users_${session.user.id}`
    );

    setHiddenMessageIds(savedHiddenMessages ? JSON.parse(savedHiddenMessages) : []);
    setHiddenChatIds(savedHiddenChats ? JSON.parse(savedHiddenChats) : []);
    const parsedDeletedChats = savedDeletedChats ? JSON.parse(savedDeletedChats) : [];
    deletedChatIdsRef.current = parsedDeletedChats;
    setDeletedChatIds(parsedDeletedChats);
    const parsedBlockedUsers = savedBlockedUsers ? JSON.parse(savedBlockedUsers) : [];
    setBlockedUserIds(parsedBlockedUsers);
    loadBlockedUsers(parsedBlockedUsers);
  }, [session?.user?.id]);

  useEffect(() => {
    return () => {
      cleanupVoiceMouseListeners();
      cleanupCircleRecorder();
      cleanupCall(false);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.fontSize = chatFontSize;
    document.documentElement.dataset.bubbleStyle = bubbleStyle;
    localStorage.setItem("iriska_theme", theme);
    localStorage.setItem("iriska_chat_font_size", chatFontSize);
    localStorage.setItem("iriska_bubble_style", bubbleStyle);
    document.documentElement.dataset.wallpaper = chatWallpaper;
    document.documentElement.dataset.profileCover = profileCover;
    localStorage.setItem("iriska_chat_wallpaper", chatWallpaper);
    localStorage.setItem("iriska_profile_cover", profileCover);
  }, [theme, chatFontSize, bubbleStyle, chatWallpaper, profileCover]);

  useEffect(() => {
    localStorage.setItem("iriska_hide_online", hideOnline ? "1" : "0");

    const currentSession = sessionRef.current || session;
    if (!currentSession?.user?.id) return;

    if (hideOnline) {
      supabase
        .from("profiles")
        .update({ online_at: null })
        .eq("id", currentSession.user.id);
    } else {
      updateOnlineStatus();
    }
  }, [hideOnline]);

  useEffect(() => {
    localStorage.setItem("iriska_notification_sound", notificationSound);
  }, [notificationSound]);

  useEffect(() => {
    if (!profile) return;

    setProfileNickname(profile.username || "");
    setProfileDescription(profile.description || localStorage.getItem("iriska_profile_description") || "");
    setProfileStatus(profile.status || localStorage.getItem("iriska_profile_status") || "В сети");

    if (profile.profile_cover) {
      setProfileCover(profile.profile_cover);
    }

    if (profile.chat_wallpaper) {
      setChatWallpaper(profile.chat_wallpaper);
    }

    if (profile.profile_header_image_url) {
      setProfileHeaderImageUrl(profile.profile_header_image_url);
      setProfileHeaderPreviewUrl("");
    }

    if (profile.chat_header_image_url) {
      setChatHeaderImageUrl(profile.chat_header_image_url);
      setChatHeaderPreviewUrl("");
    }
  }, [profile?.id, profile?.profile_header_image_url, profile?.chat_header_image_url]);

  useEffect(() => {
    localStorage.setItem("iriska_profile_nickname", profileNickname);
    localStorage.setItem("iriska_profile_description", profileDescription);
    localStorage.setItem("iriska_profile_status", profileStatus);
    localStorage.setItem("iriska_profile_header_image_url", profileHeaderImageUrl || "");
    localStorage.setItem("iriska_chat_header_image_url", chatHeaderImageUrl || "");
  }, [profileNickname, profileDescription, profileStatus, profileHeaderImageUrl, chatHeaderImageUrl]);

  useEffect(() => {
    localStorage.setItem("iriska_private_chat_backgrounds", JSON.stringify(privateChatBackgrounds || {}));
  }, [privateChatBackgrounds]);

  useEffect(() => {
    function updateViewportHeight() {
      // ВАЖНО: не берём visualViewport.height, иначе iPhone при клавиатуре сжимает всё приложение.
      const roundedHeight = Math.max(420, Math.floor(window.innerHeight));
      document.documentElement.style.setProperty("--iriska-app-height", `${roundedHeight}px`);
    }

    updateViewportHeight();
    window.addEventListener("resize", updateViewportHeight);
    window.addEventListener("orientationchange", updateViewportHeight);

    return () => {
      window.removeEventListener("resize", updateViewportHeight);
      window.removeEventListener("orientationchange", updateViewportHeight);
    };
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.warn("SERVICE WORKER ERROR:", error);
      });
    }
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    notificationAudioRef.current = notificationAudioRef.current || null;
  }, [session?.user?.id]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) return;

    initUser();

    const onlineTimer = setInterval(updateOnlineStatus, 15000);

    const chatsRefreshTimer = setInterval(() => {
      loadMyChats();
    }, 5000);

    const messagesChannel = supabase
      .channel("global-messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        async (payload) => {
          const currentChat = selectedChatRef.current;
          const currentSession = sessionRef.current;

          const row = payload.new || payload.old;

          if (currentChat?.id === row?.chat_id) {
            if (payload.eventType === "UPDATE" && payload.new?.is_deleted) {
              setMessages((current) =>
                current.filter((msg) => msg.id !== payload.new.id)
              );
            } else if (payload.eventType === "INSERT") {
              setMessages((current) => {
                const exists = current.some((msg) => msg.id === payload.new.id);
                if (exists) return current;

                if (payload.new.sender_id !== currentSession?.user?.id) {
                  showIncomingNotification(payload.new);
                }

                if (
                  payload.new.sender_id !== currentSession?.user?.id &&
                  !isAtBottomRef.current
                ) {
                  setNewMessagesCount((count) => count + 1);
                }

                return [...current, payload.new];
              });
            } else {
              loadMessages(currentChat.id);
            }

            if (row.sender_id !== currentSession?.user?.id) {
              markChatAsRead(row.chat_id);
            }
          }

          await loadMyChats();
        }
      )
      .subscribe();

    const chatsChannel = supabase
      .channel("private-chats")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "private_chats" },
        async (payload) => {
          const currentChat = selectedChatRef.current;
          const currentSession = sessionRef.current;
          const updatedChat = payload.new;

          if (currentChat?.id && updatedChat?.id === currentChat.id) {
            const isOtherTyping =
              updatedChat.typing_user_id &&
              updatedChat.typing_user_id !== currentSession?.user?.id &&
              updatedChat.typing_at &&
              Date.now() - new Date(updatedChat.typing_at).getTime() < 6000;

            setTypingUser(isOtherTyping ? selectedUserRef.current : null);
          }

          await loadMyChats();
        }
      )
      .subscribe();

    const profilesChannel = supabase
      .channel("profiles-online")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        async (payload) => {
          const updatedUser = payload.new;
          const currentSession = sessionRef.current;
          const currentSelectedUser = selectedUserRef.current;

          if (updatedUser.id === currentSession?.user?.id) {
            setProfile(updatedUser);
          }

          if (updatedUser.id === currentSelectedUser?.id) {
            setSelectedUser(updatedUser);
          }

          setSearchResults((current) =>
            current.map((user) =>
              user.id === updatedUser.id ? updatedUser : user
            )
          );

          await loadMyChats();
        }
      )
      .subscribe();

    return () => {
      clearInterval(onlineTimer);
      clearInterval(chatsRefreshTimer);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(chatsChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [session?.user?.id]);

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom("smooth");
    }
  }, [messages, isAtBottom]);

  useEffect(() => {
    if (!selectedChat?.id) {
      setTypingUser(null);
      return;
    }

    refreshTypingStatus(selectedChat.id);

    const interval = setInterval(() => {
      loadMessages(selectedChat.id);
      refreshTypingStatus(selectedChat.id);
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedChat?.id]);


  useEffect(() => {
    const currentSession = sessionRef.current || session;

    if (!currentSession?.user?.id) return;

    callListenStartedAtRef.current = new Date(Date.now() - 45000).toISOString();

    const pollRecentCallSignals = async () => {
      const startedAt = callListenStartedAtRef.current;
      if (!startedAt) return;

      const { data, error } = await supabase
        .from("call_signals")
        .select("*")
        .eq("receiver_id", currentSession.user.id)
        .gt("created_at", startedAt)
        .order("created_at", { ascending: true })
        .limit(80);

      if (error) {
        console.warn("CALL SIGNAL POLL ERROR:", error);
        return;
      }

      (data || []).forEach((row) => {
        handleCallSignal(row);
      });
    };

    const callsChannel = supabase
      .channel(`call-signals-${currentSession.user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "call_signals",
          filter: `receiver_id=eq.${currentSession.user.id}`,
        },
        (payload) => {
          handleCallSignal(payload.new);
        }
      )
      .subscribe((status) => {
        console.log("CALL REALTIME STATUS:", status);
      });

    pollRecentCallSignals();
    const callsPollTimer = setInterval(pollRecentCallSignals, 1200);

    return () => {
      clearInterval(callsPollTimer);
      supabase.removeChannel(callsChannel);
    };
  }, [session?.user?.id]);

  async function initUser() {
    await createProfileIfMissing();
    await updateOnlineStatus();
    await loadMyChats();
  }

  function scrollToBottom(behavior = "smooth") {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }, 50);
  }

  function handleMessagesScroll(event) {
    const element = event.currentTarget;
    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;

    const nearBottom = distanceFromBottom < 120;
    setIsAtBottom(nearBottom);

    if (nearBottom) {
      setNewMessagesCount(0);
    }
  }

  function jumpToNewMessages() {
    setIsAtBottom(true);
    setNewMessagesCount(0);
    scrollToBottom("smooth");
  }


  function openMainMenu() {
    setShowSidebar(true);
  }

  function closeMainMenu() {
    if (isMobile()) setShowSidebar(false);
  }

  function handleAppTouchStart(event) {
    const touch = event.touches?.[0];
    if (!touch) return;
    appTouchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleAppTouchMove(event) {
    const touch = event.touches?.[0];
    if (!touch) return;
    const start = appTouchStartRef.current;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dy) > 70) return;

    // Открыть меню свайпом от левого края вправо.
    if (!showSidebar && start.x < 36 && dx > 70) {
      setShowSidebar(true);
      return;
    }

    // Закрыть меню свайпом влево.
    if (showSidebar && dx < -70) {
      closeMainMenu();
    }
  }

  function getReadKey(chatId) {
    return `iriska_read_${session?.user?.id}_${chatId}`;
  }

  async function markChatAsRead(chatId) {
    const currentSession = sessionRef.current || session;
    if (!currentSession?.user?.id || !chatId) return;

    const now = new Date().toISOString();
    localStorage.setItem(getReadKey(chatId), now);

    await supabase
      .from("messages")
      .update({ delivered_at: now, read_at: now })
      .eq("chat_id", chatId)
      .neq("sender_id", currentSession.user.id)
      .is("read_at", null);

    loadMyChats();
  }


  function getNotificationSenderName(message) {
    const currentChat = selectedChatRef.current;
    const currentSelectedUser = selectedUserRef.current;

    if (currentSelectedUser?.id === message?.sender_id) {
      return currentSelectedUser.username || "Ириска";
    }

    const chat = myChats.find((item) => item.otherUser?.id === message?.sender_id);
    return chat?.otherUser?.username || currentChat?.otherUser?.username || "Ириска";
  }

  function playNotificationSound(soundName = localStorage.getItem("iriska_notification_sound") || "qweek") {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const gain = audioContext.createGain();
      gain.connect(audioContext.destination);
      gain.gain.setValueAtTime(0.0001, audioContext.currentTime);

      const playTone = (frequency, startAt, duration, type = "sine", volume = 0.18) => {
        const oscillator = audioContext.createOscillator();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + startAt);
        oscillator.connect(gain);
        gain.gain.exponentialRampToValueAtTime(volume, audioContext.currentTime + startAt + 0.01);
        oscillator.start(audioContext.currentTime + startAt);
        oscillator.stop(audioContext.currentTime + startAt + duration);
      };

      if (soundName === "oi") {
        playTone(520, 0, 0.16, "triangle", 0.22);
        playTone(390, 0.18, 0.18, "triangle", 0.2);
      } else if (soundName === "glass") {
        [1200, 1600, 2100, 900].forEach((freq, index) => {
          playTone(freq, index * 0.045, 0.08, "square", 0.12);
        });
      } else if (soundName === "ding") {
        playTone(1320, 0, 0.12, "sine", 0.2);
        playTone(1760, 0.12, 0.18, "sine", 0.18);
      } else {
        playTone(880, 0, 0.09, "sine", 0.18);
        playTone(660, 0.1, 0.12, "sine", 0.16);
      }

      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.55);
      setTimeout(() => audioContext.close?.(), 800);
    } catch (error) {
      console.warn("NOTIFICATION SOUND ERROR:", error);
    }
  }

  function getNotificationBody(message) {
    if (message.message_type === "image") return "📷 Фото";
    if (message.message_type === "audio") return "🎤 Голосовое";
    if (message.message_type === "circle") return "🎥 Кружочек";
    if (message.message_type === "file") return `📄 ${message.file_name || "Файл"}`;
    return message.text || "Новое сообщение";
  }

  function showIncomingNotification(message) {
    try {
      const currentSession = sessionRef.current || session;
      if (!message || message.sender_id === currentSession?.user?.id) return;

      if (navigator.vibrate) {
        navigator.vibrate([90, 40, 90]);
      }

      playNotificationSound();

      if (!("Notification" in window)) return;
      if (Notification.permission !== "granted") return;

      const title = `Новое сообщение от ${getNotificationSenderName(message)}`;
      const body = getNotificationBody(message);
      const options = {
        body,
        icon: "/favicon.svg",
        badge: "/favicon.svg",
        tag: `iriska-${message.id || Date.now()}`,
        renotify: true,
        silent: false,
      };

      if ("serviceWorker" in navigator && navigator.serviceWorker?.ready) {
        navigator.serviceWorker.ready
          .then((registration) => {
            if (registration.showNotification) {
              registration.showNotification(title, options);
            } else {
              new Notification(title, options);
            }
          })
          .catch(() => new Notification(title, options));
      } else {
        new Notification(title, options);
      }
    } catch (error) {
      console.warn("NOTIFICATION ERROR:", error);
    }
  }


  async function loadBlockedUsers(ids = blockedUserIdsRef.current) {
    if (!ids || ids.length === 0) {
      setBlockedUsers([]);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .in("id", ids);

    if (error) {
      console.error("LOAD BLOCKED USERS ERROR:", error);
      return;
    }

    setBlockedUsers(data || []);
  }

  function unblockUser(userId) {
    const nextBlockedUserIds = blockedUserIds.filter((id) => id !== userId);
    saveBlockedUsers(nextBlockedUserIds);
    setBlockedUsers((current) => current.filter((user) => user.id !== userId));
    loadMyChats();
  }


  async function refreshTypingStatus(chatId) {
    const currentSession = sessionRef.current || session;
    const currentSelectedUser = selectedUserRef.current;

    if (!chatId || !currentSession?.user?.id || !currentSelectedUser?.id) {
      setTypingUser(null);
      return;
    }

    const { data, error } = await supabase
      .from("private_chats")
      .select("typing_user_id, typing_at")
      .eq("id", chatId)
      .maybeSingle();

    if (error) {
      console.error("REFRESH TYPING ERROR:", error);
      return;
    }

    const typingIsFresh =
      data?.typing_user_id &&
      data.typing_user_id !== currentSession.user.id &&
      data.typing_at &&
      Date.now() - new Date(data.typing_at).getTime() < 6000;

    setTypingUser(typingIsFresh ? currentSelectedUser : null);
  }

  async function updateTypingStatus(isTyping) {
    const currentSession = sessionRef.current || session;
    const currentChat = selectedChatRef.current;

    if (!currentSession?.user?.id || !currentChat?.id) return;

    await supabase
      .from("private_chats")
      .update({
        typing_user_id: isTyping ? currentSession.user.id : null,
        typing_at: isTyping ? new Date().toISOString() : null,
      })
      .eq("id", currentChat.id);
  }

  function handleTextChange(event) {
    const value = event.target.value;
    setText(value);

    if (!selectedChatRef.current?.id || !sessionRef.current?.user?.id) return;

    const now = Date.now();

    if (value.trim() && now - lastTypingUpdateRef.current > 1500) {
      lastTypingUpdateRef.current = now;
      updateTypingStatus(true);
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(false);
    }, 2500);
  }


  async function requestMobileNotifications() {
    if (!("Notification" in window)) {
      alert("Этот браузер не поддерживает уведомления. На iPhone нужны Safari, iOS 16.4+ и установка Ириски на экран Домой.");
      return;
    }

    try {
      if ("serviceWorker" in navigator) {
        await navigator.serviceWorker.register("/sw.js");
      }

      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        localStorage.setItem("iriska_notifications_enabled", "1");
        playNotificationSound();
        navigator.vibrate?.([80, 40, 80]);

        const title = "Ириска";
        const body = "Уведомления включены";

        if ("serviceWorker" in navigator && navigator.serviceWorker?.ready) {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification(title, {
            body,
            icon: "/favicon.svg",
            badge: "/favicon.svg",
            tag: "iriska-test-notification",
            renotify: true,
            silent: false,
          });
        } else {
          new Notification(title, { body, icon: "/favicon.svg" });
        }

        alert("Уведомления включены. Важно: если телефон полностью заблокирован, настоящие push-уведомления требуют отдельного push-сервера. Сейчас уведомления приходят, когда сайт/PWA активен или висит в фоне.");
      } else {
        alert("Уведомления не включены. Проверь разрешения сайта в настройках браузера.");
      }
    } catch (error) {
      console.error("NOTIFICATION PERMISSION ERROR:", error);
      alert("Не удалось включить уведомления. На iPhone открой сайт в Safari, добавь на экран Домой и разреши уведомления в настройках.");
    }
  }


  function toggleTheme() {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  function restoreHiddenChats() {
    const currentSession = sessionRef.current || session;
    if (!currentSession?.user?.id) return;

    const ok = confirm("Вернуть скрытые/удалённые у себя чаты?");
    if (!ok) return;

    localStorage.removeItem(`iriska_hidden_chats_${currentSession.user.id}`);
    hiddenChatIdsRef.current = [];
    setHiddenChatIds([]);
    loadMyChats();
  }

  function getFileDownloadUrl(message) {
    if (!message?.file_url) return "#";
    const fileName = encodeURIComponent(message.file_name || "file");
    const separator = message.file_url.includes("?") ? "&" : "?";
    return `${message.file_url}${separator}download=${fileName}`;
  }

  function openFileMessage(event, message) {
    event.stopPropagation();
    if (!message?.file_url) return;

    const url = getFileDownloadUrl(message);
    const opened = window.open(url, "_blank", "noopener,noreferrer");

    if (!opened) {
      window.location.href = url;
    }
  }

  async function updateOnlineStatus() {
    const currentSession = sessionRef.current || session;
    if (!currentSession?.user?.id) return;

    if (localStorage.getItem("iriska_hide_online") === "1") {
      await supabase
        .from("profiles")
        .update({ online_at: null })
        .eq("id", currentSession.user.id);
      return;
    }

    await supabase
      .from("profiles")
      .update({ online_at: new Date().toISOString() })
      .eq("id", currentSession.user.id);
  }

  async function register() {
    if (!username.trim() || !email.trim() || !password.trim()) {
      setAuthMessage("Заполни логин, email и пароль");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: SITE_URL,
        data: { username: username.trim() },
      },
    });

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    setAuthMessage("Аккаунт создан. Проверь почту и подтверди регистрацию.");
    setMode("login");
  }

  async function login() {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    setAuthMessage("");
  }

  async function createProfileIfMissing() {
    const user = session.user;

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (existingProfile) {
      setProfile(existingProfile);
      return;
    }

    const name = user.user_metadata?.username || user.email.split("@")[0];

    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        username: name,
        online_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("PROFILE CREATE ERROR:", error);
      return;
    }

    setProfile(data);
  }

  async function loadMyChats() {
    const currentSession = sessionRef.current || session;
    if (!currentSession?.user?.id) return;

    const { data, error } = await supabase
      .from("private_chats")
      .select("*")
      .or(`user_one.eq.${currentSession.user.id},user_two.eq.${currentSession.user.id}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("LOAD CHATS ERROR:", error);
      return;
    }

    const chats = await Promise.all(
      (data || []).map(async (chat) => {
        const otherId =
          chat.user_one === currentSession.user.id ? chat.user_two : chat.user_one;

        const { data: otherUser } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", otherId)
          .maybeSingle();

        const { data: lastMessages } = await supabase
          .from("messages")
          .select("*")
          .eq("chat_id", chat.id)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })
          .limit(50);

        const savedHiddenMessages = localStorage.getItem(
          `iriska_hidden_messages_${currentSession.user.id}`
        );
        const hiddenIds = savedHiddenMessages ? JSON.parse(savedHiddenMessages) : [];
        const visibleLastMessage =
          (lastMessages || []).find((msg) => !hiddenIds.includes(msg.id)) || null;

        const lastRead = localStorage.getItem(
          `iriska_read_${currentSession.user.id}_${chat.id}`
        );

        const { data: unreadMessages } = await supabase
          .from("messages")
          .select("*")
          .eq("chat_id", chat.id)
          .eq("is_deleted", false)
          .neq("sender_id", currentSession.user.id);

        const unreadCount = (unreadMessages || []).filter((msg) => {
          if (hiddenIds.includes(msg.id)) return false;
          if (!lastRead) return true;
          return new Date(msg.created_at) > new Date(lastRead);
        }).length;

        return {
          ...chat,
          otherUser,
          lastMessage: visibleLastMessage,
          unreadCount: selectedChatRef.current?.id === chat.id ? 0 : unreadCount,
        };
      })
    );

    const visibleChats = chats.filter((chat) => {
      if (deletedChatIdsRef.current.includes(chat.id)) return false;
      if (hiddenChatIdsRef.current.includes(chat.id)) return false;
      if (chat.otherUser?.id && blockedUserIdsRef.current.includes(chat.otherUser.id)) return false;
      return true;
    });

    const deliverableChatIds = visibleChats.map((chat) => chat.id);

    if (deliverableChatIds.length > 0) {
      await supabase
        .from("messages")
        .update({ delivered_at: new Date().toISOString() })
        .in("chat_id", deliverableChatIds)
        .neq("sender_id", currentSession.user.id)
        .is("delivered_at", null);
    }

    setMyChats(visibleChats);

    const currentSelected = selectedChatRef.current;
    if (currentSelected?.id) {
      const updated = visibleChats.find((chat) => chat.id === currentSelected.id);
      if (updated) {
        setSelectedChat(updated);
        setSelectedUser(updated.otherUser);
      }
    }
  }

  async function searchUsers(value) {
    setSearch(value);

    if (!value.trim()) {
      setSearchResults([]);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .ilike("username", `%${value.trim()}%`)
      .neq("id", session.user.id)
      .limit(20);

    if (error) {
      console.error("SEARCH ERROR:", error);
      return;
    }

    setSearchResults((data || []).filter((user) => !blockedUserIdsRef.current.includes(user.id)));
  }

  async function openChatWithUser(user) {
    if (blockedUserIdsRef.current.includes(user.id)) {
      alert("Пользователь заблокирован. Сначала разблокируй его в настройках.");
      return;
    }

    const ids = [session.user.id, user.id].sort();
    const user_one = ids[0];
    const user_two = ids[1];

    const { data: existingChat, error: findError } = await supabase
      .from("private_chats")
      .select("*")
      .eq("user_one", user_one)
      .eq("user_two", user_two)
      .maybeSingle();

    if (findError) {
      console.error("FIND CHAT ERROR:", findError);
      return;
    }

    let chat = existingChat;

    if (!chat) {
      const { data: newChat, error: createError } = await supabase
        .from("private_chats")
        .insert({ user_one, user_two })
        .select()
        .single();

      if (createError) {
        console.error("CREATE CHAT ERROR:", createError);
        return;
      }

      chat = newChat;
    }

    const fullChat = { ...chat, otherUser: user };

    setSelectedChat(fullChat);
    setSelectedUser(user);
    setMessages([]);
    setReplyTo(null);
    setIsAtBottom(true);
    setNewMessagesCount(0);
    setIsChatOptionsOpen(false);
    setSearch("");
    setSearchResults([]);

    await loadMessages(chat.id);
    await refreshTypingStatus(chat.id);
    markChatAsRead(chat.id);
    await loadMyChats();

    if (isMobile()) setShowSidebar(false);
  }

  async function openExistingChat(chat) {
    setSelectedChat(chat);
    setSelectedUser(chat.otherUser);
    setMessages([]);
    setReplyTo(null);
    setIsAtBottom(true);
    setNewMessagesCount(0);
    setIsChatOptionsOpen(false);

    await loadMessages(chat.id);
    await refreshTypingStatus(chat.id);
    markChatAsRead(chat.id);

    if (isMobile()) setShowSidebar(false);
  }

  async function loadMessages(chatId) {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("LOAD MESSAGES ERROR:", error);
      return;
    }

    const saved = localStorage.getItem(`iriska_hidden_messages_${sessionRef.current?.user?.id}`);
    const hiddenIds = saved ? JSON.parse(saved) : [];
    const visibleMessages = (data || []).filter((msg) => !hiddenIds.includes(msg.id));

    const previousMessages = messagesRef.current || [];
    const previousLastId = previousMessages[previousMessages.length - 1]?.id;
    const nextLastId = visibleMessages[visibleMessages.length - 1]?.id;
    const hasNewMessage =
      previousMessages.length > 0 &&
      visibleMessages.length > previousMessages.length &&
      previousLastId !== nextLastId;

    setMessages(visibleMessages);
    setPinnedMessages(visibleMessages.filter((msg) => msg.is_pinned));

    const currentSession = sessionRef.current || session;
    if (selectedChatRef.current?.id === chatId && currentSession?.user?.id) {
      const now = new Date().toISOString();
      localStorage.setItem(`iriska_read_${currentSession.user.id}_${chatId}`, now);
      supabase
        .from("messages")
        .update({ delivered_at: now, read_at: now })
        .eq("chat_id", chatId)
        .neq("sender_id", currentSession.user.id)
        .is("read_at", null)
        .then(() => loadMyChats());
    }

    if (hasNewMessage && !isAtBottomRef.current) {
      setNewMessagesCount((count) => count + 1);
    }
  }


  function saveHiddenChats(nextHiddenChatIds) {
    const currentSession = sessionRef.current || session;
    if (!currentSession?.user?.id) return;

    localStorage.setItem(
      `iriska_hidden_chats_${currentSession.user.id}`,
      JSON.stringify(nextHiddenChatIds)
    );
    hiddenChatIdsRef.current = nextHiddenChatIds;
    setHiddenChatIds(nextHiddenChatIds);
  }

  function saveDeletedChats(nextDeletedChatIds) {
    const currentSession = sessionRef.current || session;
    if (!currentSession?.user?.id) return;

    localStorage.setItem(
      `iriska_deleted_chats_${currentSession.user.id}`,
      JSON.stringify(nextDeletedChatIds)
    );
    deletedChatIdsRef.current = nextDeletedChatIds;
    setDeletedChatIds(nextDeletedChatIds);
  }

  function saveBlockedUsers(nextBlockedUserIds) {
    const currentSession = sessionRef.current || session;
    if (!currentSession?.user?.id) return;

    localStorage.setItem(
      `iriska_blocked_users_${currentSession.user.id}`,
      JSON.stringify(nextBlockedUserIds)
    );
    blockedUserIdsRef.current = nextBlockedUserIds;
    setBlockedUserIds(nextBlockedUserIds);
    loadBlockedUsers(nextBlockedUserIds);
  }

  function openChatMenu(chat) {
    if (!chat) return;
    setActionChat(chat);
  }

  function closeChatMenu() {
    setActionChat(null);
  }

  function handleChatTouchStart(chat) {
    clearTimeout(chatLongPressTimerRef.current);
    chatLongPressTimerRef.current = setTimeout(() => {
      openChatMenu(chat);
    }, 520);
  }

  function handleChatTouchEnd() {
    clearTimeout(chatLongPressTimerRef.current);
  }

  function handleChatContextMenu(event, chat) {
    event.preventDefault();
    openChatMenu(chat);
  }

  async function deleteChatForMe(chat) {
    if (!chat?.id) return;

    const ok = confirm("Удалить чат у себя? Он больше не будет возвращаться после обновления.");
    if (!ok) return;

    const nextDeletedChatIds = Array.from(
      new Set([...(deletedChatIdsRef.current || []), chat.id])
    );
    saveDeletedChats(nextDeletedChatIds);

    // На всякий случай убираем этот чат и из старого списка скрытых чатов.
    const nextHiddenChatIds = (hiddenChatIdsRef.current || []).filter((id) => id !== chat.id);
    saveHiddenChats(nextHiddenChatIds);

    setMyChats((current) => current.filter((item) => item.id !== chat.id));

    if (selectedChatRef.current?.id === chat.id) {
      setSelectedChat(null);
      setSelectedUser(null);
      setMessages([]);
      setReplyTo(null);
      setPinnedMessages([]);
      setIsChatSearchOpen(false);
      setMessageSearch("");
      setIsChatOptionsOpen(false);
      setShowSidebar(true);
    }

    closeChatMenu();
    setIsChatOptionsOpen(false);
  }

  async function clearChatHistoryForMe(chat) {
    if (!chat?.id) return;

    const ok = confirm("Очистить историю этого чата у себя?");
    if (!ok) return;

    const currentSession = sessionRef.current || session;
    if (!currentSession?.user?.id) return;

    const { data, error } = await supabase
      .from("messages")
      .select("id")
      .eq("chat_id", chat.id)
      .eq("is_deleted", false);

    if (error) {
      console.error("CLEAR CHAT HISTORY ERROR:", error);
      alert("Не удалось очистить историю");
      return;
    }

    const storageKey = `iriska_hidden_messages_${currentSession.user.id}`;
    const saved = localStorage.getItem(storageKey);
    const currentHiddenIds = saved ? JSON.parse(saved) : [];
    const messageIds = (data || []).map((message) => message.id);
    const nextHiddenIds = Array.from(new Set([...currentHiddenIds, ...messageIds]));

    localStorage.setItem(storageKey, JSON.stringify(nextHiddenIds));
    setHiddenMessageIds(nextHiddenIds);

    if (selectedChat?.id === chat.id) {
      setMessages([]);
      setReplyTo(null);
    }

    // Не перезагружаем список сразу из Supabase, чтобы удалённый чат не мигал и не возвращался на экран.
    closeChatMenu();
    setIsChatOptionsOpen(false);
  }

  async function clearChatHistoryForAll(chat) {
    if (!chat?.id) return;

    const ok = confirm("Очистить историю этого чата у всех?");
    if (!ok) return;

    const { error } = await supabase
      .from("messages")
      .update({
        is_deleted: true,
        text: "",
        image_url: null,
        audio_url: null,
      })
      .eq("chat_id", chat.id);

    if (error) {
      console.error("CLEAR CHAT HISTORY FOR ALL ERROR:", error);
      alert("Не удалось очистить историю у всех. Проверь RLS-политику update для messages.");
      return;
    }

    if (selectedChat?.id === chat.id) {
      setMessages([]);
      setReplyTo(null);
    }

    await loadMyChats();
    closeChatMenu();
    setIsChatOptionsOpen(false);
  }

  async function blockUserFromChat(chat) {
    const otherUserId = chat?.otherUser?.id;
    if (!otherUserId) return;

    const ok = confirm(`Заблокировать ${chat.otherUser?.username || "пользователя"}?`);
    if (!ok) return;

    const nextBlockedUserIds = Array.from(new Set([...blockedUserIds, otherUserId]));
    saveBlockedUsers(nextBlockedUserIds);

    if (chat.id) {
      const nextDeletedChatIds = Array.from(new Set([...(deletedChatIdsRef.current || []), chat.id]));
      saveDeletedChats(nextDeletedChatIds);
    }

    setMyChats((current) => current.filter((item) => item.otherUser?.id !== otherUserId));
    setSearchResults((current) => current.filter((user) => user.id !== otherUserId));

    if (selectedUser?.id === otherUserId) {
      setSelectedChat(null);
      setSelectedUser(null);
      setMessages([]);
      setReplyTo(null);
      if (isMobile()) setShowSidebar(true);
    }

    closeChatMenu();
    setIsChatOptionsOpen(false);
  }

  function startReply(message) {
    if (message.is_deleted) return;
    setReplyTo({
      id: message.id,
      sender_id: message.sender_id,
      text: message.text || "",
      image_url: message.image_url || null,
      message_type: message.message_type || "text",
    });
  }

  function openMessageMenu(message) {
    if (!message || message.pending || message.is_deleted) return;
    setActionMessage(message);
  }

  function closeMessageMenu() {
    setActionMessage(null);
  }

  function getMyReaction(message) {
    const currentSession = sessionRef.current || session;
    if (!message?.reactions || !currentSession?.user?.id) return null;
    return message.reactions[currentSession.user.id] || null;
  }

  function getActiveChatBackgroundImage() {
    if (selectedChat?.id && privateChatBackgrounds?.[selectedChat.id]) {
      return privateChatBackgrounds[selectedChat.id];
    }

    return profile?.chat_header_image_url || chatHeaderImageUrl || "";
  }

  function getVisibleProfileHeaderImage() {
    return profileHeaderPreviewUrl || profileHeaderImageUrl || profile?.profile_header_image_url || "";
  }

  function getVisibleChatHeaderImage() {
    return privateChatBackgroundPreviewUrl || chatHeaderPreviewUrl || getActiveChatBackgroundImage();
  }

  function handleMessageTap(message) {
    if (!message || message.pending || message.is_deleted) return;

    const now = Date.now();
    const previous = messageTapRef.current;

    if (previous.id === message.id && now - previous.time < 320) {
      clearTimeout(longPressTimerRef.current);
      messageTapRef.current = { id: null, time: 0 };
      openMessageMenu(message);
      return;
    }

    messageTapRef.current = { id: message.id, time: now };
  }

  function handleMessageTouchStart(message) {
    clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      openMessageMenu(message);
    }, 520);
  }

  function handleMessageTouchEnd() {
    clearTimeout(longPressTimerRef.current);
  }

  function handleMessageContextMenu(event, message) {
    event.preventDefault();
    openMessageMenu(message);
  }

  function replyFromMenu() {
    if (!actionMessage) return;
    startReply(actionMessage);
    closeMessageMenu();
  }

  function deleteMessageForMe(messageId) {
    const currentSession = sessionRef.current || session;
    if (!currentSession?.user?.id) return;

    const storageKey = `iriska_hidden_messages_${currentSession.user.id}`;
    const saved = localStorage.getItem(storageKey);
    const currentHiddenIds = saved ? JSON.parse(saved) : [];

    const nextHiddenIds = Array.from(new Set([...currentHiddenIds, messageId]));

    localStorage.setItem(storageKey, JSON.stringify(nextHiddenIds));
    setHiddenMessageIds(nextHiddenIds);
    setMessages((current) => current.filter((msg) => msg.id !== messageId));
    setPinnedMessages((current) => current.filter((msg) => msg.id !== messageId));
    closeMessageMenu();
    loadMyChats();
  }

  function startForwardFromMenu() {
    if (!actionMessage) return;
    setForwardMessage(actionMessage);
    closeMessageMenu();
  }

  async function forwardToChat(chat) {
    if (!forwardMessage || !chat?.id || !session?.user?.id) return;

    const isImage = forwardMessage.message_type === "image" && forwardMessage.image_url;
    const isAudio = forwardMessage.message_type === "audio" && forwardMessage.audio_url;
    const isFile = forwardMessage.message_type === "file" && forwardMessage.file_url;
    const forwardedText =
      isImage || isAudio || isFile
        ? ""
        : `↪ Переслано\n${forwardMessage.text || "сообщение"}`;

    const { error } = await supabase
      .from("messages")
      .insert({
        sender_id: session.user.id,
        chat_id: chat.id,
        text: forwardedText,
        image_url: isImage ? forwardMessage.image_url : null,
        audio_url: isAudio ? forwardMessage.audio_url : null,
        file_url: isFile ? forwardMessage.file_url : null,
        file_name: isFile ? forwardMessage.file_name : null,
        file_size: isFile ? forwardMessage.file_size : null,
        file_type: isFile ? forwardMessage.file_type : null,
        message_type: isImage ? "image" : isAudio ? "audio" : isFile ? "file" : "text",
        reactions: {},
        is_deleted: false,
      });

    if (error) {
      console.error("FORWARD MESSAGE ERROR:", error);
      alert("Не удалось переслать сообщение");
      return;
    }

    setForwardMessage(null);
    await loadMyChats();

    if (selectedChat?.id === chat.id) {
      await loadMessages(chat.id);
    }

    alert("Сообщение переслано");
  }

  async function deleteMessage(messageId) {
    const ok = confirm("Удалить сообщение у всех?");
    if (!ok) return;

    const currentChatId = selectedChatRef.current?.id;
    const previousMessages = messagesRef.current;

    // Сначала убираем с экрана сразу, без ожидания Supabase.
    setMessages((current) => current.filter((msg) => msg.id !== messageId));
    setPinnedMessages((current) => current.filter((msg) => msg.id !== messageId));
    closeMessageMenu();

    if (replyTo?.id === messageId) {
      setReplyTo(null);
    }

    const { error } = await supabase
      .from("messages")
      .update({
        is_deleted: true,
        text: "",
        image_url: null,
        audio_url: null,
        file_url: null,
      })
      .eq("id", messageId)
      .eq("sender_id", session.user.id);

    if (error) {
      console.error("DELETE MESSAGE ERROR:", error);
      alert("Не удалось удалить сообщение");
      setMessages(previousMessages);
      return;
    }

    if (currentChatId) {
      loadMyChats();
    }
  }

  function startEditMessage(message) {
    if (!message || message.sender_id !== session?.user?.id) return;

    setEditingMessage(message);
    setText(message.text || "");
    closeMessageMenu();
  }

  async function saveEditedMessage() {
    if (!editingMessage?.id) return;

    if (editingMessage.message_type === "text" && !text.trim()) return;

    const nextText = text.trim();
    const editedAt = new Date().toISOString();

    setMessages((current) =>
      current.map((msg) =>
        msg.id === editingMessage.id
          ? { ...msg, text: nextText, edited_at: editedAt }
          : msg
      )
    );

    const { error } = await supabase
      .from("messages")
      .update({ text: nextText, edited_at: editedAt })
      .eq("id", editingMessage.id)
      .eq("sender_id", session.user.id);

    if (error) {
      console.error("EDIT MESSAGE ERROR:", error);
      alert("Не удалось изменить сообщение");
      if (selectedChat?.id) await loadMessages(selectedChat.id);
      return;
    }

    setText("");
    setEditingMessage(null);
    await loadMyChats();
  }

  async function pokeSelectedUser() {
    if (!selectedChat?.id || !selectedUser?.id || !session?.user?.id) return;

    if (selectedUser?.id && blockedUserIdsRef.current.includes(selectedUser.id)) {
      alert("Пользователь заблокирован. Ткнуть не получится.");
      return;
    }

    const pokeText = `👆 ${profile?.username || "Пользователь"} ткнул тебя`;

    const { error } = await supabase
      .from("messages")
      .insert({
        sender_id: session.user.id,
        chat_id: selectedChat.id,
        text: pokeText,
        image_url: null,
        audio_url: null,
        file_url: null,
        message_type: "text",
        reactions: {},
        is_deleted: false,
      });

    if (error) {
      console.error("POKE ERROR:", error);
      alert("Не удалось ткнуть пользователя");
      return;
    }

    playNotificationSound("ding");
    await loadMessages(selectedChat.id);
    await loadMyChats();
  }

  async function sendMessage() {
    updateTypingStatus(false);

    if (editingMessage) {
      await saveEditedMessage();
      return;
    }
    if (!text.trim() || !selectedChat?.id) return;

    if (selectedUser?.id && blockedUserIdsRef.current.includes(selectedUser.id)) {
      alert("Пользователь заблокирован. Сообщение не отправлено.");
      return;
    }

    const messageText = text.trim();
    const tempId = crypto.randomUUID();

    const localMessage = {
      id: tempId,
      sender_id: session.user.id,
      chat_id: selectedChat.id,
      text: messageText,
      image_url: null,
      message_type: "text",
      reply_to_id: replyTo?.id || null,
      reply_text: replyTo ? getReplyPreview(replyTo) : null,
      reply_image_url: replyTo?.image_url || null,
      reply_sender_id: replyTo?.sender_id || null,
      created_at: new Date().toISOString(),
      pending: true,
      is_deleted: false,
    };

    setMessages((current) => [...current, localMessage]);
    setText("");
    setReplyTo(null);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: session.user.id,
        chat_id: selectedChat.id,
        text: messageText,
        image_url: null,
        message_type: "text",
        reply_to_id: localMessage.reply_to_id,
        reply_text: localMessage.reply_text,
        reply_image_url: localMessage.reply_image_url,
        reply_sender_id: localMessage.reply_sender_id,
        is_deleted: false,
      })
      .select()
      .single();

    if (error) {
      console.error("SEND MESSAGE ERROR:", error);
      setMessages((current) => current.filter((msg) => msg.id !== tempId));
      return;
    }

    setMessages((current) =>
      current.map((msg) => (msg.id === tempId ? data : msg))
    );

    markChatAsRead(selectedChat.id);
    await loadMyChats();
  }

  async function sendImage(event) {
    updateTypingStatus(false);
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !selectedChat?.id || !session?.user?.id) return;

    if (selectedUser?.id && blockedUserIdsRef.current.includes(selectedUser.id)) {
      alert("Пользователь заблокирован. Фото не отправлено.");
      return;
    }

    const tempId = crypto.randomUUID();
    const previewUrl = URL.createObjectURL(file);

    const localMessage = {
      id: tempId,
      sender_id: session.user.id,
      chat_id: selectedChat.id,
      text: "",
      image_url: previewUrl,
      message_type: "image",
      reply_to_id: replyTo?.id || null,
      reply_text: replyTo ? getReplyPreview(replyTo) : null,
      reply_image_url: replyTo?.image_url || null,
      reply_sender_id: replyTo?.sender_id || null,
      created_at: new Date().toISOString(),
      pending: true,
      is_deleted: false,
    };

    setMessages((current) => [...current, localMessage]);
    setReplyTo(null);

    const fileExt = file.name.split(".").pop();
    const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${selectedChat.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("chat-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("IMAGE UPLOAD ERROR:", uploadError);
      alert("Ошибка загрузки изображения");
      setMessages((current) => current.filter((msg) => msg.id !== tempId));
      return;
    }

    const { data: publicData } = supabase.storage
      .from("chat-images")
      .getPublicUrl(filePath);

    const imageUrl = publicData.publicUrl;

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: session.user.id,
        chat_id: selectedChat.id,
        text: "",
        image_url: imageUrl,
        message_type: "image",
        reply_to_id: localMessage.reply_to_id,
        reply_text: localMessage.reply_text,
        reply_image_url: localMessage.reply_image_url,
        reply_sender_id: localMessage.reply_sender_id,
        is_deleted: false,
      })
      .select()
      .single();

    if (error) {
      console.error("SEND IMAGE MESSAGE ERROR:", error);
      alert("Ошибка отправки изображения");
      setMessages((current) => current.filter((msg) => msg.id !== tempId));
      return;
    }

    setMessages((current) =>
      current.map((msg) => (msg.id === tempId ? data : msg))
    );

    markChatAsRead(selectedChat.id);
    await loadMyChats();
  }


  function getFileMimeType(file) {
    if (file?.type) return file.type;

    const name = file?.name?.toLowerCase() || "";
    if (name.endsWith(".pdf")) return "application/pdf";
    if (name.endsWith(".doc")) return "application/msword";
    if (name.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (name.endsWith(".xls")) return "application/vnd.ms-excel";
    if (name.endsWith(".xlsx")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    if (name.endsWith(".zip")) return "application/zip";
    return "application/octet-stream";
  }

  async function sendFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !selectedChat?.id || !session?.user?.id) return;

    if (selectedUser?.id && blockedUserIdsRef.current.includes(selectedUser.id)) {
      alert("Пользователь заблокирован. Файл не отправлен.");
      return;
    }

    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("Файл слишком большой. Максимум 25 МБ.");
      return;
    }

    const tempId = crypto.randomUUID();
    const uploadMimeType = getFileMimeType(file);

    const localMessage = {
      id: tempId,
      sender_id: session.user.id,
      chat_id: selectedChat.id,
      text: "",
      image_url: null,
      audio_url: null,
      file_url: null,
      file_name: file.name,
      file_size: file.size,
      file_type: uploadMimeType,
      message_type: "file",
      reply_to_id: replyTo?.id || null,
      reply_text: replyTo ? getReplyPreview(replyTo) : null,
      reply_image_url: replyTo?.image_url || null,
      reply_sender_id: replyTo?.sender_id || null,
      reactions: {},
      created_at: new Date().toISOString(),
      pending: true,
      is_deleted: false,
    };

    setMessages((current) => [...current, localMessage]);
    setReplyTo(null);

    const fileExt = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "bin";
    const filePath = `${selectedChat.id}/${session.user.id}-${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("chat-files")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: uploadMimeType,
      });

    if (uploadError) {
      console.error("FILE UPLOAD ERROR:", uploadError);
      alert(`Ошибка загрузки файла: ${uploadError.message || "проверь bucket chat-files и политики Storage"}`);
      setMessages((current) => current.filter((msg) => msg.id !== tempId));
      return;
    }

    const { data: publicData } = supabase.storage
      .from("chat-files")
      .getPublicUrl(filePath);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: session.user.id,
        chat_id: selectedChat.id,
        text: "",
        image_url: null,
        audio_url: null,
        file_url: publicData.publicUrl,
        file_name: file.name,
        file_size: file.size,
        file_type: uploadMimeType,
        message_type: "file",
        reply_to_id: localMessage.reply_to_id,
        reply_text: localMessage.reply_text,
        reply_image_url: localMessage.reply_image_url,
        reply_sender_id: localMessage.reply_sender_id,
        reactions: {},
        is_deleted: false,
      })
      .select()
      .single();

    if (error) {
      console.error("SEND FILE MESSAGE ERROR:", error);
      alert("Ошибка отправки файла");
      setMessages((current) => current.filter((msg) => msg.id !== tempId));
      return;
    }

    setMessages((current) =>
      current.map((msg) => (msg.id === tempId ? data : msg))
    );

    markChatAsRead(selectedChat.id);
    await loadMyChats();
  }

  function formatFileSize(size) {
    if (!size) return "";
    if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} КБ`;
    return `${(size / 1024 / 1024).toFixed(1)} МБ`;
  }

  function getFileIcon(fileName = "") {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "📕";
    if (["doc", "docx"].includes(ext)) return "📘";
    if (["xls", "xlsx"].includes(ext)) return "📗";
    if (["zip", "rar", "7z"].includes(ext)) return "🗜️";
    return "📄";
  }



  function formatReactionSummary(reactions) {
    if (!reactions || typeof reactions !== "object") return [];

    const counts = {};

    Object.values(reactions).forEach((emoji) => {
      if (!emoji) return;
      counts[emoji] = (counts[emoji] || 0) + 1;
    });

    return Object.entries(counts).map(([emoji, count]) => ({ emoji, count }));
  }

  async function reactToMessage(message, emoji) {
    if (!message?.id || !session?.user?.id) return;

    const currentReactions =
      message.reactions && typeof message.reactions === "object"
        ? message.reactions
        : {};

    const previousEmoji = currentReactions[session.user.id];
    const nextReactions = { ...currentReactions };

    if (previousEmoji === emoji) {
      delete nextReactions[session.user.id];
    } else {
      nextReactions[session.user.id] = emoji;
    }

    setMessages((current) =>
      current.map((msg) =>
        msg.id === message.id ? { ...msg, reactions: nextReactions } : msg
      )
    );

    const { error } = await supabase
      .from("messages")
      .update({ reactions: nextReactions })
      .eq("id", message.id);

    if (error) {
      console.error("REACTION ERROR:", error);
      alert("Не удалось поставить реакцию");
      if (selectedChat?.id) await loadMessages(selectedChat.id);
      return;
    }

    closeMessageMenu();
    await loadMyChats();
  }

  async function togglePinMessage(message) {
    if (!message?.id) return;

    const nextPinned = !message.is_pinned;

    setMessages((current) =>
      current.map((msg) =>
        msg.id === message.id ? { ...msg, is_pinned: nextPinned } : msg
      )
    );

    setPinnedMessages((current) => {
      if (nextPinned) {
        const exists = current.some((msg) => msg.id === message.id);
        return exists ? current : [{ ...message, is_pinned: true }, ...current];
      }

      return current.filter((msg) => msg.id !== message.id);
    });

    const { error } = await supabase
      .from("messages")
      .update({ is_pinned: nextPinned })
      .eq("id", message.id);

    if (error) {
      console.error("PIN MESSAGE ERROR:", error);
      alert("Не удалось закрепить сообщение");
      if (selectedChat?.id) await loadMessages(selectedChat.id);
      return;
    }

    closeMessageMenu();
    await loadMyChats();
  }

  function renderMessageStatus(msg) {
    if (!msg || msg.sender_id !== session?.user?.id || msg.pending) return null;

    if (msg.read_at) {
      return <span className="message-status read">✓✓</span>;
    }

    if (msg.delivered_at) {
      return <span className="message-status delivered">✓✓</span>;
    }

    return <span className="message-status sent">✓</span>;
  }

  function renderPinnedText(message) {
    if (!message) return "Сообщение";
    if (message.message_type === "image") return "📷 Фото";
    if (message.message_type === "audio") return "🎤 Голосовое";
    if (message.message_type === "circle") return "🎥 Кружочек";
    return message.text || "Сообщение";
  }

  function jumpToMessage(messageId) {
    if (!messageId) return;

    const element = document.getElementById(`message-${messageId}`);
    if (!element) return;

    element.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedMessageId(messageId);

    setTimeout(() => {
      setHighlightedMessageId(null);
    }, 1800);
  }

  async function unpinMessage(messageId) {
    if (!messageId) return;

    setPinnedMessages((current) => current.filter((msg) => msg.id !== messageId));
    setMessages((current) =>
      current.map((msg) =>
        msg.id === messageId ? { ...msg, is_pinned: false } : msg
      )
    );

    const { error } = await supabase
      .from("messages")
      .update({ is_pinned: false })
      .eq("id", messageId);

    if (error) {
      console.error("UNPIN MESSAGE ERROR:", error);
      alert("Не удалось открепить сообщение");
      if (selectedChat?.id) await loadMessages(selectedChat.id);
    }
  }

  const messageSearchResults = messageSearch.trim()
    ? messages.filter((msg) => {
        const query = messageSearch.trim().toLowerCase();
        const content = [
          msg.text,
          msg.file_name,
          msg.reply_text,
          msg.message_type === "image" ? "фото" : "",
          msg.message_type === "audio" ? "голосовое" : "",
          msg.message_type === "circle" ? "кружочек видео" : "",
        ]
          .filter(Boolean)
          .join(" " )
          .toLowerCase();

        return content.includes(query);
      })
    : [];

  function cleanupVoiceMouseListeners() {
    window.removeEventListener("mousemove", handleVoiceDocumentMouseMove);
    window.removeEventListener("mouseup", handleVoiceDocumentMouseUp);
  }

  function handleVoiceDocumentMouseMove(event) {
    if (!isRecordingRef.current || isVoiceLockedRef.current) return;

    const startY = recordingMouseStartYRef.current;
    const currentY = typeof event?.clientY === "number" ? event.clientY : null;

    if (startY === null || currentY === null) return;

    if (startY - currentY > 55) {
      isVoiceLockedRef.current = true;
      setIsVoiceLocked(true);
    }
  }

  function handleVoiceDocumentMouseUp() {
    cleanupVoiceMouseListeners();

    if (!isRecordingRef.current) return;

    if (!isVoiceLockedRef.current) {
      stopVoiceRecording({ send: true });
    }
  }

  async function startVoiceRecording(event) {
    event?.preventDefault?.();

    const isMouseStart = event?.type === "mousedown";
    const mouseStartY = typeof event?.clientY === "number" ? event.clientY : null;
    const touchStartY = event?.touches?.[0]?.clientY || null;

    if (!selectedChat?.id || !session?.user?.id || isRecording) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Запись голоса не поддерживается этим браузером");
      return;
    }

    if (selectedUser?.id && blockedUserIdsRef.current.includes(selectedUser.id)) {
      alert("Пользователь заблокирован. Голосовое не отправлено.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      voiceChunksRef.current = [];
      shouldSendVoiceRef.current = true;
      recordingTouchStartYRef.current = touchStartY;
      recordingMouseStartYRef.current = mouseStartY;
      recordingStartedAtRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) {
          voiceChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        clearInterval(recordingTimerRef.current);

        const audioBlob = new Blob(voiceChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        const shouldSend = shouldSendVoiceRef.current;
        const duration = Math.max(1, Math.round((Date.now() - (recordingStartedAtRef.current || Date.now())) / 1000));

        voiceChunksRef.current = [];
        mediaRecorderRef.current = null;
        isRecordingRef.current = false;
        isVoiceLockedRef.current = false;
        setIsRecording(false);
        setIsVoiceLocked(false);
        setRecordingSeconds(0);

        if (shouldSend && audioBlob.size > 0) {
          await sendVoice(audioBlob, duration);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      isRecordingRef.current = true;
      isVoiceLockedRef.current = false;
      setIsRecording(true);
      setIsVoiceLocked(false);

      if (isMouseStart) {
        cleanupVoiceMouseListeners();
        window.addEventListener("mousemove", handleVoiceDocumentMouseMove);
        window.addEventListener("mouseup", handleVoiceDocumentMouseUp);
      }
      setRecordingSeconds(0);

      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((seconds) => seconds + 1);
      }, 1000);
    } catch (error) {
      console.error("VOICE RECORD ERROR:", error);
      clearInterval(recordingTimerRef.current);
      isRecordingRef.current = false;
      isVoiceLockedRef.current = false;
      setIsRecording(false);
      setIsVoiceLocked(false);
      setRecordingSeconds(0);
      alert("Не удалось включить микрофон");
    }
  }

  function stopVoiceRecording({ send = true } = {}) {
    cleanupVoiceMouseListeners();

    const recorder = mediaRecorderRef.current;
    shouldSendVoiceRef.current = send;

    if (!recorder || recorder.state === "inactive") {
      clearInterval(recordingTimerRef.current);
      isRecordingRef.current = false;
      isVoiceLockedRef.current = false;
      isRecordingRef.current = false;
      isVoiceLockedRef.current = false;
      setIsRecording(false);
      setIsVoiceLocked(false);
      setRecordingSeconds(0);
      return;
    }

    recorder.stop();
  }

  function cancelVoiceRecording() {
    stopVoiceRecording({ send: false });
  }

  function handleVoiceTouchMove(event) {
    if (!isRecording || isVoiceLocked) return;

    const startY = recordingTouchStartYRef.current;
    const currentY = event?.touches?.[0]?.clientY;

    if (!startY || !currentY) return;

    if (startY - currentY > 55) {
      isVoiceLockedRef.current = true;
      setIsVoiceLocked(true);
    }
  }

  function handleVoiceMouseMove(event) {
    if (!isRecording || isVoiceLocked) return;

    const startY = recordingMouseStartYRef.current;
    const currentY = typeof event?.clientY === "number" ? event.clientY : null;

    if (!startY || !currentY) return;

    if (startY - currentY > 55) {
      isVoiceLockedRef.current = true;
      setIsVoiceLocked(true);
    }
  }

  function handleVoiceTouchEnd() {
    if (!isRecording) return;
    if (isVoiceLocked) return;
    stopVoiceRecording({ send: true });
  }

  function handleVoiceMouseLeave() {
    // На ПК мышь может выйти за пределы кнопки при свайпе вверх.
    // Поэтому здесь НЕ останавливаем запись: остановка будет по mouseup на всём окне.
  }

  function finishLockedVoiceRecording() {
    stopVoiceRecording({ send: true });
  }

  function formatVoiceTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function toggleVoicePlayback(message) {
    if (!message?.audio_url) return;

    if (activeAudioRef.current && voicePlayer.id === message.id && voicePlayer.playing) {
      activeAudioRef.current.pause();
      setVoicePlayer({ id: message.id, playing: false });
      return;
    }

    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }

    const audio = new Audio(message.audio_url);
    activeAudioRef.current = audio;
    setVoicePlayer({ id: message.id, playing: true });

    audio.onended = () => {
      setVoicePlayer({ id: null, playing: false });
      activeAudioRef.current = null;
    };

    audio.onerror = () => {
      setVoicePlayer({ id: null, playing: false });
      activeAudioRef.current = null;
    };

    audio.play().catch((error) => {
      console.error("VOICE PLAY ERROR:", error);
      setVoicePlayer({ id: null, playing: false });
      activeAudioRef.current = null;
    });
  }

  async function sendVoice(audioBlob, duration = 0) {
    updateTypingStatus(false);
    if (!audioBlob || !selectedChat?.id || !session?.user?.id) return;

    const tempId = crypto.randomUUID();
    const previewUrl = URL.createObjectURL(audioBlob);

    const localMessage = {
      id: tempId,
      sender_id: session.user.id,
      chat_id: selectedChat.id,
      text: "",
      image_url: null,
      audio_url: previewUrl,
      audio_duration: duration,
      message_type: "audio",
      reply_to_id: replyTo?.id || null,
      reply_text: replyTo ? getReplyPreview(replyTo) : null,
      reply_image_url: replyTo?.image_url || null,
      reply_sender_id: replyTo?.sender_id || null,
      reactions: {},
      created_at: new Date().toISOString(),
      pending: true,
      is_deleted: false,
    };

    setMessages((current) => [...current, localMessage]);
    setReplyTo(null);

    const fileName = `${session.user.id}-${Date.now()}.webm`;
    const filePath = `${selectedChat.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("voice-messages")
      .upload(filePath, audioBlob, {
        cacheControl: "3600",
        upsert: true,
        contentType: audioBlob.type || "audio/webm",
      });

    if (uploadError) {
      console.error("VOICE UPLOAD ERROR:", uploadError);
      alert("Ошибка загрузки голосового");
      setMessages((current) => current.filter((msg) => msg.id !== tempId));
      return;
    }

    const { data: publicData } = supabase.storage
      .from("voice-messages")
      .getPublicUrl(filePath);

    const audioUrl = publicData.publicUrl;

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: session.user.id,
        chat_id: selectedChat.id,
        text: "",
        image_url: null,
        audio_url: audioUrl,
        audio_duration: duration,
        message_type: "audio",
        reply_to_id: localMessage.reply_to_id,
        reply_text: localMessage.reply_text,
        reply_image_url: localMessage.reply_image_url,
        reply_sender_id: localMessage.reply_sender_id,
        reactions: {},
        is_deleted: false,
      })
      .select()
      .single();

    if (error) {
      console.error("SEND VOICE MESSAGE ERROR:", error);
      alert("Ошибка отправки голосового");
      setMessages((current) => current.filter((msg) => msg.id !== tempId));
      return;
    }

    setMessages((current) =>
      current.map((msg) => (msg.id === tempId ? data : msg))
    );

    markChatAsRead(selectedChat.id);
    await loadMyChats();
  }


  function cleanupCircleRecorder() {
    clearInterval(circleTimerRef.current);
    clearTimeout(circleHoldTimerRef.current);
    circleCancelRef.current = false;
    circleLockedRef.current = false;

    if (circlePreviewUrl) {
      URL.revokeObjectURL(circlePreviewUrl);
    }

    if (circleStreamRef.current) {
      circleStreamRef.current.getTracks().forEach((track) => track.stop());
      circleStreamRef.current = null;
    }

    circleRecorderRef.current = null;
    circleChunksRef.current = [];
    circleStartedAtRef.current = null;
  }

  function resetCircleRecorderState() {
    cleanupCircleRecorder();
    setIsCircleRecording(false);
    setIsCircleLocked(false);
    setCircleRecordHint("");
    setCircleSeconds(0);
    setCirclePreviewUrl(null);
    setCircleBlob(null);
  }

  async function openCircleRecorder({ autoStart = false } = {}) {
    if (!selectedChat?.id || !session?.user?.id) return;

    if (selectedUser?.id && blockedUserIdsRef.current.includes(selectedUser.id)) {
      alert("Пользователь заблокирован. Кружочек не отправлен.");
      return;
    }

    setIsCircleRecorderOpen(true);
    setCirclePreviewUrl(null);
    setCircleBlob(null);
    setCircleSeconds(0);
    setIsCircleLocked(false);
    setCircleRecordHint(autoStart ? "Удерживай для записи · вверх — закрепить · влево — отмена" : "Ретушь включена");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: circleFacingMode,
          width: { ideal: 720 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: true,
      });

      circleStreamRef.current = stream;

      setTimeout(() => {
        if (circleVideoRef.current) {
          circleVideoRef.current.srcObject = stream;
          circleVideoRef.current.onloadedmetadata = () => {
            circleVideoRef.current?.play?.().catch(() => {});
          };
          circleVideoRef.current.play?.().catch(() => {});
        }

        if (autoStart) {
          setTimeout(() => startCircleRecording(), 120);
        }
      }, 140);
    } catch (error) {
      console.error("CIRCLE CAMERA ERROR:", error);
      setIsCircleRecorderOpen(false);
      alert("Не удалось открыть камеру. Проверь разрешение камеры и микрофона.");
    }
  }

  function closeCircleRecorder() {
    resetCircleRecorderState();
    setIsCircleRecorderOpen(false);
  }

  function startCircleRecording() {
    if (!circleStreamRef.current || isCircleRecording) return;

    if (!window.MediaRecorder) {
      alert("Этот браузер не поддерживает запись видео. Попробуй Safari/Chrome поновее или PWA.");
      return;
    }

    try {
      const supportedMimeTypes = [
        "video/mp4;codecs=h264,aac",
        "video/mp4",
        "video/webm;codecs=vp8,opus",
        "video/webm",
      ];

      const mimeType =
        supportedMimeTypes.find((type) => MediaRecorder.isTypeSupported(type)) || "";

      const recorder = mimeType
        ? new MediaRecorder(circleStreamRef.current, {
            mimeType,
            videoBitsPerSecond: 1100000,
            audioBitsPerSecond: 96000,
          })
        : new MediaRecorder(circleStreamRef.current, {
            videoBitsPerSecond: 1100000,
            audioBitsPerSecond: 96000,
          });

      circleChunksRef.current = [];
      circleStartedAtRef.current = Date.now();
      circleCancelRef.current = false;

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) {
          circleChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        clearInterval(circleTimerRef.current);

        const duration = Math.max(
          1,
          Math.round((Date.now() - (circleStartedAtRef.current || Date.now())) / 1000)
        );

        setIsCircleRecording(false);
        setIsCircleLocked(false);
        circleLockedRef.current = false;

        if (circleCancelRef.current) {
          circleCancelRef.current = false;
          circleChunksRef.current = [];
          setCircleSeconds(0);
          setCircleBlob(null);
          setCirclePreviewUrl(null);
          setCircleRecordHint("Кружочек отменён");
          return;
        }

        const blob = new Blob(circleChunksRef.current, {
          type: recorder.mimeType || "video/webm",
        });

        if (!blob.size) {
          setCircleRecordHint("Запись пустая, попробуй ещё раз");
          return;
        }

        const previewUrl = URL.createObjectURL(blob);

        setCircleBlob(blob);
        setCirclePreviewUrl(previewUrl);
        setCircleSeconds(duration);
        setCircleRecordHint("Пересмотри и отправь");

        setTimeout(() => {
          const preview = document.getElementById("circle-preview-video");
          preview?.load?.();
        }, 80);
      };

      circleRecorderRef.current = recorder;
      recorder.start(350);
      circleTouchStartRef.current = { x: 0, y: 0 };
      circleMouseStartRef.current = { x: 0, y: 0 };
      setIsCircleRecording(true);
      setIsCircleLocked(false);
      setCircleSeconds(0);
      setCircleRecordHint("Записывает кружочек… вверх — закрепить, влево — отмена");

      clearInterval(circleTimerRef.current);
      circleTimerRef.current = setInterval(() => {
        setCircleSeconds((seconds) => {
          const next = seconds + 1;

          if (next >= 60) {
            stopCircleRecording({ send: false });
          }

          return next;
        });
      }, 1000);
    } catch (error) {
      console.error("CIRCLE RECORD ERROR:", error);
      alert("Не удалось начать запись кружочка");
    }
  }

  function stopCircleRecording({ cancel = false } = {}) {
    const recorder = circleRecorderRef.current;

    if (cancel) {
      circleCancelRef.current = true;
      setCircleRecordHint("Запись отменена");
    }

    if (!recorder || recorder.state === "inactive") {
      setIsCircleRecording(false);
      setIsCircleLocked(false);
      circleLockedRef.current = false;
      clearInterval(circleTimerRef.current);
      return;
    }

    recorder.stop();
  }

  function cancelCircleRecording() {
    circleCancelRef.current = true;
    stopCircleRecording({ cancel: true });
  }

  async function handleCircleQuickPressStart(event) {
    if (!selectedChat) return;

    const point = event.touches?.[0] || event;
    const startPoint = { x: point.clientX || 0, y: point.clientY || 0 };
    circleTouchStartRef.current = startPoint;
    circleMouseStartRef.current = startPoint;
    circleCancelRef.current = false;
    circleLockedRef.current = false;

    clearTimeout(circleHoldTimerRef.current);
    circleHoldTimerRef.current = setTimeout(async () => {
      await openCircleRecorder({ autoStart: true });
    }, 220);
  }

  function handleCircleQuickMove(event) {
    const point = event.touches?.[0] || event;
    if (!point) return;

    if (!isCircleRecording) return;

    let start = circleTouchStartRef.current;

    if (!start?.x && !start?.y) {
      start = { x: point.clientX || 0, y: point.clientY || 0 };
      circleTouchStartRef.current = start;
    }

    const dx = (point.clientX || 0) - start.x;
    const dy = (point.clientY || 0) - start.y;

    if (dy < -46 && !circleLockedRef.current) {
      circleLockedRef.current = true;
      setIsCircleLocked(true);
      setCircleRecordHint("Запись закреплена — можно отпустить");
      navigator.vibrate?.([35, 20, 35]);
      return;
    }

    if (dx < -48) {
      navigator.vibrate?.([80]);
      cancelCircleRecording();
    }
  }

  function handleCircleQuickPressEnd() {
    clearTimeout(circleHoldTimerRef.current);

    if (!isCircleRecording) return;

    if (circleLockedRef.current || isCircleLocked) {
      return;
    }

    stopCircleRecording();
  }

  function handleCircleModalGestureStart(event) {
    const point = event.touches?.[0] || event;
    if (!point) return;
    circleTouchStartRef.current = { x: point.clientX || 0, y: point.clientY || 0 };
  }

  function handleCircleModalGestureMove(event) {
    handleCircleQuickMove(event);
  }

  function handleCircleModalGestureEnd() {
    // В модальном окне запись не останавливаем отпусканием пальца.
    // Остановка через кнопку "Стоп", отмена через свайп влево.
  }


  async function sendCircleMessage() {
    if (!circleBlob || !selectedChat?.id || !session?.user?.id) return;

    const tempId = crypto.randomUUID();
    const previewUrl = circlePreviewUrl;

    const localMessage = {
      id: tempId,
      sender_id: session.user.id,
      chat_id: selectedChat.id,
      text: "",
      image_url: null,
      audio_url: null,
      file_url: null,
      circle_url: previewUrl,
      circle_duration: circleSeconds || 1,
      circle_filter: "smooth",
      circle_mask: "none",
      message_type: "circle",
      reply_to_id: replyTo?.id || null,
      reply_text: replyTo ? getReplyPreview(replyTo) : null,
      reply_image_url: replyTo?.image_url || null,
      reply_sender_id: replyTo?.sender_id || null,
      reactions: {},
      created_at: new Date().toISOString(),
      pending: true,
      is_deleted: false,
    };

    setMessages((current) => [...current, localMessage]);
    setReplyTo(null);
    setIsCircleRecorderOpen(false);

    const circleMimeType = circleBlob.type || "video/mp4";
    const circleExtension = circleMimeType.includes("mp4") ? "mp4" : "webm";
    const filePath = `${selectedChat.id}/${session.user.id}-${Date.now()}-${crypto.randomUUID()}.${circleExtension}`;

    const { error: uploadError } = await supabase.storage
      .from("circle-messages")
      .upload(filePath, circleBlob, {
        cacheControl: "3600",
        upsert: true,
        contentType: circleMimeType,
      });

    if (uploadError) {
      console.error("CIRCLE UPLOAD ERROR:", uploadError);
      alert(`Ошибка загрузки кружочка: ${uploadError.message || "проверь bucket circle-messages и Storage policies"}`);
      setMessages((current) => current.filter((msg) => msg.id !== tempId));
      setIsCircleRecorderOpen(true);
      return;
    }

    const { data: publicData } = supabase.storage
      .from("circle-messages")
      .getPublicUrl(filePath);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: session.user.id,
        chat_id: selectedChat.id,
        text: "",
        image_url: null,
        audio_url: null,
        file_url: null,
        circle_url: publicData.publicUrl,
        circle_duration: circleSeconds || 1,
        circle_filter: "smooth",
        circle_mask: "none",
        message_type: "circle",
        reply_to_id: localMessage.reply_to_id,
        reply_text: localMessage.reply_text,
        reply_image_url: localMessage.reply_image_url,
        reply_sender_id: localMessage.reply_sender_id,
        reactions: {},
        is_deleted: false,
      })
      .select()
      .single();

    resetCircleRecorderState();

    if (error) {
      console.error("SEND CIRCLE MESSAGE ERROR:", error);
      alert("Ошибка отправки кружочка. Проверь SQL-поля circle_url/circle_duration/circle_filter/circle_mask.");
      setMessages((current) => current.filter((msg) => msg.id !== tempId));
      return;
    }

    setMessages((current) =>
      current.map((msg) => (msg.id === tempId ? data : msg))
    );

    markChatAsRead(selectedChat.id);
    await loadMyChats();
  }

  function toggleCirclePlayback(message) {
    if (!message?.circle_url) return;

    const videoElement = document.getElementById(`circle-video-${message.id}`);

    if (!videoElement) return;

    if (activeCircleVideoRef.current && activeCircleVideoRef.current !== videoElement) {
      activeCircleVideoRef.current.pause();
    }

    if (circlePlayer.id === message.id && circlePlayer.playing) {
      videoElement.pause();
      setCirclePlayer({ id: message.id, playing: false });
      return;
    }

    activeCircleVideoRef.current = videoElement;

    videoElement.currentTime = 0;
    videoElement.play().catch((error) => {
      console.error("CIRCLE PLAY ERROR:", error);
    });

    setCirclePlayer({ id: message.id, playing: true });

    videoElement.onended = () => {
      setCirclePlayer({ id: null, playing: false });
      activeCircleVideoRef.current = null;
    };
  }

  function seekCircleVideo(messageId, seconds) {
    const videoElement = document.getElementById(`circle-video-${messageId}`);
    if (!videoElement) return;

    const duration = Number.isFinite(videoElement.duration) ? videoElement.duration : 0;
    const nextTime = Math.max(0, Math.min(duration || 9999, (videoElement.currentTime || 0) + seconds));
    videoElement.currentTime = nextTime;
  }



  function playCallSound(type = "ring") {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const gain = audioContext.createGain();
      gain.connect(audioContext.destination);
      gain.gain.setValueAtTime(0.0001, audioContext.currentTime);

      const beep = (frequency, startAt, duration, volume = 0.18, wave = "sine") => {
        const oscillator = audioContext.createOscillator();
        oscillator.type = wave;
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + startAt);
        oscillator.connect(gain);
        gain.gain.exponentialRampToValueAtTime(volume, audioContext.currentTime + startAt + 0.01);
        oscillator.start(audioContext.currentTime + startAt);
        oscillator.stop(audioContext.currentTime + startAt + duration);
      };

      if (type === "ring") {
        beep(740, 0, 0.11, 0.16);
        beep(740, 0.32, 0.11, 0.16);
      } else if (type === "accept") {
        beep(520, 0, 0.08, 0.18, "triangle");
        beep(740, 0.09, 0.09, 0.18, "triangle");
        beep(980, 0.19, 0.12, 0.16, "triangle");
      } else if (type === "end") {
        beep(620, 0, 0.1, 0.15, "sawtooth");
        beep(420, 0.11, 0.12, 0.13, "sawtooth");
        beep(240, 0.24, 0.16, 0.11, "sawtooth");
      } else if (type === "missed") {
        beep(330, 0, 0.13, 0.16);
        beep(220, 0.18, 0.18, 0.13);
      }

      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.75);
      setTimeout(() => audioContext.close?.(), 900);
    } catch (error) {
      console.warn("CALL SOUND ERROR:", error);
    }
  }

  async function sendCallSystemMessage(chatId, textValue) {
    const currentSession = sessionRef.current || session;
    if (!currentSession?.user?.id || !chatId || !textValue) return;

    await supabase
      .from("messages")
      .insert({
        sender_id: currentSession.user.id,
        chat_id: chatId,
        text: textValue,
        image_url: null,
        audio_url: null,
        file_url: null,
        message_type: "text",
        reactions: {},
        is_deleted: false,
      });

    if (selectedChatRef.current?.id === chatId) {
      await loadMessages(chatId);
    }

    await loadMyChats();
  }

  async function getLocalCallStream(type = "audio", facingMode = callFacingMode) {
    const audio = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    };

    if (type !== "video") {
      return navigator.mediaDevices.getUserMedia({ audio, video: false });
    }

    try {
      return await navigator.mediaDevices.getUserMedia({
        audio,
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
    } catch (error) {
      console.warn("VIDEO WITH FACING MODE FAILED, RETRY BASIC VIDEO:", error);
      return navigator.mediaDevices.getUserMedia({
        audio,
        video: true,
      });
    }
  }

  function getCallPeerFromChat(chatId, senderId) {
    const existingChat = myChats.find((chat) => chat.id === chatId);
    if (existingChat?.otherUser) return existingChat.otherUser;

    if (selectedChatRef.current?.id === chatId && selectedUserRef.current) {
      return selectedUserRef.current;
    }

    return {
      id: senderId,
      username: "Пользователь",
      avatar_url: null,
    };
  }

  function attachCallStreams() {
    setTimeout(() => {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localCallStreamRef.current;
        localVideoRef.current.muted = true;
        localVideoRef.current.volume = 0;
        localVideoRef.current.play?.().catch(() => {});
      }

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteCallStreamRef.current;
        remoteVideoRef.current.muted = false;
        remoteVideoRef.current.volume = 1;
        remoteVideoRef.current.play?.().catch(() => {});
      }

      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteCallStreamRef.current;
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current.volume = 1;
        remoteAudioRef.current.play?.().catch((error) => {
          console.warn("REMOTE AUDIO PLAY BLOCKED:", error);
        });
      }
    }, 80);
  }

  async function flushPendingIceCandidates() {
    const peerConnection = peerConnectionRef.current;
    if (!peerConnection || pendingIceCandidatesRef.current.length === 0) return;

    const pendingCandidates = [...pendingIceCandidatesRef.current];
    pendingIceCandidatesRef.current = [];

    for (const candidate of pendingCandidates) {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.warn("PENDING CALL ICE ERROR:", error);
      }
    }
  }

  function createPeerConnection(callId, chatId, receiverId) {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    const remoteStream = new MediaStream();
    remoteCallStreamRef.current = remoteStream;

    peerConnection.ontrack = (event) => {
      const incomingStream = event.streams?.[0];

      if (incomingStream) {
        incomingStream.getTracks().forEach((track) => {
          track.enabled = true;
          const alreadyAdded = remoteStream.getTracks().some((existingTrack) => existingTrack.id === track.id);
          if (!alreadyAdded) {
            remoteStream.addTrack(track);
          }
        });
      } else if (event.track) {
        event.track.enabled = true;
        const alreadyAdded = remoteStream.getTracks().some((existingTrack) => existingTrack.id === event.track.id);
        if (!alreadyAdded) {
          remoteStream.addTrack(event.track);
        }
      }

      attachCallStreams();
    };

    peerConnection.onicecandidate = async (event) => {
      if (!event.candidate || !receiverId) return;

      await sendCallSignal({
        type: "ice",
        callId,
        chatId,
        receiverId,
        payload: {
          candidate: event.candidate.toJSON(),
        },
      });
    };

    peerConnection.onconnectionstatechange = () => {
      if (["failed", "disconnected", "closed"].includes(peerConnection.connectionState)) {
        if (callStateRef.current.status === "active") {
          cleanupCall(false);
        }
      }
    };

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  }

  async function sendCallSignal({ type, callId, chatId, receiverId, payload = {} }) {
    const currentSession = sessionRef.current || session;
    if (!currentSession?.user?.id || !receiverId) return;

    const { error } = await supabase.from("call_signals").insert({
      call_id: callId,
      chat_id: chatId,
      sender_id: currentSession.user.id,
      receiver_id: receiverId,
      signal_type: type,
      payload,
    });

    if (error) {
      console.error("CALL SIGNAL ERROR:", error);
      alert("Ошибка звонка. Проверь SQL для call_signals.");
    }
  }

  async function startCall(type = "audio") {
    const currentSession = sessionRef.current || session;
    const currentChat = selectedChatRef.current || selectedChat;
    const peerUser = selectedUserRef.current || selectedUser;

    if (!currentSession?.user?.id || !currentChat?.id || !peerUser?.id) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Этот браузер не поддерживает звонки");
      return;
    }

    try {
      const callId = crypto.randomUUID();
      playCallSound("ring");
      const localStream = await getLocalCallStream(type, callFacingMode);

      localCallStreamRef.current = localStream;

      setCallState({
        status: "outgoing",
        type,
        callId,
        chatId: currentChat.id,
        peerUser,
        offer: null,
      });

      const peerConnection = createPeerConnection(callId, currentChat.id, peerUser.id);
      localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));

      attachCallStreams();

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      await sendCallSignal({
        type: "offer",
        callId,
        chatId: currentChat.id,
        receiverId: peerUser.id,
        payload: {
          callType: type,
          offer,
          caller: {
            id: currentSession.user.id,
            username: profile?.username || currentSession.user.email || "Пользователь",
            avatar_url: profile?.avatar_url || null,
          },
        },
      });
    } catch (error) {
      console.error("START CALL ERROR:", error);
      const reason =
        error?.name === "NotAllowedError"
          ? "Браузер запретил камеру/микрофон. Разреши доступ в адресной строке рядом с замком."
          : error?.name === "NotFoundError"
            ? "Камера или микрофон не найдены."
            : error?.name === "NotReadableError"
              ? "Камера/микрофон заняты другой программой или вкладкой."
              : "Проверь разрешение камеры/микрофона.";
      alert(`Не удалось начать звонок. ${reason}`);
      cleanupCall(false);
    }
  }

  async function acceptCall() {
    const currentSession = sessionRef.current || session;
    const currentCall = callStateRef.current;

    if (!currentSession?.user?.id || !currentCall?.offer || !currentCall?.peerUser?.id) return;

    try {
      playCallSound("accept");
      const localStream = await getLocalCallStream(currentCall.type, callFacingMode);

      localCallStreamRef.current = localStream;

      const peerConnection = createPeerConnection(
        currentCall.callId,
        currentCall.chatId,
        currentCall.peerUser.id
      );

      localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));

      await peerConnection.setRemoteDescription(new RTCSessionDescription(currentCall.offer));
      await flushPendingIceCandidates();
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      setCallState((current) => ({
        ...current,
        status: "active",
      }));

      attachCallStreams();

      await sendCallSignal({
        type: "answer",
        callId: currentCall.callId,
        chatId: currentCall.chatId,
        receiverId: currentCall.peerUser.id,
        payload: { answer },
      });
    } catch (error) {
      console.error("ACCEPT CALL ERROR:", error);
      alert("Не удалось принять звонок. Проверь камеру/микрофон.");
      cleanupCall(true);
    }
  }

  async function rejectCall() {
    const currentCall = callStateRef.current;

    playCallSound("missed");

    if (currentCall?.peerUser?.id && currentCall?.callId) {
      await sendCallSignal({
        type: "reject",
        callId: currentCall.callId,
        chatId: currentCall.chatId,
        receiverId: currentCall.peerUser.id,
      });

      await sendCallSystemMessage(
        currentCall.chatId,
        currentCall.status === "incoming"
          ? "📞 Звонок отклонён"
          : "📞 Не удалось дозвониться до пользователя"
      );
    }

    cleanupCall(false);
  }

  async function endCall() {
    const currentCall = callStateRef.current;

    playCallSound("end");

    if (currentCall?.peerUser?.id && currentCall?.callId) {
      await sendCallSignal({
        type: "end",
        callId: currentCall.callId,
        chatId: currentCall.chatId,
        receiverId: currentCall.peerUser.id,
      });

      await sendCallSystemMessage(currentCall.chatId, "📞 Звонок завершён");
    }

    cleanupCall(false);
  }

  function cleanupCall(resetRemote = true) {
    try {
      peerConnectionRef.current?.close?.();
    } catch {}

    peerConnectionRef.current = null;
    pendingIceCandidatesRef.current = [];

    localCallStreamRef.current?.getTracks()?.forEach((track) => track.stop());
    localCallStreamRef.current = null;

    if (resetRemote) {
      remoteCallStreamRef.current?.getTracks()?.forEach((track) => track.stop());
    }

    remoteCallStreamRef.current = null;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    setIsCallMuted(false);
    setIsCallCameraOff(false);
    setIsCallSelfFullScreen(false);
    setCallAudioUnlocked(false);
    setCallState({
      status: "idle",
      type: "audio",
      callId: null,
      chatId: null,
      peerUser: null,
      offer: null,
    });
  }

  function toggleCallMute() {
    const nextMuted = !isCallMuted;
    localCallStreamRef.current?.getAudioTracks()?.forEach((track) => {
      track.enabled = !nextMuted;
    });
    setIsCallMuted(nextMuted);
  }

  function toggleCallCamera() {
    const nextOff = !isCallCameraOff;
    localCallStreamRef.current?.getVideoTracks()?.forEach((track) => {
      track.enabled = !nextOff;
    });
    setIsCallCameraOff(nextOff);
  }


  async function replaceCallVideoTrack(nextFacingMode) {
    const currentCall = callStateRef.current;
    if (currentCall.type !== "video") return;

    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: nextFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      const nextVideoTrack = nextStream.getVideoTracks()[0];
      if (!nextVideoTrack) return;

      const sender = peerConnectionRef.current
        ?.getSenders()
        ?.find((item) => item.track?.kind === "video");

      if (sender) {
        await sender.replaceTrack(nextVideoTrack);
      }

      const oldVideoTracks = localCallStreamRef.current?.getVideoTracks?.() || [];
      oldVideoTracks.forEach((track) => {
        localCallStreamRef.current?.removeTrack?.(track);
        track.stop();
      });

      localCallStreamRef.current?.addTrack(nextVideoTrack);
      attachCallStreams();
    } catch (error) {
      console.error("SWITCH CALL CAMERA ERROR:", error);
      alert("Не удалось переключить камеру");
    }
  }

  async function handleCallSelfPreviewTap() {
    const now = Date.now();

    if (now - callLastTapRef.current < 320) {
      const nextFacingMode = callFacingMode === "user" ? "environment" : "user";
      setCallFacingMode(nextFacingMode);
      await replaceCallVideoTrack(nextFacingMode);
      callLastTapRef.current = 0;
      return;
    }

    callLastTapRef.current = now;
    setIsCallSelfFullScreen((value) => !value);
  }

  async function switchCircleCamera() {
    const nextFacingMode = circleFacingMode === "user" ? "environment" : "user";
    setCircleFacingMode(nextFacingMode);

    if (!circleStreamRef.current) return;

    try {
      circleStreamRef.current.getTracks().forEach((track) => track.stop());

      const nextStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: nextFacingMode,
          width: { ideal: 720 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: true,
      });

      circleStreamRef.current = nextStream;

      if (circleVideoRef.current) {
        circleVideoRef.current.srcObject = nextStream;
        circleVideoRef.current.play?.().catch(() => {});
      }
    } catch (error) {
      console.error("SWITCH CIRCLE CAMERA ERROR:", error);
      alert("Не удалось переключить камеру кружочка");
    }
  }

  function handleCirclePreviewTap() {
    const now = Date.now();

    if (now - circleLastTapRef.current < 320) {
      switchCircleCamera();
      circleLastTapRef.current = 0;
      return;
    }

    circleLastTapRef.current = now;
  }

  async function handleCallSignal(row) {
    const currentSession = sessionRef.current || session;
    if (!currentSession?.user?.id || !row?.id) return;
    if (processedCallSignalsRef.current.has(row.id)) return;
    processedCallSignalsRef.current.add(row.id);

    if (row.sender_id === currentSession.user.id) return;

    const payload = row.payload || {};
    const currentCall = callStateRef.current;

    if (row.signal_type === "offer") {
      const peerUser =
        payload.caller ||
        getCallPeerFromChat(row.chat_id, row.sender_id);

      setCallState({
        status: "incoming",
        type: payload.callType || "audio",
        callId: row.call_id,
        chatId: row.chat_id,
        peerUser,
        offer: payload.offer,
      });

      return;
    }

    if (!currentCall?.callId || currentCall.callId !== row.call_id) return;

    if (row.signal_type === "answer" && payload.answer) {
      try {
        await peerConnectionRef.current?.setRemoteDescription(
          new RTCSessionDescription(payload.answer)
        );
        await flushPendingIceCandidates();
        setCallState((current) => ({ ...current, status: "active" }));
      } catch (error) {
        console.error("CALL ANSWER ERROR:", error);
      }
      return;
    }

    if (row.signal_type === "ice" && payload.candidate) {
      const peerConnection = peerConnectionRef.current;

      if (!peerConnection || !peerConnection.remoteDescription) {
        pendingIceCandidatesRef.current.push(payload.candidate);
        return;
      }

      try {
        await peerConnection.addIceCandidate(
          new RTCIceCandidate(payload.candidate)
        );
      } catch (error) {
        pendingIceCandidatesRef.current.push(payload.candidate);
        console.warn("CALL ICE ERROR:", error);
      }
      return;
    }

    if (["end", "reject"].includes(row.signal_type)) {
      playCallSound(row.signal_type === "reject" ? "missed" : "end");
      if (row.signal_type === "end") {
        await sendCallSystemMessage(row.chat_id, "📞 Звонок завершён");
      } else {
        await sendCallSystemMessage(row.chat_id, "📞 Не удалось дозвониться до пользователя");
      }
      cleanupCall(false);
    }
  }

  async function saveMyProfileSettings() {
    const currentSession = sessionRef.current || session;

    if (!currentSession?.user?.id) return;

    const nextNickname = profileNickname.trim();

    if (!nextNickname) {
      alert("Никнейм не может быть пустым");
      return;
    }

    const nextProfile = {
      username: nextNickname,
      description: profileDescription.trim(),
      status: profileStatus,
      profile_cover: profileCover,
      chat_wallpaper: chatWallpaper,
      profile_header_image_url: profileHeaderImageUrl || null,
      chat_header_image_url: chatHeaderImageUrl || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("profiles")
      .update(nextProfile)
      .eq("id", currentSession.user.id)
      .select()
      .single();

    if (error) {
      console.error("SAVE PROFILE ERROR:", error);
      alert("Не удалось сохранить профиль. Проверь SQL-поля description/status/profile_cover/chat_wallpaper.");
      return;
    }

    setProfile(data);
    setSearchResults((current) =>
      current.map((user) => (user.id === data.id ? data : user))
    );

    setMyChats((current) =>
      current.map((chat) =>
        chat.otherUser?.id === data.id
          ? { ...chat, otherUser: data }
          : chat
      )
    );

    if (selectedUserRef.current?.id === data.id) {
      setSelectedUser(data);
    }

    localStorage.setItem("iriska_profile_nickname", data.username || nextNickname);
    localStorage.setItem("iriska_profile_description", data.description || "");
    localStorage.setItem("iriska_profile_status", data.status || "В сети");
    localStorage.setItem("iriska_profile_cover", data.profile_cover || profileCover);
    localStorage.setItem("iriska_chat_wallpaper", data.chat_wallpaper || chatWallpaper);
    localStorage.setItem("iriska_profile_header_image_url", data.profile_header_image_url || profileHeaderImageUrl || "");
    localStorage.setItem("iriska_chat_header_image_url", data.chat_header_image_url || chatHeaderImageUrl || "");

    await loadMyChats();
    alert("Профиль сохранён");
  }

  async function uploadAvatar(event) {
    const file = event.target.files?.[0];
    if (!file || !session?.user?.id) return;

    const fileExt = file.name.split(".").pop();
    const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${session.user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("AVATAR UPLOAD ERROR:", uploadError);
      alert("Ошибка загрузки аватарки");
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const avatarUrl = data.publicUrl;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", session.user.id);

    if (updateError) {
      console.error("AVATAR UPDATE ERROR:", updateError);
      alert("Ошибка сохранения аватарки");
      return;
    }

    setProfile((current) => ({
      ...current,
      avatar_url: avatarUrl,
    }));

    await loadMyChats();
  }

  async function uploadProfileBackgroundImage(event, type) {
    const file = event.target.files?.[0];
    event.target.value = "";

    const currentSession = sessionRef.current || session;
    if (!file || !currentSession?.user?.id) return;

    const instantPreviewUrl = URL.createObjectURL(file);

    if (type === "profile-header") {
      setProfileHeaderPreviewUrl(instantPreviewUrl);
    } else {
      setChatHeaderPreviewUrl(instantPreviewUrl);
    }

    const fileExt = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "jpg";
    const filePath = `${currentSession.user.id}/${type}-${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || "image/jpeg",
      });

    if (uploadError) {
      console.error("PROFILE BACKGROUND UPLOAD ERROR:", uploadError);
      alert(`Ошибка загрузки изображения: ${uploadError.message || "проверь bucket avatars"}`);
      if (type === "profile-header") setProfileHeaderPreviewUrl("");
      else setChatHeaderPreviewUrl("");
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const publicUrl = data.publicUrl;

    const updatePayload =
      type === "profile-header"
        ? { profile_header_image_url: publicUrl, updated_at: new Date().toISOString() }
        : { chat_header_image_url: publicUrl, updated_at: new Date().toISOString() };

    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", currentSession.user.id)
      .select()
      .single();

    if (updateError) {
      console.error("PROFILE BACKGROUND SAVE ERROR:", updateError);
      alert("Фото загрузилось, но не сохранилось в профиле. Выполни SQL для profile_header_image_url/chat_header_image_url.");
      if (type === "profile-header") setProfileHeaderPreviewUrl("");
      else setChatHeaderPreviewUrl("");
      return;
    }

    if (type === "profile-header") {
      setProfileHeaderImageUrl(publicUrl);
      setProfileHeaderPreviewUrl("");
      localStorage.setItem("iriska_profile_header_image_url", publicUrl);
    } else {
      setChatHeaderImageUrl(publicUrl);
      setChatHeaderPreviewUrl("");
      localStorage.setItem("iriska_chat_header_image_url", publicUrl);
    }

    setProfile(updatedProfile);

    setSearchResults((current) =>
      current.map((user) => (user.id === updatedProfile.id ? updatedProfile : user))
    );

    setMyChats((current) =>
      current.map((chat) =>
        chat.otherUser?.id === updatedProfile.id
          ? { ...chat, otherUser: updatedProfile }
          : chat
      )
    );

    if (selectedUserRef.current?.id === updatedProfile.id) {
      setSelectedUser(updatedProfile);
    }

    await loadMyChats();
  }

  async function uploadPrivateChatBackgroundImage(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    const currentSession = sessionRef.current || session;
    const currentChat = selectedChatRef.current || selectedChat;

    if (!file || !currentSession?.user?.id || !currentChat?.id) return;

    const instantPreviewUrl = URL.createObjectURL(file);
    setPrivateChatBackgroundPreviewUrl(instantPreviewUrl);

    const fileExt = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "jpg";
    const filePath = `${currentSession.user.id}/private-chat-${currentChat.id}-${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || "image/jpeg",
      });

    if (uploadError) {
      console.error("PRIVATE CHAT BACKGROUND UPLOAD ERROR:", uploadError);
      alert(`Ошибка загрузки фона чата: ${uploadError.message || "проверь bucket avatars"}`);
      setPrivateChatBackgroundPreviewUrl("");
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const publicUrl = data.publicUrl;

    setPrivateChatBackgrounds((current) => ({
      ...(current || {}),
      [currentChat.id]: publicUrl,
    }));

    setPrivateChatBackgroundPreviewUrl("");
  }

  function removePrivateChatBackground() {
    const currentChat = selectedChatRef.current || selectedChat;
    if (!currentChat?.id) return;

    setPrivateChatBackgrounds((current) => {
      const next = { ...(current || {}) };
      delete next[currentChat.id];
      return next;
    });
    setPrivateChatBackgroundPreviewUrl("");
  }

  async function changeMyPassword() {
    const passwordValue = newPassword.trim();

    if (passwordValue.length < 6) {
      alert("Пароль должен быть минимум 6 символов");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: passwordValue,
    });

    if (error) {
      console.error("CHANGE PASSWORD ERROR:", error);
      alert(`Не удалось изменить пароль: ${error.message}`);
      return;
    }

    setNewPassword("");
    alert("Пароль изменён");
  }

  async function logout() {
    await supabase.auth.signOut();

    setSession(null);
    setProfile(null);
    setMyChats([]);
    setSearchResults([]);
    setSelectedChat(null);
    setSelectedUser(null);
    setMessages([]);
    setText("");
    setSearch("");
    setReplyTo(null);
    setActionMessage(null);
    setForwardMessage(null);
    setActionChat(null);
    setHiddenMessageIds([]);
    setHiddenChatIds([]);
    setBlockedUserIds([]);
    setShowSidebar(true);
  }

  function renderAvatar(user) {
    if (user?.avatar_url) {
      return <img className="avatar-img" src={user.avatar_url} alt="avatar" />;
    }

    return user?.username?.[0]?.toUpperCase() || "👤";
  }

  function renderLastMessage(chat) {
    if (!chat.lastMessage) return "личный чат";

    if (chat.lastMessage.message_type === "image") {
      return chat.lastMessage.sender_id === session.user.id
        ? "Вы: 📷 Фото"
        : "📷 Фото";
    }

    if (chat.lastMessage.message_type === "audio") {
      return chat.lastMessage.sender_id === session.user.id
        ? "Вы: 🎤 Голосовое"
        : "🎤 Голосовое";
    }

    if (chat.lastMessage.message_type === "circle") {
      return chat.lastMessage.sender_id === session.user.id
        ? "Вы: 🎥 Кружочек"
        : "🎥 Кружочек";
    }

    if (chat.lastMessage.message_type === "file") {
      const name = chat.lastMessage.file_name || "Файл";
      return chat.lastMessage.sender_id === session.user.id
        ? `Вы: 📄 ${name}`
        : `📄 ${name}`;
    }

    if (chat.lastMessage.sender_id === session.user.id) {
      return `Вы: ${chat.lastMessage.text || "сообщение"}`;
    }

    return chat.lastMessage.text || "сообщение";
  }

  if (!session) {
    return (
      <Auth
        mode={mode}
        setMode={setMode}
        username={username}
        setUsername={setUsername}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        authMessage={authMessage}
        register={register}
        login={login}
      />
    );
  }

  return (
    <div
      className={`app theme-${theme}`}
      data-theme={theme}
      data-wallpaper={chatWallpaper}
      onTouchStart={handleAppTouchStart}
      onTouchMove={handleAppTouchMove}
    >
      <aside className={`sidebar ${showSidebar ? "show" : "hide"} ${showSidebar ? "drawer-open" : ""}`}>
        <div className="logo">
          <label className="profile-avatar">
            <input type="file" accept="image/*" onChange={uploadAvatar} />
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="avatar" />
            ) : (
              <span>🍬</span>
            )}
          </label>

          <div>
            <h1>Ириска</h1>
            <p>{profile?.username || session.user.email}</p>
          </div>
        </div>

        <button type="button" className="drawer-close-btn" onClick={closeMainMenu}>×</button>

        <button className="logout" onClick={logout}>
          Выйти
        </button>

        <div className="sidebar-action-grid">
          <button type="button" className="sidebar-mini-action" onClick={() => setIsMyProfileOpen(true)}>
            👤 Мой профиль
          </button>
          <button type="button" className="sidebar-mini-action" onClick={requestMobileNotifications}>
            🔔 Уведомления
          </button>
          <button type="button" className="sidebar-mini-action" onClick={toggleTheme}>
            {theme === "dark" ? "☀️ Светлая" : "🌙 Тёмная"}
          </button>
          <button type="button" className="sidebar-mini-action" onClick={restoreHiddenChats}>
            ↩️ Вернуть чаты
          </button>
          <button type="button" className="sidebar-mini-action" onClick={() => setHideOnline((value) => !value)}>
            {hideOnline ? "🫥 Онлайн скрыт" : "👁️ Скрыть онлайн"}
          </button>
          <button type="button" className="sidebar-mini-action" onClick={() => setIsAppearanceOpen(true)}>
            🎨 Оформление
          </button>
        </div>

        <button
          type="button"
          className="blocked-users-button"
          onClick={() => {
            loadBlockedUsers();
            setIsBlockedUsersOpen(true);
          }}
        >
          🚫 Заблокированные
        </button>

        <input
          className="search-input"
          placeholder="Найти пользователя..."
          value={search}
          onChange={(e) => searchUsers(e.target.value)}
        />

        {searchResults.length > 0 && (
          <div className="block">
            <p className="block-title">Поиск</p>

            {searchResults.map((user) => (
              <div
                className="chat-item"
                key={user.id}
                onClick={() => openChatWithUser(user)}
              >
                <div className="avatar">{renderAvatar(user)}</div>
                <div className="chat-info">
                  <h3>{user.username}</h3>
                  <p>{isUserOnline(user) ? "онлайн" : "офлайн"}</p>
                </div>
                <span className={isUserOnline(user) ? "online-dot" : "offline-dot"} />
              </div>
            ))}
          </div>
        )}

        <div className="block side-chat-list">
          <p className="block-title">Мои чаты</p>

          {myChats.length === 0 && (
            <p className="empty">Пока нет чатов. Найди пользователя выше.</p>
          )}

          {myChats.map((chat) => (
            <div
              className={`chat-item ${selectedChat?.id === chat.id ? "active" : ""}`}
              key={chat.id}
              onClick={() => openExistingChat(chat)}
              onTouchStart={() => handleChatTouchStart(chat)}
              onTouchEnd={handleChatTouchEnd}
              onTouchMove={handleChatTouchEnd}
              onMouseDown={() => handleChatTouchStart(chat)}
              onMouseUp={handleChatTouchEnd}
              onMouseLeave={handleChatTouchEnd}
              onContextMenu={(event) => handleChatContextMenu(event, chat)}
            >
              <div className="avatar">{renderAvatar(chat.otherUser)}</div>

              <div className="chat-info">
                <h3>{chat.otherUser?.username || "Пользователь"}</h3>
                <p>{renderLastMessage(chat)}</p>
              </div>

              <div className="chat-meta">
                <span
                  className={
                    isUserOnline(chat.otherUser) ? "online-dot" : "offline-dot"
                  }
                />

                {chat.unreadCount > 0 && (
                  <span className="unread-badge">{chat.unreadCount}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main
        className={`chat ${!selectedChat ? "chat-home-mode" : ""} ${getVisibleChatHeaderImage() ? "has-custom-chat-bg" : ""}`}
        style={getVisibleChatHeaderImage() ? { "--custom-chat-bg": `url(${getVisibleChatHeaderImage()})` } : undefined}
      >
        <header className="chat-header">
          <button
            className="back-btn"
            onClick={() => {
              setIsChatOptionsOpen(false);
              setIsUserProfileOpen(false);
              setActionMessage(null);
              setForwardMessage(null);
              if (selectedChat) {
                setSelectedChat(null);
                setSelectedUser(null);
                setMessages([]);
                setShowSidebar(false);
              } else {
                openMainMenu();
              }
            }}
          >
            {selectedChat ? "←" : "☰"}
          </button>

          <button
            className="chat-user-button"
            type="button"
            onClick={() => selectedUser && setIsUserProfileOpen(true)}
            disabled={!selectedUser}
          >
            <div className="chat-header-avatar">
              <div className="avatar">{renderAvatar(selectedUser)}</div>
            </div>

            <div>
              <h2>{selectedUser ? selectedUser.username : "Чаты"}</h2>
              <p className={typingUser ? "typing-header-text" : ""}>
                {selectedUser
                  ? typingUser
                    ? `${typingUser.username || "Пользователь"} что-то колдует`
                    : isUserOnline(selectedUser)
                    ? "онлайн"
                    : "офлайн"
                  : "Ириска"}
              </p>
            </div>
          </button>

          {selectedChat ? (
            <div className="chat-call-actions">
              <button
                type="button"
                className="chat-call-btn"
                onClick={() => startCall("audio")}
                aria-label="Аудиозвонок"
                title="Аудиозвонок"
              >
                📞
              </button>
              <button
                type="button"
                className="chat-call-btn"
                onClick={() => startCall("video")}
                aria-label="Видеозвонок"
                title="Видеозвонок"
              >
                🎥
              </button>
              <button
                type="button"
                className="chat-options-btn"
                onClick={() => setIsChatOptionsOpen((value) => !value)}
                aria-label="Меню чата"
              >
                ⋮
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="chat-options-btn home-edit-btn"
              onClick={() => setIsMyProfileOpen(true)}
              aria-label="Редактировать профиль"
            >
              ✎
            </button>
          )}

        </header>

        {!selectedChat && (
          <section className="mobile-home-chats">
            <input
              className="search-input mobile-home-search"
              placeholder="Найти пользователя..."
              value={search}
              onChange={(e) => searchUsers(e.target.value)}
            />

            {searchResults.length > 0 && (
              <div className="mobile-home-search-results">
                {searchResults.map((user) => (
                  <button
                    type="button"
                    className="chat-item mobile-chat-card"
                    key={user.id}
                    onClick={() => openChatWithUser(user)}
                  >
                    <span className="avatar">{renderAvatar(user)}</span>
                    <span className="chat-info">
                      <h3>{user.username}</h3>
                      <p>{isUserOnline(user) ? "онлайн" : "офлайн"}</p>
                    </span>
                    <span className={isUserOnline(user) ? "online-dot" : "offline-dot"} />
                  </button>
                ))}
              </div>
            )}

            <p className="block-title mobile-home-title">Мои чаты</p>

            <div className="mobile-home-chat-list">
              {myChats.length === 0 && (
                <p className="empty">Пока нет чатов. Найди пользователя выше.</p>
              )}

              {myChats.map((chat) => (
                <button
                  type="button"
                  className="chat-item mobile-chat-card"
                  key={chat.id}
                  onClick={() => openExistingChat(chat)}
                  onContextMenu={(event) => handleChatContextMenu(event, chat)}
                >
                  <span className="avatar">{renderAvatar(chat.otherUser)}</span>
                  <span className="chat-info">
                    <h3>{chat.otherUser?.username || "Пользователь"}</h3>
                    <p>{renderLastMessage(chat)}</p>
                  </span>
                  <span className="chat-meta">
                    <span className={isUserOnline(chat.otherUser) ? "online-dot" : "offline-dot"} />
                    {chat.unreadCount > 0 && <span className="unread-badge">{chat.unreadCount}</span>}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {pinnedMessages.length > 0 && selectedChat && (
          <div className="pinned-messages-panel">
            <div className="pinned-title">📌 Закреплено</div>
            {pinnedMessages.slice(0, 3).map((message) => (
              <div key={message.id} className="pinned-message-item">
                <button
                  type="button"
                  className="pinned-message-jump"
                  onClick={() => jumpToMessage(message.id)}
                >
                  {renderPinnedText(message)}
                </button>
                <button
                  type="button"
                  className="pinned-unpin-btn"
                  onClick={() => unpinMessage(message.id)}
                  aria-label="Открепить"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {isChatSearchOpen && (
          <div className="chat-search-panel">
            <div className="chat-search-row">
              <input
                value={messageSearch}
                onChange={(event) => setMessageSearch(event.target.value)}
                placeholder="Поиск по сообщениям..."
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  setIsChatSearchOpen(false);
                  setMessageSearch("");
                }}
              >
                ×
              </button>
            </div>

            {messageSearch.trim() && (
              <div className="chat-search-results">
                {messageSearchResults.length === 0 ? (
                  <p>Ничего не найдено</p>
                ) : (
                  messageSearchResults.slice(-8).reverse().map((message) => (
                    <button
                      key={message.id}
                      type="button"
                      onClick={() => jumpToMessage(message.id)}
                    >
                      {renderPinnedText(message)}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {typingUser && (
          <div className="typing-indicator">
            <span>{typingUser.username || "Пользователь"} что-то колдует</span>
            <span className="typing-dots">...</span>
          </div>
        )}

        <section className="messages" ref={messagesContainerRef} onScroll={handleMessagesScroll}>
          {!selectedUser && (
            <div className="message bot">Выбери чат или найди пользователя.</div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              id={`message-${msg.id}`}
              className={`message ${
                msg.sender_id === session.user.id ? "me" : "bot"
              } ${msg.message_type === "image" ? "image-message" : ""} ${highlightedMessageId === msg.id ? "message-highlight" : ""}`}
              onTouchStart={() => handleMessageTouchStart(msg)}
              onTouchEnd={handleMessageTouchEnd}
              onTouchMove={handleMessageTouchEnd}
              onMouseDown={() => handleMessageTouchStart(msg)}
              onMouseUp={handleMessageTouchEnd}
              onMouseLeave={handleMessageTouchEnd}
              onClick={() => handleMessageTap(msg)}
              onDoubleClick={() => openMessageMenu(msg)}
              onContextMenu={(event) => handleMessageContextMenu(event, msg)}
            >
              {msg.reply_to_id && (
                <div className="reply-inside">
                  <span>↩ Ответ</span>
                  <p>{msg.reply_text || "сообщение"}</p>
                </div>
              )}

              {msg.message_type === "image" && msg.image_url ? (
                <img
                  className="chat-image"
                  src={msg.image_url}
                  alt="Фото"
                  onClick={(event) => {
                    event.stopPropagation();
                    setFullscreenImage(msg.image_url);
                  }}
                />
              ) : msg.message_type === "audio" && msg.audio_url ? (
                <div className="voice-message clean-voice-message">
                  <span className="voice-icon">🎤</span>
                  <button
                    type="button"
                    className="voice-play-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleVoicePlayback(msg);
                    }}
                  >
                    {voicePlayer.id === msg.id && voicePlayer.playing ? "⏸" : "▶"}
                  </button>
                  <div className="voice-wave-bars" aria-hidden="true">
                    {Array.from({ length: 18 }).map((_, index) => (
                      <span key={index} style={{ "--bar": `${(index % 5) + 1}` }} />
                    ))}
                  </div>
                  <span className="voice-label">{formatVoiceTime(msg.audio_duration || 0)}</span>
                  {msg.text && <div className="media-caption">{msg.text}</div>}
                </div>
              ) : msg.message_type === "circle" && msg.circle_url ? (
                <div className={`circle-message circle-filter-${msg.circle_filter || "normal"}`}>
                  <div className="circle-video-shell">
                    <video
                      id={`circle-video-${msg.id}`}
                      className="circle-chat-video"
                      src={msg.circle_url}
                      playsInline
                      preload="metadata"
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleCirclePlayback(msg);
                      }}
                    />
                    {msg.circle_mask && msg.circle_mask !== "none" && (
                      <div className={`circle-chat-mask circle-mask-${msg.circle_mask}`}>
                        {msg.circle_mask === "glasses"
                          ? "😎"
                          : msg.circle_mask === "crown"
                            ? "👑"
                            : msg.circle_mask === "fire"
                              ? "🔥"
                              : msg.circle_mask === "demon"
                                ? "😈"
                                : msg.circle_mask === "bunny"
                                  ? "🐰"
                                  : ""}
                      </div>
                    )}
                    <div className="circle-seek-controls">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          seekCircleVideo(msg.id, -5);
                        }}
                      >
                        « 5
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          seekCircleVideo(msg.id, 5);
                        }}
                      >
                        5 »
                      </button>
                    </div>
                  </div>
                  <span className="circle-duration">{formatVoiceTime(msg.circle_duration || 0)}</span>
                  {msg.text && <div className="media-caption circle-caption">{msg.text}</div>}
                </div>
              ) : msg.message_type === "file" && msg.file_url ? (
                <button
                  type="button"
                  className="file-message"
                  onClick={(event) => openFileMessage(event, msg)}
                >
                  <span className="file-icon">{getFileIcon(msg.file_name)}</span>
                  <span className="file-info">
                    <strong>{msg.file_name || "Файл"}</strong>
                    <small>{formatFileSize(msg.file_size)} · нажми, чтобы скачать</small>
                    {msg.text && <em className="media-caption file-caption">{msg.text}</em>}
                  </span>
                </button>
              ) : (
                <>
                  {msg.text}
                  {msg.edited_at && <span className="edited-label"> изменено</span>}
                </>
              )}

              {formatReactionSummary(msg.reactions).length > 0 && (
                <div className="message-reactions">
                  {formatReactionSummary(msg.reactions).map((reaction) => (
                    <span
                      key={reaction.emoji}
                      className={`reaction-badge ${getMyReaction(msg) === reaction.emoji ? "active" : ""}`}
                    >
                      {reaction.emoji} {reaction.count}
                    </span>
                  ))}
                </div>
              )}

              {renderMessageStatus(msg)}
            </div>
          ))}

          <div ref={messagesEndRef} />
        </section>

        {!isAtBottom && newMessagesCount > 0 && (
          <button className="new-messages-btn" onClick={jumpToNewMessages}>
            ↓ Новые сообщения {newMessagesCount}
          </button>
        )}

        <footer className="input-area-wrapper">
          {editingMessage && (
            <div className="reply-preview edit-preview">
              <div>
                <strong>Редактирование</strong>
                <p>{editingMessage.text || getReplyPreview(editingMessage)}</p>
              </div>

              <button onClick={() => { setEditingMessage(null); setText(""); }}>×</button>
            </div>
          )}

          {replyTo && (
            <div className="reply-preview">
              <div>
                <strong>Ответ на сообщение</strong>
                <p>{getReplyPreview(replyTo)}</p>
              </div>

              <button onClick={() => setReplyTo(null)}>×</button>
            </div>
          )}

          {isRecording && (
            <div className={`voice-recording-panel ${isVoiceLocked ? "locked" : ""}`}>
              <div className="voice-recording-status">
                <span className="recording-dot">●</span>
                <span>{formatVoiceTime(recordingSeconds)}</span>
                <span>{isVoiceLocked ? "Запись закреплена" : "Потяни вверх, чтобы закрепить"}</span>
              </div>

              {isVoiceLocked && (
                <div className="voice-recording-actions">
                  <button type="button" className="voice-cancel-btn" onClick={cancelVoiceRecording}>
                    Отмена
                  </button>
                  <button type="button" className="voice-send-btn" onClick={finishLockedVoiceRecording}>
                    Отправить
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="input-area telegram-input-area">
            <div className="input-left-actions">
              <button
                type="button"
                className={`circle-open-btn ${isCircleRecording ? "recording" : ""} ${isCircleLocked ? "locked" : ""}`}
                disabled={!selectedChat}
                onClick={() => openCircleRecorder()}
                onMouseDown={handleCircleQuickPressStart}
                onMouseMove={handleCircleQuickMove}
                onMouseUp={handleCircleQuickPressEnd}
                onMouseLeave={handleCircleQuickPressEnd}
                onTouchStart={handleCircleQuickPressStart}
                onTouchMove={handleCircleQuickMove}
                onTouchEnd={handleCircleQuickPressEnd}
                title="Кружочек"
              >
                🎥
              </button>

              <label className={`image-btn ${!selectedChat ? "disabled" : ""}`} title="Прикрепить файл">
                📎
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
                  disabled={!selectedChat}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    if (file.type.startsWith("image/")) {
                      sendImage(event);
                    } else {
                      sendFile(event);
                    }
                  }}
                />
              </label>
            </div>

            <input
              className="telegram-message-input"
              value={text}
              disabled={!selectedChat}
              onChange={handleTextChange}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={
                selectedChat ? "Введите сообщение..." : "Сначала выбери чат"
              }
            />

            {text.trim() || editingMessage ? (
              <button
                type="button"
                className="input-send-btn"
                onClick={sendMessage}
                disabled={!selectedChat}
              >
                {editingMessage ? "✓" : "➤"}
              </button>
            ) : (
              <button
                type="button"
                className={`voice-btn input-voice-right ${isRecording ? "recording" : ""} ${isVoiceLocked ? "locked" : ""}`}
                disabled={!selectedChat}
                onMouseDown={startVoiceRecording}
                onMouseUp={() => !isVoiceLockedRef.current && stopVoiceRecording({ send: true })}
                onMouseLeave={handleVoiceMouseLeave}
                onTouchStart={startVoiceRecording}
                onTouchMove={handleVoiceTouchMove}
                onTouchEnd={handleVoiceTouchEnd}
                title="Голосовое"
              >
                🎤
              </button>
            )}
          </div>
        </footer>
      </main>

      {isChatOptionsOpen && selectedChat && (
        <div
          className="chat-options-backdrop"
          onClick={() => setIsChatOptionsOpen(false)}
        >
          <div
            className="chat-options-menu"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="chat-options-menu-title">Меню чата</div>

            <button
              type="button"
              onClick={() => {
                setIsChatSearchOpen(true);
                setIsChatOptionsOpen(false);
              }}
            >
              🔍 Поиск по сообщениям
            </button>

            <button
              type="button"
              onClick={() => {
                setIsUserProfileOpen(true);
                setIsChatOptionsOpen(false);
              }}
            >
              👤 Перейти в профиль
            </button>

            <label className="chat-menu-file-btn">
              🖼 Поставить свой фон в этом чате
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  uploadPrivateChatBackgroundImage(event);
                  setIsChatOptionsOpen(false);
                }}
              />
            </label>

            {privateChatBackgrounds?.[selectedChat.id] && (
              <button
                type="button"
                onClick={() => {
                  removePrivateChatBackground();
                  setIsChatOptionsOpen(false);
                }}
              >
                🧽 Убрать свой фон этого чата
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                pokeSelectedUser();
                setIsChatOptionsOpen(false);
              }}
            >
              👆 Ткнуть пользователя
            </button>

            <button
              type="button"
              onClick={() => {
                clearChatHistoryForMe(selectedChat);
                setIsChatOptionsOpen(false);
              }}
            >
              🧹 Очистить историю у себя
            </button>

            <button
              type="button"
              onClick={() => {
                clearChatHistoryForAll(selectedChat);
                setIsChatOptionsOpen(false);
              }}
            >
              🧨 Очистить историю у всех
            </button>

            <button
              type="button"
              onClick={() => {
                deleteChatForMe(selectedChat);
                setIsChatOptionsOpen(false);
              }}
            >
              🗑 Удалить чат у себя
            </button>

            <button
              type="button"
              className="danger-action"
              onClick={() => {
                blockUserFromChat(selectedChat);
                setIsChatOptionsOpen(false);
              }}
            >
              🚫 Заблокировать пользователя
            </button>

            <button
              type="button"
              className="cancel-action"
              onClick={() => setIsChatOptionsOpen(false)}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      <UserProfile
        isOpen={isUserProfileOpen}
        user={selectedUser}
        chat={selectedChat}
        isOnline={isUserOnline(selectedUser)}
        renderAvatar={renderAvatar}
        onClose={() => setIsUserProfileOpen(false)}
        onClearHistory={() => selectedChat && clearChatHistoryForMe(selectedChat)}
        onDeleteChat={() => selectedChat && deleteChatForMe(selectedChat)}
        onBlockUser={() => selectedChat && blockUserFromChat(selectedChat)}
      />

      <MessageMenu
        actionMessage={actionMessage}
        forwardMessage={forwardMessage}
        myChats={myChats}
        session={session}
        renderAvatar={renderAvatar}
        closeMessageMenu={closeMessageMenu}
        replyFromMenu={replyFromMenu}
        startForwardFromMenu={startForwardFromMenu}
        deleteMessageForMe={deleteMessageForMe}
        deleteMessage={deleteMessage}
        setForwardMessage={setForwardMessage}
        forwardToChat={forwardToChat}
        reactToMessage={reactToMessage}
        getMyReaction={getMyReaction}
        togglePinMessage={togglePinMessage}
        startEditMessage={startEditMessage}
      />

      {isAppearanceOpen && (
        <div className="message-menu-backdrop" onClick={() => setIsAppearanceOpen(false)}>
          <div className="appearance-modal" onClick={(event) => event.stopPropagation()}>
            <div className="blocked-users-header">
              <h3>🎨 Оформление</h3>
              <button type="button" onClick={() => setIsAppearanceOpen(false)}>×</button>
            </div>

            <div className="appearance-section">
              <p>Тема</p>
              <div className="appearance-buttons">
                <button type="button" className={theme === "dark" ? "active" : ""} onClick={() => setTheme("dark")}>🌙 Тёмная</button>
                <button type="button" className={theme === "light" ? "active" : ""} onClick={() => setTheme("light")}>☀️ Светлая</button>
              </div>
            </div>

            <div className="appearance-section">
              <p>Обои чата</p>
              <div className="wallpaper-grid">
                {["aurora", "cosmos", "neon", "sunset", "ocean", "rain", "forest", "cyber", "ice", "violet", "fire", "minimal"].map((item) => (
                  <button
                    type="button"
                    key={item}
                    className={`wallpaper-choice wallpaper-${item} ${chatWallpaper === item ? "active" : ""}`}
                    onClick={() => setChatWallpaper(item)}
                    aria-label={item}
                  />
                ))}
              </div>
            </div>

            <div className="appearance-section">
              <p>Пузырьки</p>
              <div className="appearance-buttons">
                <button type="button" className={bubbleStyle === "round" ? "active" : ""} onClick={() => setBubbleStyle("round")}>Круглые</button>
                <button type="button" className={bubbleStyle === "compact" ? "active" : ""} onClick={() => setBubbleStyle("compact")}>Компактные</button>
                <button type="button" className={bubbleStyle === "telegram" ? "active" : ""} onClick={() => setBubbleStyle("telegram")}>Telegram</button>
              </div>
            </div>

            <div className="appearance-section">
              <p>Шрифт</p>
              <div className="appearance-buttons">
                <button type="button" className={chatFontSize === "small" ? "active" : ""} onClick={() => setChatFontSize("small")}>Мелкий</button>
                <button type="button" className={chatFontSize === "normal" ? "active" : ""} onClick={() => setChatFontSize("normal")}>Обычный</button>
                <button type="button" className={chatFontSize === "large" ? "active" : ""} onClick={() => setChatFontSize("large")}>Крупный</button>
              </div>
            </div>

            <div className="appearance-section">
              <p>Звук уведомлений</p>
              <div className="appearance-buttons vertical">
                <button type="button" className={notificationSound === "qweek" ? "active" : ""} onClick={() => { setNotificationSound("qweek"); playNotificationSound("qweek"); }}>qweek</button>
                <button type="button" className={notificationSound === "oi" ? "active" : ""} onClick={() => { setNotificationSound("oi"); playNotificationSound("oi"); }}>ой ой</button>
                <button type="button" className={notificationSound === "glass" ? "active" : ""} onClick={() => { setNotificationSound("glass"); playNotificationSound("glass"); }}>бьющееся стекло</button>
                <button type="button" className={notificationSound === "ding" ? "active" : ""} onClick={() => { setNotificationSound("ding"); playNotificationSound("ding"); }}>цзынь-цзынь</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isMyProfileOpen && (
        <div className="message-menu-backdrop" onClick={() => setIsMyProfileOpen(false)}>
          <div className="my-profile-modal" onClick={(event) => event.stopPropagation()}>
            <div className="blocked-users-header">
              <h3>👤 Мой профиль</h3>
              <button type="button" onClick={() => setIsMyProfileOpen(false)}>×</button>
            </div>

            <div
              className={`my-profile-cover wallpaper-${profileCover} ${getVisibleProfileHeaderImage() ? "has-custom-cover" : ""}`}
              style={getVisibleProfileHeaderImage() ? {
                "--profile-header-bg": `url(${getVisibleProfileHeaderImage()})`,
                backgroundImage: `linear-gradient(rgba(2, 6, 23, 0.18), rgba(2, 6, 23, 0.22)), url(${getVisibleProfileHeaderImage()})`,
              } : undefined}
            >
              <label className="profile-big-avatar editable-avatar">
                <input type="file" accept="image/*" onChange={uploadAvatar} />
                {renderAvatar(profile)}
              </label>
            </div>

            <div className="profile-upload-row">
              <label className="profile-upload-btn">
                🖼 Шапка профиля
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => uploadProfileBackgroundImage(event, "profile-header")}
                />
              </label>

              <label className="profile-upload-btn">
                🌌 Фон чата
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => uploadProfileBackgroundImage(event, "chat-header")}
                />
              </label>
            </div>

            <div className="appearance-section">
              <p>Никнейм</p>
              <input
                className="profile-input"
                value={profileNickname}
                onChange={(event) => setProfileNickname(event.target.value)}
                placeholder="Например: FIRSOVICH"
                maxLength={32}
              />
            </div>

            <div className="appearance-section">
              <p>Описание</p>
              <textarea
                className="profile-textarea"
                value={profileDescription}
                onChange={(event) => setProfileDescription(event.target.value)}
                placeholder="Например: на смене, делаю Ириску 🍬"
                maxLength={120}
              />
            </div>

            <div className="appearance-section">
              <p>Статус</p>
              <div className="appearance-buttons vertical">
                {["В сети", "На работе", "Сплю", "Не беспокоить", "Пью кофе", "На смене", "Играю", "В дороге"].map((status) => (
                  <button
                    type="button"
                    key={status}
                    className={profileStatus === status ? "active" : ""}
                    onClick={() => setProfileStatus(status)}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="appearance-section">
              <p>Дата регистрации</p>
              <div className="profile-date-box">
                {session?.user?.created_at ? new Date(session.user.created_at).toLocaleDateString("ru-RU") : "—"}
              </div>
            </div>

            <div className="appearance-section">
              <p>Фон профиля</p>
              <div className="wallpaper-grid">
                {["aurora", "cosmos", "neon", "sunset", "ocean", "rain", "forest", "cyber", "ice", "violet", "fire", "minimal"].map((item) => (
                  <button
                    type="button"
                    key={item}
                    className={`wallpaper-choice wallpaper-${item} ${profileCover === item ? "active" : ""}`}
                    onClick={() => setProfileCover(item)}
                    aria-label={item}
                  />
                ))}
              </div>
            </div>

            <div className="appearance-section">
              <p>Изменить пароль</p>
              <div className="password-change-row">
                <input
                  className="profile-input"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Новый пароль"
                  autoComplete="new-password"
                />
                <button type="button" onClick={changeMyPassword}>
                  Изменить
                </button>
              </div>
            </div>

            <button type="button" className="profile-save-btn" onClick={saveMyProfileSettings}>
              💾 Сохранить профиль
            </button>
          </div>
        </div>
      )}

      {isBlockedUsersOpen && (
        <div className="message-menu-backdrop" onClick={() => setIsBlockedUsersOpen(false)}>
          <div className="blocked-users-modal" onClick={(event) => event.stopPropagation()}>
            <div className="blocked-users-header">
              <h3>🚫 Заблокированные</h3>
              <button type="button" onClick={() => setIsBlockedUsersOpen(false)}>×</button>
            </div>

            {blockedUsers.length === 0 ? (
              <p className="empty">Заблокированных пользователей нет</p>
            ) : (
              blockedUsers.map((user) => (
                <div className="blocked-user-item" key={user.id}>
                  <div className="avatar">{renderAvatar(user)}</div>
                  <div>
                    <strong>{user.username || "Пользователь"}</strong>
                    <p>{isUserOnline(user) ? "онлайн" : "офлайн"}</p>
                  </div>
                  <button type="button" onClick={() => unblockUser(user.id)}>
                    Разблокировать
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}


      {isCircleRecorderOpen && (
        <div
          className="circle-recorder-backdrop"
          onClick={() => {
            if (!isCircleRecording) closeCircleRecorder();
          }}
          onTouchStart={handleCircleModalGestureStart}
          onTouchMove={handleCircleModalGestureMove}
          onTouchEnd={handleCircleModalGestureEnd}
          onMouseDown={handleCircleModalGestureStart}
          onMouseMove={handleCircleModalGestureMove}
        >
          <div className="circle-recorder-modal telegram-circle-modal" onClick={(event) => event.stopPropagation()}>
            <div className="circle-recorder-header">
              <div>
                <h3>Кружочек</h3>
                <p>
                  {isCircleRecording
                    ? circleRecordHint || "Записывает кружочек…"
                    : circlePreviewUrl
                      ? "Пересмотри и отправь"
                      : "Ретушь включена"}
                </p>
              </div>
              <button type="button" onClick={closeCircleRecorder} disabled={isCircleRecording}>×</button>
            </div>

            {(isCircleRecording || circlePreviewUrl) && (
              <div className="circle-progress-info">
                <span>{isCircleRecording ? "● Записывает кружочек…" : "Готово к отправке"}</span>
                <strong>{formatVoiceTime(circleSeconds)} / 01:00</strong>
              </div>
            )}

            <div
              className={`circle-camera-wrap circle-filter-smooth ${isCircleRecording ? "recording" : ""}`}
              style={{ "--circle-progress": `${Math.min(360, (circleSeconds / 60) * 360)}deg` }}
            >
              {!circlePreviewUrl ? (
                <video
                  ref={circleVideoRef}
                  className="circle-camera-video"
                  muted
                  playsInline
                  autoPlay
                  onClick={handleCirclePreviewTap}
                  onTouchEnd={handleCirclePreviewTap}
                />
              ) : (
                <>
                  <video
                    id="circle-preview-video"
                    className="circle-camera-video circle-preview-video"
                    src={circlePreviewUrl}
                    controls
                    playsInline
                    preload="auto"
                  />
                  <button
                    type="button"
                    className="circle-preview-play"
                    onClick={() => {
                      const video = document.getElementById("circle-preview-video");
                      if (!video) return;
                      video.currentTime = 0;
                      video.play?.().catch(() => {});
                    }}
                  >
                    ▶
                  </button>
                </>
              )}

              {isCircleRecording && <div className="circle-rec-dot">REC</div>}
            </div>

            <div className="circle-gesture-hints">
              {!circlePreviewUrl && (
                <>
                  <span>⬆ вверх — закрепить</span>
                  <span>⬅ влево — отмена</span>
                  <span>⏹ стоп — предпросмотр</span>
                </>
              )}
            </div>

            {isCircleRecording && (
              <div className={`circle-lock-status ${isCircleLocked ? "locked" : ""}`}>
                {isCircleLocked ? "🔒 Запись закреплена" : "Потяни вверх для блокировки или влево для отмены"}
              </div>
            )}

            <div className="circle-recorder-actions telegram-circle-actions">
              {!circlePreviewUrl ? (
                <>
                  {!isCircleRecording ? (
                    <button
                      type="button"
                      className="circle-record-btn"
                      onMouseDown={handleCircleQuickPressStart}
                      onMouseMove={handleCircleQuickMove}
                      onMouseUp={handleCircleQuickPressEnd}
                      onMouseLeave={handleCircleQuickPressEnd}
                      onTouchStart={handleCircleQuickPressStart}
                      onTouchMove={handleCircleQuickMove}
                      onTouchEnd={handleCircleQuickPressEnd}
                    >
                      Удерживать запись
                    </button>
                  ) : (
                    <>
                      <button type="button" className="circle-redo-btn" onClick={cancelCircleRecording}>
                        Отмена
                      </button>
                      <button type="button" className="circle-stop-btn" onClick={() => stopCircleRecording()}>
                        Стоп
                      </button>
                    </>
                  )}
                </>
              ) : (
                <>
                  <button type="button" className="circle-redo-btn" onClick={() => {
                    if (circlePreviewUrl) URL.revokeObjectURL(circlePreviewUrl);
                    setCirclePreviewUrl(null);
                    setCircleBlob(null);
                    setCircleSeconds(0);
                    setCircleRecordHint("Ретушь включена");
                    if (circleVideoRef.current && circleStreamRef.current) {
                      circleVideoRef.current.srcObject = circleStreamRef.current;
                      circleVideoRef.current.play?.().catch(() => {});
                    }
                  }}>
                    Перезаписать
                  </button>
                  <button type="button" className="circle-send-btn" onClick={sendCircleMessage}>
                    Отправить
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {callState.status !== "idle" && (
        <div className="call-backdrop">
          <div className={`call-modal call-${callState.type} ${isCallSelfFullScreen ? "self-fullscreen" : ""}`}>
            <div className="call-header">
              <div className="call-peer-avatar">
                {renderAvatar(callState.peerUser || selectedUser)}
              </div>
              <h3>
                {callState.status === "incoming"
                  ? "Входящий звонок"
                  : callState.status === "outgoing"
                    ? "Звонок..."
                    : callState.type === "video"
                      ? "Видеозвонок"
                      : "Аудиозвонок"}
              </h3>
              <p>{callState.peerUser?.username || selectedUser?.username || "Пользователь"}</p>
            </div>

            <audio ref={remoteAudioRef} className="remote-call-audio" autoPlay playsInline />

            {callState.type === "video" ? (
              <div className="call-video-grid">
                <video
                  ref={isCallSelfFullScreen ? localVideoRef : remoteVideoRef}
                  className="remote-call-video"
                  playsInline
                  autoPlay
                  muted={isCallSelfFullScreen}
                />
                <video
                  ref={isCallSelfFullScreen ? remoteVideoRef : localVideoRef}
                  className="local-call-video"
                  playsInline
                  autoPlay
                  muted={!isCallSelfFullScreen}
                  onClick={handleCallSelfPreviewTap}
                  onTouchEnd={handleCallSelfPreviewTap}
                  title="Тап — развернуть, двойной тап — сменить камеру"
                />
                <div className="call-preview-hint">тап — экран / двойной тап — камера</div>
              </div>
            ) : (
              <div className="audio-call-visual audio-call-visual-clean">
                <div className="audio-pulse">
                  {renderAvatar(callState.peerUser || selectedUser)}
                </div>
                <span>
                  {callState.status === "active"
                    ? "Соединение активно"
                    : callState.status === "incoming"
                      ? "Звонит тебе"
                      : "Ожидаем ответа"}
                </span>
                <div className="audio-self-mini">
                  {renderAvatar(profile)}
                </div>
              </div>
            )}

            {!callAudioUnlocked && (
              <button
                type="button"
                className="call-audio-unlock"
                onClick={() => {
                  setCallAudioUnlocked(true);
                  attachCallStreams();
                  remoteAudioRef.current?.play?.().catch(() => {});
                  remoteVideoRef.current?.play?.().catch(() => {});
                  playCallSound("accept");
                }}
              >
                🔊 Включить звук
              </button>
            )}

            <div className="call-controls">
              {callState.status === "incoming" ? (
                <>
                  <button type="button" className="call-accept" onClick={acceptCall}>
                    Принять
                  </button>
                  <button type="button" className="call-decline" onClick={rejectCall}>
                    Отклонить
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className={isCallMuted ? "call-muted active" : "call-muted"} onClick={toggleCallMute}>
                    {isCallMuted ? "Микрофон выкл" : "Микрофон"}
                  </button>

                  {callState.type === "video" && (
                    <button type="button" className={isCallCameraOff ? "call-camera active" : "call-camera"} onClick={toggleCallCamera}>
                      {isCallCameraOff ? "Камера выкл" : "Камера"}
                    </button>
                  )}

                  <button type="button" className="call-decline" onClick={endCall}>
                    Завершить
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {fullscreenImage && (
        <div className="photo-viewer" onClick={() => setFullscreenImage(null)}>
          <button type="button" className="photo-viewer-close" onClick={() => setFullscreenImage(null)}>×</button>
          <img src={fullscreenImage} alt="Фото" onClick={(event) => event.stopPropagation()} />
        </div>
      )}

      {actionChat && (
        <div className="message-menu-backdrop" onClick={closeChatMenu}>
          <div className="message-action-menu" onClick={(event) => event.stopPropagation()}>
            <div className="message-action-title">
              {actionChat.otherUser?.username || "Чат"}
            </div>

            <button
              onClick={() => {
                const chat = actionChat;
                closeChatMenu();
                openExistingChat(chat);
              }}
            >
              💬 Открыть чат
            </button>

            <button onClick={() => clearChatHistoryForMe(actionChat)}>
              🧹 Очистить историю у себя
            </button>

            <button onClick={() => clearChatHistoryForAll(actionChat)}>
              🧨 Очистить историю у всех
            </button>

            <button onClick={() => deleteChatForMe(actionChat)}>
              🗑 Удалить чат у себя
            </button>

            <button className="danger-action" onClick={() => blockUserFromChat(actionChat)}>
              🚫 Заблокировать пользователя
            </button>

            <button className="cancel-action" onClick={closeChatMenu}>
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
