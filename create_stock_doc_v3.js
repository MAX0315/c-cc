const https = require('https');
const fs = require('fs');

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

    const doc = await createDoc(token, '📈 股票的基本涨跌知识（详解版）');
    if (!doc) { console.log('文档创建失败'); return; }
    console.log(`✅ 文档创建成功! ID: ${doc.document_id}\n`);

    const docId = doc.document_id;
    const blocks = [];
    let idx = 0;
    function add(type, content) { blocks.push({ type, content, index: idx++ }); }

    // 标题
    add('h1', '一、股票基础概念');
    add('text', '股票是股份有限公司发行的所有权凭证，购买股票即成为公司的股东，享有公司盈利分红和重大决策投票权。');
    add('bullet', '股票代表公司净资产的所有权份额');
    add('bullet', '股价短期由市场供求决定，长期由公司基本面决定');
    add('bullet', '中国A股市场主要有上海证券交易所和深圳证券交易所');

    add('h1', '二、股票涨跌原理');
    add('h2', '2.1 基本供需关系');
    add('bullet', '买盘 > 卖盘时，股价上涨（供不应求）');
    add('bullet', '买盘 < 卖盘时，股价下跌（供过于求）');
    add('bullet', '买卖均衡时，股价横盘');
    add('text', '');
    add('h2', '2.2 影响股价的核心因素');
    add('text', '基本面因素：');
    add('bullet', '公司业绩：净利润增长推动股价上涨');
    add('bullet', '盈利能力：毛利率、ROE等指标优秀，资金青睐');
    add('bullet', '行业前景：朝阳行业更受市场关注');
    add('text', '');
    add('text', '市场面因素：');
    add('bullet', '宏观经济：GDP增长、货币政策宽松，利好股市');
    add('bullet', '政策影响：产业扶持政策，相关板块上涨');
    add('bullet', '市场情绪：投资者信心影响短期走势');
    add('bullet', '资金面：北向资金、杠杆资金流向');

    add('h1', '三、K线图基础知识');
    add('h2', '3.1 K线的构成');
    add('quote', 'K线起源于日本米市，又称"蜡烛图"，由四个价格组成：开盘价、收盘价、最高价、最低价');
    add('text', '');
    add('text', '阳线（红色/空心）：收盘价 > 开盘价，表示上涨');
    add('text', '阴线（绿色/实心）：收盘价 < 开盘价，表示下跌');
    add('text', '上影线：最高价到收盘价/开盘价的距离');
    add('text', '下影线：开盘价/收盘价到最低价的距离');
    add('text', '');
    add('h2', '3.2 经典K线形态');
    add('text', '反转形态：');
    add('bullet', '锤子线：下影线是实体的2-3倍，出现在下跌底部 → 买入信号');
    add('bullet', '上吊线：锤子线的倒置，出现在上涨顶部 → 警惕回落');
    add('bullet', '吞没形态：阳包阴（买入）、阴包阳（卖出）');
    add('bullet', '十字星：开盘=收盘，多空博弈平衡 → 观望信号');
    add('text', '');
    add('text', '持续形态：');
    add('bullet', '纺锤线：实体小、上下影线长 → 盘整信号');
    add('bullet', '三兵形态：红三兵（强势）、黑三兵（弱势）');

    add('h1', '四、常用技术指标（重点）');
    add('h2', '4.1 均线系统（MA）—— 趋势之王');
    add('text', '均线是将一定周期内的收盘价加权平均连接成曲线：');
    add('bullet', 'MA5（一周均线）：超短线操作参考');
    add('bullet', 'MA10（两周均线）：短线趋势判断');
    add('bullet', 'MA20（一个月）：中期趋势分水岭');
    add('bullet', 'MA60（一季度）：长期趋势确认');
    add('bullet', 'MA120（半年线）：牛熊分界线');
    add('text', '');
    add('text', '均线实战用法：');
    add('bullet', '多头排列：短周期在上、长周期在下 → 强势上涨');
    add('bullet', '空头排列：短周期在下、长周期在上 → 强势下跌');
    add('bullet', '均线金叉：短周期上穿长周期 → 买入信号');
    add('bullet', '均线死叉：短周期下穿长周期 → 卖出信号');

    add('h2', '4.2 MACD指标 —— 趋势研判');
    add('text', 'MACD构成：DIF（差离值）= 12日EMA - 26日EMA；DEA（信号线）= DIF的9日加权移动平均');
    add('text', '');
    add('text', 'MACD实战用法：');
    add('bullet', '金叉：DIF上穿DEA → 买入信号');
    add('bullet', '死叉：DIF下穿DEA → 卖出信号');
    add('bullet', '零轴上方：DIF>DEA，牛市格局，逢低买入');
    add('bullet', '零轴下方：DIF<DEA，熊市格局，逢高卖出');
    add('text', '');
    add('text', '背离（高级用法）：');
    add('bullet', '顶背离：股价创新高但MACD没创新高 → 警惕回落！');
    add('bullet', '底背离：股价创新低但MACD没创新低 → 关注反弹！');

    add('h2', '4.3 KDJ指标 —— 超买超卖');
    add('text', 'KDJ构成：K值（快速随机指标）、D值（K的平滑）、J值（3K-2D，波动最敏感）');
    add('text', '');
    add('text', '实战判断：');
    add('bullet', '超买区（>80）：股价过热，考虑卖出');
    add('bullet', '超卖区（<20）：股价过冷，关注买入');
    add('bullet', 'KDJ金叉（K上穿D）+ 在20附近 → 较强买入信号');
    add('bullet', 'KDJ死叉（K下穿D）+ 在80附近 → 较强卖出信号');

    add('h2', '4.4 布林带（BBAND）—— 波动通道');
    add('text', '布林带构成：上轨=MA20+2倍标准差（压力位）；中轨=MA20（趋势线）；下轨=MA20-2倍标准差（支撑位）');
    add('text', '');
    add('text', '实战用法：');
    add('bullet', '股价触及上轨：接近压力，谨慎/卖出');
    add('bullet', '股价触及下轨：接近支撑，关注买入');
    add('bullet', '布林带收口：行情蓄势，等待突破');
    add('bullet', '布林带开口：行情加速，顺势而为');

    add('h2', '4.5 VOL成交量 —— 量先于价');
    add('quote', '"量为价先"是技术分析的核心原则');
    add('text', '');
    add('text', '量价配合八律：');
    add('bullet', '放量上涨：资金涌入，持股待涨');
    add('bullet', '缩量上涨：动能不足，警惕回调');
    add('bullet', '放量下跌：恐慌抛售，谨慎观望');
    add('bullet', '缩量下跌：抛压减轻，底部信号');
    add('bullet', '放量突破：真突破，顺势买入');
    add('bullet', '缩量突破：假突破，警惕陷阱');
    add('bullet', '地量见地价：极度缩量，底部区域');
    add('bullet', '天量见天价：极度放量，警惕顶部');

    add('h1', '五、基本面分析基础');
    add('h2', '5.1 核心财务指标');
    add('text', '估值类：');
    add('bullet', 'PE（市盈率）：越低越便宜，一般<15为合理');
    add('bullet', 'PB（市净率）：越低越有价值，<1为破净');
    add('bullet', 'PS（市销率）：适合亏损公司，<3为合理');
    add('text', '');
    add('text', '盈利类：');
    add('bullet', '净利润增长率：>20%为高增长，<0需警惕');
    add('bullet', '毛利率：>30%说明竞争力强');
    add('bullet', 'ROE（净资产收益率）：>15%为优秀');
    add('text', '');
    add('text', '财务排雷：');
    add('bullet', '应收账款异常增长');
    add('bullet', '存货周转天数大幅增加');
    add('bullet', '经营活动现金流持续为负');
    add('bullet', '资产负债率超过70%');

    add('h2', '5.2 估值方法');
    add('bullet', '相对估值法：与行业平均PE/PB对比');
    add('bullet', '绝对估值法（DCF）：预测未来现金流折现');
    add('bullet', 'PEG估值法：PEG<1为低估，=1为合理，>1为高估');

    add('h1', '六、趋势分析与支撑压力');
    add('h2', '6.1 三种趋势');
    add('bullet', '上升趋势：高点不断抬高，低点不断抬高 → 逢低买入');
    add('bullet', '下降趋势：高点不断降低，低点不断降低 → 逢高卖出');
    add('bullet', '横盘震荡：高低点基本持平 → 高抛低吸');
    add('text', '');
    add('h2', '6.2 支撑与压力');
    add('bullet', '支撑位：股价下跌时遇到买盘支撑的区域');
    add('bullet', '压力位：股价上涨时遇到卖盘压力的区域');
    add('bullet', '角色转换：支撑跌破变压力，压力突破变支撑');
    add('bullet', '识别方法：前期高低点、均线位置、成交密集区、整数关口');

    add('h1', '七、风险控制（关键！）');
    add('h2', '7.1 止损原则');
    add('bullet', '短线止损：7-10%');
    add('bullet', '中线止损：10-15%');
    add('bullet', '长线止损：20%');
    add('text', '');
    add('h2', '7.2 仓位管理');
    add('bullet', '满仓（100%）：确定性极高时');
    add('bullet', '重仓（60-80%）：明显趋势时');
    add('bullet', '半仓（50%）：震荡行情');
    add('bullet', '轻仓（20-30%）：谨慎观望');
    add('bullet', '空仓（0%）：行情不明时');
    add('text', '');
    add('h2', '7.3 交易纪律');
    add('text', '应该做的：');
    add('bullet', '制定交易计划，按计划执行');
    add('bullet', '顺势而为，不要逆势操作');
    add('bullet', '分散投资，不要单押一只');
    add('bullet', '保留现金，永不满仓');
    add('text', '');
    add('text', '不应该做的：');
    add('bullet', '不要追涨杀跌');
    add('bullet', '不要频繁交易');
    add('bullet', '不要重仓单一股票');
    add('bullet', '不要忽视止损');
    add('bullet', '不要情绪化交易');

    add('h1', '八、常见术语速查');
    add('text', '基础术语：');
    add('bullet', '牛市：股价整体上涨');
    add('bullet', '熊市：股价整体下跌');
    add('bullet', '震荡市：股价在区间内反复波动');
    add('bullet', '涨停/跌停：A股当日涨跌幅达10%');
    add('text', '');
    add('text', '交易术语：');
    add('bullet', '建仓：开始买入；加仓：买入更多；减仓：卖出一部分；清仓：全部卖出');
    add('bullet', '补仓：被套后低价买入摊薄成本');
    add('bullet', '追高：在高位买入（不推荐）；抄底：在低位买入（难度高）');
    add('bullet', '踏空：行情上涨但没买入；套牢：买入后亏损');
    add('text', '');
    add('text', '技术术语：');
    add('bullet', '突破：股价向上穿越压力位；跌破：向下穿越支撑位');
    add('bullet', '回踩：突破后回落测试；企稳：下跌后横盘；筑底：低位形成底部');
    add('bullet', '诱多：主力拉高引诱买入；诱空：主力打压逼出散户');
    add('text', '');
    add('text', '资金术语：');
    add('bullet', '北向资金：港资买入A股；主力/庄家：能影响股价的大资金');
    add('bullet', '散户：个人投资者；杠杆资金：融资借来的钱');

    add('h1', '九、学习路径建议');
    add('text', '新手入门（3个月）：');
    add('bullet', '理解基本概念和术语');
    add('bullet', '学会看K线和均线');
    add('bullet', '了解量价关系');
    add('bullet', '模拟盘练习');
    add('text', '');
    add('text', '进阶提升（6-12个月）：');
    add('bullet', '深入学习MACD、KDJ等指标');
    add('bullet', '理解趋势和支撑压力');
    add('bullet', '建立自己的交易系统');
    add('bullet', '小资金实盘验证');
    add('text', '');
    add('text', '形成体系（1-2年）：');
    add('bullet', '完善交易系统');
    add('bullet', '做好风险控制');
    add('bullet', '保持交易纪律');
    add('bullet', '持续学习总结');

    add('text', '');
    add('quote', '⚠️ 重要提示：投资有风险，入市需谨慎！本文档仅供参考，不构成任何投资建议。');
    add('text', '祝您投资顺利，稳健盈利！💰 嘻嘻 📊');

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
        await new Promise(r => setTimeout(r, 80));
        if (item.index % 30 === 0) console.log(`已添加 ${item.index}/${blocks.length}`);
    }

    console.log('\n✅ 文档生成完成!');
    console.log(`📎 文档链接: https://feishu.cn/docx/${docId}`);
    return `https://feishu.cn/docx/${docId}`;
}

createStockDoc().catch(console.error);