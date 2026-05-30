import { useState } from "react";
import "./App.css";

function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");

  if (!isAuth) {
    return (
      <div className="app auth-page">
        <div className="auth-card">
          <h1>🍬 Ириска</h1>
          <p>Защищённый мессенджер нового поколения</p>

          <input
            placeholder="Логин"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input placeholder="Пароль" type="password" />

          <button onClick={() => setIsAuth(true)}>
            {mode === "login" ? "Войти" : "Зарегистрироваться"}
          </button>

          <span onClick={() => setMode(mode === "login" ? "register" : "login")}>
            {mode === "login"
              ? "Нет аккаунта? Создать"
              : "Уже есть аккаунт? Войти"}
          </span>
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
            <p>{username || "Пользователь"} онлайн</p>
          </div>
        </div>

        <button className="new-chat">+ Новый чат</button>

        <div className="chat-list">
          <div className="chat-item active">
            <div className="avatar">🍬</div>
            <div>
              <h3>Ириска AI</h3>
              <p>онлайн</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="chat">
        <header className="chat-header">
          <div>
            <h2>Ириска AI</h2>
            <p>онлайн</p>
          </div>
        </header>

        <section className="messages">
          <div className="message bot">Привет, {username || "друг"}! Ты вошёл в Ириску.</div>
          <div className="message me">Теперь делаем настоящий мессенджер 🚀</div>
        </section>

        <footer className="input-area">
          <input placeholder="Введите сообщение..." />
          <button>Отправить</button>
        </footer>
      </main>
    </div>
  );
}

export default App;