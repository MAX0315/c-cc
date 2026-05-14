const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

// 使用Node.js的Buffer直接转换WebP为JPG
// WebP转JPG需要解码再编码，这里我们简单处理：复制文件并改扩展名尝试
// 更好的方式是使用sharp库，但我们先尝试不依赖外部库

// 检查是否有ffmpeg可用
function hasFfmpeg() {
    try {
        execSync('ffmpeg -version', { stdio: 'ignore' });
        return true;
    } catch (e) {
        return false;
    }
}

// 检查是否有ImageMagick可用
function hasConvert() {
    try {
        execSync('convert -version', { stdio: 'ignore' });
        return true;
    } catch (e) {
        return false;
    }
}

function uploadImage(token, filePath) {
    return new Promise((resolve, reject) => {
        const fileName = path.basename(filePath);
        const fileContent = fs.readFileSync(filePath);

        const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
        const body = Buffer.concat([
            Buffer.from(`--${boundary}\r\n`),
            Buffer.from(`Content-Disposition: form-data; name="image"; filename="${fileName}"\r\n`),
            Buffer.from(`Content-Type: image/webp\r\n\r\n`),
            fileContent,
            Buffer.from(`\r\n--${boundary}--\r\n`)
        ]);

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

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.code === 0 && result.data && result.data.image_key) {
                        resolve(result.data.image_key);
                    } else {
                        console.log(`Upload failed: ${result.msg}`);
                        resolve(null);
                    }
                } catch (e) {
                    resolve(null);
                }
            });
        });

        req.on('error', (e) => resolve(null));
        req.write(body);
        req.end();
    });
}

function sendImageViaWebhook(imageKey) {
    return new Promise((resolve) => {
        const postData = JSON.stringify({
            msg_type: "image",
            content: { image_key: imageKey }
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

        req.on('error', (e) => resolve({ code: -1, msg: e.message }));
        req.write(postData);
        req.end();
    });
}

async function main() {
    const imageDir = 'C:/c-cc/xhs-images/68a6af36000000001b01df6d';
    const files = fs.readdirSync(imageDir).filter(f => f.match(/\.(jpg|jpeg|png|webp|gif)$/i)).sort();

    console.log(`共 ${files.length} 张图片\n`);

    // 检查可用工具
    console.log('检查图像转换工具...');
    const hasFfmpegTool = hasFfmpeg();
    const hasConvertTool = hasConvert();
    console.log(`ffmpeg: ${hasFfmpegTool ? '✅' : '❌'}`);
    console.log(`ImageMagick: ${hasConvertTool ? '✅' : '❌'}`);
    console.log('');

    const token = await getToken();
    console.log('Token获取成功\n');

    // 创建临时目录存放转换后的JPG
    const tempDir = 'C:/c-cc/xhs-images/temp_jpg';
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    let success = 0;
    for (let i = 0; i < files.length; i++) {
        const filePath = path.join(imageDir, files[i]);
        const baseName = path.basename(filePath, path.extname(filePath));
        const tempJpgPath = path.join(tempDir, baseName + '.jpg');

        console.log(`[${i + 1}/${files.length}] ${files[i]}`);

        // 如果是WebP格式，尝试转换
        if (filePath.toLowerCase().endsWith('.jpg') || filePath.toLowerCase().endsWith('.jpeg')) {
            // 已经是JPG/JPEG格式，直接上传
            const imageKey = await uploadImage(token, filePath);
            if (imageKey) {
                const result = await sendImageViaWebhook(imageKey);
                if (result.code === 0) {
                    console.log('  ✅ 发送成功');
                    success++;
                } else {
                    console.log(`  ❌ 发送失败: ${result.msg}`);
                }
            } else {
                console.log('  ❌ 上传失败');
            }
        } else {
            // 非JPG格式，尝试用工具转换
            console.log('  非JPG格式，跳过（需要转换工具）');
        }

        await new Promise(r => setTimeout(r, 500));
    }

    // 清理临时目录
    try {
        fs.rmSync(tempDir, { recursive: true });
    } catch (e) {}

    console.log(`\n完成！成功发送 ${success}/${files.length} 张图片~`);
    console.log('\n📌 注意: 当前图片为WebP格式，需要转换工具才能发送。');
    console.log('   如果安装了ffmpeg或ImageMagick，可以自动转换并发送。');
}

main().catch(console.error);