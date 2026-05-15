---
title: "OpenAI Codex CLI 完全指南"
subtitle: "命令行中的AI编程助手"
author: "基于YouTube视频整理"
source: "https://www.youtube.com/watch?v=n64Y8gr_FDY"
date: 2026-05-15
tags:
  - Codex
  - OpenAI
  - CLI
  - AI编程
  - 命令行工具
  - GitHub Copilot
type: literature-note
aliases:
  - Codex-CLI
  - OpenAI Codex
---

# OpenAI Codex CLI 完全指南

> [!abstract] 摘要
> Codex CLI 是 OpenAI 推出的命令行工具，基于强大的 Codex 模型，能够理解自然语言并生成代码、解释代码、调试问题等。它是驱动 GitHub Copilot 的底层技术，现在以独立 CLI 工具的形式提供，让开发者可以在终端中直接与 AI 交互完成编程任务。

## 核心要点

- [!] [[代码生成]] - 通过自然语言描述生成代码
- [!] [[代码解释]] - 解释代码功能和逻辑
- [!] [[Bug修复]] - 诊断并修复代码问题
- [+] [[多语言支持]] - 支持所有主流编程语言

---

## 一、什么是 Codex CLI

**OpenAI Codex CLI** 是 OpenAI 推出的命令行工具，它基于强大的 Codex 模型（基于 GPT-4 架构），能够理解自然语言并生成代码、解释代码、调试问题等。

> [!info] 关键信息
> Codex 是驱动 GitHub Copilot 的底层技术，现在以独立 CLI 工具的形式提供，让开发者可以在终端中直接与 AI 交互完成编程任务。

### 主要功能

| 功能 | 描述 |
|------|------|
| **代码生成** | 通过自然语言描述生成代码 |
| **代码解释** | 解释代码功能和逻辑 |
| **代码补全** | 智能补全代码片段 |
| **Bug 修复** | 诊断并修复代码问题 |
| **多语言支持** | 支持多种编程语言 |
| **交互式编程** | 在终端中实时对话 |
| **文件操作** | 读取、创建、编辑文件 |

---

## 二、Codex CLI 与 GitHub Copilot 对比

| 对比项 | [[Codex CLI]] | GitHub Copilot |
|--------|--------------|----------------|
| **开发者** | OpenAI | GitHub/Microsoft |
| **底层模型** | Codex (GPT-4) | Codex |
| **集成方式** | 独立 CLI 工具 | IDE/编辑器插件 |
| **使用场景** | 终端、服务器、无 GUI 环境 | 日常编码（VS Code 等） |
| **交互方式** | 命令行对话 | 实时补全、建议 |
| **部署方式** | 本地运行 | 云端+本地混合 |

---

## 三、支持的编程语言

### 后端语言
- Python, JavaScript, TypeScript
- Java, Go, Rust, C#, Ruby, PHP

### 前端语言
- HTML, CSS
- React, Vue, Angular

### 脚本语言
- Bash, PowerShell
- Python, Node.js

### 其他
- SQL, Swift, Kotlin 等

---

## 四、安装方法

### 方法1：npm 安装（推荐）

```bash
npm install -g @openai/codex
```

### 方法2：pip 安装

```bash
pip install openai-codex
```

### 方法3：源码安装

```bash
git clone https://github.com/openai/codex.git
cd codex
pip install -e .
```

### 验证安装

```bash
codex --version
```

---

## 五、基本使用方法

### 5.1 启动交互式会话

```bash
codex
```

### 5.2 单条指令模式

```bash
# 询问代码问题
codex "解释这段代码的作用" < example.py

# 生成代码
codex "创建一个 Python 函数计算斐波那契数列"

# 修复 Bug
codex "修复以下代码的错误" < buggy.py
```

### 5.3 非交互模式

```bash
echo "解释这段代码" | codex
```

### 5.4 指定模型

```bash
codex --model gpt-4 "创建一个人脸识别程序"
```

---

## 六、常用命令参考

| 命令 | 说明 |
|------|------|
| `codex --help` | 显示帮助信息 |
| `codex --version` | 显示版本 |
| `codex "指令"` | 执行单条指令 |
| `codex -i` | 交互模式 |
| `codex --model <model>` | 指定模型 |
| `codex --stream` | 流式输出模式 |

---

## 七、实际应用场景

### 7.1 代码生成

```bash
codex "创建一个 HTTP 服务器处理 GET 请求"
```

### 7.2 代码审查

```bash
codex "审查这个 Python 文件中的潜在问题" < app.py
```

### 7.3 调试

```bash
codex "找出这段代码为什么运行缓慢" < slow.py
```

### 7.4 跨语言翻译

```bash
codex "将这段 JavaScript 代码转换为 TypeScript" < input.js
```

---

## 八、使用示例

### 示例1：快速原型开发

```bash
# 创建 Flask 应用
codex "创建一个 Flask REST API，包含用户注册和登录接口"

# 创建 React 组件
codex "创建一个带分页的表格组件"
```

### 示例2：学习辅助

```bash
# 解释代码
codex "解释这个排序算法的时间复杂度" < algorithm.py

# 学习新技术
codex "用 Go 语言实现一个 HTTP 中间件"
```

### 示例3：自动化脚本

```bash
# DevOps 脚本
codex "创建一个备份数据库的 Bash 脚本"

# CI/CD
codex "创建 GitHub Actions 工作流"
```

---

## 九、思维导图

```
@Codex CLI
  ├── 功能
  │   ├── 代码生成
  │   ├── 代码解释
  │   ├── Bug修复
  │   └── 多语言支持
  ├── 安装
  │   ├── npm install -g @openai/codex
  │   └── pip install openai-codex
  ├── 使用方式
  │   ├── 交互模式 (codex)
  │   ├── 单条指令 (codex "...")
  │   └── 管道输入 (cat file | codex)
  └── 应用场景
      ├── 快速原型开发
      ├── 代码审查
      ├── 调试优化
      └── 自动化脚本
```

---

## 相关笔记

- [[GitHub Copilot使用指南]]
- [[OpenAI API使用详解]]
- [[CLI工具大全]]
- [[AI编程助手对比]]