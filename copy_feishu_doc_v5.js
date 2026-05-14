const https = require('https');

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

// 获取文档块
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

// 创建单个块
async function createSingleBlock(token, docToken, parentBlockId, block) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            children: [block],
            index: -1
        });
        const options = {
            hostname: 'open.feishu.cn',
            path: `/open-apis/docx/v1/documents/${docToken}/blocks/${parentBlockId}/children`,
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

// 构建文本元素
function buildTextElements(text, bold = false) {
    return [{
        type: "text_run",
        text_run: {
            content: text,
            text_element_style: bold ? { bold: true } : {}
        }
    }];
}

// 构建段落块
function buildParagraphBlock(text, bold = false) {
    return {
        block_type: 2,
        text: {
            elements: buildTextElements(text, bold)
        }
    };
}

// 构建标题块
function buildHeadingBlock(text, level = 1) {
    const typeMap = { 1: 3, 2: 4, 3: 5 };
    return {
        block_type: typeMap[level] || 3,
        text: {
            elements: buildTextElements(text, true)
        }
    };
}

// 构建引用块
function buildQuoteBlock(text) {
    return {
        block_type: 14,
        text: {
            elements: buildTextElements(text)
        },
        quote: {}
    };
}

// 构建callout块
function buildCalloutBlock(text, emoji = "💡") {
    return {
        block_type: 15,
        text: {
            elements: buildTextElements(text)
        },
        callout: {
            emoji_id: emoji,
            background_color: 1
        }
    };
}

// 构建分割线
function buildDividerBlock() {
    return {
        block_type: 19,
        divider: {}
    };
}

// 解析原始块为可创建的块
function parseBlock(block) {
    // 跳过容器块和有子块的块
    if (block.children && block.children.length > 0) {
        return null;
    }

    const type = block.block_type;

    // 文本块
    if (block.text && block.text.elements) {
        const text = block.text.elements
            .map(el => el.text_run?.content || '')
            .join('');

        if (!text.trim()) return null;

        switch (type) {
            case 2: // 段落
                return buildParagraphBlock(text, false);
            case 3: // h1
                return buildHeadingBlock(text, 1);
            case 4: // h2
                return buildHeadingBlock(text, 2);
            case 5: // h3
                return buildHeadingBlock(text, 3);
            case 14: // 引用
                return buildQuoteBlock(text);
            case 15: // callout
                const emojiId = block.callout?.emoji_id || "💡";
                return buildCalloutBlock(text, emojiId);
        }
    }

    // 分割线
    if (type === 19) {
        return buildDividerBlock();
    }

    return null;
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

    // 创建新文档
    console.log('\n=== 创建新文档 ===');
    const newDoc = await createDoc(token, 'Claude Code 使用 - 副本');

    if (newDoc.code !== 0 || !newDoc.data?.document?.document_id) {
        console.log('❌ 创建文档失败');
        return;
    }

    const newDocId = newDoc.data.document.document_id;
    console.log('✅ 新文档创建成功:', newDocId);

    // 解析所有块
    console.log('\n=== 解析块 ===');
    const newBlocks = [];
    const skippedTypes = {};

    items.forEach(item => {
        // 跳过容器块和有children的块
        if (item.children && item.children.length > 0) {
            skippedTypes[item.block_type] = (skippedTypes[item.block_type] || 0) + 1;
            return;
        }

        const parsed = parseBlock(item);
        if (parsed) {
            newBlocks.push(parsed);
        } else {
            skippedTypes[item.block_type] = (skippedTypes[item.block_type] || 0) + 1;
        }
    });

    console.log(`解析了 ${newBlocks.length} 个块`);
    console.log('跳过的块类型:', skippedTypes);

    // 创建块 - 使用根block_id作为parent
    console.log('\n=== 创建块 ===');
    let success = 0;
    let failed = 0;

    for (let i = 0; i < newBlocks.length; i++) {
        const block = newBlocks[i];
        const result = await createSingleBlock(token, newDocId, newDocId, block);

        if (result.code === 0) {
            success++;
        } else {
            failed++;
            if (failed <= 3) {
                console.log(`第${i + 1}个块失败: ${result.msg}`);
            }
        }

        if ((i + 1) % 50 === 0) {
            console.log(`进度: ${i + 1}/${newBlocks.length} (成功:${success}, 失败:${failed})`);
        }
    }

    console.log('\n=== 结果 ===');
    console.log(`成功创建 ${success} 个块`);
    console.log(`失败 ${failed} 个块`);

    // 发送链接
    const newUrl = `https://kcnxjau9hxy4.feishu.cn/docx/${newDocId}`;
    await sendMessage(`📄 Claude Code 使用 - 副本

文档副本已创建（${success}个内容块）：

${newUrl}

原文档：https://kcnxjau9hxy4.feishu.cn/wiki/X0QNwZxwKi6G1FkYSV7cy4ZQndc

嘻嘻 📖`);

    console.log('\n✅ 已发送链接到群聊');
}

main().catch(console.error);