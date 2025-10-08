import React from 'react';
import '../App.css';

const Verificacao = () => (
  <header className="container form-container">
    <a href="Recuperacao" className="back-btn" id="backBtn"><i class="bi bi-chevron-left"></i></a>
    <h2>Verificação <br /> Insira o código de 4 dígitos que enviamos para o seu email</h2>
    <form id="verificacaoForm" className="form">
        <div class="code-container">
            <input type="text" maxlength="1" className="code-input" required />
            <input type="text" maxlength="1" className="code-input" required />
            <input type="text" maxlength="1" className="code-input" required />
            <input type="text" maxlength="1" className="code-input" required />
        </div>
        <button type="submit" className="verificar-btn">Verificar</button>
    </form>
    <p>Não recebeu o código? <a href="#" className="reenviar-link">Reenviar</a></p>
  </header>
);

export default Verificacao;