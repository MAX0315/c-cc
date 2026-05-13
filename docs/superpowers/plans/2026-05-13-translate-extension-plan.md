# AI 划词翻译插件实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一款 Chrome 浏览器扩展插件，实现划词自动翻译功能，支持调用 OpenAI API，并将生词存入本地单词本。

**Architecture:** 基于 Manifest V3 的 Chrome 扩展，使用 Content Script 检测划词，Background Script 处理翻译逻辑，Popup UI 展示结果。所有数据通过 Chrome Storage API + Sync 存储。

**Tech Stack:** Chrome Extension (Manifest V3), Vanilla JavaScript, OpenAI API

---

## 文件结构

```
translate-extension/
├── manifest.json           # 扩展配置文件
├── background.js           # 后台脚本（API调用、存储）
├── content.js             # 内容脚本（划词检测）
├── popup.html             # 弹窗界面
├── popup.js               # 弹窗逻辑
├── popup.css              # 弹窗样式
├── styles.css             # 浮窗样式
├── options.html           # 设置页面
├── options.js             # 设置逻辑
└── icons/                 # 图标资源
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## 任务列表

### Task 1: 项目初始化与 manifest 配置

**Files:**
- Create: `translate-extension/manifest.json`

- [ ] **Step 1: 创建 manifest.json**

```json
{
  "manifest_version": 3,
  "name": "AI划词翻译",
  "version": "1.0.0",
  "description": "AI驱动的划词翻译插件，支持调用OpenAI API",
  "permissions": [
    "storage",
    "activeTab",
    "scripting"
  ],
  "host_permissions": [
    "https://api.openai.com/*"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "css": ["styles.css"]
    }
  ],
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "options_page": "options.html"
}
```

- [ ] **Step 2: 提交**

```bash
git add translate-extension/manifest.json
git commit -m "feat: 初始化扩展项目结构"
```

---

### Task 2: Content Script（划词检测）

**Files:**
- Create: `translate-extension/content.js`
- Create: `translate-extension/styles.css`

- [ ] **Step 1: 创建 content.js**

```javascript
// content.js - 划词检测脚本
let selectedText = '';
let translationPopup = null;

// 创建翻译浮窗
function createPopup() {
  if (translationPopup) return translationPopup;

  translationPopup = document.createElement('div');
  translationPopup.id = 'ai-translate-popup';
  translationPopup.className = 'ai-translate-popup';
  translationPopup.innerHTML = `
    <div class="popup-content">
      <div class="loading">翻译中...</div>
    </div>
  `;
  document.body.appendChild(translationPopup);
  return translationPopup;
}

// 显示翻译结果
function showTranslation(translation, originalText) {
  const popup = createPopup();
  popup.innerHTML = `
    <div class="popup-content">
      <div class="original-text">${escapeHtml(originalText)}</div>
      <div class="translation-text">${escapeHtml(translation)}</div>
      <button class="add-to-vocab-btn">添加到单词本</button>
    </div>
  `;

  // 绑定添加按钮事件
  popup.querySelector('.add-to-vocab-btn').addEventListener('click', () => {
    chrome.runtime.sendMessage({
      type: 'ADD_TO_VOCABULARY',
      data: {
        word: originalText,
        translation: translation
      }
    });
    popup.querySelector('.add-to-vocab-btn').textContent = '已添加 ✓';
    popup.querySelector('.add-to-vocab-btn').disabled = true;
  });

  positionPopup(popup);
  popup.classList.add('visible');
}

// 定位浮窗
function positionPopup(popup) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  popup.style.top = `${window.scrollY + rect.bottom + 10}px`;
  popup.style.left = `${window.scrollX + rect.left}px`;
}

// HTML转义
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 隐藏浮窗
function hidePopup() {
  if (translationPopup) {
    translationPopup.classList.remove('visible');
  }
}

// 监听鼠标选择事件
document.addEventListener('mouseup', (e) => {
  setTimeout(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text && text.length > 0) {
      selectedText = text;
      showTranslation('翻译中...', text);

      // 发送翻译请求
      chrome.runtime.sendMessage({
        type: 'TRANSLATE',
        data: { text: text }
      });
    } else {
      hidePopup();
    }
  }, 100);
});

// 点击其他地方隐藏浮窗
document.addEventListener('mousedown', (e) => {
  if (translationPopup && !translationPopup.contains(e.target)) {
    hidePopup();
  }
});

// 监听翻译结果
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TRANSLATION_RESULT') {
    showTranslation(message.data.translation, message.data.original);
  } else if (message.type === 'TRANSLATION_ERROR') {
    showTranslation('翻译失败，请重试', selectedText);
  }
});
```

- [ ] **Step 2: 创建 styles.css**

```css
/* styles.css - 翻译浮窗样式 */
.ai-translate-popup {
  position: absolute;
  z-index: 2147483647;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 12px 16px;
  min-width: 200px;
  max-width: 400px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  display: none;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.ai-translate-popup.visible {
  display: block;
  opacity: 1;
}

.ai-translate-popup .popup-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ai-translate-popup .original-text {
  color: #666;
  font-size: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
  word-break: break-word;
}

.ai-translate-popup .translation-text {
  color: #333;
  font-size: 15px;
  line-height: 1.5;
  word-break: break-word;
}

.ai-translate-popup .add-to-vocab-btn {
  background: #4A90D9;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.ai-translate-popup .add-to-vocab-btn:hover {
  background: #3a7bc8;
}

.ai-translate-popup .add-to-vocab-btn:disabled {
  background: #9dc4e8;
  cursor: default;
}

.ai-translate-popup .loading {
  color: #999;
  font-size: 13px;
  text-align: center;
  padding: 8px 0;
}
```

- [ ] **Step 3: 提交**

```bash
git add translate-extension/content.js translate-extension/styles.css
git commit -m "feat: 添加划词检测和浮窗显示"
```

---

### Task 3: Background Script（核心逻辑）

**Files:**
- Create: `translate-extension/background.js`

- [ ] **Step 1: 创建 background.js**

```javascript
// background.js - 后台脚本，处理翻译和存储

// 获取配置
async function getConfig() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['openaiApiKey', 'model'], (items) => {
      resolve({
        apiKey: items.openaiApiKey || '',
        model: items.model || 'gpt-4o-mini'
      });
    });
  });
}

// 调用 OpenAI API 翻译
async function translateText(text, apiKey, model) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'system',
          content: '你是一个翻译引擎，将用户输入的文本翻译成中文。只返回翻译结果，不要解释。'
        },
        {
          role: 'user',
          content: text
        }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API请求失败');
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

// 获取单词本
async function getVocabulary() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['vocabulary'], (items) => {
      resolve(items.vocabulary || []);
    });
  });
}

// 保存单词本
async function saveVocabulary(vocab) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ vocabulary: vocab }, resolve);
  });
}

// 添加到单词本
async function addToVocabulary(word, translation, context = '') {
  const vocab = await getVocabulary();

  // 去重检查
  const exists = vocab.some(item => item.word.toLowerCase() === word.toLowerCase());
  if (exists) {
    return { success: false, message: '已存在' };
  }

  const newItem = {
    id: crypto.randomUUID(),
    word: word,
    translation: translation,
    context: context,
    createdAt: new Date().toISOString(),
    reviewCount: 0,
    lastReviewed: null
  };

  vocab.push(newItem);
  await saveVocabulary(vocab);

  return { success: true, item: newItem };
}

// 监听消息
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  const tabId = sender.tab?.id;

  if (message.type === 'TRANSLATE') {
    try {
      const config = await getConfig();

      if (!config.apiKey) {
        chrome.runtime.sendMessage(tabId, {
          type: 'TRANSLATION_ERROR',
          data: '请先配置API Key'
        });
        return;
      }

      const translation = await translateText(message.data.text, config.apiKey, config.model);

      chrome.runtime.sendMessage(tabId, {
        type: 'TRANSLATION_RESULT',
        data: {
          translation: translation,
          original: message.data.text
        }
      });
    } catch (error) {
      chrome.runtime.sendMessage(tabId, {
        type: 'TRANSLATION_ERROR',
        data: error.message
      });
    }
  }

  if (message.type === 'ADD_TO_VOCABULARY') {
    const result = await addToVocabulary(
      message.data.word,
      message.data.translation,
      message.data.context || ''
    );
    // 通知 popup 更新
    chrome.runtime.sendMessage({ type: 'VOCAB_UPDATED', data: result });
  }
});
```

- [ ] **Step 2: 提交**

```bash
git add translate-extension/background.js
git commit -m "feat: 添加后台脚本处理翻译和存储"
```

---

### Task 4: Popup UI（设置和单词本）

**Files:**
- Create: `translate-extension/popup.html`
- Create: `translate-extension/popup.js`
- Create: `translate-extension/popup.css`

- [ ] **Step 1: 创建 popup.html**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div class="popup-container">
    <header class="popup-header">
      <h1>AI 划词翻译</h1>
    </header>

    <nav class="tabs">
      <button class="tab-btn active" data-tab="vocab">单词本</button>
      <button class="tab-btn" data-tab="settings">设置</button>
    </nav>

    <main class="popup-content">
      <!-- 单词本面板 -->
      <section id="vocab-panel" class="panel active">
        <div id="vocab-list" class="vocab-list">
          <p class="empty-state">暂无单词</p>
        </div>
      </section>

      <!-- 设置面板 -->
      <section id="settings-panel" class="panel">
        <div class="form-group">
          <label for="api-key">OpenAI API Key</label>
          <input type="password" id="api-key" placeholder="sk-...">
        </div>

        <div class="form-group">
          <label for="model">模型</label>
          <select id="model">
            <option value="gpt-4o-mini">GPT-4o Mini</option>
            <option value="gpt-4o">GPT-4o</option>
            <option value="gpt-4-turbo">GPT-4 Turbo</option>
          </select>
        </div>

        <button id="save-settings" class="save-btn">保存设置</button>
        <p id="save-status" class="save-status"></p>
      </section>
    </main>
  </div>
  <script src="popup.js"></script>
</body>
</html>
```

- [ ] **Step 2: 创建 popup.css**

```css
/* popup.css */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  width: 320px;
  min-height: 400px;
  background: #f5f5f5;
}

.popup-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.popup-header {
  background: #4A90D9;
  color: white;
  padding: 16px;
  text-align: center;
}

.popup-header h1 {
  font-size: 16px;
  font-weight: 600;
}

.tabs {
  display: flex;
  background: white;
  border-bottom: 1px solid #eee;
}

.tab-btn {
  flex: 1;
  padding: 12px;
  border: none;
  background: none;
  font-size: 14px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.tab-btn.active {
  color: #4A90D9;
  border-bottom: 2px solid #4A90D9;
}

.popup-content {
  flex: 1;
  overflow-y: auto;
}

.panel {
  display: none;
  padding: 16px;
}

.panel.active {
  display: block;
}

/* 单词本列表 */
.vocab-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.vocab-item {
  background: white;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.vocab-item .word {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.vocab-item .translation {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.vocab-item .context {
  font-size: 11px;
  color: #999;
  font-style: italic;
}

.vocab-item .meta {
  font-size: 11px;
  color: #ccc;
  margin-top: 6px;
}

.empty-state {
  text-align: center;
  color: #999;
  padding: 40px 0;
}

/* 设置表单 */
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 13px;
  color: #666;
  margin-bottom: 6px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #4A90D9;
}

.save-btn {
  width: 100%;
  padding: 12px;
  background: #4A90D9;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.save-btn:hover {
  background: #3a7bc8;
}

.save-status {
  text-align: center;
  font-size: 13px;
  margin-top: 8px;
  color: #4A90D9;
}
```

- [ ] **Step 3: 创建 popup.js**

```javascript
// popup.js - Popup 逻辑

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadVocabulary();
  setupTabs();
  setupSaveButton();
});

// 加载设置
function loadSettings() {
  chrome.storage.sync.get(['openaiApiKey', 'model'], (items) => {
    document.getElementById('api-key').value = items.openaiApiKey || '';
    document.getElementById('model').value = items.model || 'gpt-4o-mini';
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

    chrome.storage.sync.set({ openaiApiKey: apiKey, model }, () => {
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
```

- [ ] **Step 4: 提交**

```bash
git add translate-extension/popup.html translate-extension/popup.css translate-extension/popup.js
git commit -m "feat: 添加Popup UI界面"
```

---

### Task 5: Options 页面（备用设置页）

**Files:**
- Create: `translate-extension/options.html`
- Create: `translate-extension/options.js`

- [ ] **Step 1: 创建 options.html**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>AI划词翻译 - 设置</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; }
    h1 { color: #4A90D9; }
    .form-group { margin-bottom: 20px; }
    label { display: block; margin-bottom: 8px; font-weight: 500; }
    input, select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; }
    button { background: #4A90D9; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; }
    button:hover { background: #3a7bc8; }
    .status { margin-top: 16px; color: green; }
  </style>
</head>
<body>
  <h1>AI 划词翻译 - 设置</h1>
  <div class="form-group">
    <label>OpenAI API Key</label>
    <input type="password" id="api-key" placeholder="sk-...">
  </div>
  <div class="form-group">
    <label>模型</label>
    <select id="model">
      <option value="gpt-4o-mini">GPT-4o Mini</option>
      <option value="gpt-4o">GPT-4o</option>
      <option value="gpt-4-turbo">GPT-4 Turbo</option>
    </select>
  </div>
  <button id="save">保存</button>
  <p id="status" class="status"></p>
  <script src="options.js"></script>
</body>
</html>
```

- [ ] **Step 2: 创建 options.js**

```javascript
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
```

- [ ] **Step 3: 提交**

```bash
git add translate-extension/options.html translate-extension/options.js
git commit -m "feat: 添加设置页面"
```

---

### Task 6: 图标资源

**Files:**
- Create: `translate-extension/icons/icon16.png` (16x16)
- Create: `translate-extension/icons/icon48.png` (48x48)
- Create: `translate-extension/icons/icon128.png` (128x128)

- [ ] **Step 1: 使用 WebFetch 获取免费图标或告知用户自行制作**

由于图标需要实际图片，建议用户：
1. 在 [Flaticon](https://www.flaticon.com/) 搜索 "translate" 下载 PNG
2. 或使用在线工具生成：`https://favicon.io/` 或 `https://www.favicon.cc/`

将图标放入 `translate-extension/icons/` 目录

- [ ] **Step 2: 提交**

```bash
git add translate-extension/icons/
git commit -m "feat: 添加扩展图标"
```

---

### Task 7: 本地加载测试

**Files:**
- Modify: `README.md` (创建使用说明)

- [ ] **Step 1: 创建 README.md**

```markdown
# AI 划词翻译扩展

## 安装步骤

1. 打开 Chrome，输入 `chrome://extensions/`
2. 开启右上角「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `translate-extension` 文件夹
5. 点击扩展图标旁的-pin固定到工具栏

## 使用方法

1. 点击工具栏图标，进入「设置」标签
2. 填入你的 OpenAI API Key
3. 选择模型，点击保存
4. 在任意网页划词，自动显示翻译
5. 点击「添加到单词本」保存生词

## 卸载

在 `chrome://extensions/` 找到本扩展，点击「移除」
```

- [ ] **Step 2: 提交**

```bash
git add README.md
git commit -m "docs: 添加使用说明"
```

---

## 自检清单

- [ ] manifest.json 配置正确
- [ ] content.js 划词检测工作
- [ ] background.js 翻译请求正确
- [ ] popup.html 界面正常显示
- [ ] Chrome Storage 存储正常
- [ ] 图标文件存在
- [ ] 扩展可正常加载到 Chrome

---

## 执行方式

**请选择：**

**1. Subagent-Driven (推荐)** - 我调度子代理逐任务执行，每步审核，快迭代

**2. Inline Execution** - 在本会话中批量执行任务，带检查点