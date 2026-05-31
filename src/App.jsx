import { useEffect, useRef, useState } from "react";
import "./App.css";
import { supabase } from "./supabase";
import Auth from "./components/Auth";
import MessageMenu from "./components/MessageMenu";
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
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMessagesCount, setNewMessagesCount] = useState(0);

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
    if (!session?.user?.id) {
      setHiddenMessageIds([]);
      return;
    }

    const saved = localStorage.getItem(`iriska_hidden_messages_${session.user.id}`);
    setHiddenMessageIds(saved ? JSON.parse(saved) : []);
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
        async () => {
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

  function markChatAsRead(chatId) {
    localStorage.setItem(getReadKey(chatId), new Date().toISOString());
    loadMyChats();
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
          .limit(1);

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
          if (!lastRead) return true;
          return new Date(msg.created_at) > new Date(lastRead);
        }).length;

        return {
          ...chat,
          otherUser,
          lastMessage: lastMessages?.[0] || null,
          unreadCount,
        };
      })
    );

    setMyChats(chats);

    const currentSelected = selectedChatRef.current;
    if (currentSelected?.id) {
      const updated = chats.find((chat) => chat.id === currentSelected.id);
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

    setSearchResults(data || []);
  }

  async function openChatWithUser(user) {
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

    if (hasNewMessage && !isAtBottomRef.current) {
      setNewMessagesCount((count) => count + 1);
    }
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
    const forwardedText = isImage
      ? ""
      : `↪ Переслано\n${forwardMessage.text || "сообщение"}`;

    const { error } = await supabase
      .from("messages")
      .insert({
        sender_id: session.user.id,
        chat_id: chat.id,
        text: forwardedText,
        image_url: isImage ? forwardMessage.image_url : null,
        message_type: isImage ? "image" : "text",
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
    if (!text.trim() || !selectedChat?.id) return;

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
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !selectedChat?.id || !session?.user?.id) return;

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
    setHiddenMessageIds([]);
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
        </header>

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
              ) : (
                msg.text
              )}
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

            <input
              value={text}
              disabled={!selectedChat}
              onChange={(e) => setText(e.target.value)}
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
      />
    </div>
  );
}

export default App;
