// utils/store.js —— 账本数据层（基于 wx.storage 本地持久化）

const KEY_RECORDS = 'ledger_records_v1'
const KEY_SEED_PURGED = 'ledger_seed_purged_v1'

// 早期版本首次运行会写入 4 条示例数据，这里一次性清掉。
// 按 类型 + 金额 + 分类 + 备注 精确匹配，不会误删用户自己记的账。
const SEED_SIGNATURES = [
  ['expense', 28.5,  'food',      '午饭 · 牛肉面'],
  ['expense', 6,     'transport', '地铁通勤'],
  ['income',  12000, 'salary',    '九月工资'],
  ['expense', 219,   'shopping',  '一双跑鞋']
]

// 内置分类（emoji + 名称 + 类型）
const CATEGORIES = [
  // 支出
  { id: 'food',     name: '餐饮', emoji: '🍜', type: 'expense' },
  { id: 'transport',name: '交通', emoji: '🚇', type: 'expense' },
  { id: 'shopping', name: '购物', emoji: '🛍️', type: 'expense' },
  { id: 'home',     name: '居住', emoji: '🏠', type: 'expense' },
  { id: 'fun',      name: '娱乐', emoji: '🎮', type: 'expense' },
  { id: 'health',   name: '医疗', emoji: '💊', type: 'expense' },
  { id: 'study',    name: '学习', emoji: '📚', type: 'expense' },
  { id: 'other_e',  name: '其他', emoji: '✨', type: 'expense' },
  // 收入
  { id: 'salary',   name: '工资', emoji: '💰', type: 'income' },
  { id: 'bonus',    name: '奖金', emoji: '🎁', type: 'income' },
  { id: 'invest',   name: '理财', emoji: '📈', type: 'income' },
  { id: 'other_i',  name: '其他', emoji: '✨', type: 'income' }
]

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function todayStr() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

const store = {
  CATEGORIES,

  init() {
    store._purgeSeed()
    if (!Array.isArray(wx.getStorageSync(KEY_RECORDS))) {
      wx.setStorageSync(KEY_RECORDS, [])
    }
  },

  // 清掉早期版本写进去的示例数据，只跑一次
  _purgeSeed() {
    if (wx.getStorageSync(KEY_SEED_PURGED)) return
    const arr = wx.getStorageSync(KEY_RECORDS)
    if (Array.isArray(arr) && arr.length) {
      const isSeed = (r) => SEED_SIGNATURES.some((s) =>
        r.type === s[0] &&
        Number(r.amount) === s[1] &&
        r.categoryId === s[2] &&
        (r.note || '') === s[3]
      )
      wx.setStorageSync(KEY_RECORDS, arr.filter((r) => !isSeed(r)))
    }
    wx.setStorageSync(KEY_SEED_PURGED, 1)
  },

  list() {
    const arr = wx.getStorageSync(KEY_RECORDS) || []
    // 按日期倒序，同日按创建时间倒序
    return arr.slice().sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1
      return (b.createdAt || 0) - (a.createdAt || 0)
    })
  },

  add(record) {
    const arr = wx.getStorageSync(KEY_RECORDS) || []
    const item = {
      id: uid(),
      createdAt: Date.now(),
      ...record
    }
    arr.push(item)
    wx.setStorageSync(KEY_RECORDS, arr)
    return item
  },

  remove(id) {
    const arr = wx.getStorageSync(KEY_RECORDS) || []
    const next = arr.filter(r => r.id !== id)
    wx.setStorageSync(KEY_RECORDS, next)
  },

  get(id) {
    const arr = wx.getStorageSync(KEY_RECORDS) || []
    return arr.find(r => r.id === id) || null
  },

  categoryOf(categoryId) {
    return CATEGORIES.find(c => c.id === categoryId) ||
      { id: categoryId, name: '未分类', emoji: '❔', type: 'expense' }
  },

  // 汇总：总收入 / 总支出 / 结余
  summary(records) {
    const list = records || store.list()
    let income = 0, expense = 0
    list.forEach(r => {
      const v = Number(r.amount) || 0
      if (r.type === 'income') income += v
      else expense += v
    })
    return {
      income: Math.round(income * 100) / 100,
      expense: Math.round(expense * 100) / 100,
      balance: Math.round((income - expense) * 100) / 100
    }
  },

  // 指定月份汇总（month: 'YYYY-MM'）
  summaryOfMonth(month) {
    const list = store.list().filter(r => (r.date || '').slice(0, 7) === month)
    return store.summary(list)
  },

  // 按分类聚合支出（用于统计页）
  groupByCategory(records, type = 'expense') {
    const list = records || store.list()
    const map = {}
    list.filter(r => r.type === type).forEach(r => {
      const cid = r.categoryId || 'unknown'
      if (!map[cid]) map[cid] = 0
      map[cid] += Number(r.amount) || 0
    })
    const total = Object.values(map).reduce((s, v) => s + v, 0) || 1
    return Object.keys(map).map(cid => {
      const cat = store.categoryOf(cid)
      const value = Math.round(map[cid] * 100) / 100
      return {
        categoryId: cid,
        name: cat.name,
        emoji: cat.emoji,
        value,
        percent: Math.round((map[cid] / total) * 1000) / 10
      }
    }).sort((a, b) => b.value - a.value)
  },

  // 把明细按日期分组，供列表渲染
  groupByDate(records) {
    const list = records || store.list()
    const groups = []
    const idx = {}
    list.forEach(r => {
      const d = r.date || ''
      if (idx[d] === undefined) {
        idx[d] = groups.length
        groups.push({ date: d, items: [], dayIncome: 0, dayExpense: 0 })
      }
      const g = groups[idx[d]]
      g.items.push(r)
      const v = Number(r.amount) || 0
      if (r.type === 'income') g.dayIncome += v
      else g.dayExpense += v
    })
    return groups
  },

  todayStr,
  monthStr() {
    return todayStr().slice(0, 7)
  },
  fmtAmount(n) {
    const v = Number(n) || 0
    return v.toFixed(2).replace(/\.00$/, '')
  },
  // 友好日期：今天 / 昨天 / M月D日
  fmtDate(dateStr) {
    const t = todayStr()
    if (dateStr === t) return '今天'
    const d = new Date(dateStr.replace(/-/g, '/'))
    const yd = new Date()
    yd.setDate(yd.getDate() - 1)
    const yStr = `${yd.getFullYear()}-${String(yd.getMonth() + 1).padStart(2, '0')}-${String(yd.getDate()).padStart(2, '0')}`
    if (dateStr === yStr) return '昨天'
    return `${d.getMonth() + 1}月${d.getDate()}日`
  }
}

module.exports = store
