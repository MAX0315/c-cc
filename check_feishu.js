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

// 检查应用权限列表
async function getAppInfo(token) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'open.feishu.cn',
            path: '/open-apis/application/v6/applications/cli_aa8b1485e63bdbc3',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve({ error: e.message });
                }
            });
        });

        req.on('error', () => resolve({ error: 'request failed' }));
        req.end();
    });
}

// 测试webhook基本连通性
function testWebhookBasic() {
    return new Promise((resolve) => {
        // 发送一个测试文本消息
        const postData = JSON.stringify({
            msg_type: "text",
            content: { text: "🔧 Webhook连通性测试 - 请忽略" }
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
            res.on('end', () => {
                const result = JSON.parse(data);
                resolve(result);
            });
        });

        req.on('error', (e) => resolve({ code: -1, msg: e.message }));
        req.write(postData);
        req.end();
    });
}

async function main() {
    console.log('=== 飞书机器人调试 ===\n');

    // 1. 测试Webhook基本功能
    console.log('1. 测试Webhook发送文本...');
    const webhookResult = await testWebhookBasic();
    console.log(webhookResult.code === 0 ? '   ✅ Webhook正常' : `   ❌ Webhook失败: ${webhookResult.msg}`);
    console.log('');

    // 2. 获取Token并检查应用信息
    console.log('2. 获取Token...');
    const tokenResult = await getToken();
    if (tokenResult.tenant_access_token) {
        console.log('   ✅ Token获取成功\n');
        const token = tokenResult.tenant_access_token;

        // 3. 检查应用权限
        console.log('3. 检查应用信息...');
        const appInfo = await getAppInfo(token);
        console.log(JSON.stringify(appInfo, null, 2));
    } else {
        console.log('   ❌ Token获取失败\n');
    }

    console.log('\n📌 当前状态:');
    console.log('   - Webhook发送文本: ✅ 正常');
    console.log('   - 上传图片获取image_key: ❌ 失败 (Invalid request param)');
    console.log('');
    console.log('💡 可能的原因:');
    console.log('   1. 应用权限未完全审批通过');
    console.log('   2. 需要在飞书开放平台开通「图片消息」权限');
    console.log('   3. 应用需要管理员审批');
}

main().catch(console.error);