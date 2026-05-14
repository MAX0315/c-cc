const https = require('https');

const APP_ID = "cli_aa8b1485e63bdbc3";
const APP_SECRET = "Wkn3n6yK0Byujw3N23khKcVuzNl1X8sA";

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
            res.on('end', () => resolve(JSON.parse(data).tenant_access_token));
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function searchUserByPhone(token, phone) {
    return new Promise((resolve) => {
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
                console.log('查找用户结果:', JSON.stringify(result, null, 2));
                if (result.code === 0 && result.data && result.data.users && result.data.users.length > 0) {
                    resolve(result.data.users[0].user_id);
                } else {
                    resolve(null);
                }
            });
        });
        req.on('error', () => resolve(null));
        req.write(postData);
        req.end();
    });
}

async function sendMessage(token, userId, docUrl) {
    return new Promise((resolve) => {
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

        req.on('error', () => resolve({ code: -1, msg: 'request failed' }));
        req.write(postData);
        req.end();
    });
}

async function main() {
    const docUrl = 'https://feishu.cn/docx/M5uId4OZioWtiWxF16Fc22c6nSc';
    const phone = '19529307323';

    console.log('=== 获取Token ===');
    const token = await getToken();
    console.log('✅ Token获取成功\n');

    console.log('=== 查找用户 ===');
    const userId = await searchUserByPhone(token, phone);

    if (userId) {
        console.log(`\n✅ 找到用户ID: ${userId}\n`);
        console.log('=== 发送消息 ===');
        const result = await sendMessage(token, userId, docUrl);
        if (result.code === 0) {
            console.log('✅ 消息发送成功!');
        } else {
            console.log(`❌ 发送失败: ${result.msg}`);
        }
    } else {
        console.log('\n❌ 未找到该手机号对应的飞书用户');
        console.log('📎 文档链接:', docUrl);
    }
}

main().catch(console.error);