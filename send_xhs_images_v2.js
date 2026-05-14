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

// 尝试IM API上传图片
function uploadImageIM(token, filePath) {
    return new Promise((resolve, reject) => {
        const fileName = path.basename(filePath);
        const fileContent = fs.readFileSync(filePath);
        const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';

        const body = Buffer.concat([
            Buffer.from(`--${boundary}\r\n`),
            Buffer.from(`Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`),
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
                console.log('Upload response:', data.substring(0, 300));
                try {
                    const result = JSON.parse(data);
                    if (result.code === 0 && result.data && result.data.image_key) {
                        resolve(result.data.image_key);
                    } else {
                        console.log('Upload failed:', result.msg, result.code);
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

// 通过IM API发送图片消息
function sendImageMessage(token, imageKey) {
    return new Promise((resolve, reject) => {
        // 需要获取chat_id，这里用 webhook 方式
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

// 获取机器人所在群列表
async function getBotChats(token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'open.feishu.cn',
            path: '/open-apis/im/v1/chats?page_size=50',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const result = JSON.parse(data);
                if (result.code === 0) {
                    resolve(result.data.items);
                } else {
                    console.log('Get chats failed:', result.msg);
                    resolve([]);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

// 通过IM API发送到群
async function sendImageToChat(token, chatId, imageKey) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            receive_id: chatId,
            msg_type: "image",
            content: JSON.stringify({ image_key: imageKey })
        });

        const options = {
            hostname: 'open.feishu.cn',
            path: '/open-apis/im/v1/messages?receive_id_type=chat_id',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
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
    const imageDir = 'C:/c-cc/xhs-images/68a6af36000000001b01df6d';
    const files = fs.readdirSync(imageDir).filter(f => f.endsWith('.jpg')).sort();

    console.log('获取Token...');
    const token = await getToken();

    console.log('获取群列表...');
    const chats = await getBotChats(token);
    console.log(`机器人所在群: ${chats.length} 个`);

    if (chats.length > 0) {
        console.log('群列表:');
        chats.forEach((chat, i) => {
            console.log(`  ${i + 1}. ${chat.name} (${chat.chat_id})`);
        });
    }

    console.log(`\n开始上传并发送 ${files.length} 张图片...\n`);

    let success = 0;
    const chatId = chats.length > 0 ? chats[0].chat_id : null;

    for (let i = 0; i < files.length; i++) {
        const filePath = path.join(imageDir, files[i]);
        console.log(`[${i + 1}/${files.length}] ${files[i]}`);

        const imageKey = await uploadImageIM(token, filePath);
        if (imageKey) {
            console.log(`  image_key: ${imageKey}`);

            // 通过IM API发送到群
            const result = await sendImageToChat(token, chatId, imageKey);
            if (result.code === 0) {
                console.log('  ✅ 发送成功');
                success++;
            } else {
                console.log(`  ❌ 发送失败: ${result.msg}`);
            }
        } else {
            console.log('  ❌ 上传失败');
        }

        await new Promise(r => setTimeout(r, 500));
    }

    console.log(`\n完成！成功发送 ${success}/${files.length} 张图片~`);
}

main().catch(console.error);