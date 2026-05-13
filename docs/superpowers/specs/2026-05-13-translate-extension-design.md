# 划词翻译插件设计规格书

**日期**: 2026-05-13
**项目**: AI 划词翻译浏览器插件
**状态**: 已批准

---

## 1. 项目概述

开发一款 Chrome/Edge 浏览器扩展插件，实现划词翻译功能，支持调用 OpenAI GPT 系列模型 API，并将生词添加到本地单词本便于复习。

---

## 2. 技术方案

### 2.1 扩展类型
- Chrome Browser Extension (Manifest V3)
- 打包为 .crx 直接加载或发布到 Chrome Web Store

### 2.2 核心架构

```
┌─────────────────────────────────────────────┐
│            Chrome Browser Extension          │
├─────────────────────────────────────────────┤
│  Content Script (划词检测)                   │
│    └─→ 监听鼠标选择事件                      │
│    └─→ 发送选中文字给 Background              │
│                                             │
│  Background Script (核心逻辑)                │
│    └─→ 调用 OpenAI API 翻译                  │
│    └─→ 管理单词本存储                        │
│    └─→ 弹出 Popup 翻译结果                   │
│                                             │
│  Popup UI (翻译结果展示)                     │
│    └─→ 显示翻译结果                          │
│    └─→ 添加到单词本按钮                      │
│    └─→ 模型切换（未来扩展）                  │
└─────────────────────────────────────────────┘
```

---

## 3. 功能列表

### 3.1 翻译功能
- 用户划词后自动检测选中文本
- 调用 OpenAI API 进行翻译
- 在浮窗中显示翻译结果
- 支持自动检测源语言，目标语言为中文

### 3.2 单词本功能
- 一键将单词/短语添加到单词本
- 自动去重（相同文本不重复添加）
- 存储：Chrome Storage API + Chrome Sync 跨设备同步
- 包含原文语境（context）保存

### 3.3 辅助功能
- 快捷键支持（可自定义）
- 错误提示（网络错误、API 限额等）
- 模型配置（API Key 管理）

---

## 4. 数据模型

### 4.1 单词本条目 (VocabularyItem)
```typescript
interface VocabularyItem {
  id: string;           // UUID
  word: string;         // 单词/短语
  translation: string;  // 翻译结果
  context: string;      // 原文语境
  createdAt: string;    // ISO 8601 时间戳
  reviewCount: number;  // 复习次数
  lastReviewed: string | null; // 上次复习时间
}
```

### 4.2 翻译请求 (TranslationRequest)
```typescript
interface TranslationRequest {
  model: string;        // 默认 "gpt-4o-mini"
  text: string;         // 要翻译的文本
  sourceLang: string;   // "auto"
  targetLang: string;   // "zh"
}
```

---

## 5. 文件结构

```
translate-extension/
├── manifest.json           # 扩展配置文件
├── background.js           # 后台脚本
├── content.js             # 内容脚本（划词检测）
├── popup.html             # 弹窗界面
├── popup.js              # 弹窗逻辑
├── popup.css             # 弹窗样式
├── styles.css             # 浮窗样式
├── options.html          # 设置页面
├── options.js            # 设置逻辑
└── icons/                 # 图标资源
```

---

## 6. 错误处理

| 错误类型 | 处理方式 |
|----------|----------|
| 网络错误 | 显示"网络错误，请重试" |
| API 限额 | 显示"API 限额已达，请稍后再试" |
| 无效输入 | 忽略空选择或过短文本（<1字符） |
| 存储错误 | 显示"保存失败，请检查存储空间" |

---

## 7. 待考虑扩展

- 多模型支持（Claude、Gemini 等）
- 单词本复习功能
- 更多语言对支持
- 快捷键自定义

---

## 8. 验收标准

- [ ] 划词后自动弹出翻译浮窗
- [ ] 翻译结果正确显示
- [ ] 单词可添加到本地存储
- [ ] Chrome Sync 同步正常
- [ ] 错误情况有友好提示