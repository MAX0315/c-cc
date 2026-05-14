const https = require('https');

const APP_ID = "cli_aa8b1485e63bdbc3";
const APP_SECRET = "Wkn3n6yK0Byujw3N23khKcVuzNl1X8sA";

function getToken() {
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

async function addBlock(token, docId, block) {
    return new Promise((resolve) => {
        const postData = JSON.stringify({ children: [block] });
        const options = {
            hostname: 'open.feishu.cn',
            path: `/open-apis/docx/v1/documents/${docId}/blocks/${docId}/children`,
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

function textEl(content) {
    return { text_run: { content, text_element_style: {} } };
}

function textBlock(content) {
    return { block_type: 2, text: { elements: [textEl(content)], style: {} } };
}

function h1Block(content) {
    return { block_type: 3, heading1: { elements: [textEl(content)], style: {} } };
}

function h2Block(content) {
    return { block_type: 4, heading2: { elements: [textEl(content)], style: {} } };
}

function bulletBlock(content) {
    return { block_type: 14, bullet: { elements: [textEl(content)], style: {} } };
}

function quoteBlock(content) {
    return { block_type: 11, quote: { elements: [textEl(content)], style: {} } };
}

async function createArticle() {
    const token = await getToken();
    if (!token) { console.log('Token失败'); return; }
    console.log('✅ Token获取成功\n');

    const doc = await createDoc(token, '股票的基本涨跌知识');
    if (!doc) { console.log('文档创建失败'); return; }
    console.log(`✅ 文档创建成功: ${doc.document_id}\n`);

    const docId = doc.document_id;

    const blocks = [
        quoteBlock('股票是股份有限公司发行的所有权凭证，购买股票即成为公司股东，享有分红和投票权。'),
        h1Block('一、股票涨跌原理'),
        h2Block('1.1 基本供需'),
        bulletBlock('买盘 > 卖盘 → 股价上涨'),
        bulletBlock('买盘 < 卖盘 → 股价下跌'),
        bulletBlock('买卖均衡 → 股价横盘'),
        h2Block('1.2 影响股价因素'),
        bulletBlock('公司业绩：盈利增长 → 股价上涨'),
        bulletBlock('宏观经济：政策宽松 → 利好股市'),
        bulletBlock('市场情绪：投资者信心影响短期走势'),
        bulletBlock('资金面：北向资金、杠杆资金流向'),

        h1Block('二、K线图基础'),
        h2Block('2.1 K线构成'),
        quoteBlock('K线由开盘价、收盘价、最高价、最低价四个价格组成'),
        bulletBlock('阳线（红色）：收盘价 > 开盘价 → 上涨'),
        bulletBlock('阴线（绿色）：收盘价 < 开盘价 → 下跌'),
        bulletBlock('上影线：最高价到收盘价的距离'),
        bulletBlock('下影线：开盘价到最低价的距离'),
        h2Block('2.2 经典形态'),
        bulletBlock('锤子线：出现在底部 → 买入信号'),
        bulletBlock('上吊线：出现在顶部 → 警惕回落'),
        bulletBlock('十字星：开盘=收盘 → 多空平衡'),
        bulletBlock('吞没形态：阳包阴（买入）、阴包阳（卖出）'),

        h1Block('三、常用技术指标'),
        h2Block('3.1 均线MA'),
        bulletBlock('MA5（一周）：超短线参考'),
        bulletBlock('MA20（一个月）：中期趋势分水岭'),
        bulletBlock('MA60（一季度）：长期趋势确认'),
        bulletBlock('均线金叉：短上穿长 → 买入'),
        bulletBlock('均线死叉：短下穿长 → 卖出'),
        h2Block('3.2 MACD指标'),
        bulletBlock('DIF线：12日EMA - 26日EMA'),
        bulletBlock('DEA线：DIF的移动平均'),
        bulletBlock('MACD柱：DIF与DEA的差值'),
        bulletBlock('金叉：DIF上穿DEA → 买入'),
        bulletBlock('死叉：DIF下穿DEA → 卖出'),
        bulletBlock('顶背离：股价↑但MACD未↑ → 警惕回落'),
        bulletBlock('底背离：股价↓但MACD未↓ → 关注反弹'),
        h2Block('3.3 KDJ指标'),
        bulletBlock('K值：股价在近期区间的位置（0-100）'),
        bulletBlock('D值：K值的平滑'),
        bulletBlock('超买区（>80）：注意回调风险'),
        bulletBlock('超卖区（<20）：关注反弹机会'),
        h2Block('3.4 布林带BBAND'),
        bulletBlock('上轨：MA20 + 2倍标准差（压力位）'),
        bulletBlock('下轨：MA20 - 2倍标准差（支撑位）'),
        bulletBlock('股价触及上轨：注意回落'),
        bulletBlock('股价触及下轨：关注反弹'),
        bulletBlock('布林带收口：行情即将突破'),
        bulletBlock('布林带开口：行情加速'),

        h1Block('四、量价关系'),
        quoteBlock('"量为价先"——成交量是价格变化的先行指标'),
        bulletBlock('放量上涨：资金涌入 → 看多信号'),
        bulletBlock('缩量上涨：动能不足 → 警惕回调'),
        bulletBlock('放量下跌：恐慌抛售 → 可能见底'),
        bulletBlock('缩量下跌：卖压减轻 → 底部信号'),
        bulletBlock('地量低价：极度缩量 → 底部区域'),
        bulletBlock('放量突破：真突破 → 顺势买入'),
        bulletBlock('缩量突破：假突破 → 警惕陷阱'),

        h1Block('五、基本面分析'),
        h2Block('5.1 核心指标'),
        bulletBlock('PE（市盈率）：越低越便宜，<15为合理'),
        bulletBlock('PB（市净率）：越低越有价值，<1为破净'),
        bulletBlock('净利润增长率：>20%为高增长'),
        bulletBlock('ROE（净资产收益率）：>15%为优秀'),
        h2Block('5.2 估值方法'),
        bulletBlock('相对估值：PE、PB与行业对比'),
        bulletBlock('PEG估值：PEG<1为低估'),

        h1Block('六、趋势与支撑压力'),
        bulletBlock('上升趋势：高点和低点不断抬高 → 逢低买入'),
        bulletBlock('下降趋势：高点和低点不断降低 → 逢高卖出'),
        bulletBlock('横盘震荡：高低点基本持平 → 高抛低吸'),
        bulletBlock('支撑位：股价下跌时的买盘支撑'),
        bulletBlock('压力位：股价上涨时的卖盘压力'),
        bulletBlock('支撑跌破变压力，压力突破变支撑'),

        h1Block('七、风险控制'),
        bulletBlock('止损原则：亏损7-10%时果断止损'),
        bulletBlock('仓位管理：单只股票不超总仓位20%'),
        bulletBlock('分散投资：不把鸡蛋放一个篮子'),
        bulletBlock('右侧交易：趋势确认后再入场'),
        bulletBlock('永不满仓：保留现金应对突发'),
        bulletBlock('不追涨杀跌：追高风险大'),

        h1Block('八、常见术语'),
        bulletBlock('牛市：股价整体上涨；熊市：整体下跌'),
        bulletBlock('涨停/跌停：A股当日涨跌幅±10%'),
        bulletBlock('建仓：开始买入；清仓：全部卖出'),
        bulletBlock('追高：高位买入（不推荐）；抄底：低位买入'),
        bulletBlock('套牢：买入后亏损；割肉：亏损卖出'),
        bulletBlock('北向资金：港资买入A股'),
        bulletBlock('金叉：短上穿长 → 买入信号'),
        bulletBlock('死叉：短下穿长 → 卖出信号'),

        quoteBlock('⚠️ 投资有风险，入市需谨慎！本文仅供参考，不构成投资建议。'),
        textBlock('祝您投资顺利~ 嘻嘻 📊'),
    ];

    console.log(`共 ${blocks.length} 个块，开始添加...\n`);
    let success = 0;
    for (let i = 0; i < blocks.length; i++) {
        const ok = await addBlock(token, docId, blocks[i]);
        if (ok) success++;
        if ((i + 1) % 20 === 0) console.log(`已添加 ${i + 1}/${blocks.length}`);
        await new Promise(r => setTimeout(r, 100));
    }

    console.log(`\n✅ 完成! 成功 ${success}/${blocks.length} 个块`);
    return `https://feishu.cn/docx/${docId}`;
}

createArticle().then(url => {
    if (url) {
        console.log(`\n📎 文档链接: ${url}`);

        // 发送到飞书群
        const WEBHOOK = '06844d98-f23d-4a5f-a27e-e4665d021d96';
        const message = `📈 股票的基本涨跌知识

涵盖内容：
✅ 股票涨跌原理
✅ K线图基础知识
✅ 常用技术指标
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
            path: `/open-apis/bot/v2/hook/${WEBHOOK}`,
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