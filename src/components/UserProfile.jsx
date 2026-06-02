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

  const createdAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString("ru-RU")
    : "—";

  const description = user.description || "Описание пока не добавлено";
  const status = user.status || (isOnline ? "В сети" : "Офлайн");
  const coverUrl = user.profile_header_image_url || "";

  return (
    <div className="user-profile-backdrop" onClick={onClose}>
      <div className="user-profile-card user-profile-card-v2" onClick={(event) => event.stopPropagation()}>
        <button className="profile-close-btn" onClick={onClose}>
          ×
        </button>

        <div
          className={`other-profile-cover ${coverUrl ? "has-cover" : ""}`}
          style={coverUrl ? { backgroundImage: `linear-gradient(rgba(2, 6, 23, 0.08), rgba(2, 6, 23, 0.24)), url(${coverUrl})` } : undefined}
        >
          <div className="profile-big-avatar other-profile-avatar">
            {renderAvatar(user)}
          </div>
        </div>

        <h2>{user.username || "Пользователь"}</h2>

        <p className={isOnline ? "profile-online" : "profile-offline"}>
          {isOnline ? "онлайн" : "офлайн"}
        </p>

        <div className="profile-info-grid">
          <div>
            <span>Описание</span>
            <p>{description}</p>
          </div>

          <div>
            <span>Статус</span>
            <p>{status}</p>
          </div>

          <div>
            <span>Дата регистрации</span>
            <p>{createdAt}</p>
          </div>
        </div>

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
