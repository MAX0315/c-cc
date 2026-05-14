// popup.js - Popup 逻辑

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadVocabulary();
  setupTabs();
  setupSaveButton();
});

// 加载设置
function loadSettings() {
  chrome.storage.sync.get(['apiKey', 'model'], (items) => {
    document.getElementById('api-key').value = items.apiKey || '';
    document.getElementById('model').value = items.model || 'MiniMax-M2.7';
  });
}

// 加载单词本
function loadVocabulary() {
  chrome.storage.sync.get(['vocabulary'], (items) => {
    const vocab = items.vocabulary || [];
    renderVocabulary(vocab);
  });
}

// 渲染单词本列表
function renderVocabulary(vocab) {
  const list = document.getElementById('vocab-list');

  if (vocab.length === 0) {
    list.innerHTML = '<p class="empty-state">暂无单词</p>';
    return;
  }

  // 按时间倒序排列
  const sorted = [...vocab].sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  list.innerHTML = sorted.map(item => `
    <div class="vocab-item">
      <div class="word">${escapeHtml(item.word)}</div>
      <div class="translation">${escapeHtml(item.translation)}</div>
      ${item.context ? `<div class="context">${escapeHtml(item.context)}</div>` : ''}
      <div class="meta">添加于 ${formatDate(item.createdAt)}</div>
    </div>
  `).join('');
}

// Tab 切换
function setupTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      document.getElementById(`${tab.dataset.tab}-panel`).classList.add('active');
    });
  });
}

// 保存设置按钮
function setupSaveButton() {
  const saveBtn = document.getElementById('save-settings');
  const status = document.getElementById('save-status');

  saveBtn.addEventListener('click', () => {
    const apiKey = document.getElementById('api-key').value.trim();
    const model = document.getElementById('model').value;

    chrome.storage.sync.set({ apiKey: apiKey, model }, () => {
      status.textContent = '设置已保存 ✓';
      setTimeout(() => { status.textContent = ''; }, 2000);
    });
  });
}

// 工具函数
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString('zh-CN');
}

// 监听单词本更新
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'VOCAB_UPDATED') {
    loadVocabulary();
  }
});