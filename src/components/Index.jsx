import React from 'react';
import '../App.css';

const Index = () => (
  <header className="container">
    <div className="illustration">
      <img src="/assets/Layer_2.png" className="illustration-img" />
    </div>
    <div className="logo">
      <img src="/assets/Recycling.png" className="logo-icon" />
    </div>
    <div className="buttons">
      <a href="/login" className="enter-btn">Entrar</a>
      <a href="/cadastro?from=index" className="register-btn">Quero me cadastrar</a>
    </div>
  </header>
);

export default Index;