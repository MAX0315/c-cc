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
    const message = `📄 Claude Code 使用 - 飞书云文档 副本

文档内容已准备好，点击链接查看：

https://kcnxjau9hxy4.feishu.cn/wiki/X0QNwZxwKi6G1FkYSV7cy4ZQndc

包含完整目录：
• 第一章 Claude Code 基础入门
• 第二章 安装与配置
• 第三章 核心命令与操作
• 第四章 文件编辑技巧
• 第五章 项目实战流程
• 第六章 模型选择与优化
• 第七章 团队协作与工作流集成
• 第八章 提示词工程技巧
• 第九章 安全与权限管理
• 第十章 高级配置与定制

嘻嘻 📖`;

    const result = await sendText(message);
    console.log(result.code === 0 ? '✅ 发送成功!' : `❌ ${result.msg}`);
}

main();