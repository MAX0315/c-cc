const ytdl = require('ytdl-core');

async function main() {
    const videoId = 'WDQjRzVcX-A';
    console.log('正在获取视频信息...\n');

    try {
        const info = await ytdl.getInfo(videoId);

        console.log('视频标题:', info.videoDetails.title);
        console.log('频道:', info.videoDetails.ownerChannelName);
        console.log('观看次数:', info.videoDetails.viewCount);
        console.log('\n--- 视频描述 ---');
        console.log(info.videoDetails.description?.substring(0, 2000) || '无描述');

        // 检查字幕轨道
        if (info.player_response.captions && info.player_response.captions.playerCaptionsTracklistRenderer) {
            const tracks = info.player_response.captions.playerCaptionsTracklistRenderer.captionTracks;
            console.log('\n--- 字幕轨道 ---');
            if (tracks && tracks.length > 0) {
                tracks.forEach((track, i) => {
                    console.log(`${i + 1}. ${track.name.simpleText} (${track.languageCode})`);
                });

                // 获取第一个字幕
                const track = tracks[0];
                console.log(`\n正在获取字幕: ${track.name.simpleText}...`);

                // ytdl-core没有直接获取字幕的方法，需要通过baseUrl
                // 但baseUrl需要signature，这里尝试另一种方式
                console.log('字幕baseUrl:', track.baseUrl?.substring(0, 100));
            } else {
                console.log('没有找到字幕轨道');
            }
        } else {
            console.log('视频没有字幕');
        }

        // 尝试获取视频元数据
        console.log('\n--- 视频元数据 ---');
        console.log('关键字:', info.videoDetails.keywords?.join(', ') || '无');
        console.log('类别:', info.videoDetails.category);
        console.log('发布于:', info.player_response.microformat?.playerMicroformatRenderer?.publishDate);

    } catch (err) {
        console.error('错误:', err.message);
    }
}

main();