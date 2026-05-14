// background.js - 后台脚本，处理翻译和存储
console.log('Background script loaded');

// 获取配置
async function getConfig() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['apiKey', 'model'], (items) => {
      resolve({
        apiKey: items.apiKey || '',
        model: items.model || 'MiniMax-M2.7'
      });
    });
  });
}

// 调用 MiniMax API 翻译
async function translateText(text, apiKey, model) {
  console.log('开始翻译:', text);

  const response = await fetch('https://api.minimaxi.com/v1/text/chatcompletion_v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      stream: false,
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

  console.log('响应状态:', response.status);

  if (!response.ok) {
    const error = await response.json();
    console.log('错误响应:', error);
    throw new Error(error.error?.message || 'API请求失败');
  }

  const data = await response.json();
  console.log('完整响应:', JSON.stringify(data));

  // MiniMax 响应格式可能是 choices[0].message.content 或 choices[0].delta.content
  const content = data.choices?.[0]?.message?.content
    || data.choices?.[0]?.delta?.content
    || data.choices?.[0]?.content
    || data.text
    || JSON.stringify(data);

  return content.trim();
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
        if (tabId) {
          chrome.tabs.sendMessage(tabId, {
            type: 'TRANSLATION_ERROR',
            data: '请先配置API Key'
          });
        }
        return;
      }

      const translation = await translateText(message.data.text, config.apiKey, config.model);

      if (tabId) {
        chrome.tabs.sendMessage(tabId, {
          type: 'TRANSLATION_RESULT',
          data: {
            translation: translation,
            original: message.data.text
          }
        });
      }
    } catch (error) {
      if (tabId) {
        chrome.tabs.sendMessage(tabId, {
          type: 'TRANSLATION_ERROR',
          data: error.message
        });
      }
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