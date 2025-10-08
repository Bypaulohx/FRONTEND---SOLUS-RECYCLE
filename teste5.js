document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('cadastroForm2');
    const nomeInput = document.getElementById('nome');
    const emailInput = document.getElementById('email');
    const documentoInput = document.getElementById('documento');
    const senhaInput = document.getElementById('senha');
    const confirmaSenhaInput = document.getElementById('confirma-senha');
    const telefoneInput = document.getElementById('telefone');
    const cepInput = document.getElementById('cep');
    const numeroInput = document.getElementById('numero');
    const complementoInput = document.getElementById('complemento');
    const cpfRadio = document.querySelector('input[value="cpf"]');
    const cnpjRadio = document.querySelector('input[value="cnpj"]');

    // Nome: Apenas letras e espaços
    nomeInput.addEventListener('input', () => {
        const nome = nomeInput.value;
        const nomeError = document.getElementById('nome-error');
        if (!/^[A-Za-z\s]+$/.test(nome) && nome !== '') {
            nomeError.textContent = 'Apenas letras e espaços são permitidos.';
        } else {
            nomeError.textContent = '';
        }
    });

    // Email: Deve conter @ e terminar com domínio válido
    emailInput.addEventListener('input', () => {
        const email = emailInput.value;
        const emailError = document.getElementById('email-error');
        const validDomains = ['@gmail.com', '@hotmail.com', '@yahoo.com', '@outlook.com'];
        if (!validDomains.some(domain => email.endsWith(domain)) && email !== '') {
            emailError.textContent = 'E-mail deve terminar com @gmail.com, @hotmail.com, @yahoo.com ou @outlook.com.';
        } else {
            emailError.textContent = '';
        }
    });

    // CPF/CNPJ: Apenas números, com formatação específica
    documentoInput.addEventListener('input', () => {
        let value = documentoInput.value.replace(/\D/g, '');
        const documentoError = document.getElementById('documento-error');
        if (cpfRadio.checked) {
            if (value.length > 11) value = value.slice(0, 11);
            documentoInput.value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
            if (value.length !== 11 && value !== '') {
                documentoError.textContent = 'CPF deve conter 11 dígitos.';
            } else {
                documentoError.textContent = '';
            }
        } else {
            if (value.length > 14) value = value.slice(0, 14);
            documentoInput.value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
            if (value.length !== 14 && value !== '') {
                documentoError.textContent = 'CNPJ deve conter 14 dígitos.';
            } else {
                documentoError.textContent = '';
            }
        }
    });

    // CPF/CNPJ Radio Buttons: Reformatar ao mudar
    [cpfRadio, cnpjRadio].forEach(radio => {
        radio.addEventListener('change', () => {
            documentoInput.value = '';
            documentoInput.dispatchEvent(new Event('input'));
        });
    });

    // Senha: Força da senha
    senhaInput.addEventListener('input', () => {
        const senha = senhaInput.value;
        const senhaStrength = document.getElementById('senha-strength');
        if (senha.length < 8 && senha !== '') {
            senhaStrength.textContent = 'Senha fraca';
            senhaStrength.style.color = 'red';
        } else if (senha.length >= 8 && senha.length < 12) {
            senhaStrength.textContent = 'Senha média';
            senhaStrength.style.color = 'orange';
        } else if (senha.length >= 12) {
            senhaStrength.textContent = 'Senha boa';
            senhaStrength.style.color = 'green';
        } else {
            senhaStrength.textContent = '';
        }
    });

    // Confirma Senha: Verificar igualdade
    confirmaSenhaInput.addEventListener('input', () => {
        const confirmaSenha = confirmaSenhaInput.value;
        const senha = senhaInput.value;
        const confirmaSenhaError = document.getElementById('confirma-senha-error');
        if (confirmaSenha !== senha && confirmaSenha !== '') {
            confirmaSenhaError.textContent = 'As senhas não coincidem.';
        } else {
            confirmaSenhaError.textContent = '';
        }
    });

    // Telefone: Apenas números, formato (00) 00000-0000
    telefoneInput.addEventListener('input', () => {
        let value = telefoneInput.value.replace(/\D/g, '');
        const telefoneError = document.getElementById('telefone-error');
        if (value.length > 11) value = value.slice(0, 11);
        telefoneInput.value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        if (value.length !== 11 && value !== '') {
            telefoneError.textContent = 'Telefone deve conter 11 dígitos.';
        } else {
            telefoneError.textContent = '';
        }
    });

    // CEP: Apenas números, formato 00000-000
    cepInput.addEventListener('input', () => {
        let value = cepInput.value.replace(/\D/g, '');
        const cepError = document.getElementById('cep-error');
        if (value.length > 8) value = value.slice(0, 8);
        cepInput.value = value.replace(/(\d{5})(\d{3})/, '$1-$2');
        if (value.length !== 8 && value !== '') {
            cepError.textContent = 'CEP deve conter 8 dígitos.';
        } else {
            cepError.textContent = '';
        }
    });

    // Número: Apenas números
    numeroInput.addEventListener('input', () => {
        const numeroError = document.getElementById('numero-error');
        numeroInput.value = numeroInput.value.replace(/\D/g, '');
        if (numeroInput.value === '') {
            numeroError.textContent = 'Número é obrigatório.';
        } else {
            numeroError.textContent = '';
        }
    });

    // Complemento: Aceita números e caracteres, opcional
    complementoInput.addEventListener('input', () => {
        complementoInput.value = complementoInput.value.replace(/[^A-Za-z0-9\s]/g, '');
    });

    // Prevenir envio do formulário se houver erros
    form.addEventListener('submit', (e) => {
        const errors = document.querySelectorAll('.error-message');
        const hasErrors = Array.from(errors).some(error => error.textContent !== '');
        if (hasErrors || senhaInput.value.length < 8 || confirmaSenhaInput.value !== senhaInput.value) {
            e.preventDefault();
            alert('Por favor, corrija os erros no formulário antes de enviar.');
        }
    });
});