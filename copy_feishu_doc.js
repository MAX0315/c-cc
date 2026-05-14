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
            res.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// 创建新文档
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

// 获取原文档块
async function getDocBlocks(token, docToken) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'open.feishu.cn',
            path: `/open-apis/docx/v1/documents/${docToken}/blocks`,
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

// 获取新文档的根block_id
async function getDocRootBlock(token, docToken) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'open.feishu.cn',
            path: `/open-apis/docx/v1/documents/${docToken}/blocks?page_size=1`,
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
                    reject(e);
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

// 添加块到文档
async function addBlocks(token, docToken, rootBlockId, children) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            children: children,
            index: -1
        });
        const options = {
            hostname: 'open.feishu.cn',
            path: `/open-apis/docx/v1/documents/${docToken}/blocks/${rootBlockId}/children`,
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
                    resolve({ error: e.message, raw: data });
                }
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// 复制文档
async function copyDoc(token, sourceDocToken, newTitle) {
    console.log('正在获取原文档块...');

    // 获取原文档块
    const blocksResult = await getDocBlocks(token, sourceDocToken);
    if (blocksResult.code !== 0) {
        console.error('获取块失败:', blocksResult);
        return null;
    }

    const items = blocksResult.data?.items || [];
    console.log(`获取到 ${items.length} 个块`);

    // 创建新文档
    console.log('正在创建新文档...');
    const newDoc = await createDoc(token, newTitle);

    if (newDoc.code !== 0 || !newDoc.data?.document?.document_id) {
        console.error('创建文档失败:', newDoc);
        return null;
    }

    const newDocId = newDoc.data.document.document_id;
    console.log('新文档创建成功, ID:', newDocId);

    // 获取新文档的根block
    console.log('获取新文档根block...');
    const rootResult = await getDocRootBlock(token, newDocId);
    const rootBlockId = rootResult.data?.items?.[0]?.block_id;
    console.log('根Block ID:', rootBlockId);

    // 复制块内容
    if (items.length > 0 && rootBlockId) {
        console.log('正在复制文档内容...');

        // 分批复制，每批50个
        const batchSize = 50;
        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            console.log(`复制块 ${i + 1} - ${Math.min(i + batchSize, items.length)}...`);

            const result = await addBlocks(token, newDocId, rootBlockId, batch);
            if (result.code !== 0) {
                console.log(`复制批次${i/batchSize + 1}失败:`, result.msg);
            }
        }
        console.log('文档内容复制完成!');
    }

    return `https://kcnxjau9hxy4.feishu.cn/docx/${newDocId}`;
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

    console.log('=== 复制文档 ===');
    const newDocUrl = await copyDoc(token, sourceDocToken, 'Claude Code 使用 - 副本');

    if (newDocUrl) {
        console.log('\n✅ 文档复制成功!');
        console.log('新文档链接:', newDocUrl);
    } else {
        console.log('\n❌ 文档复制失败');
    }
}

main().catch(console.error);