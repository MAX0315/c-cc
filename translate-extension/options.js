// options.js
document.getElementById('save').addEventListener('click', () => {
  const apiKey = document.getElementById('api-key').value.trim();
  const model = document.getElementById('model').value;

  chrome.storage.sync.set({ openaiApiKey: apiKey, model }, () => {
    document.getElementById('status').textContent = '设置已保存 ✓';
  });
});

// 加载现有设置
chrome.storage.sync.get(['openaiApiKey', 'model'], (items) => {
  document.getElementById('api-key').value = items.openaiApiKey || '';
  document.getElementById('model').value = items.model || 'gpt-4o-mini';
});