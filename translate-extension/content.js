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