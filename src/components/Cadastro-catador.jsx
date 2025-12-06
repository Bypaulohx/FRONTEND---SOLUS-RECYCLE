import React from 'react';
import '../App.css';

const Cadastro = () => (
  <header className="container form-container">
    <a href="/Index" className="back-btn" id="backBtn"><i class="bi bi-chevron-left"></i></a>
    <h2>Olá!<br />Vamos começar?</h2>
    <form id="cadastroForm" className="form">
        <input type="email" placeholder="Email" required />
        <input type="tel" id="telefone" placeholder="Telefone" required />
        <input type="password" id="passwordInput" placeholder="Senha" required />
        <input type="password" id="confirmPasswordInput" placeholder="Confirme a senha" required />
        <button type="submit" className="avancar-btn">Avançar</button>
    </form>
    <p>Já tem uma conta? <a href="Login" className="login-link">Faça seu login</a></p>
  </header>
);

const Cadastro1 = () => (
  <header className="container form-container">
    <a href="/Index" className="back-btn" id="backBtn"><i class="bi bi-chevron-left"></i></a>
    <h2>Olá!<br />Vamos termina seu cadastro</h2>
    <div className="question-container">
        <span className="question-text" title="Selecione se você faz parte da comunidade que descarta resíduos ou da organização que coleta resíduos.">Quem é você?</span>
    </div>
    <div className="tab-container">
        <button className="option-btn" onclick="window.location.href='cadastro2.html'">Comunidade</button>
        <button className="option-btn" onclick="window.location.href='cadastro-coletor.html'">Organizações Sociais</button>
    </div>
    <form id="cadastroForm2" className="form">
        <input type="text" id="collector-name" placeholder="Nome da ONG ou Catadores" required />
        <div className="cpf-cnpj-row">
            <label className="radio-label">
                <input type="radio" name="documento" value="cpf" />
                CPF
            </label>
            <label className="radio-label">
                <input type="radio" name="documento" value="cnpj" />
                CNPJ
            </label>
            <input type="text" id="documento" placeholder="CPF ou CNPJ" required />
        </div>
        <input type="text" id="cep" placeholder="CEP" required />
        <div className="address-row">
            <input type="text" placeholder="Número" required />
            <input type="text" placeholder="Complemento" />
        </div>
            <input type="text" id="operation-hours" placeholder="Horários e Dias de Funcionamento" required />
            
            <div class="materials-section">
                <label>O que aceita como reciclagem:</label>
                <label><input type="checkbox" name="materials" value="papel" /> Papel</label>
                <label><input type="checkbox" name="materials" value="plastico" /> Plástico</label>
                <label><input type="checkbox" name="materials" value="metal" /> Metal</label>
                <label><input type="checkbox" name="materials" value="vidro" /> Vidro</label>
                <label><input type="checkbox" name="materials" value="eletronicos" /> Resíduos Eletrônicos</label>
            </div>
        
            <select id="weight-range" required>
                <option value="" disabled selected>Quantidade de Kilos</option>
                <option value="5-10">5kg a 10kg</option>
                <option value="10-15">10kg a 15kg</option>
                <option value="15-20">15kg a 20kg</option>
                <option value="above-20">Acima de 20kg</option>
            </select>
        
            <select id="collection-method" required>
                <option value="" disabled selected>Meio de Coleta</option>
                <option value="carro">Carro</option>
                <option value="bicicleta">Bicicleta</option>
                <option value="carroca">Carroça</option>
                <option value="caminhao">Caminhão</option>
                <option value="van">Van</option>
            </select>

        <label className="checkbox-label">
            Aceito receber notificações do app
            <input type="checkbox" checked />
            <span className="custom-checkbox"></span>
        </label>
        <button type="submit" className="cadastrar-btn">Cadastrar</button>
    </form>
  </header>
);

const Cadastro2 = () => (
    <header className="container form-container">
        <a href="/Index" className="back-btn" id="backBtn"><i class="bi bi-chevron-left"></i></a>
        <h2>Olá!<br />Vamos termina seu cadastro</h2>
            <div className="question-container">
        <span className="question-text" title="Selecione se você faz parte da comunidade que descarta resíduos ou da organização que coleta resíduos.">Quem é você?</span>
    </div>
    <div className="tab-container">
        <button className="option-btn active" onclick="window.location.href='cadastro2.html'">Comunidade</button>
        <button className="option-btn" onclick="window.location.href='cadastro-coletor.html'">Organizações Sociais</button>
    </div>

        <form id="cadastroForm3" class="form" action="mapa.html" method="GET" onsubmit="adicionarCepNaUrl(event)">
            <input type="text" id="telefone" placeholder="Telefone" required />
            <input type="text" id="cep" placeholder="CEP" required  />
            <div class="address-row">
                <input type="text" placeholder="Número" required />
                <input type="text" placeholder="Complemento" />
            </div>
            <input type="text" id="collector-name" placeholder="Nome da ONG ou Catadores" required />
            <input type="text" id="operation-hours" placeholder="Horários e Dias de Funcionamento" required />
            
            <div class="materials-section">
                <label>O que aceita como reciclagem:</label>
                <label><input type="checkbox" name="materials" value="papel" /> Papel</label>
                <label><input type="checkbox" name="materials" value="plastico" /> Plástico</label>
                <label><input type="checkbox" name="materials" value="metal" /> Metal</label>
                <label><input type="checkbox" name="materials" value="vidro" /> Vidro</label>
                <label><input type="checkbox" name="materials" value="eletronicos" /> Resíduos Eletrônicos</label>
            </div>
        
            <select id="weight-range" required>
                <option value="" disabled selected>Quantidade de Kilos</option>
                <option value="5-10">5kg a 10kg</option>
                <option value="10-15">10kg a 15kg</option>
                <option value="15-20">15kg a 20kg</option>
                <option value="above-20">Acima de 20kg</option>
            </select>
        
            <select id="collection-method" required>
                <option value="" disabled selected>Meio de Coleta</option>
                <option value="carro">Carro</option>
                <option value="bicicleta">Bicicleta</option>
                <option value="carroca">Carroça</option>
                <option value="caminhao">Caminhão</option>
                <option value="van">Van</option>
            </select>
        
            <div class="radio-group">
                <label><input type="radio" name="collector-type" value="ong" required /> ONG</label>
                <label><input type="radio" name="collector-type" value="catador" /> Catador Autônomo</label>
            </div>
        
            <label class="checkbox-label">
                Aceito receber notificações do app
                <input type="checkbox" checked />
                <span class="custom-checkbox"></span>
            </label>
        
            <button type="submit" class="cadastrar-btn">Cadastrar</button>
        </form>

    </header>
);

export default Cadastro;