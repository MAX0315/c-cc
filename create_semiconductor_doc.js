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
    return new Promise((resolve, reject) => {
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
                else { console.log('添加块失败:', result.msg); resolve(null); }
            });
        });
        req.on('error', reject);
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

async function createSemiconductorDoc() {
    const token = await getToken();
    console.log('Token获取成功\n');

    const doc = await createDoc(token, '2026年半导体行业分析报告');
    console.log(`文档创建成功! ID: ${doc.document_id}\n`);

    const docId = doc.document_id;
    const blocks = [];
    let idx = 0;

    function add(type, content) {
        blocks.push({ type, content, index: idx++ });
    }

    // ===== 一、行业概述 =====
    add('h1', '一、行业概述');
    add('text', '半导体行业是现代信息技术产业的核心基础，被誉为"工业粮食"。2026年，随着AI算力需求爆发、汽车电子化加速、以及消费电子复苏，半导体行业呈现结构性高增长态势。');

    // ===== 二、市场现状 =====
    add('h1', '二、市场现状分析');
    add('h2', '2.1 全球市场规模');
    add('quote', '2026年Q1全球半导体市场规模约1,520亿美元，同比增长23%，环比下降4%，符合季节性调整规律。');
    add('text', '');
    add('bullet', 'AI芯片成为最大增量：数据中心芯片占比提升至38%，英伟达H系列芯片持续热销');
    add('bullet', '消费电子回暖：智能手机SoC出货量同比增长12%，库存周期结束');
    add('bullet', '汽车芯片结构性短缺：车规级MCU需求持续紧张，功率半导体受益新能源车增长');

    add('h2', '2.2 竞争格局');
    add('bullet', '先进制程：台积电3nm产能爬坡中，N2制程进展顺利；三星SF2良率问题仍待解决');
    add('bullet', 'AI芯片：英伟达市占率超75%，AMD MI300X提升至18%，谷歌TPU持续迭代');
    add('bullet', '存储芯片：HBM3e成为争夺焦点，SK海力士、三星、美光三国争霸');

    // ===== 三、技术趋势 =====
    add('h1', '三、核心技术趋势');
    add('h2', '3.1 先进封装技术');
    add('bullet', 'CoWoS：台积电产能持续紧张，2026年产能已售罄，直接受益英伟达订单溢出');
    add('bullet', 'SoIC：AMD、苹果率先采用，3D封装成为延续摩尔定律关键');
    add('bullet', 'Chiplet：中国厂商积极布局，国产替代重要方向');
    add('text', '');
    add('h2', '3.2 AI芯片演进');
    add('bullet', '算力需求每9个月翻倍，大模型参数量年均增长10倍');
    add('bullet', 'HBM4规划带宽提升至2TB/s，先进封装成为性能瓶颈');
    add('bullet', '光互联技术（CPO）开始商业化部署');

    // ===== 四、投资逻辑 =====
    add('h1', '四、投资逻辑分析');
    add('h2', '4.1 核心投资主线');
    add('bullet', '主线一：AI算力产业链——GPU、ASIC、FPGA需求爆发，核心受益标的：英伟达、AMD、博通');
    add('bullet', '主线二：先进封装——CoWoS产能紧张持续，核心受益标的：台积电、日月光、Amkor');
    add('bullet', '主线三：国产替代——设备/材料/设计环节加速突破，核心受益标的：中芯国际、北方华创、中微公司');

    add('h2', '4.2 估值分析');
    add('quote', '当前半导体板块整体PE约35倍，处于近5年60%分位。AI芯片龙头英伟达PE约45倍，低于历史均值；设备龙头应用材料PE约20倍，处于历史低位。');

    // ===== 五、个股推荐 =====
    add('h1', '五、重点标的推荐');
    add('h2', '5.1 海外标的');
    add('bullet', '英伟达 (NVDA)：AI芯片绝对龙头，H200/B系列持续放量，目标价150美元');
    add('bullet', '台积电 (TSM)：先进制程独步天下，CoWoS产能成业绩保障，目标价200美元');
    add('bullet', '博通 (AVGO)：AI ASIC定制芯片放量，财报持续超预期，目标价180美元');

    add('h2', '5.2 A/H股标的');
    add('bullet', '中芯国际 (688981.SH)：成熟制程国产替代加速，14nm良率持续提升');
    add('bullet', '北方华创 (002371.SZ)：半导体设备平台型龙头，PVD/CVD订单充沛');
    add('bullet', '中微公司 (688012.SH)：刻蚀设备国产替代龙头，CCP/ICP双线突破');

    // ===== 六、风险提示 =====
    add('h1', '六、风险提示');
    add('bullet', '地缘政治风险：美国出口管制持续升级，高端设备/芯片获取受限');
    add('bullet', '产能过剩风险：成熟制程竞争加剧，28nm以下可能出现价格战');
    add('bullet', '需求波动风险：消费电子复苏力度待观察，智能手机换机周期延长');
    add('bullet', '技术迭代风险：技术路线切换可能导致现有投资贬值');

    // ===== 七、操作建议 =====
    add('h1', '七、操作建议');
    add('text', '基于当前市场环境，建议采取以下策略：');
    add('text', '');
    add('bullet', '仓位配置：半导体仓位建议占总仓位15-20%，不宜过重');
    add('bullet', '建仓节奏：分批建仓，避免追高，当前点位可开始左侧布局');
    add('bullet', '止损建议：单只标的最大亏损控制在10%以内');
    add('bullet', '持有周期：半导体周期约3-5年，建议持有1年以上获取周期红利');

    add('h2', '7.1 重点关注时间节点');
    add('bullet', 'Q2财报季（7-8月）：AI芯片需求验证');
    add('bullet', '台积电法说会（季度）：先进制程产能指引');
    add('bullet', '苹果秋季发布会（9月）：新芯片带动换机潮');

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

    console.log('文档生成完成!');
    console.log(`文档链接: https://feishu.cn/docx/${docId}`);

    return docId;
}

createSemiconductorDoc().catch(console.error);