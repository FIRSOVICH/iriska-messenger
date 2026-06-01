function Auth({
  mode,
  setMode,
  username,
  setUsername,
  email,
  setEmail,
  password,
  setPassword,
  authMessage,
  register,
  login,
  resetPasswordByEmail,
}) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>🍬 Ириска</h1>
        <p>Регистрация и вход</p>

        {mode === "register" && (
          <input
            placeholder="Логин"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        )}

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value.trim())}
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="email"
        />

        <input
          placeholder="Пароль"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />

        <button onClick={mode === "login" ? login : register}>
          {mode === "login" ? "Войти" : "Создать аккаунт"}
        </button>

        {mode === "login" && (
          <button type="button" className="auth-secondary-btn" onClick={resetPasswordByEmail}>
            Забыли пароль?
          </button>
        )}

        <span onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login"
            ? "Нет аккаунта? Регистрация"
            : "Уже есть аккаунт? Войти"}
        </span>

        {authMessage && <p className="auth-message">{authMessage}</p>}
      </div>
    </div>
  );
}

export default Auth;
