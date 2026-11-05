portal.pedir('/api/auth/usuario').then(usuario => { document.getElementById('nome-perfil').textContent = usuario.nome; }).catch(erro => portal.avisar(erro.message));
