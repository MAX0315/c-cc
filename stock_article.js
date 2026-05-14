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
            res.on('end', () => resolve(result => {
                try { resolve(JSON.parse(data).code === 0); } catch { resolve(false); }
            }));
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

async function addBlockReal(token, documentId, parentId, index, block) {
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
                try {
                    const result = JSON.parse(data);
                    resolve(result.code === 0);
                } catch { resolve(false); }
            });
        });
        req.on('error', () => resolve(false));
        req.write(postData);
        req.end();
    });
}

async function createArticle() {
    const token = await getToken();
    if (!token) { console.log('Token获取失败'); return; }
    console.log('✅ Token获取成功\n');

    const doc = await createDoc(token, '📈 股票的基本涨跌知识');
    if (!doc) { console.log('文档创建失败'); return; }
    console.log(`✅ 文档创建成功! ID: ${doc.document_id}\n`);

    const docId = doc.document_id;
    const blocks = [];
    let idx = 0;
    function add(type, content) { blocks.push({ type, content, index: idx++ }); }

    // 标题和引言
    add('h1', '股票的基本涨跌知识');
    add('quote', '股票是股份有限公司发行的所有权凭证，代表持有者对公司净资产的所有权。股市是投资者买卖股票的平台，价格由市场供求关系决定。');

    // 一、涨跌原理
    add('h1', '一、股票涨跌原理');
    add('h2', '1.1 基本供需关系');
    add('bullet', '买盘 > 卖盘 → 股价上涨（供不应求）');
    add('bullet', '买盘 < 卖盘 → 股价下跌（供过于求）');
    add('bullet', '买卖均衡 → 股价横盘');
    add('text', '');
    add('h2', '1.2 影响股价的因素');
    add('bullet', '公司业绩：盈利增长 → 股价上涨');
    add('bullet', '宏观经济：经济增长 + 货币政策宽松 → 利好股市');
    add('bullet', '政策影响：产业扶持政策 → 相关板块受益');
    add('bullet', '市场情绪：投资者信心和预期');
    add('bullet', '资金面：北向资金、杠杆资金流向');

    // 二、K线基础
    add('h1', '二、K线图基础知识');
    add('h2', '2.1 K线构成');
    add('quote', 'K线由开盘价、收盘价、最高价、最低价四个价格组成');
    add('bullet', '阳线（红色）：收盘价 > 开盘价 → 上涨');
    add('bullet', '阴线（绿色）：收盘价 < 开盘价 → 下跌');
    add('bullet', '上影线：最高价到收盘价的距离');
    add('bullet', '下影线：开盘价到最低价的距离');
    add('text', '');
    add('h2', '2.2 经典K线形态');
    add('bullet', '锤子线：下影线是实体2-3倍，出现在底部 → 买入信号');
    add('bullet', '上吊线：出现在顶部 → 警惕回落');
    add('bullet', '十字星：开盘价=收盘价 → 多空平衡，观望信号');
    add('bullet', '吞没形态：阳包阴（买入）、阴包阳（卖出）');

    // 三、技术指标
    add('h1', '三、常用技术指标');
    add('h2', '3.1 均线MA');
    add('bullet', 'MA5（一周）：超短线参考');
    add('bullet', 'MA20（一个月）：中期趋势分水岭');
    add('bullet', 'MA60（一季度）：长期趋势确认');
    add('bullet', '均线金叉：短上穿长 → 买入信号');
    add('bullet', '均线死叉：短下穿长 → 卖出信号');
    add('text', '');
    add('h2', '3.2 MACD指标');
    add('bullet', 'DIF线：12日EMA - 26日EMA');
    add('bullet', 'DEA线：DIF的移动平均');
    add('bullet', 'MACD柱：DIF与DEA的差值');
    add('bullet', '金叉：DIF上穿DEA → 买入');
    add('bullet', '死叉：DIF下穿DEA → 卖出');
    add('bullet', '顶背离：股价创新高但MACD没新高 → 警惕回落');
    add('bullet', '底背离：股价创新低但MACD没新低 → 关注反弹');
    add('text', '');
    add('h2', '3.3 KDJ指标');
    add('bullet', 'K值：股价在近期区间的位置（0-100）');
    add('bullet', 'D值：K值的平滑（更稳定）');
    add('bullet', 'J值：3×K - 2×D（最敏感）');
    add('bullet', '超买区（>80）：注意回调风险');
    add('bullet', '超卖区（<20）：关注反弹机会');
    add('text', '');
    add('h2', '3.4 布林带BBAND');
    add('bullet', '上轨：MA20 + 2倍标准差（压力位）');
    add('bullet', '中轨：MA20（趋势参考）');
    add('bullet', '下轨：MA20 - 2倍标准差（支撑位）');
    add('bullet', '股价触及上轨：注意回落');
    add('bullet', '股价触及下轨：关注反弹');
    add('bullet', '布林带收口：行情即将突破');
    add('bullet', '布林带开口：行情加速中');

    // 四、量价关系
    add('h1', '四、量价关系');
    add('quote', '"量为价先"——成交量是价格变化的先行指标');
    add('bullet', '放量上涨：资金涌入 → 看多信号');
    add('bullet', '缩量上涨：动能不足 → 警惕回调');
    add('bullet', '放量下跌：恐慌抛售 → 可能加速见底');
    add('bullet', '缩量下跌：卖压减轻 → 底部信号');
    add('bullet', '地量低价：成交量极度萎缩 → 底部区域');
    add('bullet', '放量突破：真突破 → 顺势买入');
    add('bullet', '缩量突破：假突破 → 警惕陷阱');

    // 五、基本面
    add('h1', '五、基本面分析');
    add('h2', '5.1 核心财务指标');
    add('bullet', 'PE（市盈率）：越低越便宜，<15为合理');
    add('bullet', 'PB（市净率）：越低越有价值，<1为破净');
    add('bullet', '净利润增长率：>20%为高增长');
    add('bullet', 'ROE（净资产收益率）：>15%为优秀');
    add('text', '');
    add('h2', '5.2 估值方法');
    add('bullet', '相对估值：PE、PB与行业对比');
    add('bullet', 'PEG估值：PEG<1为低估');

    // 六、趋势分析
    add('h1', '六、趋势与支撑压力');
    add('bullet', '上升趋势：高点抬高、低点抬高 → 逢低买入');
    add('bullet', '下降趋势：高点降低、低点降低 → 逢高卖出');
    add('bullet', '横盘震荡：高低点持平 → 高抛低吸');
    add('text', '');
    add('bullet', '支撑位：股价下跌时的买盘支撑');
    add('bullet', '压力位：股价上涨时的卖盘压力');
    add('bullet', '支撑跌破变压力，压力突破变支撑');

    // 七、风险控制
    add('h1', '七、风险控制');
    add('bullet', '止损原则：亏损7-10%时果断止损');
    add('bullet', '仓位管理：单只股票不超总仓位20%');
    add('bullet', '分散投资：不把鸡蛋放一个篮子');
    add('bullet', '右侧交易：趋势确认后再入场');
    add('bullet', '永不满仓：保留现金应对突发');
    add('bullet', '不追涨杀跌：追高风险大');

    // 八、术语速查
    add('h1', '八、常见术语');
    add('bullet', '牛市：股价整体上涨；熊市：整体下跌');
    add('bullet', '涨停/跌停：A股当日涨跌幅±10%');
    add('bullet', '建仓：开始买入；清仓：全部卖出');
    add('bullet', '追高：高位买入（不推荐）；抄底：低位买入');
    add('bullet', '套牢：买入后亏损；割肉：亏损卖出');
    add('bullet', '北向资金：港资买入A股');

    // 结尾
    add('text', '');
    add('quote', '⚠️ 投资有风险，入市需谨慎！本文仅供参考，不构成投资建议。');
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
        await addBlockReal(token, docId, docId, item.index, block);
        await new Promise(r => setTimeout(r, 80));
        if (item.index % 40 === 0) console.log(`已添加 ${item.index}/${blocks.length}`);
    }

    console.log('\n✅ 文档生成完成!');
    return `https://feishu.cn/docx/${docId}`;
}

createArticle().then(url => {
    if (url) {
        console.log(`📎 文档链接: ${url}`);

        // 发送到飞书群
        const https = require('https');
        const WEBHOOK = '06844d98-f23d-4a5f-a27e-e4665d021d96';
        const message = `📈 股票的基本涨跌知识

涵盖内容：
✅ 股票涨跌原理
✅ K线图基础知识
✅ 常用技术指标（MA/MACD/KDJ/布林带）
✅ 量价关系
✅ 基本面分析
✅ 趋势与支撑压力
✅ 风险控制
✅ 术语速查

链接：${url}

投资有风险，入市需谨慎！祝您投资顺利~ 嘻嘻 📊`;

        const postData = JSON.stringify({
            msg_type: 'text',
            content: { text: message }
        });

        const options = {
            hostname: 'open.feishu.cn',
            path: '/open-apis/bot/v2/hook/' + WEBHOOK,
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(postData) }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const result = JSON.parse(data);
                console.log(result.code === 0 ? '\n✅ 已发送到飞书群!' : '\n❌ 发送失败');
            });
        });

        req.on('error', () => console.log('\n❌ 发送失败'));
        req.write(postData);
        req.end();
    }
}).catch(console.error);