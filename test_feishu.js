const https = require('https');

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
            res.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// 测试webhook发送文本
async function testWebhook() {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            msg_type: "text",
            content: { text: "🔧 测试消息 - 图片发送调试中" }
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

// 测试上传图片 - 尝试不同格式
async function testUpload(token, filePath) {
    const fs = require('fs');
    const path = require('path');

    const fileName = path.basename(filePath);
    const fileContent = fs.readFileSync(filePath);

    // 方式1: name="image"
    const boundary1 = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const body1 = Buffer.concat([
        Buffer.from(`--${boundary1}\r\n`),
        Buffer.from(`Content-Disposition: form-data; name="image"; filename="${fileName}"\r\n`),
        Buffer.from(`Content-Type: image/jpeg\r\n\r\n`),
        fileContent,
        Buffer.from(`\r\n--${boundary1}--\r\n`)
    ]);

    // 方式2: name="file"
    const boundary2 = '----WebKitFormBoundary7MA4YWxkTrZu0gW2';
    const body2 = Buffer.concat([
        Buffer.from(`--${boundary2}\r\n`),
        Buffer.from(`Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`),
        Buffer.from(`Content-Type: image/jpeg\r\n\r\n`),
        fileContent,
        Buffer.from(`\r\n--${boundary2}--\r\n`)
    ]);

    // 方式3: 无filename
    const boundary3 = '----WebKitFormBoundary7MA4YWxkTrZu0gW3';
    const body3 = Buffer.concat([
        Buffer.from(`--${boundary3}\r\n`),
        Buffer.from(`Content-Disposition: form-data; name="image"\r\n`),
        Buffer.from(`Content-Type: image/jpeg\r\n\r\n`),
        fileContent,
        Buffer.from(`\r\n--${boundary3}--\r\n`)
    ]);

    const methods = [
        { name: 'image+filename', boundary: boundary1, body: body1 },
        { name: 'file+filename', boundary: boundary2, body: body2 },
        { name: 'image+noFilename', boundary: boundary3, body: body3 }
    ];

    for (const method of methods) {
        console.log(`\n尝试方式: ${method.name}`);
        console.log(`body length: ${method.body.length}`);

        const result = await new Promise((resolve) => {
            const options = {
                hostname: 'open.feishu.cn',
                path: '/open-apis/im/v1/images',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': `multipart/form-data; boundary=${method.boundary}`,
                    'Content-Length': method.body.length
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        resolve({ error: e.message, raw: data });
                    }
                });
            });

            req.on('error', (e) => resolve({ error: e.message }));
            req.write(method.body);
            req.end();
        });

        if (result.code === 0 && result.data && result.data.image_key) {
            console.log(`✅ 成功! image_key: ${result.data.image_key}`);
            return result.data.image_key;
        } else {
            console.log(`❌ 失败: ${result.msg || result.error || JSON.stringify(result)}`);
        }
    }

    return null;
}

async function main() {
    console.log('=== 1. 测试Token获取 ===');
    const tokenResult = await getToken();
    if (tokenResult.tenant_access_token) {
        console.log('✅ Token获取成功');
    } else {
        console.log('❌ Token获取失败:', tokenResult.msg);
        return;
    }

    const token = tokenResult.tenant_access_token;

    console.log('\n=== 2. 测试Webhook发送文本 ===');
    const webhookResult = await testWebhook();
    console.log(webhookResult.code === 0 ? '✅ Webhook正常' : `❌ Webhook失败: ${webhookResult.msg}`);

    console.log('\n=== 3. 测试图片上传(多种方式) ===');
    const imageKey = await testUpload(token, 'C:/c-cc/xhs-images/68a6af36000000001b01df6d/68a6af36000000001b01df6d_1.jpg');

    if (imageKey) {
        console.log('\n✅ 图片上传成功! image_key:', imageKey);
    } else {
        console.log('\n❌ 图片上传全部失败');
    }
}

main().catch(console.error);