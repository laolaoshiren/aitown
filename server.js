const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const axios = require('axios');

const DEEPSEEK_API_KEY = 'sk-ee23c831346b4758b861aba027286088';

// 存储所有角色信息
const characters = new Map();

// 存储角色记忆
const characterMemories = new Map();

// 存储当前对话状态
const activeConversations = new Map();

// 存储对话轮次
const conversationRounds = new Map();

// 场景配置
const SCENE_CONFIG = {
    // 时间相关场景
    timeScenes: {
        "凌晨": {
            locations: ["24小时便利店", "医院急诊室", "出租车站", "地铁站", "夜间书吧"],
            topics: ["熬夜工作", "城市夜生活", "职业选择", "生活节奏", "未来规划"]
        },
        "早晨": {
            locations: ["早餐店", "公园", "地铁站", "写字楼", "健身房", "咖啡厅"],
            topics: ["晨练习惯", "一天计划", "生活态度", "职场经验", "健康生活"]
        },
        "上午": {
            locations: ["图书馆", "写字楼", "商场", "美术馆", "创意园区", "科技园"],
            topics: ["工作心得", "专业技能", "行业动态", "创新想法", "市场趋势"]
        },
        "中午": {
            locations: ["餐厅", "公司食堂", "咖啡厅", "休闲广场", "便利店"],
            topics: ["美食推荐", "工作压力", "生活方式", "兴趣爱好", "午休时光"]
        },
        "下午": {
            locations: ["茶馆", "创意园区", "图书馆", "艺术中心", "科技馆"],
            topics: ["专业交流", "行业见解", "人生感悟", "艺术鉴赏", "科技发展"]
        },
        "傍晚": {
            locations: ["公园", "商场", "健身房", "文化广场", "滨江步道"],
            topics: ["生活感悟", "运动健康", "休闲方式", "城市变迁", "未来规划"]
        },
        "晚上": {
            locations: ["餐厅", "电影院", "音乐厅", "咖啡馆", "书店", "酒吧"],
            topics: ["生活品质", "文化艺术", "社会话题", "情感交流", "人生目标"]
        }
    },

    // 天气影响
    weatherEffects: {
        "晴天": {
            mood: ["愉快", "开朗", "活力", "热情"],
            topics: ["户外活动", "生活乐趣", "阳光心态"]
        },
        "雨天": {
            mood: ["安静", "文艺", "感性", "思考"],
            topics: ["文艺创作", "生活感悟", "心灵对话"]
        },
        "阴天": {
            mood: ["平和", "理性", "内敛", "沉稳"],
            topics: ["职业规划", "生活思考", "未来展望"]
        }
    },

    // 职业组合特殊对话
    specialInteractions: {
        "医生_老师": {
            topics: ["青少年心理健康", "校园卫生防疫", "健康教育创新"],
            depth: "专业"
        },
        "程序员_艺术家": {
            topics: ["数字艺术创作", "科技与艺术融合", "创新设计理念"],
            depth: "跨界"
        },
        "作家_心理咨询师": {
            topics: ["人物刻画", "情感表达", "心理分析"],
            depth: "深度"
        }
    }
};

app.use(express.static('public'));
app.use(express.json());

// 初始化角色记忆
function initializeCharacterMemory(characterId, character) {
    characterMemories.set(characterId, {
        name: character.name,
        personality: character.personality,
        profession: character.profession,
        gender: character.gender,
        conversations: [],
        relationships: new Map()
    });
}

// 更新角色记忆
function updateMemory(char1Id, char2Id, conversation) {
    const memory1 = characterMemories.get(char1Id);
    const memory2 = characterMemories.get(char2Id);
    const char1 = characters.get(char1Id);
    const char2 = characters.get(char2Id);

    if (memory1 && memory2) {
        // 更新对话历史
        memory1.conversations.push({
            with: char2.name,
            content: conversation.char1Says,
            timestamp: Date.now()
        });
        memory2.conversations.push({
            with: char1.name,
            content: conversation.char2Says,
            timestamp: Date.now()
        });

        // 更新关系
        if (!memory1.relationships.has(char2.name)) {
            memory1.relationships.set(char2.name, {
                meetCount: 1,
                lastMeet: Date.now(),
                impression: "初次见面"
            });
        } else {
            const relation = memory1.relationships.get(char2.name);
            relation.meetCount++;
            relation.lastMeet = Date.now();
            if (relation.meetCount <= 3) {
                relation.impression = "逐渐熟悉";
            } else if (relation.meetCount <= 6) {
                relation.impression = "已经熟络";
            } else {
                relation.impression = "老朋友了";
            }
        }

        if (!memory2.relationships.has(char1.name)) {
            memory2.relationships.set(char1.name, {
                meetCount: 1,
                lastMeet: Date.now(),
                impression: "初次见面"
            });
        } else {
            const relation = memory2.relationships.get(char1.name);
            relation.meetCount++;
            relation.lastMeet = Date.now();
            if (relation.meetCount <= 3) {
                relation.impression = "逐渐熟悉";
            } else if (relation.meetCount <= 6) {
                relation.impression = "已经熟络";
            } else {
                relation.impression = "老朋友了";
            }
        }

        // 限制记忆大小
        if (memory1.conversations.length > 10) memory1.conversations.shift();
        if (memory2.conversations.length > 10) memory2.conversations.shift();
    }
}

// 获取当前场景配置
function getCurrentSceneConfig() {
    const hour = new Date().getHours();
    let timeContext = "";
    if (hour < 6) timeContext = "凌晨";
    else if (hour < 9) timeContext = "早晨";
    else if (hour < 12) timeContext = "上午";
    else if (hour < 14) timeContext = "中午";
    else if (hour < 17) timeContext = "下午";
    else if (hour < 19) timeContext = "傍晚";
    else timeContext = "晚上";

    // 模拟天气（实际项目可以接入天气API）
    const weathers = ["晴天", "雨天", "阴天"];
    const currentWeather = weathers[Math.floor(Math.random() * weathers.length)];

    return {
        timeContext,
        weather: currentWeather,
        sceneConfig: SCENE_CONFIG.timeScenes[timeContext],
        weatherEffect: SCENE_CONFIG.weatherEffects[currentWeather]
    };
}

// 根据场景生成对话主题
function getConversationTopic(memory1, memory2, relationship) {
    const { timeContext, weather, sceneConfig, weatherEffect } = getCurrentSceneConfig();
    
    // 检查是否有特殊的职业组合对话
    const professionKey = `${memory1.profession}_${memory2.profession}`;
    const specialInteraction = SCENE_CONFIG.specialInteractions[professionKey];

    // 如果是第一次见面
    if (relationship.meetCount === 0) {
        const location = sceneConfig.locations[Math.floor(Math.random() * sceneConfig.locations.length)];
        return {
            topic: "初次见面的寒暄",
            context: `${timeContext}，${weather}，在${location}初次相遇`,
            mood: weatherEffect.mood[Math.floor(Math.random() * weatherEffect.mood.length)]
        };
    }

    // 如果有特殊的职业组合对话
    if (specialInteraction && Math.random() < 0.4) { // 40%的概率触发特殊对话
        const topic = specialInteraction.topics[Math.floor(Math.random() * specialInteraction.topics.length)];
        const location = sceneConfig.locations[Math.floor(Math.random() * sceneConfig.locations.length)];
        return {
            topic,
            context: `${timeContext}，${weather}，在${location}深入交流`,
            mood: weatherEffect.mood[Math.floor(Math.random() * weatherEffect.mood.length)],
            depth: specialInteraction.depth
        };
    }

    // 根据时间和天气选择话题
    const timeTopics = sceneConfig.topics;
    const weatherTopics = weatherEffect.topics;
    const allTopics = [...timeTopics, ...weatherTopics];
    
    if (memory1.profession && memory2.profession) {
        const professionalTopics = getProfessionalTopics(memory1.profession, memory2.profession);
        allTopics.push(...professionalTopics);
    }

    const personalityTopics = getPersonalityTopics(memory1.personality, memory2.personality);
    allTopics.push(...personalityTopics);

    const selectedTopic = allTopics[Math.floor(Math.random() * allTopics.length)];
    const location = sceneConfig.locations[Math.floor(Math.random() * sceneConfig.locations.length)];
    
    return {
        topic: selectedTopic,
        context: `${timeContext}，${weather}，在${location}偶遇`,
        mood: weatherEffect.mood[Math.floor(Math.random() * weatherEffect.mood.length)]
    };
}

// 获取随机地点
function getRandomLocation() {
    const locations = [
        "咖啡馆",
        "图书馆",
        "公园长椅旁",
        "商场休息区",
        "街角小店",
        "地铁站",
        "社区花园",
        "健身房",
        "美食街",
        "艺术馆",
        "博物馆",
        "电影院门口",
        "超市",
        "书店",
        "音乐厅",
        "展览中心",
        "创意园区",
        "科技馆",
        "天文馆",
        "动物园"
    ];
    return locations[Math.floor(Math.random() * locations.length)];
}

// 获取职业相关话题
function getProfessionalTopics(prof1, prof2) {
    const commonTopics = {
        "老师": {
            "医生": ["校园健康教育", "学生心理辅导", "青少年成长", "教育与医疗的结合"],
            "艺术家": ["艺术教育创新", "学生创造力培养", "校园文化建设", "艺术思维开发"],
            "程序员": ["编程教育普及", "教育信息化", "智慧校园建设", "在线教育发展"],
            "作家": ["语文教育改革", "阅读习惯培养", "写作教学方法", "文学素养提升"],
            "厨师": ["营养午餐改革", "食育课程开发", "健康饮食教育", "烹饪兴趣培养"],
            "警察": ["校园安全教育", "法制教育实践", "青少年保护", "安全意识培养"],
            "科学家": ["科学教育创新", "实验教学方法", "科普活动开展", "创新思维培养"],
            "主播": ["教育传播方式", "网络课程设计", "教育资源共享", "新媒体教学"]
        },
        "医生": {
            "艺术家": ["艺术治疗应用", "心理健康干预", "创意康复方案", "医疗环境设计"],
            "程序员": ["医疗软件开发", "远程诊疗系统", "人工智能诊断", "健康数据分析"],
            "作家": ["医学科普创作", "病例记录方法", "医患沟通技巧", "健康知识传播"],
            "厨师": ["营养调理方案", "食疗养生之道", "健康饮食指导", "特殊人群饮食"],
            "警察": ["急救知识普及", "突发事件处理", "公共卫生安全", "医疗纠纷处理"],
            "科学家": ["医学研究进展", "新药物开发", "治疗方法创新", "医疗技术革新"],
            "主播": ["健康知识传播", "医疗科普直播", "在线问诊咨询", "健康生活指导"]
        }
    };

    // 获取两个职业之间的话题
    let topics = [];
    if (commonTopics[prof1]?.[prof2]) {
        topics = commonTopics[prof1][prof2];
    } else if (commonTopics[prof2]?.[prof1]) {
        topics = commonTopics[prof2][prof1];
    }

    // 如果没有特定组合的话题，使用通用话题
    if (topics.length === 0) {
        topics = [
            "工作经验分享",
            "行业发展趋势",
            "职业规划建议",
            "工作生活平衡",
            "专业技能提升",
            "团队协作经验",
            "创新思维碰撞",
            "跨界合作机会"
        ];
    }

    return topics;
}

// 获取性格相关话题
function getPersonalityTopics(personality1, personality2) {
    const personalityTopics = {
        "热情开朗": [
            "分享快乐经历",
            "有趣的生活故事",
            "积极向上的态度",
            "社交活动体验"
        ],
        "严谨认真": [
            "工作方法探讨",
            "自我提升心得",
            "专业技能交流",
            "时间管理经验"
        ],
        "浪漫文艺": [
            "艺术作品欣赏",
            "文学作品讨论",
            "创作灵感分享",
            "生活美学探讨"
        ],
        "求知好奇": [
            "新知识探索",
            "学习方法分享",
            "科技发展讨论",
            "创新想法交流"
        ]
    };

    // 合并两种性格的话题
    let topics = [];
    if (personalityTopics[personality1]) {
        topics = topics.concat(personalityTopics[personality1]);
    }
    if (personalityTopics[personality2]) {
        topics = topics.concat(personalityTopics[personality2]);
    }

    // 如果没有特定性格的话题，使用通用话题
    if (topics.length === 0) {
        topics = [
            "生活趣事分享",
            "兴趣爱好交流",
            "近期见闻讨论",
            "未来计划展望",
            "生活感悟分享",
            "城市变迁感受",
            "美食探店经历",
            "旅行见闻交流"
        ];
    }

    return topics;
}

// 处理AI对话的函数
async function generateAIResponse(character1, character2, round = 1) {
    const memory1 = characterMemories.get(character1.id);
    const memory2 = characterMemories.get(character2.id);
    
    if (!memory1 || !memory2) {
        console.error('Character memories not found');
        return generateBackupResponse(memory1, memory2, { impression: "初次见面" });
    }

    const relationship1 = memory1.relationships.get(character2.name) || { impression: "初次见面", meetCount: 0 };
    const relationship2 = memory2.relationships.get(character1.name) || { impression: "初次见面", meetCount: 0 };

    try {
        const { topic, context, mood, depth } = getConversationTopic(memory1, memory2, relationship1);
        
        // 获取最近的对话历史
        const recentConversations = memory1.conversations
            .filter(conv => conv.with === character2.name)
            .slice(-3)
            .map(conv => {
                const timeDiff = Date.now() - conv.timestamp;
                const timeAgo = timeDiff < 86400000 ? "今天" : 
                               timeDiff < 172800000 ? "昨天" :
                               timeDiff < 604800000 ? "最近几天" : "之前";
                return `${memory1.name}: ${conv.content} (${timeAgo})`;
            })
            .join('\n');

        const prompt = `你是一个对话生成器，需要模拟两个真实的人在${context}时的自然对话。当前氛围：${mood}。
${depth ? `对话深度：${depth}，需要体现专业性和见解。` : ''}

请注意：
1. 对话要极其自然，避免过于刻意或做作
2. 充分体现两个人的性格特点和职业背景
3. 可以加入语气词、口头禅等口语化表达
4. 对话要有互动性，而不是各说各的
5. 可以适当展现情感和态度
6. 避免说教或说空话
7. 对话长度适中，不要太长
8. 要符合当前的时间、天气和场景氛围

角色1：${character1.name}
- ${memory1.gender}性，${memory1.profession || "普通市民"}
- ${memory1.personality}的性格
- ${getPersonalTraits(memory1)}

角色2：${character2.name}
- ${memory2.gender}性，${memory2.profession || "普通市民"}
- ${memory2.personality}的性格
- ${getPersonalTraits(memory2)}

关系状态：
- 他们${relationship1.impression}
- 这是第${relationship1.meetCount + 1}次见面
${recentConversations ? `\n最近的对话：\n${recentConversations}` : ""}

当前话题：${topic}

请用JSON格式输出对话内容：
{"char1Says": "第一个角色说的话", "char2Says": "第二个角色说的话"}`;

        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: "deepseek-chat",
            messages: [{ 
                role: "system",
                content: "你是一个对话生成器，只能输出JSON格式的对话内容。输出必须是有效的JSON格式，包含两个字段：char1Says和char2Says。不要输出任何其他内容。确保对话自然、有趣、富有个性。"
            }, {
                role: "user",
                content: prompt
            }],
            temperature: 0.95,
            max_tokens: 800,
            response_format: { type: "json_object" }
        }, {
            headers: {
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        let responseContent = response.data.choices[0].message.content.trim();
        
        try {
            if (responseContent.includes('```json')) {
                responseContent = responseContent.replace(/```json\n|\n```/g, '');
            }
            
            if (responseContent.includes('},{')) {
                responseContent = responseContent.split('},{')[0] + '}';
            }
            
            const conversation = JSON.parse(responseContent);
            
            if (!conversation.char1Says || !conversation.char2Says) {
                throw new Error('Missing required dialogue fields');
            }

            updateMemory(character1.id, character2.id, conversation);
            updateRelationshipImpression(character1.id, character2.id, conversation);
            
            return conversation;
        } catch (parseError) {
            console.error('Failed to parse AI response:', parseError);
            return generateBackupResponse(memory1, memory2, relationship1);
        }
    } catch (error) {
        console.error('AI Response Error:', error);
        return generateBackupResponse(memory1, memory2, relationship1);
    }
}

// 生成个性化特征
function getPersonalTraits(memory) {
    const professionTraits = {
        "老师": "关心学生成长，有教育情怀，善于观察和引导",
        "医生": "专业严谨，富有同理心，关注健康",
        "艺术家": "富有创造力，追求完美，感性细腻",
        "程序员": "逻辑思维强，专注技术，喜欢解决问题",
        "作家": "想象力丰富，善于表达，观察细致",
        "厨师": "追求完美，注重细节，热爱美食",
        "运动员": "充满活力，意志坚强，追求卓越"
    };

    const personalityTraits = {
        "严谨认真": "做事一丝不苟，追求完美",
        "温柔体贴": "善解人意，处处为他人着想",
        "热情开朗": "阳光活力，乐观向上",
        "浪漫文艺": "感性细腻，追求美好",
        "求知好奇": "勇于探索，热爱学习",
        "性格随和": "平易近人，与人为善"
    };

    return `${professionTraits[memory.profession] || "生活阅历丰富，见解独到"}，${personalityTraits[memory.personality] || "性格鲜明"}`;
}

// 总结之前的互动
function summarizeInteractions(memory, otherName) {
    const conversations = memory.conversations.filter(conv => conv.with === otherName);
    if (conversations.length === 0) return "这是他们的第一次深入交谈";

    const topics = new Set(conversations.map(conv => {
        if (conv.content.includes("教育")) return "教育话题";
        if (conv.content.includes("健康")) return "健康话题";
        if (conv.content.includes("技术")) return "技术话题";
        if (conv.content.includes("艺术")) return "艺术话题";
        if (conv.content.includes("生活")) return "生活话题";
        return "其他话题";
    }));

    return `他们曾经讨论过${Array.from(topics).join("、")}，对话氛围融洽`;
}

// 更新关系印象
function updateRelationshipImpression(char1Id, char2Id, conversation) {
    const memory1 = characterMemories.get(char1Id);
    const memory2 = characterMemories.get(char2Id);
    
    if (!memory1 || !memory2) return;

    const relationship1 = memory1.relationships.get(memory2.name);
    const relationship2 = memory2.relationships.get(memory1.name);

    if (relationship1) {
        // 根据对话内容更新印象
        if (conversation.char1Says.includes("真是投缘") || conversation.char2Says.includes("聊得很开心")) {
            relationship1.impression = "非常投缘";
        } else if (relationship1.meetCount > 5) {
            relationship1.impression = "老朋友";
        } else if (relationship1.meetCount > 3) {
            relationship1.impression = "熟悉的朋友";
        }
    }

    if (relationship2) {
        // 对称更新印象
        relationship2.impression = relationship1.impression;
    }
}

// 生成备用响应
function generateBackupResponse(memory1, memory2, relationship) {
    const hour = new Date().getHours();
    const timeContext = hour < 6 ? "凌晨" : 
                       hour < 9 ? "早上" :
                       hour < 12 ? "上午" :
                       hour < 14 ? "中午" :
                       hour < 17 ? "下午" :
                       hour < 19 ? "傍晚" : "晚上";
    
    const location = getRandomLocation();

    if (relationship.meetCount === 0) {
        const greetings = [
            `${timeContext}好，我是${memory1.name}${memory1.profession ? `，是一名${memory1.profession}` : ""}，很高兴认识你。`,
            `嗨，在${location}遇见你真是太巧了，我叫${memory1.name}。`,
            `你好啊，我是${memory1.name}，${memory1.profession ? `在${memory1.profession}领域工作` : ""}，第一次来这个${location}。`
        ];
        const responses = [
            `${timeContext}好，${memory1.name}，我是${memory2.name}，${memory2.profession ? `从事${memory2.profession}工作` : ""}，也很高兴认识你。`,
            `你好${memory1.name}，我叫${memory2.name}，${memory2.profession ? `是一名${memory2.profession}` : ""}，很高兴在${location}遇见你。`,
            `嗨，${memory1.name}，我是${memory2.name}，没想到能在${location}认识你，真是缘分。`
        ];
        return {
            char1Says: greetings[Math.floor(Math.random() * greetings.length)],
            char2Says: responses[Math.floor(Math.random() * responses.length)]
        };
    }

    const { topic } = getConversationTopic(memory1, memory2, relationship);
    const openings = [
        `${memory2.name}，好巧啊，又在${location}遇到你了。${topic}，你觉得呢？`,
        `嘿，${memory2.name}，${timeContext}在${location}遇见你真是意外。最近在忙什么呢？`,
        `${memory2.name}，${timeContext}好！没想到在${location}又见面了，我们聊聊${topic}吧。`
    ];
    const replies = [
        `是啊，${memory1.name}，真巧。说到${topic}，我最近也有一些想法想和你分享。`,
        `${memory1.name}，见到你真高兴。正好我对${topic}也很感兴趣，我们交流一下？`,
        `哈哈，${memory1.name}，在${location}遇到你太意外了。${topic}确实是个有趣的话题。`
    ];

    return {
        char1Says: openings[Math.floor(Math.random() * openings.length)],
        char2Says: replies[Math.floor(Math.random() * replies.length)]
    };
}

// 根据性格生成说话风格
function getSpeakingStyle(memory) {
    const styles = {
        "严谨认真": "说话严谨、用词准确、语气温和但不失严肃",
        "温柔体贴": "说话轻柔、充满关心、经常使用温暖的词语",
        "热情开朗": "说话活力充沛、经常带着笑意、喜欢用生动的词语",
        "正直威严": "说话干脆、直接、带有一定的威严感",
        "浪漫文艺": "说话优美、富有诗意、喜欢用优美的词句",
        "理性专注": "说话逻辑清晰、简洁明了、偶尔用专业术语",
        "阳光活力": "说话充满活力、乐观向上、经常带着笑声",
        "求知好奇": "说话充满求知欲、喜欢问问题、对新事物感兴趣",
        "精明能干": "说话简洁有力、善于表达、带有智慧",
        "活泼可爱": "说话俏皮可爱、经常带着笑意、用词活泼",
        "文采斐然": "说话优雅、用词丰富、常引经据典",
        "性格随和": "说话平和、亲切、容易与人相处"
    };
    
    return styles[memory.personality] || "说话自然、平和、友善";
}

// 根据性格生成打招呼方式
function getGreeting(memory) {
    const greetings = {
        "严谨认真": ["您好", "幸会", "很高兴见到您"],
        "温柔体贴": ["你好啊", "见到你真好", "最近好吗"],
        "热情开朗": ["嘿，你好", "哈喽", "太好了，遇到你了"],
        "正直威严": ["你好", "幸会", "见到你很高兴"],
        "浪漫文艺": ["嗨，你好", "真巧啊", "多么美好的相遇"],
        "理性专注": ["你好", "幸会", "很高兴认识你"],
        "阳光活力": ["嘿，你好啊", "哈喽", "真高兴见到你"],
        "求知好奇": ["你好啊", "很高兴认识你", "能遇到你真好"],
        "精明能干": ["你好", "幸会", "很高兴见到你"],
        "活泼可爱": ["嗨嗨", "你好呀", "见到你好开心"],
        "性格随和": ["你好", "很高兴见到你", "最近好吗"]
    };
    
    const options = greetings[memory.personality] || ["你好", "很高兴见到你"];
    return options[Math.floor(Math.random() * options.length)];
}

// 根据性格生成回应
function getRandomResponse(memory) {
    const responses = {
        "严谨认真": ["最近工作如何", "一切都好吗", "近来可好"],
        "温柔体贴": ["最近还好吗", "看起来气色不错", "今天过得怎么样"],
        "热情开朗": ["今天真是个好日子", "看到你真高兴", "最近有什么新鲜事"],
        "正直威严": ["最近如何", "工作顺利吗", "一切都好吧"],
        "浪漫文艺": ["今天天气真美", "遇见你真好", "生活还顺心吗"],
        "理性专注": ["最近在忙什么", "工作还顺利吗", "有什么新进展"],
        "阳光活力": ["今天心情不错", "有什么好玩的事", "最近怎么样"],
        "求知好奇": ["最近在研究什么", "有什么新发现吗", "学到什么新东西"],
        "精明能干": ["生意兴隆啊", "最近市场如何", "有什么新项目"],
        "活泼可爱": ["今天真开心", "有什么好玩的", "最近在忙什么"],
        "性格随和": ["最近还好吗", "一切都顺利吗", "生活怎么样"]
    };
    
    const options = responses[memory.personality] || ["最近怎么样", "一切都好吗"];
    return options[Math.floor(Math.random() * options.length)];
}

// 开始新的对话回合
async function startNewConversationRound(char1Id, char2Id) {
    const char1 = characters.get(char1Id);
    const char2 = characters.get(char2Id);
    const conversationKey = [char1Id, char2Id].sort().join('-');
    
    if (!char1 || !char2) return;
    
    const currentRound = (conversationRounds.get(conversationKey) || 0) + 1;
    conversationRounds.set(conversationKey, currentRound);
    
    const conversation = await generateAIResponse(char1, char2, currentRound);
    io.emit('showConversation', {
        char1: {
            id: char1.id,
            says: conversation.char1Says
        },
        char2: {
            id: char2.id,
            says: conversation.char2Says
        }
    });
}

// WebSocket连接处理
io.on('connection', (socket) => {
    console.log('用户已连接');
    socket.emit('updateCharacters', Array.from(characters.values()));

    socket.on('addCharacter', (character) => {
        const id = Date.now().toString();
        const newCharacter = {
            ...character,
            id: id,
            x: Math.random() * 800,
            y: Math.random() * 600
        };
        
        characters.set(id, newCharacter);
        initializeCharacterMemory(id, character);
        
        io.emit('addNewCharacter', newCharacter);
    });

    socket.on('deleteAllCharacters', () => {
        characters.clear();
        characterMemories.clear();
        activeConversations.clear();
        conversationRounds.clear();
        io.emit('charactersDeleted');
    });

    socket.on('characterCollision', async (data) => {
        const conversationKey = [data.char1Id, data.char2Id].sort().join('-');
        
        if (activeConversations.has(conversationKey)) return;
        
        activeConversations.set(conversationKey, true);
        conversationRounds.set(conversationKey, 0);
        
        startNewConversationRound(data.char1Id, data.char2Id);
    });

    // 处理对话结束事件
    socket.on('conversationEnded', (data) => {
        const conversationKey = [data.char1Id, data.char2Id].sort().join('-');
        const currentRound = conversationRounds.get(conversationKey) || 0;
        
        // 如果还没到最大轮次，继续对话
        if (currentRound < Math.floor(Math.random() * 2) + 2) { // 随机2-3轮
            setTimeout(() => {
                startNewConversationRound(data.char1Id, data.char2Id);
            }, 1000); // 1秒后开始下一轮
        } else {
            // 对话完全结束，清除状态
            activeConversations.delete(conversationKey);
            conversationRounds.delete(conversationKey);
            // 通知客户端对话完全结束
            io.emit('conversationComplete', {
                char1Id: data.char1Id,
                char2Id: data.char2Id
            });
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
}); 