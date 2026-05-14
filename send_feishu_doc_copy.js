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
    const message = `📄 Claude Code 使用 - 副本（可编辑）

已为您创建文档副本，可以自由编辑：

https://kcnxjau9hxy4.feishu.cn/docx/XHsIdIk3SoQn8mxR39rcWhRcnpg

⚠️ 注意：由于飞书API限制，文档内容需要手动复制粘贴。
   您可以打开原文档，全选复制，然后粘贴到新文档中。

原文档：https://kcnxjau9hxy4.feishu.cn/wiki/X0QNwZxwKi6G1FkYSV7cy4ZQndc

嘻嘻 📖`;

    const result = await sendText(message);
    console.log(result.code === 0 ? '✅ 发送成功!' : `❌ ${result.msg}`);
}

main();