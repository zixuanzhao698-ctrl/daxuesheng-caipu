# 🍳 大学生菜谱指南

<p align="center">
  <img src="assets/icons/favicon.svg" width="80" alt="像素风厨师图标">
</p>

<p align="center">
  <strong>🎮 像素风 · 智能匹配 · 喂饱自己 🎮</strong>
</p>

<p align="center">
  <a href="https://zixuanzhao698-ctrl.github.io/daxuesheng-caipu/"><strong>🔗 立即使用</strong></a>
  &nbsp;|&nbsp;
  <a href="#-功能"><strong>📋 功能</strong></a>
  &nbsp;|&nbsp;
  <a href="#-项目结构"><strong>📂 结构</strong></a>
</p>

---

## 📖 这是什么？

一款面向 **毕业后大学生** 的像素风格菜谱小程序。输入你手头的食材，自动匹配你能做的菜，附带完整教程、营养追踪和饮食日记。

> 🎯 核心：**不知道吃什么 → 输入食材 → 智能推荐 → 跟着做 → 记录成长**

<div align="center">

| 🥇 经典必做 | 🥈 换个口味 | 🥉 凑合能吃 |
|:---:|:---:|:---:|
| 食材刚好齐全 | 差一两样也能做 | 缺几样但可以凑合 |

</div>

---

## ✨ 功能

| 模块 | 说明 |
|------|------|
| 🔍 **智能匹配** | 输入手头食材 → 三级推荐（经典必做 / 换个口味 / 凑合能吃），47 种经典搭配加成 |
| 📖 **菜谱浏览** | 50 道菜谱（中餐 25 + 西餐 15 + 汤甜品 10），难度/时间/场景筛选 |
| 👨‍🍳 **烹饪模式** | 全屏深色模式，分步教程 + 计时器 + 小贴士 |
| 📊 **营养追踪** | 日/周/月视图，卡路里/蛋白质/碳水/脂肪环状图，热量热力图 |
| 📔 **饮食日记** | 周报/月报/年报，音乐 App 风格总结，菜品排名，花费节省统计 |
| 🛒 **采购清单** | 匹配结果一键加购，按分类（蔬菜/肉蛋/调料/主食）自动分组 |
| ❤️ **收藏 & 点赞** | 收藏最爱菜谱，点赞，记录"我做过了" |
| 🏆 **成就系统** | 游戏化徽章：初入厨房 / 厨艺小成 / 营养均衡 / 中华小当家 等 10 个 |
| 📱 **PWA** | 手机浏览器打开即用，可添加到主屏幕，支持离线访问 |
| 🔒 **隐私** | 所有数据存手机本地，不上传任何服务器 |

---

## 🎨 设计

| 元素 | 风格 |
|------|------|
| 🎨 配色 | 暖色系 — 橙 #FF6B35 / 奶油 #FFF5EE / 深棕 #5D4037 |
| 🕹️ 风格 | 像素风（星露谷物语-like），`image-rendering: pixelated` |
| ✍️ 字体 | 中文像素字体 Zpix + 英文像素字体 Press Start 2P |
| 📐 栅格 | 4px 像素栅格系统，阶梯式过渡动画 |

---

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| 🧱 架构 | 纯前端 SPA，Hash 路由，ES5 全局对象 |
| 💾 存储 | LocalStorage，无需后端 |
| 📊 图表 | Chart.js（懒加载） |
| 🔧 离线 | Service Worker，Cache-First 策略 |
| 🚀 部署 | GitHub Pages，纯静态托管 |
| 📦 依赖 | 零运行时依赖（除 Chart.js CDN） |

---

## 📂 项目结构

```
├── index.html              # 入口
├── manifest.json           # PWA 配置
├── sw.js                   # Service Worker（离线缓存）
├── css/
│   ├── variables.css       # 设计令牌（颜色/间距/字体）
│   ├── reset.css           # CSS 重置
│   ├── pixel.css           # 像素风组件（按钮/卡片/进度条）
│   ├── layout.css          # 响应式布局 + 底部导航
│   └── components.css      # 30+ 业务组件样式
├── js/
│   ├── config.js           # 全局配置
│   ├── app.js              # 应用入口 + 路由注册
│   ├── router.js           # Hash 路由
│   ├── store.js            # 状态管理 + LocalStorage 同步
│   ├── utils/
│   │   ├── storage.js      # LocalStorage 封装
│   │   ├── dom.js          # DOM 操作助手
│   │   └── format.js       # 格式化（卡路里/日期/营养）
│   ├── data/
│   │   ├── recipes-zhongcan.js   # 25 道中餐菜谱
│   │   ├── recipes-xican.js      # 15 西餐 + 10 汤甜品
│   │   ├── ingredient-synonyms.js # 75 种食材同义词
│   │   └── nutrition-base.js     # 85 种食材营养数据
│   ├── matching/
│   │   ├── matcher.js      # 智能匹配引擎
│   │   ├── scorer.js       # 加权评分器
│   │   └── classic-pairings.js   # 47 种经典搭配
│   └── modules/
│       ├── home.js         # 首页
│       ├── smart-match.js  # 智能匹配页
│       ├── browse.js       # 菜谱浏览页
│       ├── recipe-detail.js # 菜谱详情页
│       ├── cooking-mode.js  # 烹饪模式
│       ├── nutrition.js    # 营养追踪页
│       ├── diary.js        # 饮食日记页
│       ├── favorites.js    # 收藏页
│       ├── shopping-list.js # 采购清单页
│       └── settings.js     # 设置页
└── assets/
    └── icons/              # 像素风图标
```

---

## 🚀 本地运行

在项目目录下启动任意 HTTP 服务器即可：

```
# Python
python -m http.server 8080

# Node.js (npx)
npx serve .

# 然后用浏览器打开
http://localhost:8080
```

---

## 📱 添加到手机主屏幕

1. iPhone：Safari 打开 → 分享按钮 → **添加到主屏幕**
2. Android：Chrome 打开 → 右上角菜单 → **安装应用**

安装后可像原生 App 一样使用，支持离线浏览菜谱！

---

## 🔮 路线图

- [ ] 50 道菜谱的像素风配图
- [ ] 语音输入食材
- [ ] 社区菜谱分享
- [ ] 多人协作采购清单
- [ ] AI 菜谱生成

---

## 📄 许可

MIT License — 自由使用、修改、分享。

---

<p align="center">
  <sub>Made with 🍳 by 一个想喂饱自己的大学生</sub>
</p>
