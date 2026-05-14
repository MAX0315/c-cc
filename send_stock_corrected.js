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
    const message = `📊 股票基础知识 - 两个版本同时在线！

🔗 链接一（经典版 - wechat-article-formatting）：
https://max0315.github.io/c-cc/stock%E5%9F%BA%E7%A1%80%E7%9F%A5%E8%AF%86%E6%8E%92%E7%89%88.html
• 公众号标准排版，简洁清晰

🔗 链接二（新版 - 深色金融风格）：
https://max0315.github.io/c-cc/stock%E5%9F%BA%E7%A1%80%E7%9F%A5%E8%AF%86%E6%8E%92%E7%89%88_new.html
• 酷炫深色主题，专业金融终端风格

按需选择，嘻嘻 📈`;

    const result = await sendText(message);
    console.log(result.code === 0 ? '✅ 发送成功!' : `❌ ${result.msg}`);
}

main();