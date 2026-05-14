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

// 获取wiki文档的元信息
async function getWikiNode(token, objToken) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'open.feishu.cn',
            path: `/open-apis/wiki/v2/spaces/get_node?token=${objToken}`,
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

// 获取文档基础信息
async function getDocInfo(token, docToken) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'open.feishu.cn',
            path: `/open-apis/docx/v1/documents/${docToken}`,
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

// 获取文档内容块（带文本内容）
async function getDocBlocksWithText(token, docToken) {
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

// 获取块的富文本内容
async function getBlockText(token, docToken, blockId) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'open.feishu.cn',
            path: `/open-apis/docx/v1/documents/${docToken}/blocks/${blockId}/text`,
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

// 通过webhook发送
async function sendViaWebhook(message) {
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

// 获取用户信息
async function getUserInfo(token, userId) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'open.feishu.cn',
            path: `/open-apis/contact/v3/users/${userId}`,
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

// 更新文档内容（通过blocks API）
async function updateDocBlocks(token, docToken, blocks) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            children: blocks,
            index: 0
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
            res.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// 转换block类型到创建格式
function convertBlock(block) {
    const blockType = block.block_type;
    const result = {
        block_type: blockType
    };

    // 根据不同类型添加对应属性
    switch (blockType) {
        case 2: // paragraph
        case 3: // h1
        case 4: // h2
        case 5: // h3
        case 6: // text
            if (block.text && block.text.elements) {
                result.text = { elements: block.text.elements };
            }
            break;
        case 10: // bullet
        case 11: // ordered
            if (block.text && block.text.elements) {
                result.ordered = block.ordered || blockType === 11;
                result.text = { elements: block.text.elements };
            }
            break;
        case 12: // code
            if (block.code) {
                result.code = block.code;
            }
            break;
        case 14: // quote
            if (block.text && block.text.elements) {
                result.quote = block.quote || {};
                result.text = { elements: block.text.elements };
            }
            break;
        case 15: // callout
            if (block.callout) {
                result.callout = block.callout;
            }
            if (block.text && block.text.elements) {
                result.text = { elements: block.text.elements };
            }
            break;
        case 17: // table
            if (block.table) {
                result.table = block.table;
            }
            break;
        case 19: // divider
            result.divider = block.divider || {};
            break;
        case 20: // image
            if (block.image) {
                result.image = block.image;
            }
            break;
    }

    return result;
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

    // 1. 获取wiki节点信息
    console.log('=== 获取Wiki节点信息 ===');
    const wikiNode = await getWikiNode(token, sourceDocToken);
    console.log('Wiki节点:', wikiNode);

    // 2. 获取文档信息
    console.log('\n=== 获取文档信息 ===');
    const docInfo = await getDocInfo(token, sourceDocToken);
    console.log('文档信息:', JSON.stringify(docInfo, null, 2));

    // 3. 获取文档块
    console.log('\n=== 获取文档块 ===');
    const blocksResult = await getDocBlocksWithText(token, sourceDocToken);
    console.log('块数量:', blocksResult.data?.items?.length || 0);

    if (blocksResult.data?.items) {
        const items = blocksResult.data.items;
        console.log('\n前10个块类型:');
        items.slice(0, 10).forEach((item, i) => {
            console.log(`${i + 1}. type=${item.block_type}, has_text=${!!item.text}, has_children=${item.children?.length > 0}`);
        });

        // 4. 创建新文档
        console.log('\n=== 创建新文档 ===');
        const newDoc = await createDoc(token, 'Claude Code 使用 - 副本');
        if (newDoc.code !== 0 || !newDoc.data?.document?.document_id) {
            console.log('❌ 创建文档失败:', newDoc);
            return;
        }
        const newDocId = newDoc.data.document.document_id;
        console.log('✅ 新文档创建成功:', newDocId);

        // 5. 尝试转换并添加块
        console.log('\n=== 转换块格式 ===');
        const convertedBlocks = items.map(convertBlock).filter(b => b.block_type);
        console.log(`转换了 ${convertedBlocks.length} 个块`);

        // 6. 添加到新文档
        console.log('\n=== 添加块到新文档 ===');
        const batchSize = 30;
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < convertedBlocks.length; i += batchSize) {
            const batch = convertedBlocks.slice(i, i + batchSize);
            const result = await updateDocBlocks(token, newDocId, batch);

            if (result.code === 0) {
                successCount += batch.length;
            } else {
                failCount += batch.length;
                if (failCount < 5) {
                    console.log(`批次${Math.floor(i/batchSize) + 1}失败: ${result.msg}`);
                }
            }

            if ((i + batchSize) % 100 === 0 || i + batchSize >= convertedBlocks.length) {
                console.log(`进度: ${Math.min(i + batchSize, convertedBlocks.length)}/${convertedBlocks.length}`);
            }
        }

        console.log(`\n添加完成: 成功${successCount}, 失败${failCount}`);

        // 7. 发送链接到群聊
        const newUrl = `https://kcnxjau9hxy4.feishu.cn/docx/${newDocId}`;
        console.log('\n=== 发送链接到群聊 ===');
        await sendViaWebhook(`📄 Claude Code 使用 - 副本（可编辑）

文档已复制成功，点击即可编辑：

${newUrl}

原文档：https://kcnxjau9hxy4.feishu.cn/wiki/X0QNwZxwKi6G1FkYSV7cy4ZQndc

嘻嘻 📖`);

        console.log('✅ 已发送!');
    }
}

main().catch(console.error);