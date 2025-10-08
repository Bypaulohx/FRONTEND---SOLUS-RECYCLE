import React from "react";
import "../App.css";

const Verificacao = () => (
  <header className="container agendamento-container">
    <div className="boxed-section">
      <h2>Associação dos Catadores de Material Reciclável - ASCAS</h2>
    </div>
    <div className="boxed-section">
      <p>Quando será sua coleta?</p>
      <div className="calendar">
        <div className="calendar-header">
          <i className="bi bi-chevron-compact-left" onclick="previousMonth()"></i>
          <span id="monthYear"></span>
          <i className="bi bi-chevron-compact-right" onclick="nextMonth()"></i>
        </div>
        <div className="calendar-nav">
          <span>Dom</span>
          <span>Seg</span>
          <span>Ter</span>
          <span>Qua</span>
          <span>Qui</span>
          <span>Sex</span>
          <span>Sáb</span>
        </div>
        <div className="calendar-grid" id="calendarGrid"></div>
      </div>
      <p>Quais materiais serão coletados?</p>
      <p>Essa empresa só realiza coletas de Metal e/ou Vidro</p>
      <select className="custom-select">
        <option>Metal</option>
        <option>Vidro</option>
      </select>
      <p>Qual o peso aproximado da sua separação?</p>
      <p>Essa empresa só realiza coletas a partir de 10kg</p>
      <select className="custom-select">
        <option>10kg</option>
        <option>20kg</option>
        <option>30kg</option>
        <option>40kg</option>
        <option>50kg</option>
      </select>

      <p>Tem alguma observação?</p>
      <textarea placeholder="Comente sobre seus itens, horários para recebimento, etc.."></textarea>
      <a href="Confirmacao-agendamento" className="green-btn">
        Agendar coleta
      </a>
    </div>
  </header>
);

export default Verificacao;
