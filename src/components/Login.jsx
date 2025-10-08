import React, { useState } from 'react';
import '../App.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://seu-backend.com/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, senha })
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Login bem-sucedido:', data);
        window.location.href = '/Dashboard';
      } else {
        setErro(data.mensagem || 'Erro ao fazer login');
      }
    } catch (err) {
      setErro('Erro de conexão com o servidor');
    }
  };

  return (
    <header className="form-container">
      <a href="/Index" className="back-btn" id="backBtn"><i className="bi bi-chevron-left"></i></a>
      <h2>Bem-vindo de volta!<br />Faça seu login</h2>
      <form onSubmit={handleSubmit} className="form">
        <input
          type="email"
          placeholder="Digite seu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="password-container">
          <input
            type="password"
            placeholder="Digite sua senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
          <span className="toggle-password" id="togglePassword">
            <i className="bi bi-eye-fill"></i>
          </span>
        </div>
        {erro && <p className="erro">{erro}</p>}
        <a href="/Recuperacao" className="forgot-password">Esqueceu a senha?</a>
        <button type="submit" className="entrar-btn">Entrar</button>
      </form>
      <div className="divider">
        <hr className="line" />
        <p>Ou entre com</p>
        <hr className="line" />
      </div>
      <div className="social-login">
        <a href="#" className="social-icon"><img src="Facebook (Button).png" alt="Facebook" /></a>
        <a href="#" className="social-icon"><img src="Google (Button).png" alt="Google" /></a>
        <a href="#" className="social-icon"><img src="Apple (Button).png" alt="Apple" /></a>
      </div>
      <p>Ainda não tem uma conta? <a href="Cadastro" className="register-link">Faça seu cadastro</a></p>
    </header>
  );
};

export default Login;