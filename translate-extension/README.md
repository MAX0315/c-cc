# AI 划词翻译

一款 AI 驱动的浏览器划词翻译插件，支持调用 OpenAI API，并将生词添加到本地单词本。

## 功能特性

- **划词翻译**：在任意网页选中文字，自动显示翻译结果
- **AI 驱动**：基于 OpenAI GPT 模型，翻译质量高
- **单词本**：一键将生词添加到本地单词本，支持 Chrome Sync 跨设备同步
- **多模型支持**：支持 GPT-4o Mini、GPT-4o、GPT-4 Turbo

## 安装步骤

1. 打开 Chrome，输入 `chrome://extensions/`
2. 开启右上角「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `translate-extension` 文件夹
5. 点击扩展图标旁的 **📌** 固定到工具栏

## 使用方法

1. 点击工具栏图标，进入「设置」标签
2. 填入你的 OpenAI API Key（从 [OpenAI Platform](https://platform.openai.com/) 获取）
3. 选择模型，点击保存
4. 在任意网页划词，自动显示翻译浮窗
5. 点击「添加到单词本」保存生词
6. 在「单词本」标签查看所有保存的单词

## 图标

扩展需要 PNG 图标。请根据 `icons/README-icons.md` 的说明获取图标。

## 获取 API Key

1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 注册账号或登录
3. 进入 [API Keys](https://platform.openai.com/api-keys) 页面
4. 创建新的 API Key 并妥善保存

## 卸载

在 `chrome://extensions/` 找到本扩展，点击「移除」

## 安全提示

- 请妥善保管你的 API Key，不要泄露给他人
- API Key 只存储在本地 Chrome Storage 中，不会上传到任何第三方
