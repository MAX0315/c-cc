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
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve({ code: -1, error: e.message, raw: data });
                }
            });
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

// 添加块到文档
async function addBlocks(token, docToken, blocks) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            children: blocks,
            index: -1
        });
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
                    resolve({ code: -1, error: e.message, raw: data });
                }
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// 提取块的文本内容（用于创建新块）
function extractBlockData(block) {
    const type = block.block_type;

    // 基础对象
    const newBlock = { block_type: type };

    // 文本类型块
    if (block.text && block.text.elements) {
        newBlock.text = { elements: block.text.elements };
    }

    // 列表
    if (type === 10 || type === 11) {
        newBlock.ordered = type === 11;
    }

    // 引用
    if (type === 14 && block.quote) {
        newBlock.quote = block.quote;
    }

    // Callout
    if (type === 15 && block.callout) {
        newBlock.callout = block.callout;
    }

    // 分割线
    if (type === 19) {
        newBlock.divider = {};
    }

    // 代码块
    if (type === 12 && block.code) {
        newBlock.code = block.code;
    }

    // 表格
    if (type === 17 && block.table) {
        newBlock.table = block.table;
    }

    return newBlock;
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
        console.log('❌ 获取块失败:', blocksResult.msg);
        return;
    }

    const items = blocksResult.data?.items || [];
    console.log(`获取到 ${items.length} 个块`);

    // 保存原始数据用于调试
    fs.writeFileSync('original_blocks.json', JSON.stringify(items, null, 2));
    console.log('原始数据已保存到 original_blocks.json');

    // 分析块结构
    const blockTypes = {};
    items.forEach(item => {
        blockTypes[item.block_type] = (blockTypes[item.block_type] || 0) + 1;
    });
    console.log('\n块类型分布:', blockTypes);

    // 创建新文档
    console.log('\n=== 创建新文档 ===');
    const newDoc = await createDoc(token, 'Claude Code 使用 - 副本');

    if (newDoc.code !== 0 || !newDoc.data?.document?.document_id) {
        console.log('❌ 创建文档失败:', newDoc);
        return;
    }

    const newDocId = newDoc.data.document.document_id;
    console.log('✅ 新文档创建成功:', newDocId);

    // 提取可创建的块
    console.log('\n=== 提取并创建块 ===');
    const newBlocks = items.map(extractBlockData);

    // 分批添加
    const batchSize = 20;
    let success = 0;
    let failed = 0;

    for (let i = 0; i < newBlocks.length; i += batchSize) {
        const batch = newBlocks.slice(i, i + batchSize);
        const result = await addBlocks(token, newDocId, batch);

        if (result.code === 0) {
            success += batch.length;
        } else {
            failed += batch.length;
        }

        if ((i + batchSize) % 100 === 0 || i + batchSize >= newBlocks.length) {
            console.log(`进度: ${Math.min(i + batchSize, newBlocks.length)}/${newBlocks.length} (成功:${success}, 失败:${failed})`);
        }
    }

    console.log('\n=== 完成 ===');
    console.log(`成功添加 ${success} 个块`);
    console.log(`失败 ${failed} 个块`);

    // 发送链接
    const newUrl = `https://kcnxjau9hxy4.feishu.cn/docx/${newDocId}`;
    await sendMessage(`📄 Claude Code 使用 - 副本（可编辑）

文档副本已创建：

${newUrl}

⚠️ 如果内容为空，请告知我，我会手动复制内容。

原文档：https://kcnxjau9hxy4.feishu.cn/wiki/X0QNwZxwKi6G1FkYSV7cy4ZQndc

嘻嘻 📖`);

    console.log('\n✅ 已发送链接到群聊');
}

main().catch(console.error);