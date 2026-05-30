import { useState } from "react";
import "./App.css";

function App() {
  const [selectedChat, setSelectedChat] = useState(0);
  const [input, setInput] = useState("");

  const [chats, setChats] = useState([
    {
      name: "Ириска AI",
      status: "онлайн",
      avatar: "🍬",
      messages: [
        { from: "bot", text: "Привет, Кирилл! Я Ириска. Чем займёмся?" },
        { from: "me", text: "Делаем мессенджер 🚀" },
      ],
    },
    {
      name: "Тестовый чат",
      status: "был недавно",
      avatar: "💬",
      messages: [{ from: "bot", text: "Это тестовый диалог." }],
    },
    {
      name: "Проект BlackLine",
      status: "защищённый чат",
      avatar: "🛡️",
      messages: [{ from: "bot", text: "E2E-шифрование будет на следующем этапе." }],
    },
  ]);

  function sendMessage() {
    if (!input.trim()) return;

    const newChats = [...chats];
    newChats[selectedChat].messages.push({
      from: "me",
      text: input,
    });

    const userText = input;
    setInput("");
    setChats(newChats);

    setTimeout(() => {
      const replyChats = [...newChats];
      replyChats[selectedChat].messages.push({
        from: "bot",
        text: `Ириска получила: "${userText}"`,
      });
      setChats([...replyChats]);
    }, 600);
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <span>🍬</span>
          <div>
            <h1>Ириска</h1>
            <p>защищённый мессенджер</p>
          </div>
        </div>

        <button className="new-chat">+ Новый чат</button>

        <div className="chat-list">
          {chats.map((chat, index) => (
            <div
              key={index}
              className={`chat-item ${selectedChat === index ? "active" : ""}`}
              onClick={() => setSelectedChat(index)}
            >
              <div className="avatar">{chat.avatar}</div>
              <div>
                <h3>{chat.name}</h3>
                <p>{chat.status}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main className="chat">
        <header className="chat-header">
          <div>
            <h2>{chats[selectedChat].name}</h2>
            <p>{chats[selectedChat].status}</p>
          </div>
          <div className="header-actions">
            <button>🔍</button>
            <button>📞</button>
            <button>⚙️</button>
          </div>
        </header>

        <section className="messages">
          {chats[selectedChat].messages.map((message, index) => (
            <div key={index} className={`message ${message.from}`}>
              {message.text}
            </div>
          ))}
        </section>

        <footer className="input-area">
          <input
            value={input}
            placeholder="Введите сообщение..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button onClick={sendMessage}>Отправить</button>
        </footer>
      </main>
    </div>
  );
}

export default App;