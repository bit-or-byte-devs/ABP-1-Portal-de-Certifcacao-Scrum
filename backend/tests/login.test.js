const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { criarSessao } = require('../src/config/sessao');
const criarRotasLogin = require('../src/routes/login');
const { bcrypt, normalizarCpf, senhaValida } = require('../src/auth/credenciais');

test('validacao preserva senha e rejeita truncamento bcrypt', () => {
    assert.equal(normalizarCpf('000.000.000-00'), '00000000000');
    assert.equal(normalizarCpf('abc00000000000'), 'abc00000000000');
    assert.equal(normalizarCpf(123), '');
    assert.equal(senhaValida(' '.repeat(8)), true);
    assert.equal(senhaValida('é'.repeat(37)), false);
    assert.throws(() => criarSessao({}), /SESSION_SECRET/);
    assert.throws(() => criarSessao({ NODE_ENV: 'production', SESSION_SECRET: 'x'.repeat(32) }), /persistente/);
});

test('login HTTP, cookie, sessao, erros e logout', async (t) => {
    const senha = ' senha de teste ';
    const hash = await bcrypt.hash(senha, 4);
    const chamadas = [];
    const pool = { async query(sql, params) {
        chamadas.push({ sql, params });
        if (params[0] === '11111111111') throw new Error('erro privado do banco');
        return { rows: params[0] === '00000000000' ? [{ id: 7, senha_hash: hash }] : [] };
    } };
    const app = express();
    app.use(express.json());
    app.use(criarSessao({ SESSION_SECRET: 'segredo exclusivo de teste '.repeat(2) }));
    app.use('/api', criarRotasLogin(pool));
    app.use((erro, req, res, next) => res.status(500).json({ mensagem: 'Falha interna' }));
    const server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.on('listening', resolve));
    t.after(() => new Promise((resolve) => server.close(resolve)));
    const url = `http://127.0.0.1:${server.address().port}/api`;
    async function login(cpf, senhaEnviada, cookie, origin) {
        return fetch(url + '/login', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}), ...(origin ? { Origin: origin } : {}) }, body: JSON.stringify({ cpf, senha: senhaEnviada }) });
    }
    assert.equal((await fetch(url + '/sessao')).status, 401);
    assert.equal((await login('abc', senha)).status, 400);
    assert.equal((await login('00000000000', 'é'.repeat(37))).status, 400);
    const ausente = await login('99999999999', senha);
    const errada = await login('00000000000', senha.trim());
    assert.equal(ausente.status, 401);
    assert.equal(errada.status, 401);
    assert.deepEqual(await ausente.json(), await errada.json());
    assert.equal((await login('00000000000', senha, null, 'https://outra-origem.example')).status, 403);
    assert.equal((await login('11111111111', senha)).status, 500);
    const sucesso = await login('000.000.000-00', senha);
    assert.equal(sucesso.status, 200);
    const setCookie = sucesso.headers.get('set-cookie');
    assert.match(setCookie, /HttpOnly/);
    assert.match(setCookie, /SameSite=Lax/);
    assert.doesNotMatch(setCookie, /Secure/);
    const cookie = setCookie.split(';')[0];
    const sessao = await fetch(url + '/sessao', { headers: { Cookie: cookie } });
    assert.deepEqual(await sessao.json(), { candidato: { id: 7 } });
    assert.equal(sessao.headers.get('cache-control'), 'no-store');
    const novoLogin = await login('00000000000', senha, cookie);
    const novoCookie = novoLogin.headers.get('set-cookie').split(';')[0];
    assert.notEqual(cookie, novoCookie);
    assert.equal((await fetch(url + '/sessao', { headers: { Cookie: cookie } })).status, 401);
    const logout = await fetch(url + '/logout', { method: 'POST', headers: { Cookie: novoCookie } });
    assert.equal(logout.status, 200);
    assert.match(logout.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/);
    assert.equal((await fetch(url + '/sessao', { headers: { Cookie: novoCookie } })).status, 401);
    assert.ok(chamadas.every(({ sql }) => sql === 'SELECT id, senha_hash FROM tbcandidato WHERE cpf = $1'));
    assert.ok(chamadas.some(({ params }) => params[0] === '00000000000'));
});
