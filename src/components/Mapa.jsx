import React from 'react';
import '../App.css';

const Mapa = () => (
  <div className="container map-container">
    <div className="map" id="map">{/* Mapa interativo */}</div>

    <div className="collection-points-container">
      <div className="collection-header">
        {/* Ícone de seta sem funcionalidade ainda */}
        <i className="bi bi-chevron-compact-up" onClick={() => console.log("togglePoints")} />
        <h2>Encontre pontos de coleta e organizações perto de você</h2>
      </div>

      <div className="input-container">
        <i className="bi bi-search"></i>
        <input type="text" placeholder="Digite seu CEP" className="cep-input" />
      </div>

      <div className="collection-points" id="collectionPoints">
        <a href="detalhes-ponto.html" className="point collapsed">
          <i className="bi bi-geo-fill"></i>
          <div className="point-content">
            <h3>Associação de Catadores (ASCAS)</h3>
            <p>Av. LO 3, 764</p>
            <p className="opening-hours">Aberto de seg. a sex. das 7h30 às 17h</p>
            <p>(63) 98467-8637</p>
          </div>
        </a>

        <a href="detalhes-ponto.html" className="point collapsed">
          <i className="bi bi-geo-fill"></i>
          <div className="point-content">
            <h3>Coleta Municipal</h3>
            <p>Prefeitura Municipal</p>
            <p className="opening-hours">Quinta-feira a partir das 18h</p>
          </div>
        </a>

        <a href="detalhes-ponto.html" className="point collapsed">
          <i className="bi bi-geo-fill"></i>
          <div className="point-content">
            <h3>Reciminhas Comércio de Metais</h3>
            <p>Av. JK, 689</p>
            <p className="opening-hours">Aberto de seg. a sex. das 8h às 18h</p>
            <p>(63) 3373-7642</p>
          </div>
        </a>
      </div>
    </div>
  </div>
);

export default Mapa;