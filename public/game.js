const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameContainer = document.getElementById('gameContainer');

let characters = new Map();

// 职业列表
const PROFESSIONS = [
    { name: "老师", emoji: "👨‍🏫", personality: "严谨认真" },
    { name: "医生", emoji: "👩‍⚕️", personality: "温柔体贴" },
    { name: "厨师", emoji: "👨‍🍳", personality: "热情开朗" },
    { name: "警察", emoji: "👮", personality: "正直威严" },
    { name: "艺术家", emoji: "👩‍🎨", personality: "浪漫文艺" },
    { name: "程序员", emoji: "👨‍💻", personality: "理性专注" },
    { name: "运动员", emoji: "🏃‍♂️", personality: "阳光活力" },
    { name: "科学家", emoji: "🧑‍🔬", personality: "求知好奇" },
    { name: "商人", emoji: "👨‍💼", personality: "精明能干" },
    { name: "学生", emoji: "👧", personality: "活泼可爱" },
    { name: "作家", emoji: "✍️", personality: "文采斐然" },
    { name: "歌手", emoji: "🎤", personality: "热情洋溢" },
    { name: "舞者", emoji: "💃", personality: "优雅灵动" },
    { name: "主播", emoji: "🎙️", personality: "活力四射" },
    { name: "摄影师", emoji: "📸", personality: "细致耐心" },
    { name: "魔术师", emoji: "🎩", personality: "神秘有趣" },
    { name: "园丁", emoji: "🌺", personality: "心灵手巧" },
    { name: "宇航员", emoji: "👨‍🚀", personality: "勇敢探索" },
    { name: "调酒师", emoji: "🍸", personality: "品味独特" },
    { name: "糕点师", emoji: "🧁", personality: "甜美可人" },
    { name: "建筑师", emoji: "👷", personality: "创意无限" },
    { name: "导游", emoji: "🧭", personality: "见多识广" },
    { name: "动画师", emoji: "🎨", personality: "想象丰富" },
    { name: "咖啡师", emoji: "☕", personality: "专注细致" },
    { name: "占星师", emoji: "🔮", personality: "神秘莫测" },
    { name: "侦探", emoji: "🔍", personality: "敏锐机智" },
    { name: "机器人", emoji: "🤖", personality: "逻辑严密" },
    { name: "飞行员", emoji: "✈️", personality: "沉着冷静" },
    { name: "游戏师", emoji: "🎮", personality: "趣味横生" },
    { name: "花艺师", emoji: "💐", personality: "浪漫优雅" }
];

// 姓氏列表
const SURNAMES = ["王", "李", "张", "刘", "陈", "杨", "黄", "赵", "吴", "周"];

// 男性名字
const MALE_NAMES = ["明", "强", "伟", "军", "华", "建", "文", "杰", "峰", "磊"];

// 女性名字
const FEMALE_NAMES = ["芳", "娟", "敏", "静", "燕", "红", "梅", "莉", "华", "琴"];

// 网格配置
const GRID_SIZE = 40; // 网格大小

// 生成随机角色
function generateCharacter() {
    const profession = PROFESSIONS[Math.floor(Math.random() * PROFESSIONS.length)];
    const surname = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
    const gender = Math.random() < 0.5 ? "男" : "女";
    const firstName = gender === "男" 
        ? MALE_NAMES[Math.floor(Math.random() * MALE_NAMES.length)]
        : FEMALE_NAMES[Math.floor(Math.random() * FEMALE_NAMES.length)];
    
    return {
        name: profession.name + surname + firstName,
        profession: profession.name,
        emoji: profession.emoji,
        personality: profession.personality,
        gender: gender
    };
}

// 根据名字获取角色信息
function getCharacterInfo(name) {
    // 从名字中提取职业信息
    const profession = PROFESSIONS.find(p => name.includes(p.name));
    const gender = name.length === 3 ? "男" : "女"; // 三个字的假设为男性
    
    if (profession) {
        // 如果名字中包含已知职业，使用对应的表情和性格
        return {
            name: name,
            profession: profession.name,
            emoji: profession.emoji,
            personality: profession.personality,
            gender: gender
        };
    }

    // 如果名字中没有已知职业，随机选择一个表情，保持原始名字不变
    const randomEmoji = PROFESSIONS[Math.floor(Math.random() * PROFESSIONS.length)].emoji;
    return {
        name: name,
        profession: null,
        emoji: randomEmoji,
        personality: "性格随和",
        gender: gender
    };
}

// 根据角色名字获取合适的表情
function getCharacterEmoji(name) {
    // 根据职业选择表情
    for (const profession of PROFESSIONS) {
        if (name.includes(profession.name)) {
            return profession.emoji;
        }
    }
    return '🧑'; // 默认表情
}

// 自适应画布大小
function resizeCanvas() {
    const container = gameContainer.getBoundingClientRect();
    canvas.width = Math.floor(container.width / GRID_SIZE) * GRID_SIZE;
    canvas.height = Math.floor(container.height / GRID_SIZE) * GRID_SIZE;
    
    // 调整所有角色的位置到最近的网格点
    characters.forEach(char => {
        char.x = Math.round(char.x / GRID_SIZE) * GRID_SIZE + GRID_SIZE/2;
        char.y = Math.round(char.y / GRID_SIZE) * GRID_SIZE + GRID_SIZE/2;
        if (char.targetX) {
            char.targetX = Math.round(char.targetX / GRID_SIZE) * GRID_SIZE + GRID_SIZE/2;
            char.targetY = Math.round(char.targetY / GRID_SIZE) * GRID_SIZE + GRID_SIZE/2;
        }
    });
}

// 绘制网格背景
function drawGrid() {
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 1;

    // 绘制垂直线
    for (let x = 0; x <= canvas.width; x += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    // 绘制水平线
    for (let y = 0; y <= canvas.height; y += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// 监听窗口大小变化
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // 初始化画布大小

// 表情库
const EMOJIS = {
    default: '😊',
    talking: '🗣️',
    listening: '👂',
    walking: ['🚶', '🚶‍♂️', '🚶‍♀️'],
    thinking: '🤔',
    happy: ['😄', '😊', '🥰', '😎'],
    neutral: ['🙂', '😐', '😌'],
    professional: ['👨‍⚕️', '👩‍⚕️', '👨‍🏫', '👩‍🏫', '👨‍💼', '👩‍💼']
};

// 场景元素配置
const SCENE_ELEMENTS = {
    "凌晨": {
        background: "#1a1a2e",
        elements: [
            { type: "月亮", color: "#fff5cc", size: 40 },
            { type: "星星", color: "#ffffff", count: 50 },
            { type: "路灯", color: "#ffeb3b", count: 8 },
            { type: "建筑", color: "#333333", count: 5, type: "住宅" },
            { type: "猫咪", color: "#666666", count: 2 }
        ],
        ambientLight: 0.3
    },
    "早晨": {
        background: "#87ceeb",
        elements: [
            { type: "太阳", color: "#ffd700", size: 60 },
            { type: "云朵", color: "#ffffff", count: 3 },
            { type: "鸟", color: "#000000", count: 8 },
            { type: "建筑", color: "#795548", count: 4, type: "商店" },
            { type: "树木", color: "#2e7d32", count: 6 },
            { type: "花朵", color: "#e91e63", count: 10 }
        ],
        ambientLight: 0.8
    },
    "上午": {
        background: "#b3e0ff",
        elements: [
            { type: "太阳", color: "#fff700", size: 50 },
            { type: "云朵", color: "#ffffff", count: 4 },
            { type: "树木", color: "#228B22", count: 8 },
            { type: "建筑", color: "#795548", count: 6, type: "办公楼" },
            { type: "长椅", color: "#4e342e", count: 4 },
            { type: "花坛", color: "#8bc34a", count: 3 }
        ],
        ambientLight: 1
    },
    "中午": {
        background: "#4a90e2",
        elements: [
            { type: "太阳", color: "#ffd700", size: 70 },
            { type: "云朵", color: "#ffffff", count: 2 },
            { type: "遮阳伞", color: "#ff9800", count: 5 },
            { type: "建筑", color: "#795548", count: 5, type: "餐厅" },
            { type: "树荫", color: "#1b5e20", count: 6 },
            { type: "喷泉", color: "#03a9f4", count: 2 }
        ],
        ambientLight: 1
    },
    "下午": {
        background: "#6fa8dc",
        elements: [
            { type: "太阳", color: "#ffb74d", size: 55 },
            { type: "云朵", color: "#fff8e1", count: 4 },
            { type: "树影", color: "#2e7d32", count: 6 },
            { type: "建筑", color: "#795548", count: 5, type: "学校" },
            { type: "长椅", color: "#4e342e", count: 5 },
            { type: "自行车", color: "#f57f17", count: 3 }
        ],
        ambientLight: 0.9
    },
    "傍晚": {
        background: "#ff7043",
        elements: [
            { type: "夕阳", color: "#ff5722", size: 60 },
            { type: "云朵", color: "#ffccbc", count: 5 },
            { type: "飞鸟", color: "#000000", count: 12 },
            { type: "建筑", color: "#795548", count: 4, type: "商店" },
            { type: "路灯", color: "#ffeb3b", count: 6 },
            { type: "长椅", color: "#4e342e", count: 4 }
        ],
        ambientLight: 0.7
    },
    "晚上": {
        background: "#1a237e",
        elements: [
            { type: "月亮", color: "#fff8e1", size: 45 },
            { type: "星星", color: "#ffffff", count: 60 },
            { type: "路灯", color: "#ffeb3b", count: 10 },
            { type: "建筑", color: "#333333", count: 5, type: "住宅" },
            { type: "猫咪", color: "#666666", count: 3 },
            { type: "霓虹灯", color: "#e91e63", count: 4 }
        ],
        ambientLight: 0.4
    }
};

// 天气效果配置
const WEATHER_EFFECTS = {
    "晴天": {
        particles: [],
        filter: "brightness(1.1)",
        ambientLight: 1
    },
    "雨天": {
        particles: { type: "雨滴", color: "#ffffff", count: 100, speed: 5 },
        filter: "brightness(0.9)",
        ambientLight: 0.7
    },
    "阴天": {
        particles: [],
        filter: "brightness(0.8)",
        ambientLight: 0.6
    }
};

// 添加心情系统
const MOODS = {
    happy: {
        emojis: ['😄', '😊', '🥰', '😎', '🤗'],
        effects: ['❤️', '✨', '🌟'],
        colors: ['#ff69b4', '#ff1493', '#ff0000']
    },
    excited: {
        emojis: ['🤩', '🎉', '🎊', '🎈', '🎨'],
        effects: ['🎵', '🎶', '⭐'],
        colors: ['#ffd700', '#ffa500', '#ff4500']
    },
    friendly: {
        emojis: ['🤝', '👋', '🙌', '👍', '🌺'],
        effects: ['💫', '🌸', '🍀'],
        colors: ['#98fb98', '#90ee90', '#32cd32']
    }
};

// 场景特效类
class SceneEffect {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.particles = [];
        this.currentScene = null;
        this.currentWeather = null;
        this.lastUpdate = Date.now();
    }

    // 更新场景
    updateScene() {
        const hour = new Date().getHours();
        let timeContext = "";
        if (hour < 6) timeContext = "凌晨";
        else if (hour < 9) timeContext = "早晨";
        else if (hour < 12) timeContext = "上午";
        else if (hour < 14) timeContext = "中午";
        else if (hour < 17) timeContext = "下午";
        else if (hour < 19) timeContext = "傍晨";
        else timeContext = "晚上";

        const weathers = ["晴天", "雨天", "阴天"];
        const weather = weathers[Math.floor(Math.random() * weathers.length)];

        this.currentScene = SCENE_ELEMENTS[timeContext];
        this.currentWeather = WEATHER_EFFECTS[weather];
        
        // 初始化天气粒子
        if (this.currentWeather.particles.type) {
            this.initializeParticles();
        }
    }

    // 初始化粒子效果
    initializeParticles() {
        this.particles = [];
        const config = this.currentWeather.particles;
        
        for (let i = 0; i < config.count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                speed: config.speed,
                size: Math.random() * 2 + 1
            });
        }
    }

    // 绘制场景
    draw() {
        if (!this.currentScene) this.updateScene();

        // 绘制背景
        this.ctx.fillStyle = this.currentScene.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制场景元素
        this.currentScene.elements.forEach(element => {
            switch (element.type) {
                case "月亮":
                case "太阳":
                case "夕阳":
                    this.drawCelestialBody(element);
                    break;
                case "星星":
                    this.drawStars(element);
                    break;
                case "云朵":
                    this.drawClouds(element);
                    break;
                case "路灯":
                    this.drawLamps(element);
                    break;
                case "树木":
                case "树影":
                    this.drawTrees(element);
                    break;
                case "建筑":
                    this.drawBuildings(element);
                    break;
                case "长椅":
                    this.drawBenches(element);
                    break;
                case "花坛":
                    this.drawFlowerBeds(element);
                    break;
                case "喷泉":
                    this.drawFountains(element);
                    break;
                case "霓虹灯":
                    this.drawNeonLights(element);
                    break;
            }
        });

        // 绘制天气效果
        if (this.currentWeather.particles.type === "雨滴") {
            this.drawRain();
        }

        // 应用滤镜效果
        this.ctx.filter = this.currentWeather.filter;
    }

    // 绘制天体（太阳/月亮）
    drawCelestialBody(element) {
        this.ctx.beginPath();
        this.ctx.fillStyle = element.color;
        this.ctx.arc(
            this.canvas.width * 0.8,
            this.canvas.height * 0.2,
            element.size,
            0,
            Math.PI * 2
        );
        this.ctx.fill();

        // 添加光晕效果
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width * 0.8,
            this.canvas.height * 0.2,
            element.size,
            this.canvas.width * 0.8,
            this.canvas.height * 0.2,
            element.size * 2
        );
        gradient.addColorStop(0, element.color + "66");
        gradient.addColorStop(1, "transparent");
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
    }

    // 绘制星星
    drawStars(element) {
        for (let i = 0; i < element.count; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height * 0.7;
            const size = Math.random() * 2 + 1;

            this.ctx.fillStyle = element.color;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();

            // 添加闪烁效果
            if (Math.random() > 0.5) {
                this.ctx.fillStyle = element.color + "88";
                this.ctx.beginPath();
                this.ctx.arc(x, y, size * 1.5, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }

    // 绘制云朵
    drawClouds(element) {
        for (let i = 0; i < element.count; i++) {
            const x = (this.canvas.width * (i + 1)) / (element.count + 1);
            const y = this.canvas.height * 0.2 + Math.random() * 50;
            const size = 30 + Math.random() * 20;

            this.ctx.fillStyle = element.color;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.arc(x - size * 0.5, y, size * 0.6, 0, Math.PI * 2);
            this.ctx.arc(x + size * 0.5, y, size * 0.6, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    // 绘制路灯
    drawLamps(element) {
        for (let i = 0; i < element.count; i++) {
            const x = (this.canvas.width * (i + 1)) / (element.count + 1);
            const y = this.canvas.height * 0.7;

            // 绘制灯柱
            this.ctx.strokeStyle = "#666666";
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x, y - 80);
            this.ctx.stroke();

            // 绘制灯光
            const gradient = this.ctx.createRadialGradient(
                x, y - 80,
                5,
                x, y - 80,
                50
            );
            gradient.addColorStop(0, element.color);
            gradient.addColorStop(1, "transparent");
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(x, y - 80, 50, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    // 绘制树木
    drawTrees(element) {
        for (let i = 0; i < element.count; i++) {
            const x = (this.canvas.width * (i + 1)) / (element.count + 1);
            const y = this.canvas.height * 0.8;
            const size = 30 + Math.random() * 20;

            // 绘制树干
            this.ctx.fillStyle = "#5D4037";
            this.ctx.fillRect(x - 5, y - size * 2, 10, size * 2);

            // 绘制树冠
            this.ctx.fillStyle = element.color;
            this.ctx.beginPath();
            this.ctx.arc(x, y - size * 2, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    // 绘制建筑物
    drawBuildings(element) {
        for (let i = 0; i < element.count; i++) {
            const x = (this.canvas.width * (i + 1)) / (element.count + 1);
            const y = this.canvas.height * 0.6;
            const width = 60 + Math.random() * 40;
            const height = 100 + Math.random() * 80;

            // 绘制主体
            this.ctx.fillStyle = element.color;
            this.ctx.fillRect(x - width/2, y - height, width, height);

            // 绘制窗户
            this.ctx.fillStyle = this.currentScene.background === "#1a237e" ? "#fff5" : "#0005";
            const windowRows = 5;
            const windowCols = 3;
            const windowWidth = width / (windowCols + 1);
            const windowHeight = height / (windowRows + 1);

            for (let row = 0; row < windowRows; row++) {
                for (let col = 0; col < windowCols; col++) {
                    this.ctx.fillRect(
                        x - width/2 + (col + 1) * (width/(windowCols + 1)) - windowWidth/2,
                        y - height + (row + 1) * (height/(windowRows + 1)) - windowHeight/2,
                        windowWidth * 0.8,
                        windowHeight * 0.8
                    );
                }
            }
        }
    }

    // 绘制长椅
    drawBenches(element) {
        for (let i = 0; i < element.count; i++) {
            const x = (this.canvas.width * (i + 1)) / (element.count + 1);
            const y = this.canvas.height * 0.75;
            
            // 绘制椅面
            this.ctx.fillStyle = element.color;
            this.ctx.fillRect(x - 30, y - 10, 60, 5);
            
            // 绘制椅背
            this.ctx.fillRect(x - 30, y - 25, 60, 5);
            
            // 绘制支腿
            this.ctx.fillRect(x - 25, y - 10, 5, 15);
            this.ctx.fillRect(x + 20, y - 10, 5, 15);
        }
    }

    // 绘制花坛
    drawFlowerBeds(element) {
        for (let i = 0; i < element.count; i++) {
            const x = (this.canvas.width * (i + 1)) / (element.count + 1);
            const y = this.canvas.height * 0.8;
            
            // 绘制花坛底座
            this.ctx.fillStyle = "#795548";
            this.ctx.fillRect(x - 40, y - 15, 80, 15);
            
            // 绘制花朵
            const flowerColors = ["#e91e63", "#f44336", "#9c27b0", "#ffeb3b"];
            for (let j = 0; j < 6; j++) {
                const flowerX = x - 30 + j * 12;
                const flowerY = y - 20;
                this.ctx.fillStyle = flowerColors[Math.floor(Math.random() * flowerColors.length)];
                this.ctx.beginPath();
                this.ctx.arc(flowerX, flowerY, 5, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }

    // 绘制喷泉
    drawFountains(element) {
        for (let i = 0; i < element.count; i++) {
            const x = (this.canvas.width * (i + 1)) / (element.count + 1);
            const y = this.canvas.height * 0.7;
            
            // 绘制底座
            this.ctx.fillStyle = "#607d8b";
            this.ctx.beginPath();
            this.ctx.ellipse(x, y, 30, 15, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 绘制水柱
            this.ctx.fillStyle = element.color + "88";
            for (let j = 0; j < 5; j++) {
                const angle = (j / 5) * Math.PI * 2 + Date.now() / 1000;
                const height = 20 + Math.sin(angle) * 5;
                this.ctx.beginPath();
                this.ctx.moveTo(x, y - 10);
                this.ctx.quadraticCurveTo(
                    x + Math.cos(angle) * 20,
                    y - height - 20,
                    x + Math.cos(angle) * 40,
                    y - 10
                );
                this.ctx.stroke();
            }
        }
    }

    // 绘制霓虹灯
    drawNeonLights(element) {
        for (let i = 0; i < element.count; i++) {
            const x = (this.canvas.width * (i + 1)) / (element.count + 1);
            const y = this.canvas.height * 0.5;
            const colors = ["#e91e63", "#2196f3", "#ffeb3b", "#4caf50"];
            const color = colors[i % colors.length];
            
            // 绘制霓虹灯管
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(x - 20, y);
            this.ctx.lineTo(x + 20, y);
            this.ctx.stroke();
            
            // 绘制光晕效果
            const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, 20);
            gradient.addColorStop(0, color + "88");
            gradient.addColorStop(1, "transparent");
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(x - 20, y - 20, 40, 40);
        }
    }

    // 绘制雨滴
    drawRain() {
        this.ctx.strokeStyle = this.currentWeather.particles.color;
        this.ctx.lineWidth = 1;

        this.particles.forEach(particle => {
            this.ctx.beginPath();
            this.ctx.moveTo(particle.x, particle.y);
            this.ctx.lineTo(
                particle.x - particle.speed,
                particle.y + particle.speed * 2
            );
            this.ctx.stroke();

            particle.x -= particle.speed;
            particle.y += particle.speed * 2;

            if (particle.y > this.canvas.height) {
                particle.y = 0;
                particle.x = Math.random() * this.canvas.width;
            }
        });
    }

    // 更新场景
    update() {
        const now = Date.now();
        if (now - this.lastUpdate > 1800000) { // 每30分钟更新一次场景
            this.updateScene();
            this.lastUpdate = now;
        }
    }
}

// 角色类
class Character {
    constructor(name, x, y, id) {
        this.id = id;
        const characterInfo = name ? getCharacterInfo(name) : generateCharacter();
        this.name = characterInfo.name;
        this.profession = characterInfo.profession;
        this.emoji = characterInfo.emoji;
        this.personality = characterInfo.personality;
        this.gender = characterInfo.gender;
        
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.speed = 1;
        this.isInConversation = false;
        this.waitingToSpeak = false;
        this.dialogueElement = null;
        this.size = 40;
        this.conversation = '';
        this.conversationTimeout = null;
        this.currentTextIndex = 0;
        this.fullText = '';
        this.nextSpeechCallback = null;
        this.talkingWith = null;
        this.originalPosition = null;
        this.conversationPosition = null;
        this.baseEmoji = getCharacterEmoji(this.name);
        this.currentEmoji = this.baseEmoji;
        this.movementTimer = null;
        this.isMoving = false;
        this.lastInteractionTime = null;
        
        // 创建角色专属的对话气泡
        this.speechBubble = document.createElement('div');
        this.speechBubble.className = 'speech-bubble';
        gameContainer.appendChild(this.speechBubble);
        
        this.setNewTarget();
        
        this.mood = 'neutral';
        this.moodLevel = 0;
        this.effects = [];
        this.lastMoodChange = Date.now();
        this.interactionCount = 0;
        this.friends = new Set();
    }

    getRandomEmoji(type) {
        const emojiSet = EMOJIS[type];
        if (Array.isArray(emojiSet)) {
            return emojiSet[Math.floor(Math.random() * emojiSet.length)];
        }
        return emojiSet;
    }

    updateEmoji() {
        if (this.isInConversation) {
            if (this.conversation) {
                this.currentEmoji = EMOJIS.talking;
            } else if (this.waitingToSpeak) {
                this.currentEmoji = EMOJIS.listening;
            } else {
                this.currentEmoji = EMOJIS.thinking;
            }
        } else if (this.isMoving) {
            this.currentEmoji = this.getRandomEmoji('walking');
        } else {
            this.currentEmoji = this.baseEmoji;
        }
    }

    setNewTarget() {
        if (this.movementTimer) {
            clearTimeout(this.movementTimer);
            this.movementTimer = null;
        }

        // 获取当前位置的网格坐标
        const currentGridX = Math.round(this.x / GRID_SIZE);
        const currentGridY = Math.round(this.y / GRID_SIZE);

        // 可能的移动方向：上、下、左、右
        const directions = [
            { dx: 0, dy: -1 }, // 上
            { dx: 0, dy: 1 },  // 下
            { dx: -1, dy: 0 }, // 左
            { dx: 1, dy: 0 }   // 右
        ];

        // 随机选择一个方向
        const direction = directions[Math.floor(Math.random() * directions.length)];
        
        // 随机生成移动步数（2-5格）
        const steps = Math.floor(Math.random() * 4) + 2;
        
        // 计算新的目标位置（网格对齐）
        const newGridX = currentGridX + direction.dx * steps;
        const newGridY = currentGridY + direction.dy * steps;

        // 确保新位置在画布范围内
        const finalGridX = Math.max(0, Math.min(Math.floor(canvas.width / GRID_SIZE) - 1, newGridX));
        const finalGridY = Math.max(0, Math.min(Math.floor(canvas.height / GRID_SIZE) - 1, newGridY));

        this.targetX = finalGridX * GRID_SIZE + GRID_SIZE/2;
        this.targetY = finalGridY * GRID_SIZE + GRID_SIZE/2;
        this.isMoving = true;
        this.updateEmoji();

        // 根据移动距离设置下一次移动的时间间隔
        const movementDelay = Math.random() * 1000 + 1000; // 1-2秒的随机延迟
        
        // 设置下一次移动的定时器
        this.movementTimer = setTimeout(() => {
            if (!this.isInConversation && !this.waitingToSpeak && !this.talkingWith) {
                this.setNewTarget();
            }
        }, movementDelay);
    }

    draw() {
        // 绘制心情光环
        if (MOODS[this.mood]) {
            const gradient = ctx.createRadialGradient(
                this.x, this.y, this.size * 0.5,
                this.x, this.y, this.size * 1.2
            );
            gradient.addColorStop(0, 'transparent');
            gradient.addColorStop(0.5, MOODS[this.mood].colors[0] + '33');
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 1.2, 0, Math.PI * 2);
            ctx.fill();
        }

        // 绘制表情
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.currentEmoji, this.x, this.y);

        // 绘制名字 - 添加描边效果
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        
        // 绘制描边
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.strokeText(this.name, this.x, this.y - this.size/2 - 10);
        
        // 根据职业选择不同颜色
        let nameColor;
        if (this.profession) {
            switch (this.profession) {
                case "老师":
                    nameColor = '#4CAF50'; // 绿色
                    break;
                case "医生":
                    nameColor = '#2196F3'; // 蓝色
                    break;
                case "厨师":
                    nameColor = '#FF9800'; // 橙色
                    break;
                case "警察":
                    nameColor = '#3F51B5'; // 靛蓝色
                    break;
                case "艺术家":
                    nameColor = '#E91E63'; // 粉色
                    break;
                case "程序员":
                    nameColor = '#607D8B'; // 蓝灰色
                    break;
                case "运动员":
                    nameColor = '#FF5722'; // 深橙色
                    break;
                case "科学家":
                    nameColor = '#9C27B0'; // 紫色
                    break;
                case "商人":
                    nameColor = '#795548'; // 棕色
                    break;
                case "学生":
                    nameColor = '#00BCD4'; // 青色
                    break;
                default:
                    nameColor = '#333333'; // 深灰色
            }
        } else {
            nameColor = '#333333'; // 没有职业时使用深灰色
        }
        
        ctx.fillStyle = nameColor;
        ctx.fillText(this.name, this.x, this.y - this.size/2 - 10);

        // 更新对话气泡位置
        if (this.conversation) {
            this.speechBubble.style.display = 'block';
            this.speechBubble.style.left = `${this.x - 100}px`;
            this.speechBubble.style.top = `${this.y - this.size - 60}px`;
        }

        // 绘制特效
        this.drawEffects();
        
        // 如果在对话中，随机添加特效
        if (this.isInConversation && Math.random() < 0.1) {
            this.addEffect();
        }
    }

    update() {
        if (this.isInConversation) {
            if (this.conversationPosition) {
                const dx = this.conversationPosition.x - this.x;
                const dy = this.conversationPosition.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 1) {
                    this.x += (dx / distance) * this.speed * 2;
                    this.y += (dy / distance) * this.speed * 2;
                    this.isMoving = true;
                } else {
                    this.isMoving = false;
                }
            }
        } else {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            
            // 分别处理水平和垂直移动
            if (Math.abs(dx) > 1) {
                this.x += Math.sign(dx) * this.speed;
                this.isMoving = true;
            } else if (Math.abs(dy) > 1) {
                this.y += Math.sign(dy) * this.speed;
                this.isMoving = true;
            } else {
                this.isMoving = false;
                // 检查是否需要设置新的目标
                if (!this.movementTimer) {
                    // 如果角色不在对话中且没有冷却时间，立即设置新目标
                    if (!this.isInConversation && !this.waitingToSpeak && !this.talkingWith) {
                        if (!this.lastInteractionTime || (Date.now() - this.lastInteractionTime >= 5000)) {
                            this.setNewTarget();
                        }
                    }
                }
            }
        }

        // 确保角色位置在画布范围内
        this.x = Math.max(GRID_SIZE/2, Math.min(canvas.width - GRID_SIZE/2, this.x));
        this.y = Math.max(GRID_SIZE/2, Math.min(canvas.height - GRID_SIZE/2, this.y));
        
        // 检查并清除过期的交互时间
        if (this.lastInteractionTime && Date.now() - this.lastInteractionTime >= 5000) {
            this.lastInteractionTime = null;
            // 如果角色静止且不在对话中，设置新的目标
            if (!this.isMoving && !this.isInConversation && !this.waitingToSpeak && !this.talkingWith) {
                this.setNewTarget();
            }
        }
        
        this.updateEmoji();
        
        this.updateMood();
        
        // 根据心情更新表情
        if (MOODS[this.mood] && !this.isInConversation) {
            const moodEmojis = MOODS[this.mood].emojis;
            if (Math.random() < 0.05) { // 5%的概率改变表情
                this.currentEmoji = moodEmojis[Math.floor(Math.random() * moodEmojis.length)];
            }
        }
    }

    checkCollision(other) {
        // 如果任一角色正在对话，或者对方正在和别人对话，则不触发碰撞
        if (this.isInConversation || other.isInConversation || 
            this.talkingWith || other.talkingWith) return false;
            
        // 检查是否在冷却时间内
        const now = Date.now();
        if (this.lastInteractionTime && (now - this.lastInteractionTime < 5000)) return false;
        if (other.lastInteractionTime && (now - other.lastInteractionTime < 5000)) return false;
            
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.size * 2;
    }

    startConversationWith(other) {
        this.isInConversation = true;
        this.talkingWith = other;
        this.originalPosition = { x: this.x, y: this.y };
        
        const midX = (this.x + other.x) / 2;
        const midY = (this.y + other.y) / 2;
        
        const angle = Math.atan2(other.y - this.y, other.x - this.x);
        this.conversationPosition = {
            x: midX - Math.cos(angle) * this.size,
            y: midY - Math.sin(angle) * this.size
        };
        
        other.conversationPosition = {
            x: midX + Math.cos(angle) * this.size,
            y: midY + Math.sin(angle) * this.size
        };

        this.interactionCount++;
        other.interactionCount++;
        this.friends.add(other.id);
        other.friends.add(this.id);
        
        // 添加互动特效
        this.addEffect();
        other.addEffect();
    }

    showConversation(text, callback = null) {
        // 清除之前的定时器
        if (this.conversationTimeout) {
            clearTimeout(this.conversationTimeout);
        }
        if (this.textAnimationInterval) {
            clearInterval(this.textAnimationInterval);
        }
        if (this.movementTimer) {
            clearTimeout(this.movementTimer);
        }
        
        this.fullText = text;
        this.currentTextIndex = 0;
        this.conversation = '';
        this.speechBubble.style.display = 'block';
        
        // 开始文字动画
        this.textAnimationInterval = setInterval(() => {
            if (this.currentTextIndex < this.fullText.length) {
                this.conversation = this.fullText.slice(0, ++this.currentTextIndex);
                this.speechBubble.innerHTML = this.conversation;
            } else {
                clearInterval(this.textAnimationInterval);
                this.conversationTimeout = setTimeout(() => {
                    this.endConversation();
                    if (callback) callback();
                }, 2000);
            }
        }, 100);
    }

    endConversation() {
        this.conversation = '';
        this.speechBubble.style.display = 'none';
        
        // 清除所有定时器
        if (this.conversationTimeout) {
            clearTimeout(this.conversationTimeout);
            this.conversationTimeout = null;
        }
        if (this.textAnimationInterval) {
            clearInterval(this.textAnimationInterval);
            this.textAnimationInterval = null;
        }
        if (this.movementTimer) {
            clearTimeout(this.movementTimer);
            this.movementTimer = null;
        }
    }

    destroy() {
        if (this.speechBubble && this.speechBubble.parentNode) {
            this.speechBubble.parentNode.removeChild(this.speechBubble);
        }
        if (this.conversationTimeout) {
            clearTimeout(this.conversationTimeout);
        }
        if (this.textAnimationInterval) {
            clearInterval(this.textAnimationInterval);
        }
        if (this.movementTimer) {
            clearTimeout(this.movementTimer);
        }
    }

    // 更新心情
    updateMood() {
        const now = Date.now();
        if (now - this.lastMoodChange > 10000) { // 每10秒可能改变一次心情
            if (this.interactionCount > 3) {
                this.mood = 'happy';
            } else if (this.friends.size > 2) {
                this.mood = 'friendly';
            } else if (this.isMoving) {
                this.mood = 'excited';
            } else {
                this.mood = 'neutral';
            }
            this.lastMoodChange = now;
        }
    }

    // 添加特效
    addEffect() {
        if (MOODS[this.mood]) {
            const effect = {
                emoji: MOODS[this.mood].effects[Math.floor(Math.random() * MOODS[this.mood].effects.length)],
                x: this.x,
                y: this.y,
                alpha: 1,
                scale: 1,
                angle: Math.random() * Math.PI * 2
            };
            this.effects.push(effect);
        }
    }

    // 绘制特效
    drawEffects() {
        this.effects = this.effects.filter(effect => {
            effect.y -= 1;
            effect.alpha -= 0.02;
            effect.scale += 0.02;
            effect.angle += 0.1;
            
            if (effect.alpha > 0) {
                ctx.save();
                ctx.globalAlpha = effect.alpha;
                ctx.translate(effect.x, effect.y);
                ctx.rotate(effect.angle);
                ctx.scale(effect.scale, effect.scale);
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(effect.emoji, 0, 0);
                ctx.restore();
                return true;
            }
            return false;
        });
    }
}

// 添加新角色
function addCharacter() {
    const nameInput = document.getElementById('characterName');
    const name = nameInput.value.trim();
    
    socket.emit('addCharacter', name ? getCharacterInfo(name) : generateCharacter());
    nameInput.value = '';
}

// 删除所有角色
function deleteAllCharacters() {
    socket.emit('deleteAllCharacters');
}

// Socket.io 事件处理
socket.on('updateCharacters', (updatedCharacters) => {
    characters.forEach(char => char.destroy());
    characters.clear();
    
    updatedCharacters.forEach(char => {
        // 确保新角色的位置在画布范围内
        const x = Math.min(Math.max(char.x, 20), canvas.width - 20);
        const y = Math.min(Math.max(char.y, 20), canvas.height - 20);
        characters.set(char.id, new Character(char.name, x, y, char.id));
    });
});

socket.on('addNewCharacter', (newChar) => {
    if (!characters.has(newChar.id)) {
        // 确保新角色的位置在画布范围内
        const x = Math.min(Math.max(newChar.x, 20), canvas.width - 20);
        const y = Math.min(Math.max(newChar.y, 20), canvas.height - 20);
        characters.set(newChar.id, new Character(newChar.name, x, y, newChar.id));
    }
});

socket.on('showConversation', (data) => {
    const char1 = characters.get(data.char1.id);
    const char2 = characters.get(data.char2.id);
    
    if (char1 && char2) {
        char1.startConversationWith(char2);
        char2.startConversationWith(char1);
        
        char2.waitingToSpeak = true;
        
        char1.showConversation(data.char1.says, () => {
            char2.waitingToSpeak = false;
            char2.showConversation(data.char2.says, () => {
                socket.emit('conversationEnded', {
                    char1Id: data.char1.id,
                    char2Id: data.char2.id
                });
            });
        });
    }
});

socket.on('conversationComplete', (data) => {
    const char1 = characters.get(data.char1Id);
    const char2 = characters.get(data.char2Id);
    
    if (char1) {
        // 重置对话状态
        char1.isInConversation = false;
        char1.talkingWith = null;
        char1.waitingToSpeak = false;
        char1.conversationPosition = null;
        
        // 向左上方移动
        const steps = Math.floor(Math.random() * 3) + 3; // 3-5格
        const currentGridX = Math.round(char1.x / GRID_SIZE);
        const currentGridY = Math.round(char1.y / GRID_SIZE);
        const newGridX = Math.max(0, currentGridX - steps);
        const newGridY = Math.max(0, currentGridY - steps);
        char1.targetX = newGridX * GRID_SIZE + GRID_SIZE/2;
        char1.targetY = newGridY * GRID_SIZE + GRID_SIZE/2;
        char1.isMoving = true;
        
        // 清除现有的移动定时器
        if (char1.movementTimer) {
            clearTimeout(char1.movementTimer);
            char1.movementTimer = null;
        }
        
        // 设置延时后开始随机移动
        setTimeout(() => {
            if (!char1.isInConversation) {
                char1.setNewTarget();
            }
        }, 3000);
    }
    
    if (char2) {
        // 重置对话状态
        char2.isInConversation = false;
        char2.talkingWith = null;
        char2.waitingToSpeak = false;
        char2.conversationPosition = null;
        
        // 向右下方移动
        const steps = Math.floor(Math.random() * 3) + 3; // 3-5格
        const currentGridX = Math.round(char2.x / GRID_SIZE);
        const currentGridY = Math.round(char2.y / GRID_SIZE);
        const newGridX = Math.min(Math.floor(canvas.width / GRID_SIZE) - 1, currentGridX + steps);
        const newGridY = Math.min(Math.floor(canvas.height / GRID_SIZE) - 1, currentGridY + steps);
        char2.targetX = newGridX * GRID_SIZE + GRID_SIZE/2;
        char2.targetY = newGridY * GRID_SIZE + GRID_SIZE/2;
        char2.isMoving = true;
        
        // 清除现有的移动定时器
        if (char2.movementTimer) {
            clearTimeout(char2.movementTimer);
            char2.movementTimer = null;
        }
        
        // 设置延时后开始随机移动
        setTimeout(() => {
            if (!char2.isInConversation) {
                char2.setNewTarget();
            }
        }, 3000);
    }

    // 设置冷却时间，防止立即再次对话
    if (char1 && char2) {
        const cooldownTime = 5000; // 5秒冷却时间
        char1.lastInteractionTime = Date.now();
        char2.lastInteractionTime = Date.now();
    }
});

socket.on('charactersDeleted', () => {
    characters.forEach(char => char.destroy());
    characters.clear();
});

// 在游戏初始化时创建场景效果实例
let sceneEffect;
function initGame() {
    resizeCanvas();
    sceneEffect = new SceneEffect(canvas, ctx);
    gameLoop();
}

// 修改游戏循环
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制场景
    sceneEffect.update();
    sceneEffect.draw();
    
    // 绘制网格背景
    drawGrid();
    
    // 更新和绘制角色
    characters.forEach(char => {
        char.update();
        char.draw();
    });

    // 检查角色碰撞
    const charArray = Array.from(characters.values());
    for (let i = 0; i < charArray.length; i++) {
        for (let j = i + 1; j < charArray.length; j++) {
            if (charArray[i].checkCollision(charArray[j])) {
                socket.emit('characterCollision', {
                    char1Id: charArray[i].id,
                    char2Id: charArray[j].id
                });
            }
        }
    }

    requestAnimationFrame(gameLoop);
}

// 初始化游戏
window.addEventListener('load', initGame); 