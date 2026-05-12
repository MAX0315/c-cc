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

function addBlock(token, documentId, parentId, block) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            children: [block],
            index: -1  // 追加到末尾
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

function createQuoteBlock(content) {
    return {
        block_type: 11,
        quote: {
            elements: [createTextElement(content)],
            style: {}
        }
    };
}

async function main() {
    const token = await getToken();
    console.log('Token获取成功\n');

    const docId = 'SRJKdVpqqoIEjrxqMldcR7ItnQd';
    console.log(`文档链接: https://feishu.cn/docx/${docId}\n`);

    const contentBlocks = [
        { type: 'h1', content: '⚠️ 免责声明' },
        { type: 'text', content: '本文档仅供参考，不构成任何投资建议。投资有风险，入市需谨慎。所有分析基于公开市场数据和个人研究，实际投资决策请自行承担风险。' },

        { type: 'h1', content: '🚀 2026年六大潜力科技方向' },

        { type: 'h2', content: '1. 人工智能（AI）产业链' },
        { type: 'quote', content: '• 算力芯片：寒武纪、海光信息、景嘉微\n• AI应用：科大讯飞、昆仑万维、同花顺\n• 云计算：阿里云概念、华为鸿蒙概念\n\n推荐逻辑：AI技术持续突破，应用场景快速扩展，产业链上下游均有受益。' },

        { type: 'h2', content: '2. 半导体自主可控' },
        { type: 'quote', content: '• 设备材料：中微公司、北方华创、华海清科\n• 设计环节：兆易创新、韦尔股份、卓胜微\n• 封装测试：长电科技、通富微电\n\n推荐逻辑：国产替代加速，政策支持力度大，技术突破逐步显现。' },

        { type: 'h2', content: '3. 新能源汽车智能化' },
        { type: 'quote', content: '• 整车：比亚迪、小鹏汽车、理想汽车\n• 智能驾驶：德赛西威、均胜电子、经纬恒润\n• 动力电池：宁德时代、亿纬锂能\n\n推荐逻辑：智能化趋势加速，高阶辅助驾驶渗透率提升。' },

        { type: 'h2', content: '4. 低空经济与无人机' },
        { type: 'quote', content: '• eVTOL：万丰奥威、亿航智能、小鹏汇天\n• 无人机：航天彩虹、星图控股\n• 空管系统：四川九洲、纳睿雷达\n\n推荐逻辑：政策催化，低空经济万亿级市场待开拓。' },

        { type: 'h2', content: '5. 量子科技' },
        { type: 'quote', content: '• 量子计算：本源量子、国盾量子\n• 量子通信：神州数码、光迅科技\n• 量子测量：科大国创\n\n推荐逻辑：量子技术从实验室走向产业化，万亿市场空间。' },

        { type: 'h2', content: '6. 商业航天' },
        { type: 'quote', content: '• 火箭制造：航天电器、斯伦贝谢\n• 卫星互联网：中国卫星、东方嘉讯\n• SpaceX产业链：间接受益\n\n推荐逻辑：卫星互联网纳入新基建，商业航天进入发展快车道。' },

        { type: 'h1', content: '💰 涨价风口板块' },
        { type: 'h2', content: '2026年涨价很猛的9大风口' },
        { type: 'quote', content: '1. 稀有金属（锂、钴、稀土）\n2. 工业硅（光伏上游）\n3. 碳酸锂（锂电池材料）\n4. 钒电池（储能）\n5. 铜箔（PCB材料）\n6. 铝箔（电池材料）\n7. 萤石（氟化工）\n8. 石墨负极（电池材料）\n9. EVA粒子（光伏材料）' },

        { type: 'h1', content: '🎯 投资策略建议' },
        { type: 'text', content: '【长期配置方向】' },
        { type: 'quote', content: '• AI算力产业链（龙头+补涨）\n• 半导体设备材料（国产替代）\n• 新能源汽车智能化（高成长）' },

        { type: 'text', content: '【主题投资方向】' },
        { type: 'quote', content: '• 低空经济（政策催化）\n• 商业航天（万亿市场）\n• 量子科技（产业化加速）' },

        { type: 'text', content: '【周期复苏方向】' },
        { type: 'quote', content: '• 半导体设计（库存周期）\n• 新能源金属（供需改善）\n• 面板（价格回升）' },

        { type: 'h1', content: '📊 数据来源与更新时间' },
        { type: 'text', content: '数据来源：小红书、东方财富、Wind资讯' },
        { type: 'text', content: '整理时间：2026年5月12日' },
        { type: 'text', content: '更新频率：每周更新一次' },
        { type: 'text', content: '' },
        { type: 'text', content: '⚠️ 再次提醒：本文档仅供参考，不构成投资建议。投资有风险，入市需谨慎。' },
    ];

    for (let i = 0; i < contentBlocks.length; i++) {
        const block = contentBlocks[i];
        let b;

        if (block.type === 'h1') {
            b = createHeadingBlock(block.content, 1);
        } else if (block.type === 'h2') {
            b = createHeadingBlock(block.content, 2);
        } else if (block.type === 'quote') {
            b = createQuoteBlock(block.content);
        } else {
            b = createTextBlock(block.content);
        }

        await addBlock(token, docId, docId, b);
        console.log(`添加块: ${block.type} - ${block.content.substring(0, 20)}...`);
        await new Promise(r => setTimeout(r, 200));
    }

    console.log('\n文档内容添加完成!');
    console.log(`📎 文档链接: https://feishu.cn/docx/${docId}`);

    const message = `📈 2026年A股股票推荐及热门板块分析已生成！

📄 文档链接：https://feishu.cn/docx/${docId}

包含内容：
🚀 六大潜力科技方向
💰 涨价风口板块
🎯 投资策略建议

⚠️ 仅供参考，投资有风险，入市需谨慎！

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