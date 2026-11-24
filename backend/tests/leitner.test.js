const { test } = require('node:test');
const assert = require('node:assert/strict');
const { proximaCaixa } = require('../src/services/leitner');

test('proximaCaixa: tabela completa de transições Leitner em 3 caixas', () => {
    const tabela = [
        // [caixa atual, sabia, próxima caixa]
        [null, true, 2],
        [null, false, 1],
        [1, true, 2],
        [1, false, 1],
        [2, true, 3],
        [2, false, 1],
        [3, true, 3],
        [3, false, 1],
    ];
    for (const [atual, sabia, esperada] of tabela)
        assert.equal(proximaCaixa(atual, sabia), esperada, `caixa ${atual} com sabia=${sabia}`);
});

test('proximaCaixa: invariantes valem para todas as entradas válidas', () => {
    for (const atual of [null, 1, 2, 3]) {
        for (const sabia of [true, false]) {
            const proxima = proximaCaixa(atual, sabia);
            assert.ok([1, 2, 3].includes(proxima));
            if (!sabia) assert.equal(proxima, 1, 'errar sempre volta para a caixa 1');
            else assert.ok(proxima >= (atual ?? 1) && proxima <= 3, 'acertar nunca desce de caixa');
        }
    }
});

test('proximaCaixa: recusa entradas fora do domínio', () => {
    for (const atual of [0, 4, '1', undefined, 1.5]) assert.throws(() => proximaCaixa(atual, true), TypeError);
    for (const sabia of ['true', 1, null, undefined]) assert.throws(() => proximaCaixa(1, sabia), TypeError);
});
