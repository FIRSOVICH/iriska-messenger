const encoder = new TextEncoder();
const decoder = new TextDecoder();

const SECRET_KEY_NAME = "iriska_secret_key_v1";

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
}

function base64ToBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
}

async function getSecretKey() {
  let savedKey = localStorage.getItem(SECRET_KEY_NAME);

  if (!savedKey) {
    const rawKey = crypto.getRandomValues(new Uint8Array(32));
    savedKey = bufferToBase64(rawKey);
    localStorage.setItem(SECRET_KEY_NAME, savedKey);
  }

  const rawKey = base64ToBuffer(savedKey);

  return crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptMessage(text) {
  const key = await getSecretKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    encoder.encode(text)
  );

  return `${bufferToBase64(iv)}:${bufferToBase64(encrypted)}`;
}

export async function decryptMessage(ciphertext) {
  try {
    if (!ciphertext || !ciphertext.includes(":")) {
      return ciphertext || "";
    }

    const key = await getSecretKey();
    const [ivBase64, encryptedBase64] = ciphertext.split(":");

    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(base64ToBuffer(ivBase64)),
      },
      key,
      base64ToBuffer(encryptedBase64)
    );

    return decoder.decode(decrypted);
  } catch (error) {
    console.error("DECRYPT ERROR:", error);
    return "🔒 Не удалось расшифровать";
  }
}