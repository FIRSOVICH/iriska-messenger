import { useEffect, useState } from "react";
import "./App.css";
import { supabase } from "./supabase";

function App() {
  const [session, setSession] = useState(null);
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [profile, setProfile] = useState(null);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      loadProfile();
      loadUsers();
    }
  }, [session]);

  async function register() {
    if (!email || !password || !username) {
      setMessage("Заполни email, логин и пароль");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    const userId = data.user?.id;

  const result = await supabase
  .from("profiles")
  .insert({
    id: userId,
    username,
  });

console.log(result);

    setMessage("Аккаунт создан. Теперь войди.");
    setMode("login");
  }

  async function login() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("");
  }

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }

  async function loadProfile() {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    setProfile(data);
  }

  async function loadUsers() {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    setUsers(data || []);
  }

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

          {message && <p>{message}</p>}
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
            <h2>Пользователи Ириски</h2>
            <p>онлайн</p>
          </div>
        </header>

        <section className="messages">
          <div className="message bot">
            Ты вошёл как: {profile?.username || session.user.email}
          </div>
          <div className="message me">
            Теперь аккаунты реально создаются в Supabase 🚀
          </div>
        </section>

        <footer className="input-area">
          <input placeholder="Настоящие сообщения добавим следующим этапом..." />
          <button>Отправить</button>
        </footer>
      </main>
    </div>
  );
}

export default App;