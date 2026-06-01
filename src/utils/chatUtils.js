export function isMobile() {
  if (typeof window === "undefined") return false;
  return window.innerWidth <= 768;
}

export function isUserOnline(user) {
  if (!user?.online_at) return false;
  const diff = Date.now() - new Date(user.online_at).getTime();
  return diff < 45000;
}

export function getReplyPreview(message) {
  if (!message) return "";
  if (message.message_type === "image" || message.image_url) return "📷 Фото";
  if (message.message_type === "audio" || message.audio_url) return "🎤 Голосовое";
  if (message.message_type === "file" || message.file_url) return `📄 ${message.file_name || "Файл"}`;
  return message.text || "сообщение";
}
