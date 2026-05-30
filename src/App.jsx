import { useEffect, useState } from "react";
import "./App.css";
import { supabase } from "./supabase";

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      loadProfile();
      loadUsers();
      loadMessages();
    }
  }, [session]);

  async function loadProfile() {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    setProfile(data);
  }

  async function loadUsers() {
    const { data } = await supabase.from("profiles").select("*");
    setUsers(data || []);
  }

  async function loadMessages() {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: true });

    setMessages(data || []);
  }

  async function sendMessage() {
    if (!text.trim()) return;

    await supabase.from("messages").insert({
      sender_id: session.user.id,
      text,
    });

    setText("");
    loadMessages();
  }

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }

  if (!session) {
    return <div className="app auth-page">Перезайди в аккаунт</div>;
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

        <button className="new-chat" onClick={logout}>Выйти</button>

        <div className="chat-list">
          {users.map((user) => (
            <div className="chat-item" key={user.id}>
              <div className="avatar">👤</div>
              <div>
                <h3>{user.username}</h3>
                <p>{user.id === session.user.id ? "это ты" : "пользователь"}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main className="chat">
        <header className="chat-header">
          <div>
            <h2>Общий чат Ириски</h2>
            <p>сообщения сохраняются в Supabase</p>
          </div>
        </header>

        <section className="messages">
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
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Введите сообщение..."
          />
          <button onClick={sendMessage}>Отправить</button>
        </footer>
      </main>
    </div>
  );
}

export default App;