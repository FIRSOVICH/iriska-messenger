import { useEffect, useState } from "react";
import "./App.css";
import { supabase } from "./supabase";

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

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    createProfileIfMissing();
    loadMyChats();
  }, [session]);

  useEffect(() => {
    if (!selectedChat?.id) return;

    loadMessages(selectedChat.id);

    const channel = supabase
      .channel(`private-chat-${selectedChat.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${selectedChat.id}`,
        },
        (payload) => {
          setMessages((current) => {
            const exists = current.some((msg) => msg.id === payload.new.id);
            if (exists) return current;
            return [...current, payload.new];
          });
        }
      )
      .subscribe((status) => {
        console.log("REALTIME:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChat]);

  async function register() {
    if (!username || !email || !password) {
      setAuthMessage("Заполни логин, email и пароль");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: SITE_URL,
        data: { username },
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });

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
      .single();

    if (existingProfile) {
      setProfile(existingProfile);
      return;
    }

    const name = user.user_metadata?.username || user.email.split("@")[0];

    const { data, error } = await supabase
      .from("profiles")
      .insert({ id: user.id, username: name })
      .select()
      .single();

    if (error) {
      console.error("PROFILE CREATE ERROR:", error);
      return;
    }

    setProfile(data);
  }

  async function loadMyChats() {
    const { data, error } = await supabase
      .from("private_chats")
      .select("*")
      .or(`user_one.eq.${session.user.id},user_two.eq.${session.user.id}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("LOAD CHATS ERROR:", error);
      return;
    }

    const chats = await Promise.all(
      (data || []).map(async (chat) => {
        const otherId = chat.user_one === session.user.id ? chat.user_two : chat.user_one;

        const { data: otherUser } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", otherId)
          .single();

        return { ...chat, otherUser };
      })
    );

    setMyChats(chats);
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
      .ilike("username", `%${value}%`)
      .neq("id", session.user.id);

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

    const { data: existingChat } = await supabase
      .from("private_chats")
      .select("*")
      .eq("user_one", user_one)
      .eq("user_two", user_two)
      .single();

    let chat = existingChat;

    if (!chat) {
      const { data: newChat, error } = await supabase
        .from("private_chats")
        .insert({ user_one, user_two })
        .select()
        .single();

      if (error) {
        console.error("CREATE CHAT ERROR:", error);
        return;
      }

      chat = newChat;
    }

    setSelectedChat(chat);
    setSelectedUser(user);
    setMessages([]);
    setSearch("");
    setSearchResults([]);
    setShowSidebar(false);
    await loadMyChats();
  }

  function openExistingChat(chat) {
    setSelectedChat(chat);
    setSelectedUser(chat.otherUser);
    setMessages([]);
    setShowSidebar(false);
  }

  async function loadMessages(chatId) {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("LOAD MESSAGES ERROR:", error);
      return;
    }

    setMessages(data || []);
  }

  async function sendMessage() {
    console.log("SEND CLICK");

    if (!text.trim() || !selectedChat) return;

    const tempId = crypto.randomUUID();
    const messageText = text.trim();

    const localMessage = {
      id: tempId,
      sender_id: session.user.id,
      chat_id: selectedChat.id,
      text: messageText,
      created_at: new Date().toISOString(),
      pending: true,
    };

    setMessages((current) => [...current, localMessage]);
    setText("");

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: session.user.id,
        chat_id: selectedChat.id,
        text: messageText,
      })
      .select()
      .single();

    if (error) {
      console.error("SEND MESSAGE ERROR:", error);
      return;
    }

    setMessages((current) =>
      current.map((msg) => (msg.id === tempId ? data : msg))
    );

    await loadMyChats();
  }

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setMyChats([]);
    setMessages([]);
    setSelectedChat(null);
    setSelectedUser(null);
  }

  if (!session) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>🍬 Ириска</h1>
          <p>Регистрация и вход</p>

          {mode === "register" && (
            <input placeholder="Логин" value={username} onChange={(e) => setUsername(e.target.value)} />
          )}

          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input placeholder="Пароль" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

          <button onClick={mode === "login" ? login : register}>
            {mode === "login" ? "Войти" : "Создать аккаунт"}
          </button>

          <span onClick={() => setMode(mode === "login" ? "register" : "login")}>
            {mode === "login" ? "Нет аккаунта? Регистрация" : "Уже есть аккаунт? Войти"}
          </span>

          {authMessage && <p className="auth-message">{authMessage}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className={`sidebar ${showSidebar ? "show" : "hide"}`}>
        <div className="logo">
          <span>🍬</span>
          <div>
            <h1>Ириска</h1>
            <p>{profile?.username || session.user.email}</p>
          </div>
        </div>

        <button className="logout" onClick={logout}>Выйти</button>

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
              <div className="chat-item" key={user.id} onClick={() => openChatWithUser(user)}>
                <div className="avatar">🔎</div>
                <div>
                  <h3>{user.username}</h3>
                  <p>начать личный чат</p>
                </div>
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
              <div className="avatar">👤</div>
              <div>
                <h3>{chat.otherUser?.username || "Пользователь"}</h3>
                <p>личный чат</p>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main className={`chat ${showSidebar ? "mobile-hidden" : ""}`}>
        <header className="chat-header">
          <button className="back-btn" onClick={() => setShowSidebar(true)}>←</button>
          <div>
            <h2>{selectedUser ? selectedUser.username : "Выбери чат"}</h2>
            <p>{selectedUser ? "личный защищённый чат" : "найди пользователя слева"}</p>
          </div>
        </header>

        <section className="messages">
          {!selectedUser && (
            <div className="message bot">
              Выбери чат или найди пользователя.
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`message ${msg.sender_id === session.user.id ? "me" : "bot"}`}
            >
              {msg.text}
            </div>
          ))}
        </section>

        <footer className="input-area">
          <input
            value={text}
            disabled={!selectedChat}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder={selectedChat ? "Введите сообщение..." : "Сначала выбери чат"}
          />
          <button onClick={sendMessage} disabled={!selectedChat}>Отправить</button>
        </footer>
      </main>
    </div>
  );
}

export default App;