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
  const [showSidebar, setShowSidebar] = useState(true);
  const [replyTo, setReplyTo] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [forwardMessage, setForwardMessage] = useState(null);
  const [hiddenMessageIds, setHiddenMessageIds] = useState([]);
  const [hiddenChatIds, setHiddenChatIds] = useState([]);
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
  const [typingUser, setTypingUser] = useState(null);
  const [pinnedMessages, setPinnedMessages] = useState([]);

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
  const chatLongPressTimerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const voiceChunksRef = useRef([]);
  const shouldSendVoiceRef = useRef(true);
  const recordingTouchStartYRef = useRef(null);
  const recordingMouseStartYRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const activeAudioRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const lastTypingUpdateRef = useRef(0);
  const isRecordingRef = useRef(false);
  const isVoiceLockedRef = useRef(false);
  const hiddenChatIdsRef = useRef([]);
  const blockedUserIdsRef = useRef([]);

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
    blockedUserIdsRef.current = blockedUserIds;
  }, [blockedUserIds]);

  useEffect(() => {
    if (!session?.user?.id) {
      setHiddenMessageIds([]);
      setHiddenChatIds([]);
      setBlockedUserIds([]);
      return;
    }

    const savedHiddenMessages = localStorage.getItem(
      `iriska_hidden_messages_${session.user.id}`
    );
    const savedHiddenChats = localStorage.getItem(
      `iriska_hidden_chats_${session.user.id}`
    );
    const savedBlockedUsers = localStorage.getItem(
      `iriska_blocked_users_${session.user.id}`
    );

    setHiddenMessageIds(savedHiddenMessages ? JSON.parse(savedHiddenMessages) : []);
    setHiddenChatIds(savedHiddenChats ? JSON.parse(savedHiddenChats) : []);
    setBlockedUserIds(savedBlockedUsers ? JSON.parse(savedBlockedUsers) : []);
  }, [session?.user?.id]);

  useEffect(() => {
    return () => cleanupVoiceMouseListeners();
  }, []);

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
    if (!selectedChat?.id) return;

    const interval = setInterval(() => {
      loadMessages(selectedChat.id);
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedChat?.id]);

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

  async function updateOnlineStatus() {
    const currentSession = sessionRef.current || session;
    if (!currentSession?.user?.id) return;

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
          unreadCount,
        };
      })
    );

    const visibleChats = chats.filter((chat) => {
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

  function saveBlockedUsers(nextBlockedUserIds) {
    const currentSession = sessionRef.current || session;
    if (!currentSession?.user?.id) return;

    localStorage.setItem(
      `iriska_blocked_users_${currentSession.user.id}`,
      JSON.stringify(nextBlockedUserIds)
    );
    blockedUserIdsRef.current = nextBlockedUserIds;
    setBlockedUserIds(nextBlockedUserIds);
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

    const ok = confirm("Удалить чат у себя?");
    if (!ok) return;

    const nextHiddenChatIds = Array.from(new Set([...hiddenChatIds, chat.id]));
    saveHiddenChats(nextHiddenChatIds);
    setMyChats((current) => current.filter((item) => item.id !== chat.id));

    if (selectedChat?.id === chat.id) {
      setSelectedChat(null);
      setSelectedUser(null);
      setMessages([]);
      setReplyTo(null);
      if (isMobile()) setShowSidebar(true);
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

    await loadMyChats();
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
      const nextHiddenChatIds = Array.from(new Set([...hiddenChatIds, chat.id]));
      saveHiddenChats(nextHiddenChatIds);
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
    closeMessageMenu();
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
    const forwardedText =
      isImage || isAudio
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
        message_type: isImage ? "image" : isAudio ? "audio" : "text",
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

    const { error } = await supabase
      .from("messages")
      .update({
        is_deleted: true,
        text: "",
        image_url: null,
      })
      .eq("id", messageId)
      .eq("sender_id", session.user.id);

    if (error) {
      console.error("DELETE MESSAGE ERROR:", error);
      alert("Не удалось удалить сообщение");
      return;
    }

    setMessages((current) => current.filter((msg) => msg.id !== messageId));

    if (replyTo?.id === messageId) {
      setReplyTo(null);
    }

    if (selectedChat?.id) {
      await loadMessages(selectedChat.id);
    }

    closeMessageMenu();
    await loadMyChats();
  }

  async function sendMessage() {
    updateTypingStatus(false);
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
    return message.text || "Сообщение";
  }

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

        voiceChunksRef.current = [];
        mediaRecorderRef.current = null;
        isRecordingRef.current = false;
        isVoiceLockedRef.current = false;
        setIsRecording(false);
        setIsVoiceLocked(false);
        setRecordingSeconds(0);

        if (shouldSend && audioBlob.size > 0) {
          await sendVoice(audioBlob);
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

  async function sendVoice(audioBlob) {
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
    <div className="app">
      <aside className={`sidebar ${showSidebar ? "show" : "hide"}`}>
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

        <button className="logout" onClick={logout}>
          Выйти
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

        <div className="block">
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

      <main className={`chat ${showSidebar ? "mobile-hidden" : ""}`}>
        <header className="chat-header">
          <button className="back-btn" onClick={() => setShowSidebar(true)}>
            ←
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
              <h2>{selectedUser ? selectedUser.username : "Выбери чат"}</h2>
              <p>
                {selectedUser
                  ? isUserOnline(selectedUser)
                    ? "онлайн"
                    : "офлайн"
                  : "найди пользователя слева"}
              </p>
            </div>
          </button>

          {selectedChat && (
            <button
              type="button"
              className="chat-options-btn"
              onClick={() => setIsChatOptionsOpen((value) => !value)}
              aria-label="Меню чата"
            >
              ⋮
            </button>
          )}

          {isChatOptionsOpen && selectedChat && (
            <div className="chat-options-menu">
              <button
                type="button"
                onClick={() => {
                  setIsUserProfileOpen(true);
                  setIsChatOptionsOpen(false);
                }}
              >
                👤 Перейти в профиль
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
            </div>
          )}
        </header>

        {pinnedMessages.length > 0 && (
          <div className="pinned-messages-panel">
            <div className="pinned-title">📌 Закреплено</div>
            {pinnedMessages.slice(0, 3).map((message) => (
              <div key={message.id} className="pinned-message-item">
                {renderPinnedText(message)}
              </div>
            ))}
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
              className={`message ${
                msg.sender_id === session.user.id ? "me" : "bot"
              } ${msg.message_type === "image" ? "image-message" : ""}`}
              onTouchStart={() => handleMessageTouchStart(msg)}
              onTouchEnd={handleMessageTouchEnd}
              onTouchMove={handleMessageTouchEnd}
              onMouseDown={() => handleMessageTouchStart(msg)}
              onMouseUp={handleMessageTouchEnd}
              onMouseLeave={handleMessageTouchEnd}
              onContextMenu={(event) => handleMessageContextMenu(event, msg)}
            >
              {msg.reply_to_id && (
                <div className="reply-inside">
                  <span>↩ Ответ</span>
                  <p>{msg.reply_text || "сообщение"}</p>
                </div>
              )}

              {msg.message_type === "image" && msg.image_url ? (
                <img className="chat-image" src={msg.image_url} alt="Фото" />
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
                  <span className="voice-label">Голосовое</span>
                </div>
              ) : (
                msg.text
              )}

              {formatReactionSummary(msg.reactions).length > 0 && (
                <div className="message-reactions">
                  {formatReactionSummary(msg.reactions).map((reaction) => (
                    <span key={reaction.emoji} className="reaction-badge">
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

          <div className="input-area">
            <label className={`image-btn ${!selectedChat ? "disabled" : ""}`}>
              📎
              <input
                type="file"
                accept="image/*"
                disabled={!selectedChat}
                onChange={sendImage}
              />
            </label>

            <button
              type="button"
              className={`voice-btn ${isRecording ? "recording" : ""} ${isVoiceLocked ? "locked" : ""}`}
              disabled={!selectedChat}
              onMouseDown={startVoiceRecording}
              onMouseMove={handleVoiceMouseMove}
              onMouseUp={() => !isVoiceLockedRef.current && stopVoiceRecording({ send: true })}
              onMouseLeave={handleVoiceMouseLeave}
              onTouchStart={startVoiceRecording}
              onTouchMove={handleVoiceTouchMove}
              onTouchEnd={handleVoiceTouchEnd}
            >
              {isRecording ? "●" : "🎤"}
            </button>

            <input
              value={text}
              disabled={!selectedChat}
              onChange={handleTextChange}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={
                selectedChat ? "Введите сообщение..." : "Сначала выбери чат"
              }
            />

            <button onClick={sendMessage} disabled={!selectedChat}>
              Отправить
            </button>
          </div>
        </footer>
      </main>

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
        togglePinMessage={togglePinMessage}
      />

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
