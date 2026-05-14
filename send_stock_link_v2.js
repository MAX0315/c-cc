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
    const message = `📊 股票基础知识【新版】上线！

🎨 全新深色金融风格排版：
• 酷炫深色主题，眼睛更舒适
• 卡片式布局，信息更清晰
• 买入卖出信号一目了然
• 技术指标可视化展示

🔗 在线预览：
https://max0315.github.io/c-cc/stock%E5%9F%BA%E7%A1%80%E7%9F%A5%E8%AF%86%E6%8E%92%E7%89%88.html

点击即可查看全新排版效果~ 嘻嘻 📈`;

    const result = await sendText(message);
    console.log(result.code === 0 ? '✅ 发送成功!' : `❌ ${result.msg}`);
}

main();