import React, { useState } from 'react';

const Backend_API = 'Backend_API'; 

const Recuperacao = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);

    const getHeaders = () => ({
        'Content-Type': 'application/json',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!email) {
            setStatus('Por favor, insira um e-mail válido.');
            return;
        }

        setLoading(true);
        setStatus('Enviando solicitação...');

        try {
            const response = await fetch(Backend_API, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ email: email }),
            });

            if (response.ok) {
                setStatus('Código enviado! Verifique sua caixa de entrada.');
            } else {
                const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido.' }));

                let errorMessage = errorData.message || `Erro ${response.status}: Falha ao enviar a solicitação.`;
                
                if (response.status === 404) {
                    errorMessage = 'E-mail não encontrado. Verifique se o e-mail está correto.';
                }
                
                setStatus(` ${errorMessage}`);
            }

        } catch (error) {
            console.error("Erro na comunicação com a API:", error);
            setStatus('Erro de conexão. Tente novamente mais tarde.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <header className="container form-container">
            <h2 className="main-title">Esqueceu sua senha?</h2>
            <p className="subtitle">Por favor, insira o email vinculado à sua conta</p>
            
            <form id="recuperacaoForm" className="form" onSubmit={handleSubmit}>
                <input 
                    type="email" 
                    placeholder="Digite seu email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                />
                <button 
                    type="submit" 
                    className="enviar-btn" 
                    disabled={loading || !email}
                >
                    {loading ? 'Aguarde...' : 'Enviar código'}
                </button>
            </form>

            {status && (
                <p className={`status-message ${status.startsWith('ADICIONAR_ICON') ? 'success' : status.startsWith('') ? 'error' : 'info'}`}>
                    {status}
                </p>
            )}

            <p className="login-prompt">Lembrou sua senha? <a href="/Login" className="login-link">Faça seu login</a></p>
        </header>
    );
};

export default Recuperacao;