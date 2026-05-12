const https = require('https');
const fs = require('fs');
const path = require('path');

const APP_ID = "cli_aa8b1485e63bdbc3";
const APP_SECRET = "Wkn3n6yK0Byujw3N23khKcVuzNl1X8sA";
const WEBHOOK = "06844d98-f23d-4a5f-a27e-e4665d021d96";

function getToken() {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET });
        const options = {
            hostname: 'open.feishu.cn',
            path: '/open-apis/auth/v3/tenant_access_token/internal',
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data).tenant_access_token));
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

function uploadImage(token, filePath) {
    return new Promise((resolve, reject) => {
        const fileName = path.basename(filePath);
        const fileContent = fs.readFileSync(filePath);
        const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';

        const body = Buffer.concat([
            Buffer.from(`--${boundary}\r\n`),
            Buffer.from(`Content-Disposition: form-data; name="image"; filename="${fileName}"\r\n`),
            Buffer.from(`Content-Type: image/jpeg\r\n\r\n`),
            fileContent,
            Buffer.from(`\r\n--${boundary}--\r\n`)
        ]);

        const options = {
            hostname: 'open.feishu.cn',
            path: '/open-apis/im/v1/images',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': body.length
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log('Upload response:', data.substring(0, 200));
                try {
                    const result = JSON.parse(data);
                    if (result.code === 0 && result.data && result.data.image_key) {
                        resolve(result.data.image_key);
                    } else {
                        console.log('Upload failed:', result.msg);
                        resolve(null);
                    }
                } catch (e) {
                    console.log('Parse error:', e.message);
                    resolve(null);
                }
            });
        });

        req.on('error', (e) => {
            console.log('Request error:', e.message);
            resolve(null);
        });

        req.write(body);
        req.end();
    });
}

function sendImage(imageKey) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            msg_type: "image",
            content: { image_key: imageKey }
        });

        const options = {
            hostname: 'open.feishu.cn',
            path: `/open-apis/bot/v2/hook/${WEBHOOK}`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(postData) }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function main() {
    const imageDir = 'C:/c-cc/seedance-images';
    const files = fs.readdirSync(imageDir).filter(f => f.endsWith('.jpg')).slice(0, 5);

    const token = await getToken();
    console.log('Token:', token.substring(0, 20) + '...\n');

    for (let i = 0; i < files.length; i++) {
        const filePath = path.join(imageDir, files[i]);
        console.log(`[${i + 1}/${files.length}] ${files[i]}`);

        const imageKey = await uploadImage(token, filePath);
        if (imageKey) {
            const result = await sendImage(imageKey);
            console.log(result.code === 0 ? '  ✅ Sent!' : `  ❌ ${result.msg}`);
        }

        await new Promise(r => setTimeout(r, 500));
    }

    console.log('\nDone!');
}

main();
