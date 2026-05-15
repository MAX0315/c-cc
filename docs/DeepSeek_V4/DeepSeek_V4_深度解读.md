---
title: "DeepSeek V4 深度解读"
subtitle: "一个视频搞懂 DeepSeek V4"
author: "基于林亦LYi视频整理"
source: "https://www.youtube.com/watch?v=WDQjRzVcX-A"
date: 2026-04-24
tags:
  - DeepSeek
  - AI大模型
  - MoE架构
  - LLM
  - 开源
type: literature-note
aliases:
  - DeepSeek-V4
  - DeepSeek V4
---

# DeepSeek V4 深度解读

> [!abstract] 摘要
> DeepSeek V4 于 2026年4月24日 发布，包含两款模型：DeepSeek-V4-Pro（1.6万亿参数）和 DeepSeek-V4-Flash（2840亿参数）。采用混合专家（MoE）架构，支持100万token上下文窗口MIT开源许可。

## 核心要点

- [!] [[MoE架构]] - 1.6万亿总参数量，激活490亿参数
- [!] [[长上下文]] - 100万token上下文，仅需27%推理FLOPs
- [!] [[成本优势]] - 输出价格约为Claude Opus 4.7的1/7
- [+] [[开源可商用]] - MIT许可证，支持商业使用

---

## 一、发布概况

### 1.1 模型阵容

| 模型 | 总参数量 | 激活参数量 | 上下文窗口 |
|------|---------|-----------|-----------|
| **DeepSeek-V4-Pro** | 1.6万亿 (1.6T) | 490亿 (49B) | 100万 tokens |
| **DeepSeek-V4-Flash** | 2840亿 (284B) | 130亿 (13B) | 100万 tokens |

> [!info] 信息
> 两款模型均采用 **MIT 开源许可证**，支持商业使用。

---

## 二、核心架构创新

### 2.1 混合注意力架构

DeepSeek V4 设计了结合两种注意力机制的混合架构：

| 注意力类型 | 缩写 | 说明 |
|-----------|------|------|
| 压缩稀疏注意力 | [[CSA]] | 稀疏模式，减少计算量 |
| 重度压缩注意力 | [[HCA]] | 高度压缩，最大化效率 |

在100万 token 上下文场景下，V4-Pro 仅需：
- **27%** 单token推理FLOPs
- **10%** [[KV Cache]]

### 2.2 流形约束超连接

**mHC (Manifold-Constrained Hyper-Connections)**

- 强化传统残差连接
- 保持模型表达能力
- 增强跨层级信号传播稳定性

### 2.3 优化器与训练

> [!tip] 技术亮点
> - **Muon优化器**: 更快的收敛速度和更高的训练稳定性
> - **训练数据**: 超过32万亿(32T) tokens
> - **混合精度**: MoE专家使用FP4，其他使用FP8

---

## 三、主要技术特性

### 3.1 百万token上下文窗口

DeepSeek V4 支持 **100万 token** 的上下文窗口，理论上可容纳：
- 15-20部完整小说
- 500+文件的代码库
- 数年的对话历史
- 完整的法律发现文档集

### 3.2 可配置推理深度

V4 支持三种推理模式：

| 推理模式 | 特点 | 适用场景 |
|---------|------|---------|
| **Non-think** | 快速、直观、低延迟 | 简单聊天、常规任务 |
| **Think High** | 逻辑分析、中等延迟 | 复杂问题求解、规划、编程 |
| **Think Max** | 最大推理深度 | 高难度agent任务、极限逻辑 |

> [!warning] 重要
> 输出格式通过 ` [think]` 和 ` [summary]` 标签区分

---

## 四、性能表现

### 4.1 Base模型基准测试

| 基准测试 | DeepSeek-V3.2-Base | DeepSeek-V4-Flash-Base | DeepSeek-V4-Pro-Base |
|---------|-------------------|----------------------|---------------------|
| **MMLU (EM)** | 87.8 | 88.7 | **90.1** |
| **MMLU-Pro (EM)** | 65.5 | 68.3 | **73.5** |
| **GSM8K (8-shot)** | 91.1 | 90.8 | **92.6** |
| **HumanEval (Pass@1)** | 62.8 | 69.5 | **76.8** |

### 4.2 V4-Pro-Max 顶级对比

| 基准测试 | DS-V4-Pro Max | GPT-5.4 xHigh | Gemini-3.1-Pro High | Opus-4.6 Max |
|---------|--------------|--------------|-------------------|-------------|
| **LiveCodeBench** | **93.5** | — | 91.7 | 88.8 |
| **GPQA Diamond** | 90.1 | 93.0 | **94.3** | 91.3 |
| **SWE Verified** | 80.6 | — | 80.6 | **80.8** |

### 4.3 其他亮点成绩

- **编程竞赛**: [[Codeforces]] 达到 **3206分**
- **Agent任务**: GDPval-AA 基准得分 **1554**（开源第一）
- **长上下文检索**: MRCR 1M 得分 **83.5**

### 4.4 已知局限

> [!caution] 注意事项
> V4 Pro 在 **AA-Omniscience** 基准上的幻觉率为 **94%**，意味着当模型不知道答案时，几乎总是会猜测而非弃答。在需要对置信度进行校准的生产环境中需注意此特性。

---

## 五、定价与成本

### 5.1 API定价（DeepInfra）

| Token类型 | 价格（每百万tokens） |
|-----------|------|
| **输入Tokens** | $1.74 |
| **输出Tokens** | $3.48 |
| **缓存输入Tokens** | $0.145 |

### 5.2 成本对比

| 模型 | 输出价格 | 完整benchmark成本 |
|------|---------|-----------------|
| **DeepSeek V4-Pro** | $3.48/1M | $1,071 |
| **Claude Opus 4.7** | $25/1M | $4,811 |

> [!note] 成本优势
> V4-Pro输出价格约为Claude Opus 4.7的 **1/7**

---

## 六、硬件与部署

### 6.1 训练硬件

> [!example] 突破性进展
> V4报告使用 **华为昇腾910B (Huawei Ascend 910B)** 和 **寒武纪MLU (Cambricon MLU)** 芯片训练，未使用Nvidia硬件。这展示了在受出口限制情况下中国AI公司的技术突破。

### 6.2 本地运行硬件需求

| 配置 | 硬件要求 |
|-----|---------|
| FP16/BF16 全精度 | 多节点GPU集群 |
| INT8 量化 | 2x RTX 4090 (共48GB VRAM) |
| INT4 量化 | 1x RTX 5090 (32GB VRAM) |

---

## 七、与前代对比

| 规格 | DeepSeek V3 | DeepSeek V4 |
|-----|-----------|------------|
| **总参数量** | 671B | ~1T (1.6T for Pro) |
| **激活参数** | ~37B | ~37B/49B |
| **架构** | [[MoE]] | MoE |
| **上下文窗口** | 128K | 1M |
| **训练硬件** | Nvidia H800 | 华为昇腾/寒武纪 |
| **许可证** | 自定义 | MIT |

---

## 八、操作步骤与使用指南

### 8.1 API接入步骤

1. **选择提供商**: DeepInfra、SiliconFlow或其他支持供应商
2. **获取API密钥**: 在选定的服务商平台注册并获取密钥
3. **配置请求**: 设置适当的模型版本（Pro/Flash）
4. **设置推理模式**: 根据任务选择Non-think/Think High/Think Max
5. **处理响应**: 解析 ` [think]` 和 ` [summary]` 标签

### 8.2 本地部署步骤

**对于INT4量化版本（单卡RTX 5090）:**

1. **下载模型权重**: 从Hugging Face获取DeepSeek-V4-Flash
2. **安装推理框架**: 推荐使用llama.cpp或vLLM
3. **配置量化参数**: 设置INT4量化模式
4. **启动服务**: 运行本地推理服务器
5. **测试验证**: 使用基准测试验证性能

### 8.3 应用场景选择

| 场景 | 推荐模型 | 推理模式 |
|-----|---------|---------|
| 简单问答 | V4-Flash | Non-think |
| 代码生成 | V4-Pro | Think High |
| 复杂Agent任务 | V4-Pro | Think Max |
| 长文档分析 | V4-Pro | Think High |
| 实时聊天 | V4-Flash | Non-think |

---

## 九、关键概念速查

### 9.1 缩写解释

| 缩写 | 全称 | 说明 |
|------|------|------|
| [[MoE]] | Mixture of Experts | 混合专家架构 |
| [[CSA]] | Compressed Sparse Attention | 压缩稀疏注意力 |
| [[HCA]] | Heavily Compressed Attention | 重度压缩注意力 |
| [[mHC]] | Manifold-Constrained Hyper-Connections | 流形约束超连接 |
| [[KV Cache]] | Key-Value Cache | 键值缓存 |

### 9.2 相关资源

- **官网**: [[DeepSeek官网]]
- **模型下载**: [[Hugging Face - DeepSeek-V4-Pro]]
- **技术报告**: [[DeepSeek V4 Technical Report]]
- **API文档**: [[DeepInfra API]]

---

## 十、思维导图

```
@DeepSeek V4
  ├── 架构创新
  │   ├── 混合注意力 (CSA + HCA)
  │   ├── 流形约束超连接 (mHC)
  │   ├── Muon优化器
  │   └── 混合精度训练 (FP4 + FP8)
  ├── 核心能力
  │   ├── 100万token上下文
  │   ├── 可配置推理深度
  │   └── MoE高效推理
  ├── 性能表现
  │   ├── MMLU 90.1%
  │   ├── SWE-bench 80.6%
  │   └── Codeforces 3206
  └── 应用生态
      ├── MIT开源许可
      ├── API定价 $3.48/1M
      └── 本地部署支持
```

---

## 相关笔记

- [[LLM大模型对比]]
- [[MoE架构详解]]
- [[长上下文处理技术]]
- [[开源大模型列表]]