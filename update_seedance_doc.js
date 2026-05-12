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

    const documentId = 'ODvndMalGog6bGxGCdacZmjenSg';
    const insertIndex = 18;

    // 用纯文本块展示表格，更清晰
    const pricingBlocks = [
        { type: 'h1', content: '💰 AI 视频工具费用成本对比', index: insertIndex },
        { type: 'text', content: '以下是基于 2026 年 5 月最新数据整理的各 AI 视频生成工具费用对比（按每秒成本计算）：' },

        // 用引用块展示价格对比
        { type: 'quote', content: '┌─────────────────┬──────────────┬──────────────┬──────────────┬─────────┐\n│ 工具            │ 免费额度      │ 付费起价       │ 折合每秒成本   │ 备注     │\n├─────────────────┼──────────────┼──────────────┼──────────────┼─────────┤\n│ 即梦 Seedance   │ 50积分/日     │ 月度会员29元起 │ 约0.35-0.5元/秒│ 积分制   │\n│ 可灵 Kling      │ 66积分/日     │ 月度会员39元起 │ 约0.4-0.6元/秒 │ 长视频199元│\n│ VEO 3          │ 无免费额度    │ 约60美元/月   │ 约0.7-1元/秒   │ Google出品│\n│ HappyHorse     │ 少量试用      │ 待定          │ 约0.2-0.4元/秒 │ 阿里新品  │\n│ Runway Gen-3   │ 125积分/周    │ 15美元/月起   │ 约0.5-0.8元/秒 │ 老牌工具  │\n└─────────────────┴──────────────┴──────────────┴──────────────┴─────────┘' },

        { type: 'h2', content: '📊 详细分析', index: insertIndex + 3 },
        { type: 'text', content: '💡 即梦 Seedance：字节跳动旗下产品，积分制收费，每日签到赠送额度，会员性价比高，适合高频用户。' },
        { type: 'text', content: '💡 可灵 Kling：快手推出的AI视频工具，定价与Seedance相近，长视频会员199元，生态完善。' },
        { type: 'text', content: '💡 VEO 3：Google推出的AI视频生成工具，定价较高（海外市场定位），但视频质量公认领先，适合专业创作者。' },
        { type: 'text', content: '💡 HappyHorse（快乐马）：阿里巴巴新品，目前还在推广期，定价相对较低。据小红书博主爆料毛利率高达98%，说明还有降价空间。' },
        { type: 'text', content: '💡 Runway Gen-3：AI视频领域的老牌选手，技术成熟，但价格偏高。适合对视频质量有高要求的项目。' },

        { type: 'h2', content: '🎯 选型建议', index: insertIndex + 9 },
        { type: 'text', content: '• 预算有限 → 优先选 HappyHorse 或 Seedance 会员' },
        { type: 'text', content: '• 追求高质量 → VEO 3 或 Runway' },
        { type: 'text', content: '• 国内生态 → 即梦Seedance 或 可灵' },
        { type: 'text', content: '• 轻度使用 → 每日白嫖免费积分' },

        { type: 'text', content: '' },
        { type: 'text', content: '⚠️ 注意：以上价格仅供参考，实际价格请以各平台官方定价为准。部分数据来源于小红书博主整理。' },
    ];

    for (let i = 0; i < pricingBlocks.length; i++) {
        const block = pricingBlocks[i];
        let b;

        if (block.type === 'h1') {
            b = createHeadingBlock(block.content, 1);
        } else if (block.type === 'h2') {
            b = createHeadingBlock(block.content, 2);
        } else if (block.type === 'quote') {
            // 引用块 block_type = 11
            b = {
                block_type: 11,
                quote: {
                    elements: [createTextElement(block.content)],
                    style: {}
                }
            };
        } else {
            b = createTextBlock(block.content);
        }

        await addBlock(token, documentId, documentId, block.index || insertIndex + i, b);
        console.log(`添加块: ${block.type}`);
        await new Promise(r => setTimeout(r, 300));
    }

    console.log('\n价格对比区块添加完成!');
    console.log(`📎 文档链接: https://feishu.cn/docx/${documentId}`);

    const message = `💰 Seedance AI视频工具价格对比表已更新！

📄 文档链接：https://feishu.cn/docx/${documentId}

新增内容：
• 即梦 Seedance / 可灵 / VEO3 / HappyHorse / Runway 五大工具价格对比
• 精确到每秒成本计算
• 各工具特点分析与选型建议

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