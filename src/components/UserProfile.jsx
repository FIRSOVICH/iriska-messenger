function UserProfile({
  isOpen,
  user,
  chat,
  isOnline,
  renderAvatar,
  onClose,
  onClearHistory,
  onDeleteChat,
  onBlockUser,
}) {
  if (!isOpen || !user) return null;

  return (
    <div className="user-profile-backdrop" onClick={onClose}>
      <div className="user-profile-card" onClick={(event) => event.stopPropagation()}>
        <button className="profile-close-btn" onClick={onClose}>
          ×
        </button>

        <div className="profile-big-avatar">
          {renderAvatar(user)}
        </div>

        <h2>{user.username || "Пользователь"}</h2>
        <p className={isOnline ? "profile-online" : "profile-offline"}>
          {isOnline ? "онлайн" : "офлайн"}
        </p>

        <div className="profile-actions">
          <button
            onClick={() => {
              onClearHistory?.(chat);
              onClose();
            }}
          >
            🧹 Очистить историю у себя
          </button>

          <button
            onClick={() => {
              onDeleteChat?.(chat);
              onClose();
            }}
          >
            🗑 Удалить чат у себя
          </button>

          <button
            className="danger-action"
            onClick={() => {
              onBlockUser?.(chat);
              onClose();
            }}
          >
            🚫 Заблокировать пользователя
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
