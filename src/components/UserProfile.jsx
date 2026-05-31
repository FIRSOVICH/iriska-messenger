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

  const registeredAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString("ru-RU")
    : "неизвестно";

  const profileBg = user.profile_bg || "blue";

  return (
    <div className="user-profile-backdrop" onClick={onClose}>
      <div
        className={`user-profile-card profile-bg-${profileBg}`}
        onClick={(event) => event.stopPropagation()}
      >
        <button className="profile-close-btn" onClick={onClose}>
          ×
        </button>

        <div className="profile-cover-glow" />

        <div className="profile-big-avatar">
          {renderAvatar(user)}
        </div>

        <h2>{user.username || "Пользователь"}</h2>

        <p className="profile-user-status">
          {user.status || "В сети"}
        </p>

        <p className={isOnline ? "profile-online" : "profile-offline"}>
          {isOnline ? "онлайн" : "офлайн"}
        </p>

        <div className="profile-info-box">
          <p className="profile-info-title">Описание</p>
          <p className="profile-description">
            {user.bio || "Описание отсутствует"}
          </p>
        </div>

        <div className="profile-info-box">
          <p className="profile-info-title">Дата регистрации</p>
          <p className="profile-date">{registeredAt}</p>
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
