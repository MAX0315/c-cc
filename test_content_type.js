const https = require('https');
const fs = require('fs');

const APP_ID = "cli_aa8b1485e63bdbc3";
const APP_SECRET = "Wkn3n6yK0Byujw3N23khKcVuzNl1X8sA";

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

// 尝试不同的Content-Type
async function testUpload(token, filePath, contentType) {
    const fileContent = fs.readFileSync(filePath);
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';

    return new Promise((resolve) => {
        const body = Buffer.concat([
            Buffer.from(`--${boundary}\r\n`),
            Buffer.from(`Content-Disposition: form-data; name="image"; filename="test.jpg"\r\n`),
            Buffer.from(`Content-Type: ${contentType}\r\n\r\n`),
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
                const result = JSON.parse(data);
                resolve(result);
            });
        });

        req.on('error', (e) => resolve({ code: -1, msg: e.message }));
        req.write(body);
        req.end();
    });
}

async function main() {
    const token = await getToken();
    console.log('Token获取成功\n');

    const testFile = 'C:/c-cc/xhs-images/temp_jpg/test.jpg';

    const contentTypes = [
        'image/jpeg',
        'image/png',
        'application/octet-stream',
        'binary/octet-stream'
    ];

    for (const ct of contentTypes) {
        console.log(`测试 Content-Type: ${ct}`);
        const result = await testUpload(token, testFile, ct);
        console.log(`  结果: ${result.code === 0 ? '✅ 成功' : `❌ 失败 - ${result.msg || result.code}`}`);
    }
}

main().catch(console.error);