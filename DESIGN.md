---
version: alpha
name: 我的账本
description: 记账小程序的浅色磨砂玻璃设计系统，强调克制的动效与清晰的数字层级。
colors:
  background: "#f2f4f9"
  background-wash-blue: "rgba(158, 196, 255, 0.42)"
  background-wash-warm: "rgba(255, 196, 214, 0.34)"
  background-wash-mint: "rgba(150, 226, 205, 0.42)"
  surface-glass: "rgba(255, 255, 255, 0.72)"
  surface-glass-strong: "rgba(255, 255, 255, 0.86)"
  border-glass: "rgba(255, 255, 255, 0.92)"
  border-hairline: "rgba(20, 23, 31, 0.06)"
  foreground-primary: "#14171f"
  foreground-secondary: "#5a6272"
  foreground-tertiary: "#9aa2b2"
  accent: "#4f6ef7"
  accent-press: "#3f5ae0"
  accent-soft: "rgba(79, 110, 247, 0.10)"
  income: "#10b981"
  expense: "#ef4444"
  danger-soft: "rgba(239, 68, 68, 0.09)"
typography:
  sans:
    fontFamily: -apple-system, "PingFang SC", "Helvetica Neue", sans-serif
  display:
    fontFamily: -apple-system, "PingFang SC", "Helvetica Neue", sans-serif
    fontSize: 76rpx
    lineHeight: 1.2
    fontWeight: 600
  title:
    fontFamily: -apple-system, "PingFang SC", "Helvetica Neue", sans-serif
    fontSize: 32rpx
    lineHeight: 1.4
    fontWeight: 600
  body:
    fontFamily: -apple-system, "PingFang SC", "Helvetica Neue", sans-serif
    fontSize: 28rpx
    lineHeight: 1.5
    fontWeight: 400
  caption:
    fontFamily: -apple-system, "PingFang SC", "Helvetica Neue", sans-serif
    fontSize: 22rpx
    lineHeight: 1.4
    fontWeight: 400
rounded:
  sm: 16rpx
  md: 24rpx
  lg: 32rpx
  xl: 40rpx
spacing:
  s-1: 8rpx
  s-2: 16rpx
  s-3: 24rpx
  s-4: 32rpx
  s-5: 48rpx
components:
  card:
    backgroundColor: "{colors.surface-glass}"
    borderColor: "{colors.border-glass}"
    rounded: "{rounded.lg}"
  card-strong:
    backgroundColor: "{colors.surface-glass-strong}"
    borderColor: "{colors.border-glass}"
    rounded: "{rounded.lg}"
---

## Overview

记账小程序的界面设计系统。产品目的是让个人快速记录日常收支，并让"钱去哪了"一眼可见。

设计方向是浅色磨砂玻璃：底色为浅灰，叠加三层低饱和色晕，卡片以半透明白加背景模糊悬浮其上。之所以保留色晕，是因为玻璃层需要有可折射的内容，纯色底会让磨砂质感发灰、失去层次。

视觉克制是这套系统的核心约束：全局仅一个强调色，不使用装饰性渐变，不使用发光作为交互提示。收支语义色是唯一的例外，因为它们承载信息而非装饰。

## Colors

`accent` 是全局唯一强调色，用于主要动作（保存、记一笔）、当前选中态与 tabBar 激活项。同一个视图内不引入第二个强调色。

`income` 与 `expense` 是语义色，只用于金额与类型标识，不可用作装饰或强调。

`surface-glass` 用于常规卡片，`surface-glass-strong` 用于需要更高可读性的浮动层（导航栏、tabBar）。两者都必须搭配 `backdrop-filter`，否则会退化为普通半透明块。

`border-hairline` 用于卡片内部的分隔线，`border-glass` 只用于玻璃卡片的边缘。

## Typography

`display` 用于金额等核心数字，`title` 用于导航标题与区块标题，`body` 用于正文与列表项，`caption` 用于辅助说明与单位。

所有数字必须使用等宽数字（`font-variant-numeric: tabular-nums`），否则滚动更新时数字宽度会跳动。

不调整字间距。默认字距已符合中文排版需求，额外调整会破坏可读性。

## Elevation & Depth

深度只由两级阴影表达：卡片级与浮动级。不使用发光、描边加粗或色彩明度来制造层级。

玻璃卡片依赖 `backdrop-filter` 与背景色晕共同建立层次，因此色晕属于结构性元素，不可移除。

## Shapes

圆角分四档，卡片统一使用 `lg`，内部小元素使用 `sm`，浮动层使用 `xl`。不要引入四档之外的圆角值。

## Components

玻璃卡片：半透明白底、1rpx 浅色描边、圆角 `lg`，顶部有一条静态高光。高光不参与动画。

交互元素：所有可点击元素按下时缩放到 0.96–0.98，过渡时长不超过 120ms。禁用态使用中性灰底与三级文字色，且不响应按压。

顶部导航：置顶时没有底条，标题以「大标题」形态浮在页面背景上；滚动后玻璃底淡入、标题收拢回 `title` 字号。两段变化都只驱动 `transform` / `opacity`——标题用 `scale` 而非改 `font-size`，避免触发重排。标题左对齐，与卡片内容的左边线对齐；带返回键的页面用 `has-back` 给标题让位。

底部导航：胶囊容器（全圆角玻璃）+ 独立的圆形主操作按钮。选中底是实心 `accent` 胶囊 + 白色图标文字，由滑块承载，切换时横向平移过去——只动 `transform` / `opacity`。滑块占满一个槽位、按槽位位移；可见的胶囊比槽位窄、贴合内容，槽位本身仍是完整的点击热区。文字换色带 120ms 延迟，等滑块盖过来才切，避免白字短暂压在浅色玻璃上。主操作（记一笔）与导航分离，不放进胶囊里当普通项，以保证它始终是视觉上的第一动作。

进度条：使用 `transform: scaleX()` 驱动，不使用 `width`，以保证动画停留在合成层。

空状态：必须包含图标、一句说明和一个明确的下一步动作按钮。不出现没有出口的空状态。

## Do's and Don'ts

- 动画只驱动 `transform` 与 `opacity`。不要动画 `width`、`height`、`top`、`left`。
- 入场动画统一使用 `ease-out`，时长不超过 300ms；交互反馈不超过 200ms。
- 必须尊重"减弱动态效果"：该开关开启时，所有入场动画与按压过渡一并关闭。
- 不要使用装饰性渐变、彩色渐变，或用发光作为主要交互提示。
- 不要动画玻璃层或大面积 `blur()` 表面。
- 不要新增强调色。需要区分时，优先用字重、透明度或间距。
