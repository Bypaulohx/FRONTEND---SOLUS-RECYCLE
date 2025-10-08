import React from 'react';
import '../App.css';

const Recuperacao = () => (
  <header className="container form-container">
    <h2 className="main-title">Esqueceu sua senha?</h2>
    <p className="subtitle">Por favor, insira o email vinculado à sua conta</p>
    <form id="recuperacaoForm" className="form">
        <input type="email" placeholder="Digite seu email" required />
        <button type="submit" className="enviar-btn">Enviar código</button>
    </form>
    <p className="login-prompt">Lembrou sua senha? <a href="Login" className="login-link">Faça seu login</a></p>
  </header>
);

export default Recuperacao;