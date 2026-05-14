const ytdl = require('ytdl-core');

async function getTranscript(videoId) {
    try {
        // 获取视频信息
        const info = await ytdl.getInfo(videoId);

        // 尝试获取字幕
        const captions = info.player_response.captions?.playerCaptionsTracklistRenderer?.captionTracks;

        if (captions && captions.length > 0) {
            console.log('找到字幕轨道:');
            captions.forEach((cap, i) => {
                console.log(`${i + 1}. ${cap.name.simpleText} - ${cap.languageCode}`);
            });

            // 获取英文或中文字幕
            const target = captions.find(c =>
                c.languageCode === 'en' || c.languageCode === 'zh-Hans' || c.languageCode === 'zh-CN'
            ) || captions[0];

            console.log(`\n使用的字幕: ${target.name.simpleText} (${target.languageCode})`);

            // 获取字幕内容
            const captionUrl = target.baseUrl;
            const response = await fetch(captionUrl);

            if (response.ok) {
                const xml = await response.text();
                // 解析xml获取纯文本
                const text = xml
                    .replace(/<[^>]+>/g, '') // 移除xml标签
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .trim();

                return text;
            }
        }

        // 尝试从player_response获取transcript
        const transcript = info.player_response.captions?.playerCaptionsTracklistRenderer?.captionTracks?.[0];
        if (transcript) {
            const url = transcript.baseUrl + '&fmt=json3';
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                console.log('JSON3格式字幕获取成功');
                return JSON.stringify(data, null, 2);
            }
        }

        console.log('无法获取字幕');
        return null;
    } catch (err) {
        console.error('错误:', err.message);
        return null;
    }
}

const videoId = process.argv[2] || 'WDQjRzVcX-A';
console.log(`正在获取视频 ${videoId} 的字幕...\n`);
getTranscript(videoId).then(text => {
    if (text) {
        console.log('\n--- 字幕内容 ---');
        console.log(text);
    }
});