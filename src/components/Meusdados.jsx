// MeusDados.jsx
import React, { useState, useEffect } from 'react';
import { BiPencilSquare } from 'react-icons/bi';

const Backend_API = 'Backend_API'; 
const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken') || 'token'; 
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, 
    };
};

const EditModal = ({ isOpen, onClose, fieldName, currentValue, onSave }) => {
    const [inputValue, setInputValue] = useState(currentValue);

    useEffect(() => {
        setInputValue(currentValue);
    }, [currentValue]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(fieldName, inputValue);
        onClose();
    };

    const inputType = fieldName === 'email' ? 'email' : (fieldName === 'senha' ? 'password' : 'text');

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <span className="close-button" onClick={onClose}>&times;</span>
                <h2>Editar {fieldName.toUpperCase()}</h2>
                
                {fieldName === 'senha' && (
                    <p className="modal-note">A edição de senha requer confirmação de senha atual e nova senha.</p>
                )}

                <input
                    type={inputType}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={`Novo valor para ${fieldName}`}
                />
                <button onClick={handleSave} className="action-btn">Salvar</button>
            </div>
        </div>
    );
};

const DataListItem = ({ label, value, location, field, onEdit, isRowItem = false }) => (
    <li className={`data-item ${isRowItem ? 'data-row-item' : ''}`} data-field={field}>
        <span className="data-label">{label}</span>
        <div className="data-card">
            <span className="data-value">{value}</span>
            <BiPencilSquare 
                className="edit-icon" 
                onClick={() => onEdit(field)}
                role="button"
                aria-label={`Editar ${label}`}
            />
        </div>
        {location && <div className="data-location">{location}</div>}
    </li>
);

const Meusdados = () => {
    const [userData, setUserData] = useState({
        telefone: 'Carregando...',
        email: 'Carregando...',
        cep: 'Carregando...',
        endereco: 'Carregando...', 
        numero: 'Carregando...',
        complemento: 'Carregando...',
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingField, setEditingField] = useState(null);
    const [editingValue, setEditingValue] = useState('');
    const [statusMessage, setStatusMessage] = useState('');

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch(API_URL, {
                    method: 'GET',
                    headers: getAuthHeaders(),
                });

                if (!response.ok) {
                    throw new Error('Falha ao carregar dados do usuário.');
                }
                const data = await response.json();

                setUserData({
                    telefone: data.phone || data.telefone || 'N/A', 
                    email: data.email,
                    cep: data.address?.zipCode || data.cep || 'N/A',
                    endereco: data.address ? `${data.address.street}, ${data.address.city}` : data.endereco || 'N/A',
                    numero: data.address?.number || data.numero || 'N/A',
                    complemento: data.address?.complement || data.complemento || 'N/A',
                });
                
            } catch (err) {
                console.error("Erro ao buscar dados:", err);
                setError('Erro ao carregar seus dados.');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const updateUserData = async (field, newValue) => {
        setLoading(true);
        setStatusMessage('Atualizando...');

        let updatePayload = {};

        if (['telefone', 'email', 'senha'].includes(field)) {
            updatePayload = { [field]: newValue };
        } else if (['cep', 'numero', 'complemento'].includes(field)) {
            updatePayload = { address: { [field]: newValue } };
        } else {
             updatePayload = { [field]: newValue };
        }
        
        try {
            const response = await fetch(API_URL, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify(updatePayload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido.' }));
                throw new Error(errorData.message || `Erro ${response.status} ao salvar.`);
            }

            setUserData(prevData => ({
                ...prevData,
                [field]: newValue 
            }));
            
            setStatusMessage('Dados atualizados com sucesso!');

        } catch (err) {
            console.error("Erro ao atualizar dados:", err);
            setStatusMessage(`Erro ao salvar: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (field) => {
        const value = field === 'senha' ? '' : userData[field]; 
        setEditingField(field);
        setEditingValue(value);
        setIsModalOpen(true);
    };

    const handleModalSave = (field, newValue) => {
        if (newValue.trim() !== '' && newValue !== userData[field]) {
            updateUserData(field, newValue.trim());
        }
    };

    if (loading && !statusMessage) {
        return <div className="loading-state">Carregando seus dados...</div>;
    }

    if (error) {
        return <div className="error-state">Erro: {error}</div>;
    }

    return (
        <>
            <header className="header">
                <a href="/home">
                  <img src="Logo Header.png" className="logo-icon" alt="Logo GreenBox" />
                </a>
                <a href="/perfil">
                  <img src="User.jpg" className="user-photo" alt="Foto do Usuário" />
                </a>
            </header>

            <div className="content-container">
                <div className="section-title">Meus dados</div>

                {statusMessage && (
                    <div className={`status-message ${statusMessage.startsWith('ADICIONAR_ICON') ? 'success' : 'error'}`}>
                        {statusMessage}
                    </div>
                )}

                <ul className="data-list">
                    <DataListItem 
                        label="TELEFONE" 
                        value={userData.telefone} 
                        field="telefone" 
                        onEdit={handleEditClick}
                    />

                    <DataListItem 
                        label="E-MAIL" 
                        value={userData.email} 
                        field="email" 
                        onEdit={handleEditClick}
                    />
                    
                    <DataListItem 
                        label="SENHA" 
                        value="••••••••" 
                        field="senha" 
                        onEdit={() => handleEditClick('senha')} 
                    />
                    
                    <DataListItem 
                        label="CEP" 
                        value={userData.cep} 
                        location={userData.endereco}
                        field="cep" 
                        onEdit={handleEditClick}
                    />
                    
                    <li className="data-row">
                        <DataListItem 
                            label="NÚMERO" 
                            value={userData.numero} 
                            field="numero" 
                            onEdit={handleEditClick}
                            isRowItem={true}
                        />
                        <DataListItem 
                            label="COMPLEMENTO" 
                            value={userData.complemento} 
                            field="complemento" 
                            onEdit={handleEditClick}
                            isRowItem={true}
                        />
                    </li>
                </ul>
            </div>

            <EditModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                fieldName={editingField}
                currentValue={editingValue}
                onSave={handleModalSave}
            />
        </>
    );
};

export default Meusdados;