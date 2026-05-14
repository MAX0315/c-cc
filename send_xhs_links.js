const https = require('https');
const fs = require('fs');
const path = require('path');

const WEBHOOK = "06844d98-f23d-4a5f-a27e-e4665d021d96";

function sendText(message) {
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
    const imageDir = 'C:/c-cc/xhs-images/68a6af36000000001b01df6d';
    const files = fs.readdirSync(imageDir).filter(f => f.match(/\.(jpg|jpeg|png|webp|gif)$/i)).sort();

    console.log(`共 ${files.length} 张图片\n`);

    // 生成图片链接列表
    let message = `📸 小红书图片分享 (${files.length}张)\n\n`;

    files.forEach((file, i) => {
        const url = `https://raw.githubusercontent.com/MAX0315/c-cc/main/xhs-images/68a6af36000000001b01df6d/${encodeURIComponent(file)}`;
        message += `${i + 1}. ${file}\n${url}\n\n`;
    });

    message += `\n点击链接可查看/下载图片~ 嘻嘻 📷`;

    console.log('发送消息到飞书群...\n');
    const result = await sendText(message);

    if (result.code === 0) {
        console.log('✅ 发送成功!');
    } else {
        console.log(`❌ 发送失败: ${result.msg}`);
    }
}

main().catch(console.error);