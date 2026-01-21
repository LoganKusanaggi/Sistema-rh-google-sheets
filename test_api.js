const https = require('https');

const data = JSON.stringify({
    filtros: { status: 'ativo' }
});

const options = {
    hostname: 'sistema-rh-google-sheets.vercel.app',
    path: '/api/colaboradores/buscar',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => {
        body += chunk;
    });
    res.on('end', () => {
        try {
            const json = JSON.parse(body);
            if (json.colaboradores && json.colaboradores.length > 0) {
                // Imprimir cada colaborador e seu salário para ver se algum tem
                console.log("Total encontrados: " + json.colaboradores.length);
                for (let i = 0; i < Math.min(5, json.colaboradores.length); i++) {
                    const c = json.colaboradores[i];
                    console.log(`CPF: ${c.cpf} | SB: ${c.salario_base} | S: ${c.salario}`);
                }
            }
        } catch (e) {
            console.error(e);
        }
    });
});

req.write(data);
req.end();
