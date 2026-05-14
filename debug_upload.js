const https = require('https');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const APP_ID = "cli_aa8b1485e63bdbc3";
const APP_SECRET = "Wkn3n6yK0Byujw3N23khKcVuzNl1X8sA";
const WEBHOOK = "06844d98-f23d-4a5f-a27e-e4665d021d96";

function getToken() {
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

async function uploadImageDebug(token, filePath) {
    const fileName = path.basename(filePath);
    const fileContent = fs.readFileSync(filePath);

    console.log(`文件路径: ${filePath}`);
    console.log(`文件大小: ${fileContent.length} bytes`);
    console.log(`文件头: ${fileContent.slice(0, 20).toString('hex')}`);

    return new Promise((resolve) => {
        const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
        const body = Buffer.concat([
            Buffer.from(`--${boundary}\r\n`),
            Buffer.from(`Content-Disposition: form-data; name="image"; filename="${fileName}"\r\n`),
            Buffer.from(`Content-Type: image/jpeg\r\n\r\n`),
            fileContent,
            Buffer.from(`\r\n--${boundary}--\r\n`)
        ]);

        console.log(`body大小: ${body.length}`);

        const options = {
            hostname: 'open.feishu.cn',
            path: '/open-apis/im/v1/images',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': body.length
            }
        };

        console.log('发送请求...');
        const req = https.request(options, (res) => {
            console.log(`状态码: ${res.statusCode}`);
            console.log(`响应头: ${JSON.stringify(res.headers)}`);
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`完整响应: ${data}`);
                try {
                    const result = JSON.parse(data);
                    if (result.code === 0 && result.data && result.data.image_key) {
                        resolve(result.data.image_key);
                    } else {
                        resolve(null);
                    }
                } catch (e) {
                    resolve(null);
                }
            });
        });

        req.on('error', (e) => {
            console.log(`请求错误: ${e.message}`);
            resolve(null);
        });

        req.write(body);
        req.end();
    });
}

async function convertToJpg(inputPath, outputPath) {
    const metadata = await sharp(inputPath).metadata();
    console.log(`原始格式: ${metadata.format}, 尺寸: ${metadata.width}x${metadata.height}`);

    await sharp(inputPath)
        .jpeg({ quality: 90 })
        .toFile(outputPath);

    const convertedMeta = await sharp(outputPath).metadata();
    console.log(`转换后格式: ${convertedMeta.format}, 尺寸: ${convertedMeta.width}x${convertedMeta.height}`);
}

async function main() {
    const imageDir = 'C:/c-cc/xhs-images/68a6af36000000001b01df6d';
    const testFile = path.join(imageDir, '68a6af36000000001b01df6d_1.jpg');

    console.log('=== 1. 获取Token ===');
    const token = await getToken();
    console.log('✅ Token获取成功\n');

    console.log('=== 2. 转换测试 ===');
    const tempDir = 'C:/c-cc/xhs-images/temp_jpg';
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempJpgPath = path.join(tempDir, 'test.jpg');
    await convertToJpg(testFile, tempJpgPath);
    const stats = fs.statSync(tempJpgPath);
    console.log(`转换后文件大小: ${stats.size} bytes\n`);

    console.log('=== 3. 上传测试 ===');
    const imageKey = await uploadImageDebug(token, tempJpgPath);

    if (imageKey) {
        console.log(`\n✅ 上传成功! image_key: ${imageKey}`);
    } else {
        console.log('\n❌ 上传失败');
    }

    // 清理
    try {
        fs.rmSync(tempDir, { recursive: true });
    } catch (e) {}
}

main().catch(console.error);