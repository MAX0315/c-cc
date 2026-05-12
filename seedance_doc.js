const https = require('https');

const APP_ID = "cli_aa8b1485e63bdbc3";
const APP_SECRET = "Wkn3n6yK0Byujw3N23khKcVuzNl1X8sA";

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
            res.on('end', () => resolve(JSON.parse(data).tenant_access_token));
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

function createDoc(token, title) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({ title });
        const options = {
            hostname: 'open.feishu.cn',
            path: '/open-apis/docx/v1/documents',
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
                if (result.code === 0) {
                    resolve(result.data.document);
                } else {
                    reject(new Error(`创建文档失败: ${result.msg}`));
                }
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

function addBlock(token, documentId, parentId, index, block) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            children: [block],
            index: index
        });

        const options = {
            hostname: 'open.feishu.cn',
            path: `/open-apis/docx/v1/documents/${documentId}/blocks/${parentId}/children`,
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
                if (result.code === 0) {
                    resolve(result.data);
                } else {
                    console.log('添加块失败:', result.msg);
                    resolve(null);
                }
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

function createTextElement(content) {
    return {
        text_run: {
            content: content,
            text_element_style: {}
        }
    };
}

function createTextBlock(content) {
    return {
        block_type: 2,
        text: {
            elements: [createTextElement(content)],
            style: {}
        }
    };
}

function createHeadingBlock(content, level) {
    const blockTypes = { 1: 3, 2: 4, 3: 5 };
    const blockType = blockTypes[level] || 3;
    const headingKey = `heading${level}`;

    return {
        block_type: blockType,
        [headingKey]: {
            elements: [createTextElement(content)],
            style: {}
        }
    };
}

async function main() {
    const token = await getToken();
    console.log('Token获取成功\n');

    const doc = await createDoc(token, '🚀 Seedance AI 视频生成工具深度解析');
    console.log('文档创建成功!');
    console.log(`文档ID: ${doc.document_id}`);
    console.log(`文档链接: https://feishu.cn/docx/${doc.document_id}\n`);

    const docId = doc.document_id;

    const contentBlocks = [
        { type: 'h1', content: '📌 什么是 Seedance？', index: 0 },
        { type: 'text', content: 'Seedance 是字节跳动推出的 AI 视频生成模型，属于即梦（JiMeng）平台的核心能力之一。它能够根据图片或文字提示生成高质量的视频内容，在短视频制作、广告创意等领域有着广泛的应用前景。' },

        { type: 'h1', content: '🎯 核心玩法介绍', index: 2 },
        { type: 'h2', content: '1. 图生视频（Image to Video）', index: 3 },
        { type: 'text', content: '这是 Seedance 最受欢迎的功能之一。用户只需上传一张图片，Seedance 就能将其转化为动态视频。这项技术在电商详情页视频化、静态图片动态化等场景中非常实用。' },
        { type: 'text', content: '典型应用场景：产品展示视频生成、老照片动态化、logo 动画制作等。' },

        { type: 'h2', content: '2. 分镜图直出产品视频', index: 5 },
        { type: 'text', content: '通过预先设计的分镜图，Seedance 可以一键生成完整的短视频。这种工作流特别适合品牌营销内容创作，能够大幅提升视频生产效率。' },

        { type: 'h2', content: '3. GPT Image 2 + Seedance 2.0 组合', index: 7 },
        { type: 'text', content: '先用 GPT Image 2 生成高质量图片，再用 Seedance 2.0 将其动画化，这是一种被广泛验证的 AI 视频生产流水线。这种组合能够实现「图生视频」的高质量输出。' },

        { type: 'h1', content: '💡 Claude 的观点', index: 9 },
        { type: 'text', content: '作为一个 AI 助手，我认为 Seedance 在国产 AI 视频工具中表现出色：' },
        { type: 'text', content: '优势：' },
        { type: 'text', content: '• 视频生成质量稳定，特别是图生视频功能' },
        { type: 'text', content: '• 与字节生态（抖音、TikTok）深度整合' },
        { type: 'text', content: '• 操作简便，上手门槛低' },
        { type: 'text', content: '• 生成速度较快，适合内容创作者日常使用' },
        { type: 'text', content: '待改进：' },
        { type: 'text', content: '• 复杂动作序列的处理能力还有提升空间' },
        { type: 'text', content: '• 视频时长限制对某些场景不够友好' },
        { type: 'text', content: '• 与竞品（如 Runway、可灵）相比，在某些专业场景下效果略有差异' },

        { type: 'h1', content: '📊 总结', index: 19 },
        { type: 'text', content: 'Seedance 作为国产 AI 视频生成工具的优秀代表，为内容创作者提供了便捷的视频生产能力。尤其是图生视频功能，将静态图片转化为动态内容的能力非常实用。结合 GPT Image 等图片生成工具，可以构建完整的 AI 内容生产流水线。' },
        { type: 'text', content: '随着技术的持续迭代，Seedance 有望在 AI 视频生成领域带来更多惊喜！' },
    ];

    for (const block of contentBlocks) {
        let b;
        if (block.type === 'h1') {
            b = createHeadingBlock(block.content, 1);
        } else if (block.type === 'h2') {
            b = createHeadingBlock(block.content, 2);
        } else {
            b = createTextBlock(block.content);
        }
        await addBlock(token, docId, docId, block.index, b);
        await new Promise(r => setTimeout(r, 300));
    }

    console.log('\n文档内容添加完成!');
    console.log(`📎 文档链接: https://feishu.cn/docx/${docId}`);

    const message = `🚀 Seedance AI 视频工具分析报告已生成！

📄 文档链接：https://feishu.cn/docx/${docId}

包含内容：
• Seedance 核心玩法介绍
• 图生视频等实用技巧
• Claude 的专业点评
• 适用场景分析

快去看看吧～`;

    sendFeishuMessage(message);
}

function sendFeishuMessage(content) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            msg_type: "text",
            content: { text: content }
        });

        const options = {
            hostname: 'open.feishu.cn',
            path: '/open-apis/bot/v2/hook/06844d98-f23d-4a5f-a27e-e4665d021d96',
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(postData) }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log('\n飞书消息发送结果:', data);
                resolve(JSON.parse(data));
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

main().catch(console.error);