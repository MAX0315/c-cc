const https = require('https');

// DeepSeek V4 video ID
const videoId = 'WDQjRzVcX-A';

function fetch(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function getTranscript() {
    console.log('正在获取DeepSeek V4视频字幕...\n');

    // YouTube的字幕API接口
    const apiUrl = `https://youtube.com/api/timedtext?fmt=json3&lang=zh-CN&v=${videoId}`;

    try {
        const response = await fetch(apiUrl);
        console.log('API响应状态');

        if (response && response.length > 10) {
            try {
                const data = JSON.parse(response);
                if (data.events) {
                    let transcript = '';
                    data.events.forEach(event => {
                        if (event.segs) {
                            event.segs.forEach(seg => {
                                if (seg.utf8) {
                                    transcript += seg.utf8;
                                }
                            });
                        }
                    });
                    console.log('成功获取字幕!');
                    console.log('\n--- 字幕内容 ---\n');
                    console.log(transcript);

                    // 保存到文件
                    const fs = require('fs');
                    fs.writeFileSync('deepseek_v4_transcript.txt', transcript);
                    console.log('\n\n字幕已保存到 deepseek_v4_transcript.txt');
                }
            } catch (e) {
                console.log('解析JSON失败，原始响应:', response.substring(0, 500));
            }
        } else {
            console.log('未获取到字幕数据，尝试其他方法...\n');

            // 尝试英文字幕
            const enUrl = `https://youtube.com/api/timedtext?fmt=json3&lang=en&v=${videoId}`;
            const enResponse = await fetch(enUrl);
            if (enResponse && enResponse.length > 10) {
                console.log('获取到英文字幕');
                const fs = require('fs');
                fs.writeFileSync('deepseek_v4_transcript_en.txt', enResponse);
                console.log('已保存到 deepseek_v4_transcript_en.txt');
            }
        }
    } catch (err) {
        console.error('错误:', err.message);
    }
}

getTranscript();