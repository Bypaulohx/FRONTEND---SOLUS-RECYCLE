import React from "react";
import "../App.css";
import React, { useState } from 'react';

const faqs = [
    {
        id: 'faq1',
        question: 'Como agendar uma coleta?',
        answer: 'Para agendar uma coleta, vá até a página inicial, clique em "Encontrar Catadores", escolha um ponto de coleta e clique em "Agendar coleta". Siga as instruções para selecionar a data e os materiais.',
    },
    {
        id: 'faq2',
        question: 'Quais materiais posso reciclar?',
        answer: 'Você pode reciclar materiais como metal, vidro, papel, plástico e outros, dependendo do ponto de coleta. Verifique as especificações de cada ponto na página de detalhes.',
    },
    {
        id: 'faq3',
        question: 'Como alterar meus dados?',
        answer: 'Acesse a página "Meus dados" no menu lateral, clique no ícone de edição ao lado do campo que deseja alterar e insira as novas informações.',
    },
];

const instructions = [
    { text: 'Cadastre-se ou faça login com sua conta.', iconClass: 'bi bi-1-circle' },
    { text: 'Encontre um ponto de coleta na página inicial.', iconClass: 'bi bi-2-circle' },
    { text: 'Agende uma coleta selecionando a data e os materiais.', iconClass: 'bi bi-3-circle' },
    { text: 'Acompanhe suas coletas na seção de notificações.', iconClass: 'bi bi-4-circle' },
];

function Ajuda() {
    const [openFaq, setOpenFaq] = useState(null);

    const toggleFaq = (id) => {
        setOpenFaq(openFaq === id ? null : id);
    };

    return (
        <div className="info-page-container">

            <div className="faq-section">
                <div className="section-title">Perguntas Frequentes</div>
                {faqs.map((item) => (
                    <div className="faq-item" key={item.id}>
                        <label 
                            className="faq-question" 
                            onClick={() => toggleFaq(item.id)}
                            aria-expanded={openFaq === item.id}
                        >
                            {item.question}
                            <i className={openFaq === item.id ? 'bi bi-chevron-up' : 'bi bi-chevron-down'}></i>
                        </label>
                        {openFaq === item.id && (
                            <div className="faq-answer open">
                                {item.answer}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="instructions-section">
                <div className="section-title">Como Usar o Solus Recycle</div>
                <ul className="instructions-list">
                    {instructions.map((item, index) => (
                        <li className="instruction-item" key={index}>
                            <i className={item.iconClass}></i>
                            {item.text}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="contact-section">
                <div className="section-title">Fale Conosco</div>
                
                <div className="contact-item">
                    <i className="bi bi-envelope"></i>
                    E-mail: **suporte@solusrecycle.com**
                </div>
                
                <div className="contact-item">
                    <i className="bi bi-telephone"></i>
                    Telefone: **+55 (00) 0000-0000**
                </div>
            </div>
        </div>
    );
}

export default Ajuda;