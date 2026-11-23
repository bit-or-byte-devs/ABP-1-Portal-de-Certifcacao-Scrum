const { test } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const QRCode = require("qrcode");

process.env.SESSION_SECRET = crypto.randomBytes(32).toString("hex");
process.env.NODE_ENV = "test";

const pool = require("../src/config/db");
const app = require("../src/app");

test("consulta pública valida código sem login e não expõe dados pessoais", async (t) => {
    const codigoValido = "a".repeat(64);
    const outroCodigoValido = "c".repeat(64);
    const dataEmissao = new Date("2026-11-16T12:00:00.000Z");
    const nomeLongo = "Maria Eduarda de Albuquerque Vasconcelos e Albuquerque Monteiro de Carvalho da Costa e Silva Pereira dos Santos de Oliveira Ferreira";
    const certificados = new Map([
        [codigoValido, {
            nome_completo_emitido: "Maria Silva",
            nota_final_emitida: "75.00",
            percentual_acertos_emitido: "75.00",
            data_hora_emissao: dataEmissao,
        }],
        [outroCodigoValido, {
            nome_completo_emitido: nomeLongo,
            nota_final_emitida: "91.67",
            percentual_acertos_emitido: "91.67",
            data_hora_emissao: dataEmissao,
        }],
    ]);
    const consultaOriginal = pool.query;
    const gerarQROriginal = QRCode.toBuffer;
    const urlBaseOriginal = process.env.PUBLIC_BASE_URL;
    let urlCodificada;
    let consultas = 0;
    QRCode.toBuffer = async (url, opcoes) => {
        urlCodificada = url;
        assert.deepEqual(opcoes, { type: "png", errorCorrectionLevel: "H", width: 320, margin: 2 });
        return gerarQROriginal(url, opcoes);
    };
    pool.query = async (sql, parametros) => {
        consultas++;
        assert.match(sql, /FROM tbcertificado\s+WHERE codigo_validacao=\$1/);
        assert.deepEqual(parametros, [parametros[0], 65]);
        const certificado = certificados.get(parametros[0]);
        return { rows: certificado ? [certificado] : [] };
    };

    const servidor = app.listen(0, "127.0.0.1");
    await new Promise(resolve => servidor.once("listening", resolve));
    t.after(async () => {
        pool.query = consultaOriginal;
        QRCode.toBuffer = gerarQROriginal;
        if (urlBaseOriginal === undefined) delete process.env.PUBLIC_BASE_URL;
        else process.env.PUBLIC_BASE_URL = urlBaseOriginal;
        await new Promise(resolve => servidor.close(resolve));
        await pool.end();
    });

    const base = `http://127.0.0.1:${servidor.address().port}`;
    const pagina = await fetch(`${base}/pages/consultar-certificado.html`, { redirect: "manual" });
    assert.equal(pagina.status, 200);
    const html = await pagina.text();
    assert.match(html, /consulta-certificado\.js/);
    assert.doesNotMatch(html, /sessao-estudos\.js/);
    assert.match(html, /id="status-certificado">Autenticidade confirmada</);
    assert.match(html, /id="qr-certificado-publico"/);

    function codigoPreenchido(search) {
        const codigoInput = { value: "" };
        const elementos = {
            "consulta-form": { addEventListener() {} },
            "codigo-consulta": codigoInput,
            "btn-consultar-codigo": { disabled: false },
            "consulta-mensagem": { textContent: "" },
            "resultado-certificado": { hidden: true },
        };
        let inicializarConsulta;
        let chamadasApi = 0;
        vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../../frontend/js/consulta-certificado.js"), "utf8"), {
            URLSearchParams,
            location: { search },
            document: {
                addEventListener: (evento, callback) => { if (evento === "DOMContentLoaded") inicializarConsulta = callback; },
                getElementById: id => elementos[id],
            },
            fetch: () => { chamadasApi++; throw new Error("A consulta não deve iniciar automaticamente."); },
        });
        inicializarConsulta();
        return { codigo: codigoInput.value, chamadasApi };
    }
    assert.deepEqual(codigoPreenchido(`?codigo=${codigoValido}&via=qrcode`), { codigo: codigoValido, chamadasApi: 0 });
    assert.deepEqual(codigoPreenchido(`?codigo=${codigoValido}`), { codigo: "", chamadasApi: 0 });

    async function validar(codigo) {
        return fetch(`${base}/api/certificados/validar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ codigo }),
        });
    }

    const invalido = await validar("nao-e-um-codigo");
    assert.equal(invalido.status, 404);
    assert.equal(consultas, 0);

    const resposta = await validar(codigoValido);
    assert.equal(resposta.status, 200);
    assert.equal(resposta.headers.get("cache-control"), "no-store");
    assert.deepEqual(await resposta.json(), {
        valido: true,
        certificado: {
            nome: "Maria Silva",
            nota_final: 75,
            percentual_acertos: 75,
            data_hora_emissao: dataEmissao.toISOString(),
        },
    });

    // O endereço usado pelo navegador pode ser local; o QR deve usar a URL pública configurada.
    const baseLocalhost = base.replace("127.0.0.1", "localhost");
    process.env.PUBLIC_BASE_URL = "http://192.168.1.42:3000";
    const destinoEsperado = `/pages/consultar-certificado.html?codigo=${codigoValido}&via=qrcode`;
    const qr = await fetch(`${baseLocalhost}/api/certificados/${codigoValido}/qr`);
    assert.equal(qr.status, 200);
    assert.match(qr.headers.get("content-type"), /image\/png/);
    const png = Buffer.from(await qr.arrayBuffer());
    assert.deepEqual([...png.subarray(0, 4)], [137, 80, 78, 71]);
    assert.equal(urlCodificada, process.env.PUBLIC_BASE_URL + destinoEsperado);

    for (const [codigo, certificado] of certificados) {
        const pdf = await fetch(`${baseLocalhost}/api/certificados/${codigo}/pdf`);
        assert.equal(pdf.status, 200);
        assert.match(pdf.headers.get("content-type"), /application\/pdf/);
        assert.equal(pdf.headers.get("content-disposition"), `attachment; filename="certificado-${codigo}.pdf"`);
        const arquivoPdf = Buffer.from(await pdf.arrayBuffer()).toString("latin1");
        assert.ok(arquivoPdf.startsWith("%PDF-"));
        // O PDFKit grava o total de páginas no dicionário /Pages, fora dos streams compactados.
        const paginas = arquivoPdf.match(/\/Type \/Pages\s+\/Count (\d+)/)?.[1];
        assert.equal(paginas, "1", `O certificado ${codigo} deve ter uma única página`);
        const destino = new URL(urlCodificada);
        assert.equal(destino.href, `${process.env.PUBLIC_BASE_URL}/pages/consultar-certificado.html?codigo=${codigo}&via=qrcode`);
        const preenchimento = codigoPreenchido(destino.search);
        assert.deepEqual(preenchimento, { codigo, chamadasApi: 0 });
        const consulta = await validar(preenchimento.codigo);
        assert.equal(consulta.status, 200);
        assert.equal((await consulta.json()).certificado.nome, certificado.nome_completo_emitido);
    }

    process.env.PUBLIC_BASE_URL = "http://192.168.1.43:3000";
    for (const formato of ["qr", "pdf"]) {
        const atualizado = await fetch(`${baseLocalhost}/api/certificados/${codigoValido}/${formato}`);
        assert.equal(atualizado.status, 200);
        await atualizado.arrayBuffer();
        assert.equal(urlCodificada, process.env.PUBLIC_BASE_URL + destinoEsperado);
    }

    const naoEncontrado = await validar("b".repeat(64));
    assert.equal(naoEncontrado.status, 404);
    assert.equal(consultas, 9);
});
