const https = require('https');

const WEBHOOK = '06844d98-f23d-4a5f-a27e-e4665d021d96';
const message = `📈 股票科普视频上线！

🎬 《股票的基本涨跌知识》动画视频

📚 内容涵盖：
✅ 涨跌原理（供需关系）
✅ K线与四大技术指标
✅ 量价关系与风险提示

🔗 在线观看：https://MAX0315.github.io/c-cc/

10秒动画循环播放，深色科技风格，3大知识点~

⚠️ 投资有风险，入市需谨慎！`;

const postData = JSON.stringify({
  msg_type: 'text',
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
  res.on('end', () => {
    const result = JSON.parse(data);
    console.log(result.code === 0 ? '✅ 已发送到飞书群!' : '❌ 发送失败');
  });
});

req.on('error', () => console.log('❌ 发送失败'));
req.write(postData);
req.end();
