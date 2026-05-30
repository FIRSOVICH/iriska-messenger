import { useEffect, useState } from "react";
import "./App.css";
import { supabase } from "./supabase";

const SITE_URL = "https://iriska-messenger.vercel.app";

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [search, setSearch] = useState("");

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
    loadUsers();
  }, [session]);

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

    const nameFromMeta = user.user_metadata?.username || user.email.split("@")[0];

    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        username: nameFromMeta,
      })
      .select()
      .single();

    if (error) {
      console.error("PROFILE CREATE ERROR:", error);
      return;
    }

    setProfile(data);
  }

  async function loadUsers() {
    const { data, error } = await supabase.from("profiles").select("*");

    if (error) {
      console.error("LOAD USERS ERROR:", error);
      return;
    }

    setUsers(data || []);
  }

  async function openChatWithUser(user) {
    setSelectedUser(user);

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
    loadMessages(chat.id);
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

    const localMessage = {
      id: Date.now(),
      sender_id: session.user.id,
      chat_id: selectedChat.id,
      text: text.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((current) => [...current, localMessage]);
    setText("");

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: session.user.id,
        chat_id: selectedChat.id,
        text: localMessage.text,
      })
      .select()
      .single();

    if (error) {
      console.error("SEND MESSAGE ERROR:", error);
      return;
    }

    setMessages((current) =>
      current.map((msg) => (msg.id === localMessage.id ? data : msg))
    );
  }

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setMessages([]);
    setSelectedUser(null);
    setSelectedChat(null);
  }

  const filteredUsers = users.filter((user) => {
    if (user.id === session?.user?.id) return false;
    return user.username.toLowerCase().includes(search.toLowerCase());
  });

  if (!session) {
    return (
      <div className="app auth-page">
        <div className="auth-card">
          <h1>🍬 Ириска</h1>
          <p>Регистрация и вход</p>

          {mode === "register" && (
            <input
              placeholder="Логин"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          )}

          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            placeholder="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={mode === "login" ? login : register}>
            {mode === "login" ? "Войти" : "Создать аккаунт"}
          </button>

          <span onClick={() => setMode(mode === "login" ? "register" : "login")}>
            {mode === "login" ? "Нет аккаунта? Регистрация" : "Уже есть аккаунт? Войти"}
          </span>

          {authMessage && <p>{authMessage}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <span>🍬</span>
          <div>
            <h1>Ириска</h1>
            <p>{profile?.username || session.user.email}</p>
          </div>
        </div>

        <button className="new-chat" onClick={logout}>
          Выйти
        </button>

        <input
          placeholder="Поиск пользователей..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "14px",
            borderRadius: "12px",
            border: "none",
            outline: "none",
          }}
        />

        <div className="chat-list">
          {filteredUsers.map((user) => (
            <div
              className={`chat-item ${selectedUser?.id === user.id ? "active" : ""}`}
              key={user.id}
              onClick={() => openChatWithUser(user)}
            >
              <div className="avatar">👤</div>
              <div>
                <h3>{user.username}</h3>
                <p>нажми, чтобы открыть чат</p>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main className="chat">
        <header className="chat-header">
          <div>
            <h2>{selectedUser ? selectedUser.username : "Выбери пользователя"}</h2>
            <p>{selectedUser ? "личный чат" : "поиск слева"}</p>
          </div>
        </header>

        <section className="messages">
          {!selectedUser && (
            <div className="message bot">
              Найди пользователя слева и открой личный чат.
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
            placeholder={
              selectedChat ? "Введите сообщение..." : "Сначала выбери пользователя"
            }
          />

          <button onClick={sendMessage} disabled={!selectedChat}>
            Отправить
          </button>
        </footer>
      </main>
    </div>
  );
}

export default App;