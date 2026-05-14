const https = require('https');

const WEBHOOK = "06844d98-f23d-4a5f-a27e-e4665d021d96";

async function sendText(message) {
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
    const message = `🐍 贪吃蛇 Orange 新版发布！

基于黑色+橙色配色重制，视觉效果超棒！

🎮 游戏链接：https://github.com/MAX0315/c-cc/blob/main/snake-color.html

支持加速道具、粒子特效、屏幕震动等炫酷功能，快去体验吧~ 嘻嘻 🎮`;

    const result = await sendText(message);
    console.log(result.code === 0 ? '✅ 发送成功!' : `❌ ${result.msg}`);
}

main();
