import { useState, useEffect, useRef } from "react";

// ========== PIXEL CHARACTERS ==========
const PIXEL_CHARS = [
  { id: "caesar", name: "Caesar", latin: "Imperator", x: 12, y: 18, color: "#C9A84C", hat: "👑", body: "🟡", idle: ["思考帝国大事...", "Veni, Vidi, Vici!", "朕意已决"], zone: "throne" },
  { id: "consul", name: "Consul", latin: "Consul", x: 18, y: 20, color: "#8B5CF6", hat: "📜", body: "🟣", idle: ["整理日程中", "接收凯撒指令...", "调度Agent"], zone: "throne" },
  { id: "praetor", name: "Praetor", latin: "Praetor", x: 22, y: 22, color: "#A78BFA", hat: "⚖️", body: "🟣", idle: ["分析议题领域", "匹配专家中..."], zone: "throne" },
  { id: "s1", name: "经济学家", latin: "Oeconomicus", x: 30, y: 16, color: "#E85D75", hat: "📊", body: "🔴", idle: ["分析通胀数据", "利率走势堪忧"], zone: "senate" },
  { id: "s2", name: "架构师", latin: "Architectus", x: 36, y: 14, color: "#E85D75", hat: "🏗️", body: "🔴", idle: ["设计微服务", "API 需要重构"], zone: "senate" },
  { id: "s3", name: "风控师", latin: "Cautus", x: 42, y: 16, color: "#E85D75", hat: "🛡️", body: "🔴", idle: ["风险评估中", "尾部风险！"], zone: "senate" },
  { id: "s4", name: "产品经理", latin: "Fabricator", x: 34, y: 20, color: "#E85D75", hat: "🎯", body: "🔴", idle: ["用户需求分析", "MVP 优先"], zone: "senate" },
  { id: "s5", name: "创意总监", latin: "Artifex", x: 40, y: 20, color: "#E85D75", hat: "🎨", body: "🔴", idle: ["品牌叙事", "视觉太保守了"], zone: "senate" },
  { id: "leg1", name: "军团兵 I", latin: "Miles I", x: 56, y: 14, color: "#4A9EFF", hat: "⚔️", body: "🔵", idle: ["执行任务中", "任务即将完成"], zone: "camp" },
  { id: "leg2", name: "军团兵 II", latin: "Miles II", x: 62, y: 16, color: "#4A9EFF", hat: "⚔️", body: "🔵", idle: ["代码编写中...", "测试通过!"], zone: "camp" },
  { id: "leg3", name: "军团兵 III", latin: "Miles III", x: 58, y: 20, color: "#4A9EFF", hat: "⚔️", body: "🔵", idle: ["部署准备", "等待验收"], zone: "camp" },
  { id: "guard1", name: "谋略官", latin: "Strategus", x: 30, y: 4, color: "#EF4444", hat: "🧠", body: "🔴", idle: ["制定策略", "方向调整中"], zone: "praetorian" },
  { id: "guard2", name: "守卫官", latin: "Custos", x: 38, y: 4, color: "#EF4444", hat: "🛡️", body: "🔴", idle: ["边界巡逻中", "一切安全"], zone: "praetorian" },
  { id: "guard3", name: "执行官", latin: "Executor", x: 46, y: 4, color: "#EF4444", hat: "⚡", body: "🔴", idle: ["核心任务执行", "进度 78%"], zone: "praetorian" },
  { id: "annalist", name: "史官", latin: "Annalista", x: 14, y: 34, color: "#2C3E50", hat: "📚", body: "⬛", idle: ["归档决策记录", "知识库更新中"], zone: "office" },
  { id: "quaestor", name: "财务官", latin: "Quaestor", x: 26, y: 34, color: "#54A0FF", hat: "💰", body: "🔵", idle: ["账目核对中", "本月预算剩余30%"], zone: "office" },
  { id: "curator", name: "水道官", latin: "Curator", x: 38, y: 34, color: "#10B981", hat: "🌐", body: "🟢", idle: ["系统正常运行", "API延迟: 23ms"], zone: "office" },
  { id: "explorator", name: "探路者", latin: "Explorator", x: 50, y: 34, color: "#F59E0B", hat: "🔍", body: "🟡", idle: ["扫描行业动态", "发现3条新情报"], zone: "office" },
  { id: "tribune", name: "护民官", latin: "Tribunus", x: 62, y: 34, color: "#EC4899", hat: "📱", body: "🟣", idle: ["舆情监测中", "情绪指数: 正面"], zone: "office" },
];

const ROMAN_QUOTES = [
  { text: "Alea iacta est!", zh: "骰子已掷出！", trigger: "决策" },
  { text: "Veni, Vidi, Vici!", zh: "我来，我见，我征服！", trigger: "完成" },
  { text: "Et tu, Brute?", zh: "你也有份吗，布鲁图？", trigger: "Bug" },
  { text: "Carpe Diem!", zh: "把握今天！", trigger: "新任务" },
  { text: "Divide et impera!", zh: "分而治之！", trigger: "拆分" },
  { text: "Cogito ergo sum", zh: "我思故我在", trigger: "分析" },
  { text: "Per aspera ad astra", zh: "循此苦旅，以达天际", trigger: "困难" },
  { text: "Ave Caesar!", zh: "凯撒万岁！", trigger: "问候" },
  { text: "Roma non fu fatta in un giorno", zh: "罗马非一日建成", trigger: "耐心" },
  { text: "Senatus consultum!", zh: "元老院有令！", trigger: "决议" },
];

// Pixel character component
function PixelChar({ char, isActive, onClick }) {
  const [frame, setFrame] = useState(0);
  const [bubble, setBubble] = useState(null);
  const [bounceY, setBounceY] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % 4);
      setBounceY(b => b === 0 ? -2 : 0);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const showBubble = () => {
      const msg = char.idle[Math.floor(Math.random() * char.idle.length)];
      setBubble(msg);
      setTimeout(() => setBubble(null), 3000);
    };
    const interval = setInterval(showBubble, 5000 + Math.random() * 8000);
    setTimeout(showBubble, Math.random() * 3000);
    return () => clearInterval(interval);
  }, [char.idle]);

  return (
    <div onClick={() => onClick(char)} style={{
      position: "absolute",
      left: `${char.x}%`,
      top: `${char.y}%`,
      cursor: "pointer",
      transition: "transform 0.1s steps(1)",
      transform: `translateY(${bounceY}px)`,
      zIndex: Math.floor(char.y),
    }}>
      {/* Speech Bubble */}
      {bubble && (
        <div style={{
          position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)",
          padding: "4px 8px", borderRadius: 4, marginBottom: 4,
          background: "rgba(0,0,0,0.85)", border: `1px solid ${char.color}`,
          fontSize: 9, color: "#EEE", whiteSpace: "nowrap",
          fontFamily: "'Press Start 2P', monospace",
          animation: "bubblePop 0.2s steps(3)",
          imageRendering: "pixelated",
        }}>
          {bubble}
          <div style={{
            position: "absolute", bottom: -4, left: "50%", transform: "translateX(-50%)",
            width: 0, height: 0,
            borderLeft: "4px solid transparent", borderRight: "4px solid transparent",
            borderTop: `4px solid ${char.color}`,
          }} />
        </div>
      )}
      {/* Character */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        filter: isActive ? `drop-shadow(0 0 4px ${char.color})` : "none",
      }}>
        <div style={{ fontSize: 14, lineHeight: 1 }}>{char.hat}</div>
        <div style={{
          width: 20, height: 20, borderRadius: 3,
          background: char.color, border: "2px solid #000",
          display: "flex", alignItems: "center", justifyContent: "center",
          imageRendering: "pixelated",
          boxShadow: `inset 2px 2px 0 rgba(255,255,255,0.3), inset -2px -2px 0 rgba(0,0,0,0.3)`,
        }}>
          <div style={{ display: "flex", gap: 2 }}>
            <div style={{ width: 3, height: 3, background: "#000", borderRadius: 1 }} />
            <div style={{ width: 3, height: 3, background: "#000", borderRadius: 1 }} />
          </div>
        </div>
        <div style={{
          width: 14, height: 12, background: char.color,
          border: "2px solid #000", borderTop: "none",
          marginTop: -1, imageRendering: "pixelated",
          boxShadow: `inset 2px 0 0 rgba(255,255,255,0.2), inset -2px 0 0 rgba(0,0,0,0.2)`,
          opacity: 0.9,
        }} />
        {/* Legs animation */}
        <div style={{ display: "flex", gap: frame % 2 === 0 ? 4 : 2, marginTop: -1 }}>
          <div style={{ width: 4, height: frame % 2 === 0 ? 6 : 4, background: "#333", border: "1px solid #000" }} />
          <div style={{ width: 4, height: frame % 2 === 0 ? 4 : 6, background: "#333", border: "1px solid #000" }} />
        </div>
      </div>
      {/* Name tag */}
      <div style={{
        fontSize: 7, color: char.color, textAlign: "center", marginTop: 2,
        fontFamily: "'Press Start 2P', monospace", textShadow: "1px 1px 0 #000",
        imageRendering: "pixelated",
      }}>{char.name}</div>
    </div>
  );
}

export default function PixelScene() {
  const [selected, setSelected] = useState(null);
  const [quote, setQuote] = useState(null);
  const [time, setTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const showQuote = () => {
      const q = ROMAN_QUOTES[Math.floor(Math.random() * ROMAN_QUOTES.length)];
      setQuote(q);
      setTimeout(() => setQuote(null), 4000);
    };
    const interval = setInterval(showQuote, 12000);
    return () => clearInterval(interval);
  }, []);

  const romanTime = () => {
    const h = new Date().getHours();
    const romanNums = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];
    return `Hora ${romanNums[(h % 12)]}`;
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        @keyframes bubblePop { from { transform: translateX(-50%) scale(0); } to { transform: translateX(-50%) scale(1); } }
        @keyframes twinkle { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
        @keyframes torchFlicker { 0%,100% { opacity: 0.8; transform: scaleY(1); } 50% { opacity: 1; transform: scaleY(1.1); } }
        @keyframes flagWave { 0%,100% { transform: skewX(0deg); } 50% { transform: skewX(-3deg); } }
        @keyframes floatUp { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-20px); } }
        @keyframes marchIn { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>

      {/* Status Bar - Pixel Style */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "6px 12px", marginBottom: 4,
        background: "#1a1520", border: "2px solid #333",
        fontFamily: "'Press Start 2P', monospace", fontSize: 8, imageRendering: "pixelated",
        boxShadow: "inset 2px 2px 0 #444, inset -2px -2px 0 #111",
      }}>
        <span style={{ color: "#C9A84C" }}>🏛 SPQA IMPERIUM</span>
        <div style={{ display: "flex", gap: 12 }}>
          <span style={{ color: "#10B981" }}>● Agent: 19</span>
          <span style={{ color: "#F59E0B" }}>⚔ Task: 7</span>
          <span style={{ color: "#8B5CF6" }}>{romanTime()}</span>
        </div>
      </div>

      {/* Main Scene */}
      <div style={{
        position: "relative", width: "100%", paddingBottom: "60%",
        background: "linear-gradient(180deg, #1a1028 0%, #0f0a18 30%, #15101e 100%)",
        border: "3px solid #333", borderRadius: 4, overflow: "hidden",
        imageRendering: "pixelated",
        boxShadow: "inset 0 0 60px rgba(201,168,76,0.03)",
      }}>
        {/* Stars */}
        {Array.from({length: 20}).map((_, i) => (
          <div key={`star-${i}`} style={{
            position: "absolute",
            left: `${5 + Math.random() * 90}%`, top: `${2 + Math.random() * 15}%`,
            width: 2, height: 2, background: "#FFF", borderRadius: 1,
            animation: `twinkle ${2 + Math.random() * 3}s infinite`,
            animationDelay: `${Math.random() * 3}s`,
          }} />
        ))}

        {/* Moon */}
        <div style={{
          position: "absolute", right: "8%", top: "3%",
          width: 20, height: 20, borderRadius: "50%",
          background: "radial-gradient(circle at 30% 30%, #FFE4B5, #DDD08B)",
          boxShadow: "0 0 15px rgba(255,228,181,0.3)",
        }} />

        {/* Zone Labels */}
        {[
          { label: "PALATIUM CAESARIS", sub: "凯撒宫", x: "3%", y: "12%", color: "#C9A84C" },
          { label: "CURIA SENATUS", sub: "元老院", x: "30%", y: "10%", color: "#E85D75" },
          { label: "CASTRA LEGIONUM", sub: "军团营", x: "58%", y: "10%", color: "#4A9EFF" },
          { label: "CASTRA PRAETORIA", sub: "禁卫军营", x: "30%", y: "0.5%", color: "#EF4444" },
          { label: "OFFICIUM", sub: "综合办公室", x: "28%", y: "30%", color: "#888" },
        ].map((z, i) => (
          <div key={i} style={{
            position: "absolute", left: z.x, top: z.y,
            fontFamily: "'Press Start 2P', monospace", fontSize: 6,
            color: z.color, opacity: 0.5, textShadow: "1px 1px 0 #000",
          }}>
            {z.label}<br/><span style={{ fontSize: 7, fontFamily: "sans-serif" }}>{z.sub}</span>
          </div>
        ))}

        {/* Ground/Floor Pattern */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "35%",
          background: "repeating-linear-gradient(90deg, #1a1520 0px, #1a1520 18px, #1e1828 18px, #1e1828 20px), repeating-linear-gradient(0deg, #1a1520 0px, #1a1520 18px, #1e1828 18px, #1e1828 20px)",
          opacity: 0.5,
        }} />

        {/* Columns */}
        {[15, 28, 42, 55, 68].map((x, i) => (
          <div key={`col-${i}`} style={{
            position: "absolute", left: `${x}%`, top: "8%",
            width: 8, height: "55%",
            background: "linear-gradient(90deg, #3a3040, #4a4050, #3a3040)",
            border: "1px solid #555",
            boxShadow: "inset 2px 0 0 rgba(255,255,255,0.1)",
          }}>
            <div style={{
              width: 14, height: 6, background: "#4a4050", marginLeft: -3, marginTop: -3,
              border: "1px solid #555",
            }} />
            <div style={{
              position: "absolute", bottom: 0, width: 14, height: 6,
              background: "#4a4050", marginLeft: -3, border: "1px solid #555",
            }} />
          </div>
        ))}

        {/* Torches */}
        {[10, 25, 50, 75].map((x, i) => (
          <div key={`torch-${i}`} style={{
            position: "absolute", left: `${x}%`, top: "7%",
            animation: `torchFlicker ${1 + Math.random()}s infinite`,
          }}>
            <div style={{ fontSize: 12 }}>🔥</div>
          </div>
        ))}

        {/* SPQA Banner */}
        <div style={{
          position: "absolute", left: "45%", top: "1%",
          transform: "translateX(-50%)",
          padding: "3px 10px",
          background: "rgba(139,28,28,0.8)", border: "2px solid #C9A84C",
          fontFamily: "'Press Start 2P', monospace", fontSize: 8,
          color: "#C9A84C", letterSpacing: 2,
          animation: "flagWave 4s infinite ease-in-out",
          boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.2), inset -1px -1px 0 rgba(0,0,0,0.3)",
        }}>
          S·P·Q·A
        </div>

        {/* Caesar's Throne */}
        <div style={{
          position: "absolute", left: "8%", top: "14%",
          width: 40, height: 30, borderRadius: "4px 4px 0 0",
          background: "linear-gradient(180deg, #8B6914, #5a4010)",
          border: "2px solid #C9A84C",
          boxShadow: "inset 2px 2px 0 rgba(255,255,255,0.2)",
        }}>
          <div style={{
            textAlign: "center", fontSize: 6, color: "#C9A84C",
            fontFamily: "'Press Start 2P', monospace", paddingTop: 2,
          }}>CAESAR</div>
        </div>

        {/* Senate Semicircle benches */}
        {[0, 1, 2].map(row => (
          <div key={`bench-${row}`} style={{
            position: "absolute",
            left: `${28 + row * 2}%`, top: `${15 + row * 5}%`,
            width: `${22 - row * 3}%`, height: 4,
            borderRadius: "0 0 50% 50%",
            background: "#3a2a20",
            border: "1px solid #5a4a40",
            opacity: 0.6,
          }} />
        ))}

        {/* Camp tents */}
        {[0, 1, 2].map(i => (
          <div key={`tent-${i}`} style={{
            position: "absolute", left: `${54 + i * 8}%`, top: `${11 + (i % 2) * 4}%`,
            width: 0, height: 0,
            borderLeft: "10px solid transparent", borderRight: "10px solid transparent",
            borderBottom: `14px solid ${i === 0 ? '#3a3a5a' : '#3a4a5a'}`,
            opacity: 0.5,
          }} />
        ))}

        {/* All Characters */}
        {PIXEL_CHARS.map(char => (
          <PixelChar
            key={char.id}
            char={char}
            isActive={selected?.id === char.id}
            onClick={setSelected}
          />
        ))}

        {/* Roman Quote Popup */}
        {quote && (
          <div style={{
            position: "absolute", top: "40%", left: "50%",
            transform: "translate(-50%, -50%)",
            padding: "8px 16px", borderRadius: 4,
            background: "rgba(139,28,28,0.9)", border: "2px solid #C9A84C",
            fontFamily: "'Press Start 2P', monospace",
            textAlign: "center", zIndex: 100,
            animation: "floatUp 4s forwards",
          }}>
            <div style={{ fontSize: 10, color: "#C9A84C" }}>{quote.text}</div>
            <div style={{ fontSize: 8, color: "#999", marginTop: 4 }}>{quote.zh}</div>
          </div>
        )}
      </div>

      {/* Selected Character Info Panel */}
      {selected && (
        <div style={{
          marginTop: 4, padding: "10px 14px",
          background: "#1a1520", border: "2px solid #333",
          fontFamily: "'Press Start 2P', monospace", imageRendering: "pixelated",
          boxShadow: "inset 2px 2px 0 #444, inset -2px -2px 0 #111",
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 4,
            background: selected.color, border: "2px solid #000",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, boxShadow: `inset 3px 3px 0 rgba(255,255,255,0.3), inset -3px -3px 0 rgba(0,0,0,0.3)`,
          }}>{selected.hat}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: selected.color }}>{selected.name}</div>
            <div style={{ fontSize: 7, color: "#666", marginTop: 2 }}>{selected.latin}</div>
            <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
              <div>
                <div style={{ fontSize: 6, color: "#555" }}>STATUS</div>
                <div style={{ fontSize: 8, color: "#10B981" }}>● ACTIVE</div>
              </div>
              <div>
                <div style={{ fontSize: 6, color: "#555" }}>ZONE</div>
                <div style={{ fontSize: 8, color: "#AAA" }}>{selected.zone.toUpperCase()}</div>
              </div>
              <div>
                <div style={{ fontSize: 6, color: "#555" }}>HP</div>
                <div style={{ display: "flex", gap: 1, marginTop: 2 }}>
                  {Array.from({length: 10}).map((_, i) => (
                    <div key={i} style={{
                      width: 6, height: 6,
                      background: i < 8 ? "#10B981" : "#333",
                      border: "1px solid #000",
                    }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <button onClick={() => setSelected(null)} style={{
            padding: "4px 8px", background: "#333", border: "2px solid #555",
            color: "#999", fontSize: 8, cursor: "pointer",
            fontFamily: "'Press Start 2P', monospace",
            boxShadow: "inset 1px 1px 0 #666, inset -1px -1px 0 #222",
          }}>✕</button>
        </div>
      )}

      {/* Easter Egg Legend */}
      <div style={{
        marginTop: 8, padding: "8px 12px",
        background: "#1a1520", border: "2px solid #222",
        fontFamily: "'Press Start 2P', monospace", fontSize: 7,
        color: "#555", textAlign: "center",
        boxShadow: "inset 2px 2px 0 #333, inset -2px -2px 0 #111",
      }}>
        🏛 点击角色查看详情 · 观察他们的对话气泡 · 寻找隐藏的罗马名言彩蛋
      </div>
    </div>
  );
}
