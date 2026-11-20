// utils/anim.js —— 动画工具层
//
// 小程序没有 DOM，GSAP 无法直接运行。这里把 GSAP 的核心动画原则
// 用小程序能做到的方式落地：
//   - 缓动：用与 GSAP power2.out / back.out 等价的数学曲线
//   - stagger：列表错峰入场，逐项递增延迟并封顶
//   - 降级：尊重"减弱动态效果"，统一走 reduced-motion 开关
//
// 性能约定（对应 fixing-motion-performance）：
//   - 只驱动 transform / opacity 对应的数据
//   - rAF 循环必须有终止条件
//   - 不对大表面做持续动画

/* ---------------- 缓动曲线（等价 GSAP 内置 ease） ---------------- */

// power2.out —— GSAP 常用默认手感
function easeOutQuad(t) {
  return 1 - Math.pow(1 - t, 3)
}

// back.out(1.7) —— 轻微回弹
function easeOutBack(t, overshoot) {
  const s = overshoot === undefined ? 1.7 : overshoot
  const c3 = s + 1
  return 1 + c3 * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2)
}

/* ---------------- 降级开关 ---------------- */

const REDUCE_KEY = 'ledger_reduce_motion'
let reduceMotion = false

function initReduceMotion() {
  // 小程序未提供 prefers-reduced-motion 的读取接口，
  // 因此以本地设置为准，默认跟随系统（多数机型默认为 false）。
  try {
    const saved = wx.getStorageSync(REDUCE_KEY)
    reduceMotion = saved === true
  } catch (e) {
    reduceMotion = false
  }
  return reduceMotion
}

function isReduceMotion() {
  return reduceMotion
}

function setReduceMotion(v) {
  reduceMotion = !!v
  try {
    wx.setStorageSync(REDUCE_KEY, reduceMotion)
  } catch (e) {}
}

/* ---------------- 数字滚动（等价 GSAP 对文本数值的补间） ---------------- */

// countUp({ from, to, duration, decimals, onUpdate, onComplete })
// onUpdate 收到当前值（number），由页面自行 setData。
// 循环带明确终止条件，不会无限跑。
function countUp(opts) {
  const from = Number(opts.from) || 0
  const to = Number(opts.to) || 0
  const duration = opts.duration === undefined ? 520 : opts.duration
  const onUpdate = opts.onUpdate || function () {}
  const onComplete = opts.onComplete

  // 降级：直接给终值
  if (reduceMotion || duration <= 0 || from === to) {
    onUpdate(to)
    if (onComplete) onComplete()
    return
  }

  const start = Date.now()
  const delta = to - from
  let timer = null

  function frame() {
    const t = Math.min((Date.now() - start) / duration, 1)
    const v = from + delta * easeOutQuad(t)
    onUpdate(v)
    if (t < 1) {
      timer = setTimeout(frame, 16)
    } else {
      timer = null
      if (onComplete) onComplete()
    }
  }

  frame()

  // 返回取消函数，页面 onUnload 时调用，避免离开页面后仍在更新
  return function cancel() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }
}

/* ---------------- stagger 错峰 ---------------- */

// 第 index 项应延迟多少毫秒。逐项 +step，并封顶 cap，
// 避免长列表最后几项等太久（对应 gsap 的 stagger 封顶实践）。
function staggerDelay(index, step, cap) {
  const s = step === undefined ? 40 : step
  const c = cap === undefined ? 240 : cap
  if (reduceMotion) return 0
  return Math.min(index * s, c)
}

// 为数组批量附加 delay 字段，供 wxml 里 animation-delay 使用
function withStagger(list, step, cap) {
  const s = step === undefined ? 40 : step
  const c = cap === undefined ? 240 : cap
  return (list || []).map(function (item, i) {
    return Object.assign({}, item, { delay: staggerDelay(i, s, c) })
  })
}

/* ---------------- 数值格式化 ---------------- */

// 用于滚动过程中的显示：保留两位、去掉多余的 .00
function fmtRolling(v, decimals) {
  const d = decimals === undefined ? 2 : decimals
  const n = Number(v) || 0
  let s = n.toFixed(d)
  if (s.indexOf('.') >= 0) {
    s = s.replace(/0+$/, '').replace(/\.$/, '')
  }
  return s
}

module.exports = {
  easeOutQuad,
  easeOutBack,
  initReduceMotion,
  isReduceMotion,
  setReduceMotion,
  countUp,
  staggerDelay,
  withStagger,
  fmtRolling
}
