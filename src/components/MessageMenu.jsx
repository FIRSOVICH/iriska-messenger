function MessageMenu({
  actionMessage,
  forwardMessage,
  myChats,
  session,
  renderAvatar,
  closeMessageMenu,
  replyFromMenu,
  startForwardFromMenu,
  deleteMessageForMe,
  deleteMessage,
  setForwardMessage,
  forwardToChat,
  reactToMessage,
  togglePinMessage,
}) {
  return (
    <>
      {actionMessage && (
        <div className="message-menu-backdrop" onClick={closeMessageMenu}>
          <div className="message-action-menu" onClick={(e) => e.stopPropagation()}>
            <div className="message-action-title">
              {actionMessage.message_type === "image"
                ? "📷 Фото"
                : actionMessage.message_type === "audio"
                ? "🎤 Голосовое"
                : actionMessage.text || "Сообщение"}
            </div>

            <div className="reaction-row">
              {["❤️", "😂", "🔥", "👍"].map((emoji) => (
                <button
                  key={emoji}
                  className="reaction-action"
                  onClick={() => reactToMessage(actionMessage, emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <button onClick={replyFromMenu}>↩ Ответить</button>
            <button onClick={() => togglePinMessage(actionMessage)}>
              {actionMessage?.is_pinned ? "📌 Открепить" : "📌 Закрепить"}
            </button>
            <button onClick={startForwardFromMenu}>📤 Переслать</button>
            <button onClick={() => deleteMessageForMe(actionMessage.id)}>
              🧹 Удалить у себя
            </button>

            {actionMessage.sender_id === session.user.id && (
              <button
                className="danger-action"
                onClick={() => deleteMessage(actionMessage.id)}
              >
                🗑 Удалить у всех
              </button>
            )}

            <button className="cancel-action" onClick={closeMessageMenu}>
              Отмена
            </button>
          </div>
        </div>
      )}

      {forwardMessage && (
        <div className="message-menu-backdrop" onClick={() => setForwardMessage(null)}>
          <div className="forward-menu" onClick={(e) => e.stopPropagation()}>
            <h3>Кому переслать?</h3>

            {myChats.length === 0 && (
              <p className="empty">Нет чатов для пересылки</p>
            )}

            {myChats.map((chat) => (
              <button
                key={chat.id}
                className="forward-chat-item"
                onClick={() => forwardToChat(chat)}
              >
                <span className="avatar small-avatar">{renderAvatar(chat.otherUser)}</span>
                <span>{chat.otherUser?.username || "Пользователь"}</span>
              </button>
            ))}

            <button className="cancel-action" onClick={() => setForwardMessage(null)}>
              Отмена
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default MessageMenu;
