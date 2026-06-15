---
title: 沉浸式编辑模式设计
date: 2026-06-15
status: approved
---

# 沉浸式编辑模式设计

## 概述

为 admin 页面的文章编辑器添加完整的沉浸式模式，保留所有编辑功能（工具栏、预览、发布等），通过隐藏非必要元素创造专注的写作环境。

## 当前状态

- 已有沉浸式模式按钮 (`src/app/admin/page.tsx:1343-1350`)
- 已有 `isImmersiveMode` 状态管理 (`line 513`)
- 按钮已连接到状态切换，但缺少实际的全屏 UI 实现

## 设计方案

### 实现策略

利用现有编辑器组件，通过条件渲染实现沉浸式模式：

1. **复用现有编辑器代码**：工具栏、文本区域、预览面板都已经存在
2. **添加全屏容器**：当 `isImmersiveMode === true` 时渲染独立的全屏组件
3. **隐藏非必要元素**：侧边栏、顶部导航、元数据表单字段

### UI 结构

```
全屏容器 (fixed inset-0 z-50 bg-black)
├── 关闭按钮 (右上角，带 ESC 快捷键提示)
├── 编辑器容器 (与现有编辑器相同的结构)
│   ├── 工具栏 (包含 Markdown 工具 + 清除 + 发布)
│   ├── 双栏布局
│   │   ├── 左：源码编辑器
│   │   └── 右：实时预览
```

### 保留的功能

- ✅ Markdown 工具栏（B/I/H2/H3/Quote/Link/Image/Code/List/Block）
- ✅ 实时预览面板
- ✅ 清除按钮
- ✅ 发布按钮
- ✅ 内容同步（与主编辑器共享 `postData.content` 状态）

### 隐藏的元素

- ❌ 侧边栏 (sidebar)
- ❌ 顶部标题和导航
- ❌ 元数据输入框（标题、日期、别名、分类、描述、封面）
- ❌ 上传按钮（简化操作）

### 交互行为

1. **进入沉浸式模式**：点击编辑器工具栏右侧的 "沉浸式" 按钮
2. **编辑内容**：正常使用 Markdown 工具和实时预览
3. **退出方式**：
   - 点击右上角 X 按钮
   - 按 ESC 键
   - 点击发布后自动退出
4. **内容同步**：沉浸式模式与普通模式共享同一个 `postData.content` 状态

### 视觉设计

- **背景**：纯黑色 `bg-black`
- **工具栏**：保持现有样式 `bg-neutral-900/40 border-neutral-900`
- **编辑器**：保持现有样式 `bg-neutral-950 text-neutral-300`
- **关闭按钮**：悬浮在右上角，半透明背景 + 白色图标
- **动画**：淡入淡出 `animate-in fade-in duration-300`

## 技术实现

### 组件结构

```tsx
{isImmersiveMode && (
  <div className="fixed inset-0 z-50 bg-black">
    {/* 关闭按钮 */}
    <button onClick={exitImmersive} className="absolute top-4 right-4 ...">
      <FiX /> ESC
    </button>
    
    {/* 复用现有编辑器结构 */}
    <div className="h-full flex flex-col">
      {/* 工具栏 */}
      <div className="flex items-center gap-1 border-b ...">
        {/* Markdown 工具按钮 */}
        {/* 清除按钮 */}
        {/* 发布按钮 */}
      </div>
      
      {/* 双栏布局 */}
      <div className="flex-1 grid grid-cols-2">
        <div>{/* 源码编辑器 */}</div>
        <div>{/* 预览面板 */}</div>
      </div>
    </div>
  </div>
)}
```

### 状态管理

- 使用现有的 `isImmersiveMode` 状态
- 共享 `postData.content` 和 `postContentRef`
- 添加 ESC 键监听器（`useEffect` + `keydown` 事件）

### 代码位置

修改文件：`src/app/admin/page.tsx`

添加内容：
1. ESC 键监听逻辑（在组件内添加 `useEffect`）
2. 沉浸式模式全屏组件（在 `return` 语句前添加条件渲染）

## 成功标准

- [ ] 点击沉浸式按钮可以进入全屏编辑模式
- [ ] 工具栏、预览、发布按钮在沉浸式模式中正常工作
- [ ] 按 ESC 或点击关闭按钮可以退出沉浸式模式
- [ ] 在沉浸式模式中编辑的内容与普通模式同步
- [ ] 发布后自动退出沉浸式模式并返回列表视图

## 未来扩展（可选）

- 支持自动保存草稿
- 添加字数统计显示
- 支持全屏预览模式（隐藏编辑器只看预览）
- 添加快捷键说明面板
