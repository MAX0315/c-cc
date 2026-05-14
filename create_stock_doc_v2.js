const https = require('https');

const APP_ID = "cli_aa8b1485e63bdbc3";
const APP_SECRET = "Wkn3n6yK0Byujw3N23khKcVuzNl1X8sA";

async function getToken() {
    return new Promise((resolve) => {
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
        req.on('error', () => resolve(null));
        req.write(postData);
        req.end();
    });
}

async function createDoc(token, title) {
    return new Promise((resolve) => {
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
                if (result.code === 0) resolve(result.data.document);
                else resolve(null);
            });
        });
        req.on('error', () => resolve(null));
        req.write(postData);
        req.end();
    });
}

async function addBlock(token, documentId, parentId, index, block) {
    return new Promise((resolve) => {
        const postData = JSON.stringify({ children: [block], index: index });
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
                resolve(result.code === 0);
            });
        });
        req.on('error', () => resolve(false));
        req.write(postData);
        req.end();
    });
}

function createTextElement(content) {
    return { text_run: { content, text_element_style: {} } };
}

function createTextBlock(content) {
    return { block_type: 2, text: { elements: [createTextElement(content)], style: {} } };
}

function createHeadingBlock(content, level) {
    const blockTypes = { 1: 3, 2: 4, 3: 5 };
    const key = `heading${level}`;
    return { block_type: blockTypes[level] || 3, [key]: { elements: [createTextElement(content)], style: {} } };
}

function createBulletBlock(content) {
    return { block_type: 14, bullet: { elements: [createTextElement(content)], style: {} } };
}

function createQuoteBlock(content) {
    return { block_type: 11, quote: { elements: [createTextElement(content)], style: {} } };
}

async function createStockDoc() {
    const token = await getToken();
    if (!token) { console.log('Token获取失败'); return; }
    console.log('✅ Token获取成功\n');

    const doc = await createDoc(token, '股票的基本涨跌知识（优化版）');
    if (!doc) { console.log('文档创建失败'); return; }
    console.log(`✅ 文档创建成功! ID: ${doc.document_id}\n`);

    const docId = doc.document_id;
    const blocks = [];
    let idx = 0;
    function add(type, content) { blocks.push({ type, content, index: idx++ }); }

    // 标题
    add('h1', '一、股票基础概念');
    add('text', '股票是股份有限公司发行的所有权凭证，代表持有者对公司净资产的所有权。股票市场是投资者买卖股票的平台，股票价格由市场供求关系决定。');

    add('h1', '二、股票涨跌原理');
    add('h2', '2.1 基本供需关系');
    add('bullet', '买盘 > 卖盘时，股价上涨（供不应求）');
    add('bullet', '买盘 < 卖盘时，股价下跌（供过于求）');
    add('bullet', '买卖盘平衡时，股价基本稳定');
    add('text', '');
    add('h2', '2.2 影响股价的因素');
    add('bullet', '公司业绩：盈利增长推动股价上涨');
    add('bullet', '宏观经济：经济增长利好股市');
    add('bullet', '政策影响：产业政策、货币政策的松紧');
    add('bullet', '市场情绪：投资者心理和预期');
    add('bullet', '资金面：流动性充裕推动上涨');

    add('h1', '三、K线图基础知识');
    add('h2', '3.1 K线构成');
    add('quote', 'K线由开盘价、收盘价、最高价、最低价四个价格组成');
    add('bullet', '阳线（红色）：收盘价 > 开盘价，表示上涨');
    add('bullet', '阴线（绿色）：收盘价 < 开盘价，表示下跌');
    add('bullet', '上影线：最高价到收盘价/开盘价的距离');
    add('bullet', '下影线：开盘价/收盘价到最低价的距离');
    add('text', '');
    add('h2', '3.2 常见K线形态');
    add('bullet', '锤子线：底部反转信号');
    add('bullet', '上吊线：顶部反转信号');
    add('bullet', '十字星：多空平衡信号');
    add('bullet', '光头光脚：强烈趋势信号');

    add('h1', '四、常用技术指标');
    add('h2', '4.1 均线（MA）');
    add('bullet', '5日均线（MA5）：短期趋势参考，敏感度高');
    add('bullet', '10日均线（MA10）：短线交易参考');
    add('bullet', '20日均线（MA20）：中期趋势参考');
    add('bullet', '60日均线（MA60）：长期趋势参考');
    add('bullet', '均线金叉：短期均线上穿长期均线，买入信号');
    add('bullet', '均线死叉：短期均线下穿长期均线，卖出信号');
    add('text', '');
    add('h2', '4.2 MACD指标');
    add('bullet', 'DIF线（差离值）：短期与长期指数移动平均线的差值');
    add('bullet', 'DEA线（信号线）：DIF线的移动平均');
    add('bullet', 'MACD柱：DIF与DEA的差值×2');
    add('bullet', '金叉：DIF上穿DEA，柱由负转正 → 买入信号');
    add('bullet', '死叉：DIF下穿DEA，柱由正转负 → 卖出信号');
    add('bullet', '顶背离：股价创新高但MACD没创新高 → 警惕下跌');
    add('bullet', '底背离：股价创新低但MACD没创新低 → 关注反弹');
    add('text', '');
    add('h2', '4.3 KDJ指标');
    add('bullet', 'K值：当前股价在近期价格区间中的位置（0-100）');
    add('bullet', 'D值：K值的移动平均（稳定性更高）');
    add('bullet', 'J值：3×K - 2×D（波动最敏感）');
    add('bullet', '超买区（>80）：注意回调风险');
    add('bullet', '超卖区（<20）：注意反弹机会');
    add('bullet', 'KDJ金叉：D线上穿K线 → 买入信号');
    add('bullet', 'KDJ死叉：D线下穿K线 → 卖出信号');
    add('text', '');
    add('h2', '4.4 布林带（BBAND）');
    add('bullet', '上轨：MA20 + 2×标准差（压力位）');
    add('bullet', '中轨：MA20（趋势参考）');
    add('bullet', '下轨：MA20 - 2×标准差（支撑位）');
    add('bullet', '股价触及上轨：注意回落风险');
    add('bullet', '股价触及下轨：关注反弹机会');
    add('bullet', '布林带收口：行情即将突破');
    add('bullet', '布林带开口：行情加速中');

    add('h1', '五、量价关系基础');
    add('quote', '"量为价先"，成交量是价格变化的先行指标');
    add('text', '');
    add('h2', '5.1 量价配合');
    add('bullet', '放量上涨：资金积极入场，看多信号（量增价涨）');
    add('bullet', '缩量上涨：上涨动能减弱，谨慎信号（量缩价涨）');
    add('bullet', '放量下跌：恐慌抛售，但可能加速见底（量增价跌）');
    add('bullet', '缩量下跌：卖压减轻，可能见底（量缩价跌）');
    add('bullet', '地量低价：成交量极度萎缩，往往是底部信号');
    add('text', '');
    add('h2', '5.2 换手率');
    add('bullet', '换手率 = 成交股数/流通股数×100%');
    add('bullet', '换手率高：股票交易活跃');
    add('bullet', '换手率过低：流动性不足');

    add('h1', '六、基本面分析基础');
    add('h2', '6.1 财务指标');
    add('bullet', '市盈率（PE）：股价/每股收益，越低估值优势越大');
    add('bullet', '市净率（PB）：股价/每股净资产，破净可能价值重估');
    add('bullet', '净利润增长率：企业成长性核心指标');
    add('bullet', '毛利率：企业竞争力体现，毛利率高说明护城河宽');
    add('bullet', 'ROE（净资产收益率）：股东权益回报率，越高越优秀');
    add('bullet', '资产负债率：负债/总资产，警惕高负债企业');
    add('text', '');
    add('h2', '6.2 估值方法');
    add('bullet', '相对估值法：PE、PB、PS等比值与行业平均对比');
    add('bullet', '绝对估值法：DCF（现金流折现）模型');
    add('bullet', 'PEG估值：PE/净利润增长率，<1为相对低估');

    add('h1', '七、趋势分析基础');
    add('h2', '7.1 趋势类型');
    add('bullet', '上升趋势：高点不断抬高，低点不断抬高');
    add('bullet', '下降趋势：高点不断降低，低点不断降低');
    add('bullet', '横盘震荡：高低点基本持平');
    add('text', '');
    add('h2', '7.2 支撑与压力');
    add('bullet', '支撑位：股价下跌时遇到的买盘支撑');
    add('bullet', '压力位：股价上涨时遇到的卖盘压力');
    add('bullet', '突破压力位：需放量确认，否则可能是假突破');
    add('bullet', '跌破支撑位：需警惕加速下跌风险');

    add('h1', '八、风险控制基础');
    add('bullet', '止损原则：亏损达到7-10%时果断止损');
    add('bullet', '仓位管理：单只股票不超过总仓位的20%');
    add('bullet', '分散投资：不把鸡蛋放在同一个篮子里');
    add('bullet', '右侧交易：趋势确认后再入场，减少逆势操作');
    add('bullet', '保持理性：避免情绪化交易决策');
    add('bullet', '永不满仓：保留现金应对突发情况');
    add('bullet', '不追涨杀跌：追高风险大，等回调买入');

    add('h1', '九、常见术语速查');
    add('text', '牛市：股价整体上涨的趋势');
    add('text', '熊市：股价整体下跌的趋势');
    add('text', '震荡市：股价在一定区间内波动');
    add('text', '突破：股价向上穿越重要压力位');
    add('text', '回踩：股价上涨后回落测试支撑位');
    add('text', '筑底：股价在低位逐步企稳的过程');
    add('text', '解套：股价回升到成本价以上');
    add('text', '割肉：亏损卖出股票');
    add('text', '追高：在高位买入股票');
    add('text', '抄底：在低位买入股票');
    add('text', '满仓：账户资金全部买入股票');
    add('text', '空仓：账户没有股票全是现金');
    add('text', '建仓：开始买入股票');
    add('text', '加仓：买入更多同一只股票');
    add('text', '减仓：卖出一部分股票');
    add('text', '清仓：卖出全部股票');

    add('text', '');
    add('text', '投资有风险，入市需谨慎。本文档仅供参考，不构成投资建议。');
    add('text', '祝您投资顺利~ 嘻嘻 📊');

    console.log(`共 ${blocks.length} 个块，开始添加...\n`);
    for (const item of blocks) {
        let block;
        switch (item.type) {
            case 'h1': block = createHeadingBlock(item.content, 1); break;
            case 'h2': block = createHeadingBlock(item.content, 2); break;
            case 'quote': block = createQuoteBlock(item.content); break;
            case 'bullet': block = createBulletBlock(item.content); break;
            default: block = createTextBlock(item.content);
        }
        await addBlock(token, docId, docId, item.index, block);
        await new Promise(r => setTimeout(r, 100));
        if (item.index % 20 === 0) console.log(`已添加 ${item.index}/${blocks.length}`);
    }

    console.log('\n✅ 文档生成完成!');
    console.log(`📎 文档链接: https://feishu.cn/docx/${docId}`);
    return `https://feishu.cn/docx/${docId}`;
}

createStockDoc().catch(console.error);