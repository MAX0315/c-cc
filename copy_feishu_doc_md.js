const https = require('https');
const fs = require('fs');

const APP_ID = "cli_aa8b1485e63bdbc3";
const APP_SECRET = "Wkn3n6yK0Byujw3N23khKcVuzNl1X8sA";
const WEBHOOK = "06844d98-f23d-4a5f-a27e-e4665d021d96";

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
            res.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// 获取文档块（完整数据）
async function getDocBlocks(token, docToken) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'open.feishu.cn',
            path: `/open-apis/docx/v1/documents/${docToken}/blocks?page_size=500`,
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', reject);
        req.end();
    });
}

// 创建文档
async function createDoc(token, title) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({ title: title });
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
            res.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// 添加块
async function addBlocks(token, docToken, blocks) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({ children: blocks, index: -1 });
        const options = {
            hostname: 'open.feishu.cn',
            path: `/open-apis/docx/v1/documents/${docToken}/blocks/${docToken}/children`,
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
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve({ code: -1, error: e.message });
                }
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// 发送消息
async function sendMessage(message) {
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

// 解析文本元素为纯文本
function extractText(elements) {
    if (!elements) return '';
    return elements.map(el => {
        if (el.text_run) return el.text_run.content || '';
        if (el.mention) return el.mention?.title || '';
        return '';
    }).join('');
}

// 根据block类型获取Markdown
function blockToMd(block, indent = 0) {
    const prefix = '  '.repeat(indent);
    const type = block.block_type;

    // 文本内容
    const text = extractText(block.text?.elements);
    if (!text && type !== 19 && type !== 20) return '';

    switch (type) {
        case 1: // 文档根
            return '';

        case 3: // h1
            return `# ${text}`;

        case 4: // h2
            return `## ${text}`;

        case 5: // h3
            return `### ${text}`;

        case 6: // h4
            return `#### ${text}`;

        case 2: // 段落
            return text;

        case 10: // 无序列表
            return `${prefix}- ${text}`;

        case 11: // 有序列表
            return `${prefix}1. ${text}`;

        case 14: // 引用
            return `${prefix}> ${text}`;

        case 15: // callout
            return `${prefix}> 💡 ${text}`;

        case 19: // 分割线
            return '---';

        case 12: // 代码块
            const lang = block.code?.language || '';
            return `\`\`\`${lang}\n${text}\n\`\`\``;

        case 17: // 表格
            // 需要特殊处理
            return `【表格: ${text}】`;

        default:
            return text || '';
    }
}

// 构建树结构
function buildTree(items) {
    const map = {};
    const roots = [];

    // 创建map
    items.forEach(item => {
        map[item.block_id] = { ...item, children: [] };
    });

    // 构建树
    items.forEach(item => {
        if (item.children && item.children.length > 0) {
            item.children.forEach(childId => {
                if (map[childId]) {
                    map[item.block_id].children.push(map[childId]);
                }
            });
        }
    });

    // 找根节点
    items.forEach(item => {
        if (item.block_type === 1) {
            roots.push(map[item.block_id]);
        }
    });

    return roots;
}

// 树转Markdown
function treeToMd(node, indent = 0) {
    const lines = [];

    if (node.block_type !== 1) {
        const md = blockToMd(node, indent);
        if (md) lines.push(md);
    }

    if (node.children) {
        // 列表项需要保持缩进
        const childIndent = (node.block_type === 10 || node.block_type === 11) ? indent : indent;
        node.children.forEach(child => {
            lines.push(...treeToMd(child, childIndent));
        });
    }

    return lines;
}

async function main() {
    const sourceDocToken = 'X0QNwZxwKi6G1FkYSV7cy4ZQndc';

    console.log('=== 获取Token ===');
    const tokenResult = await getToken();
    if (!tokenResult.tenant_access_token) {
        console.log('❌ Token获取失败');
        return;
    }
    console.log('✅ Token获取成功\n');
    const token = tokenResult.tenant_access_token;

    // 获取原文档块
    console.log('=== 获取原文档块 ===');
    const blocksResult = await getDocBlocks(token, sourceDocToken);

    if (blocksResult.code !== 0) {
        console.log('❌ 获取块失败');
        return;
    }

    const items = blocksResult.data?.items || [];
    console.log(`获取到 ${items.length} 个块`);

    // 构建树结构
    console.log('=== 构建树结构 ===');
    const tree = buildTree(items);

    // 转换为Markdown
    console.log('=== 转换为Markdown ===');
    let mdLines = [];
    tree.forEach(root => {
        mdLines.push(...treeToMd(root));
    });

    const markdown = mdLines.join('\n\n');

    // 保存Markdown文件
    fs.writeFileSync('Claude_Code_使用.md', markdown);
    console.log('✅ Markdown已保存到 Claude_Code_使用.md');

    // 创建新文档
    console.log('\n=== 创建新文档 ===');
    const newDoc = await createDoc(token, 'Claude Code 使用 - 副本');

    if (newDoc.code !== 0 || !newDoc.data?.document?.document_id) {
        console.log('❌ 创建文档失败');
        return;
    }

    const newDocId = newDoc.data.document.document_id;
    console.log('✅ 新文档创建成功:', newDocId);

    // 把Markdown转换为飞书块
    console.log('\n=== 转换并创建块 ===');

    // 简化版：按行创建
    const lines = markdown.split('\n').filter(l => l.trim());
    let success = 0;
    let failed = 0;

    for (const line of lines) {
        let block;

        if (line.startsWith('# ')) {
            block = {
                block_type: 3,
                text: { elements: [{ type: "text_run", text_run: { content: line.substring(2), text_element_style: { bold: true } } }] }
            };
        } else if (line.startsWith('## ')) {
            block = {
                block_type: 4,
                text: { elements: [{ type: "text_run", text_run: { content: line.substring(3), text_element_style: { bold: true } } }] }
            };
        } else if (line.startsWith('### ')) {
            block = {
                block_type: 5,
                text: { elements: [{ type: "text_run", text_run: { content: line.substring(4), text_element_style: { bold: true } } }] }
            };
        } else if (line.startsWith('#### ')) {
            block = {
                block_type: 6,
                text: { elements: [{ type: "text_run", text_run: { content: line.substring(5), text_element_style: { bold: true } } }] }
            };
        } else if (line.startsWith('> ')) {
            block = {
                block_type: 14,
                text: { elements: [{ type: "text_run", text_run: { content: line.substring(2) } }] },
                quote: {}
            };
        } else if (line.startsWith('- ')) {
            block = {
                block_type: 10,
                text: { elements: [{ type: "text_run", text_run: { content: line.substring(2) } }] }
            };
        } else if (line.startsWith('1. ')) {
            block = {
                block_type: 11,
                text: { elements: [{ type: "text_run", text_run: { content: line.substring(3) } }] }
            };
        } else if (line === '---') {
            block = { block_type: 19, divider: {} };
        } else {
            block = {
                block_type: 2,
                text: { elements: [{ type: "text_run", text_run: { content: line } }] }
            };
        }

        const result = await addBlocks(token, newDocId, [block]);
        if (result.code === 0) {
            success++;
        } else {
            failed++;
        }
    }

    console.log(`成功创建 ${success} 个块，失败 ${failed} 个`);

    // 发送结果
    const newUrl = `https://kcnxjau9hxy4.feishu.cn/docx/${newDocId}`;
    const mdUrl = `https://max0315.github.io/c-cc/Claude_Code_使用.md`;

    await sendMessage(`📄 Claude Code 使用 - 副本

已创建两个版本：

1️⃣ 飞书云文档（可编辑）：
${newUrl}

2️⃣ Markdown版本：
${mdUrl}

嘻嘻 📖`);

    console.log('\n✅ 已发送链接到群聊');
}

main().catch(console.error);