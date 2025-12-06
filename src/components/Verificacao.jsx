import React, { useState, useRef, useMemo } from 'react';
import { BiChevronLeft } from 'react-icons/bi';

const Backend_API = 'Backend_API'; 
const Backend_Reinviar_API = 'Backend_API'; 

const USER_EMAIL = 'user.email@example.com'; 

const Verificacao = ({ userEmail = USER_EMAIL }) => {
    const [code, setCode] = useState(['', '', '', '']);
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);

    const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

    const fullCode = useMemo(() => code.join(''), [code]);

    const handleInputChange = (e, index) => {
        const { value } = e.target;

        if (!/^\d*$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value.slice(-1);
        setCode(newCode);

        if (value && index < 3) {
            inputRefs[index + 1].current.focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs[index - 1].current.focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (fullCode.length !== 4) {
            setStatus('Por favor, insira o código de 4 dígitos completo.');
            return;
        }

        setLoading(true);
        setStatus('Verificando código...');

        try {
            const response = await fetch(Backend_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: userEmail, 
                    code: fullCode 
                }), 
            });

            if (response.ok) {
                setStatus('Código verificado com sucesso! Redirecionando...');
            } else {
                const errorData = await response.json().catch(() => ({}));
                let errorMessage = errorData.message || 'Código inválido ou expirado. Tente novamente.';
                
                setStatus(` ${errorMessage}`);
            }

        } catch (error) {
            console.error("Erro na comunicação com a API de verificação:", error);
            setStatus('Erro de conexão. Tente novamente mais tarde.');
        } finally {
            setLoading(false);
        }
    };

    const handleReenviar = async (e) => {
        e.preventDefault();
        setResendLoading(true);
        setStatus('Solicitando novo código...');

        try {
            const response = await fetch(Backend_Reinviar_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail }), 
            });

            if (response.ok) {
                setStatus('Novo código enviado. Verifique seu email.');
            } else {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.message || 'Falha ao reenviar. Tente novamente mais tarde.';
                setStatus(` ${errorMessage}`);
            }
        } catch (error) {
            console.error("Erro na comunicação com a API de reenvio:", error);
            setStatus('Erro de conexão ao reenviar código.');
        } finally {
            setResendLoading(false);
        }
    };


    return (
        <header className="container form-container">
            <a href="/Recuperacao" className="back-btn" id="backBtn">
                <BiChevronLeft size={24} />
            </a>
            
            <h2>
                Verificação <br /> 
                <span className="subtitle">Insira o código de 4 dígitos que enviamos para <br/> **{userEmail}**</span>
            </h2>
            
            <form id="verificacaoForm" className="form" onSubmit={handleSubmit}>
                <div className="code-container">
                    {code.map((digit, index) => (
                        <input
                            key={index}
                            ref={inputRefs[index]}
                            type="text"
                            maxLength="1"
                            className="code-input"
                            required
                            value={digit}
                            onChange={(e) => handleInputChange(e, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            disabled={loading}
                        />
                    ))}
                </div>
                
                <button 
                    type="submit" 
                    className="verificar-btn"
                    disabled={loading || fullCode.length !== 4}
                >
                    {loading ? 'Verificando...' : 'Verificar'}
                </button>
            </form>

            {status && (
                <p className={`status-message ${status.startsWith('ADICIONAR_ICON') ? 'success' : status.startsWith('') ? 'error' : 'info'}`}>
                    {status}
                </p>
            )}

            <p>
                Não recebeu o código? 
                <button 
                    onClick={handleReenviar} 
                    className="reenviar-link"
                    disabled={resendLoading}
                >
                    {resendLoading ? 'Reenviando...' : 'Reenviar'}
                </button>
            </p>
        </header>
    );
};

export default Verificacao;