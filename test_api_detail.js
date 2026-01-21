const https = require('https');

const options = {
    hostname: 'sistema-rh-google-sheets.vercel.app',
    path: '/api/colaboradores/24520143039',
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
};

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(body);
            if (json.data) {
                console.log("DATA KEYS:", Object.keys(json.data));
                console.log("SALARIO_BASE:", json.data.salario_base);
                console.log("SALARIO:", json.data.salario);
            } else {
                console.log("NO DATA FIELD");
            }
        } catch (e) { console.error(e); }
    });
});
req.end();
