const https = require('https');

const APP_ID = "cli_aa8b1485e63bdbc3";
const APP_SECRET = "Wkn3n6yK0Byujw3N23khKcVuzNl1X8sA";
const WEBHOOK = "06844d98-f23d-4a5f-a27e-e4665d021d96";

async function getToken() {
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

// 通过手机号获取用户open_id
async function getUserIdByPhone(token, phone) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            phones: [phone]
        });
        const options = {
            hostname: 'open.feishu.cn',
            path: '/open-apis/contact/v3/users/batch_get_id',
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
            res.on('end', () => {
                const result = JSON.parse(data);
                console.log('获取用户ID结果:', JSON.stringify(result));
                if (result.code === 0 && result.data && result.data.users && result.data.users.length > 0) {
                    resolve(result.data.users[0].user_id);
                } else {
                    resolve(null);
                }
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// 发送消息给用户
async function sendMessageToUser(token, userId, docUrl) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            receive_id: userId,
            msg_type: "text",
            content: JSON.stringify({
                text: `📈 股票的基本涨跌知识

您需要的股票学习资料已准备好，点击链接查看：

${docUrl}

祝您投资顺利~ 嘻嘻 📊`
            })
        });

        const options = {
            hostname: 'open.feishu.cn',
            path: '/open-apis/im/v1/messages?receive_id_type=open_id',
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

// 通过webhook发送
async function sendViaWebhook(message) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            msg_type: "text",
            content: { text: message }
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
    const docUrl = 'https://feishu.cn/docx/TtCedG9Ynoq9CixyOHgcc2YvnEb';
    const phone = '19529307323';

    console.log('=== 获取Token ===');
    const tokenResult = await getToken();
    if (!tokenResult.tenant_access_token) {
        console.log('❌ Token获取失败');
        return;
    }
    console.log('✅ Token获取成功\n');

    const token = tokenResult.tenant_access_token;

    console.log('=== 通过手机号获取用户ID ===');
    const userId = await getUserIdByPhone(token, phone);
    if (userId) {
        console.log(`✅ 用户ID: ${userId}\n`);

        console.log('=== 发送消息给用户 ===');
        const result = await sendMessageToUser(token, userId, docUrl);
        if (result.code === 0) {
            console.log('✅ 消息发送成功!');
        } else {
            console.log(`❌ 发送失败: ${result.msg}`);
        }
    } else {
        console.log('❌ 未找到该手机号对应的用户\n');

        // 尝试通过webhook发送
        console.log('=== 通过Webhook发送 ===');
        const message = `📈 股票的基本涨跌知识

您需要的股票学习资料已准备好，点击链接查看：

${docUrl}

祝您投资顺利~ 嘻嘻 📊`;

        const result = await sendViaWebhook(message);
        console.log(result.code === 0 ? '✅ Webhook发送成功!' : `❌ Webhook发送失败: ${result.msg}`);
    }
}

main().catch(console.error);