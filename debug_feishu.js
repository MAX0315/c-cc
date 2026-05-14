const https = require('https');
const fs = require('fs');

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

// 通过webhook发送图片（需要image_key，但目前上传失败）
// 尝试将图片转为base64发送
function sendImageViaWebhook(imageKey) {
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

// 尝试获取群列表 - 确认权限
async function getChats(token) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'open.feishu.cn',
            path: '/open-apis/im/v1/chats?page_size=20',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve(result);
                } catch (e) {
                    resolve({ code: -1, msg: e.message });
                }
            });
        });

        req.on('error', (e) => resolve({ code: -1, msg: e.message }));
        req.end();
    });
}

async function main() {
    console.log('=== 飞书图片发送调试 ===\n');

    // 1. 获取token
    const tokenResult = await getToken();
    if (!tokenResult.tenant_access_token) {
        console.log('❌ Token获取失败');
        return;
    }
    console.log('✅ Token获取成功');
    const token = tokenResult.tenant_access_token;

    // 2. 检查应用权限
    console.log('\n=== 检查群列表权限 ===');
    const chatsResult = await getChats(token);
    console.log('获取群列表结果:', JSON.stringify(chatsResult, null, 2));

    // 3. 尝试直接用webhook发送图片（如果image_key有效的话）
    console.log('\n=== 尝试发送图片到群 ===');
    // 注意：这里需要有效的image_key，但目前上传失败

    // 4. 检查图片文件
    const testImg = 'C:/c-cc/xhs-images/68a6af36000000001b01df6d/68a6af36000000001b01df6d_1.jpg';
    const stats = fs.statSync(testImg);
    console.log(`\n测试图片: ${testImg}`);
    console.log(`大小: ${stats.size} bytes (${(stats.size / 1024).toFixed(2)} KB)`);

    // 5. 读取图片检查格式
    const buffer = fs.readFileSync(testImg);
    console.log(`文件头: ${buffer.slice(0, 10).toString('hex')}`);
    console.log(`是否为JPEG: ${buffer.slice(0, 2).toString('hex') === 'ffd8'}`);

    console.log('\n⚠️ 飞书图片上传需要：');
    console.log('1. 正确的API权限 (im:chat 或 im:message');
    console.log('2. 正确的Content-Type和Content-Disposition');
    console.log('3. 图片必须小于20MB');
    console.log('4. 必须是JPG/PNG/GIF格式');

    console.log('\n👉 请检查：');
    console.log('1. 飞书应用是否已开通「im:message」权限');
    console.log('2. 机器人是否已添加到目标群');
    console.log('3. 权限是否已审批通过');
}

main().catch(console.error);