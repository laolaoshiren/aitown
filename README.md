# AI智慧小镇

![访问统计](https://visitor-badge.laobi.icu/badge?page_id=ai-town-project)
![GitHub stars](https://img.shields.io/github/stars/laolaoshiren/aitown?style=social)
![GitHub forks](https://img.shields.io/github/forks/laolaoshiren/aitown?style=social)
![GitHub issues](https://img.shields.io/github/issues/laolaoshiren/aitown)
![GitHub license](https://img.shields.io/github/license/laolaoshiren/aitown)

一个基于 Node.js 和 Socket.IO 开发的实时交互式虚拟小镇，AI角色们在这里自主活动、交谈和互动。



## 功能特点

### 1. 角色系统
- 支持30多种预设职业（老师、医生、艺术家等）
- 每个角色都有独特的性格特征和表情
- 智能的对话系统，基于角色的职业和性格生成对话
- 角色名字支持自定义，自动匹配职业和性格

### 2. 场景系统
- 动态的昼夜更替（凌晨、早晨、上午、中午、下午、傍晚、晚上）
- 丰富的场景元素（建筑、树木、长椅、花坛、喷泉等）
- 天气系统（晴天、雨天、阴天）
- 动态光影效果

### 3. 互动系统
- 角色之间的自然碰撞和对话
- 基于职业和性格的个性化对话
- 对话气泡动画效果
- 角色心情系统和互动特效

### 4. 视觉效果
- 流畅的动画效果
- 精美的场景渲染
- 丰富的表情系统
- 动态的天气效果

## 安装说明

1. 确保已安装 Node.js (版本 >= 12)

2. 克隆项目并安装依赖：
```bash
git clone [[项目地址]](https://github.com/laolaoshiren/aitown.git)
cd aitown
npm install
```

3. 配置API密钥：
在 server.js 中配置你的 DeepSeek API 密钥：
```javascript
const DEEPSEEK_API_KEY = '你的API密钥';
```

4. 启动服务器：
```bash
npm start
```

5. 访问应用：
打开浏览器访问 http://localhost:3000

## 使用说明

### 添加角色
1. 在输入框中输入角色名称（可选）
2. 点击"添加角色"按钮
3. 如果不输入名称，系统会随机生成一个角色

### 角色互动
- 角色会自动在场景中移动
- 当两个角色相遇时，会自动进行对话
- 对话内容基于角色的职业、性格和当前场景生成
- 对话结束后角色会自动分开并继续移动

### 场景变化
- 场景会随着时间自动变化
- 不同时间段有不同的场景效果和互动内容
- 天气系统会随机变化，影响场景氛围

### 管理角色
- 使用"删除所有角色"按钮可以清空场景
- 新添加的角色会自动融入当前场景

## 技术栈

- 前端：HTML5 Canvas, JavaScript
- 后端：Node.js, Express
- 实时通信：Socket.IO
- AI对话：DeepSeek API

## 注意事项

- 建议使用现代浏览器（Chrome, Firefox, Safari等）
- 需要稳定的网络连接以确保AI对话功能正常
- 角色数量建议控制在合理范围内（20个以内）以保证流畅运行

## 许可证

MIT License 

## Star 历史

[![Star History Chart](https://api.star-history.com/svg?repos=laolaoshiren/aitown&type=Date)](https://star-history.com/#laolaoshiren/aitown&Date) 
