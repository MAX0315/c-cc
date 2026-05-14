const https = require('https');

const APP_ID = "cli_aa8b1485e63bdbc3";
const APP_SECRET = "Wkn3n6yK0Byujw3N23khKcVuzNl1X8sA";

async function getToken() {
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

async function createDoc(token, title) {
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
                if (result.code === 0) resolve(result.data.document);
                else reject(new Error(`创建文档失败: ${result.msg}`));
            });
        });
        req.on('error', reject);
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
                if (result.code === 0) resolve(result.data);
                else resolve(null);
            });
        });
        req.on('error', () => resolve(null));
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

function createDividerBlock() {
    return { block_type: 17 };
}

async function createStockDoc() {
    const token = await getToken();
    console.log('✅ Token获取成功\n');

    const doc = await createDoc(token, '股票的基本涨跌知识');
    console.log(`✅ 文档创建成功! ID: ${doc.document_id}\n`);

    const docId = doc.document_id;
    const blocks = [];
    let idx = 0;

    function add(type, content) {
        blocks.push({ type, content, index: idx++ });
    }

    // 一、股票基础概念
    add('h1', '一、股票基础概念');
    add('text', '股票是股份有限公司发行的所有权凭证，代表持有者对公司净资产的所有权。股票市场是投资者买卖股票的平台，股票价格由市场供求关系决定。');

    // 二、股票涨跌原理
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

    // 三、K线图基础
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

    // 四、技术指标基础
    add('h1', '四、常用技术指标');
    add('h2', '4.1 均线（MA）');
    add('bullet', '5日均线：短期趋势参考');
    add('bullet', '10日均线：短线交易参考');
    add('bullet', '20日均线：中期趋势参考');
    add('bullet', '60日均线：长期趋势参考');
    add('text', '');
    add('h2', '4.2 MACD');
    add('bullet', 'DIF线：短期与长期指数移动平均线的差');
    add('bullet', 'DEA线：DIF线的移动平均');
    add('bullet', '金叉：DIF上穿DEA，买入信号');
    add('bullet', '死叉：DIF下穿DEA，卖出信号');
    add('text', '');
    add('h2', '4.3 KDJ指标');
    add('bullet', 'K值：当前股价在近期价格区间中的位置');
    add('bullet', 'D值：K值的移动平均');
    add('bullet', 'J值：3倍的K减去2倍的D');
    add('bullet', '超买区（>80）：注意回调风险');
    add('bullet', '超卖区（<20）：注意反弹机会');

    // 五、量价关系
    add('h1', '五、量价关系基础');
    add('quote', '"量为价先"，成交量是价格变化的先行指标');
    add('bullet', '放量上涨：资金积极入场，看多信号');
    add('bullet', '缩量上涨：上涨动能减弱，谨慎信号');
    add('bullet', '放量下跌：恐慌抛售，可能见底');
    add('bullet', '缩量下跌：卖压减轻，可能见底');
    add('bullet', '地量低价：成交量极度萎缩，可能底部区间');

    // 六、基本面分析基础
    add('h1', '六、基本面分析基础');
    add('h2', '6.1 财务指标');
    add('bullet', '市盈率（PE）：股价与每股收益的比值，越低越有估值优势');
    add('bullet', '市净率（PB）：股价与每股净资产的比值');
    add('bullet', '净利润增长率：企业成长性的重要指标');
    add('bullet', '毛利率：企业竞争力的体现');
    add('text', '');
    add('h2', '6.2 估值方法');
    add('bullet', '相对估值法：PE、PB、PS等比值与行业对比');
    add('bullet', '绝对估值法：DCF（现金流折现）模型');
    add('bullet', 'PEG估值：PE与净利润增长率的比值，<1为低估');

    // 七、风险控制基础
    add('h1', '七、风险控制基础');
    add('bullet', '止损原则：亏损达到10%时果断止损');
    add('bullet', '仓位管理：单只股票不超过总仓位的20%');
    add('bullet', '分散投资：不把鸡蛋放在同一个篮子里');
    add('bullet', '右侧交易：趋势确认后再入场，减少逆势操作');
    add('bullet', '保持理性：避免情绪化交易决策');

    // 八、常见术语
    add('h1', '八、常见术语速查');
    add('bullet', '牛市：股价整体上涨的趋势');
    add('bullet', '熊市：股价整体下跌的趋势');
    add('bullet', '震荡市：股价在一定区间内波动');
    add('bullet', '突破：股价向上穿越重要压力位');
    add('bullet', '回踩：股价上涨后回落测试支撑位');
    add('bullet', '筑底：股价在低位逐步企稳的过程');
    add('bullet', '解套：股价回升到成本价以上');
    add('bullet', '割肉：亏损卖出股票');
    add('bullet', '追高：在高位买入股票');
    add('bullet', '抄底：在低位买入股票');

    // 添加分割线
    add('text', '');
    add('text', '祝您投资顺利~ 嘻嘻 📊');

    // 批量添加blocks
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
        await new Promise(r => setTimeout(r, 300));
    }

    console.log('✅ 文档生成完成!');
    console.log(`📎 文档链接: https://feishu.cn/docx/${docId}`);

    return `https://feishu.cn/docx/${docId}`;
}

createStockDoc().catch(console.error);