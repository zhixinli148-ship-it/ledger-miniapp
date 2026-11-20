const store = require('../../utils/store.js')
const anim = require('../../utils/anim.js')

// 列表错峰：逐项 40ms，封顶 400ms
const STAGGER_STEP = 40
const STAGGER_CAP = 400

Page({
  data: {
    statusBarHeight: 20,
    navHeight: 88,
    reduceMotion: false,
    navScrolled: false,
    // 内容块的 wx:key，每次进入页面换一个值以重播入场动画
    runs: [0],
    summary: { income: '0', expense: '0', balance: '0' },
    displayBalance: '0',
    groups: [],
    totalCount: 0
  },

  onLoad() {
    const sys = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const statusBarHeight = sys.statusBarHeight || 20
    const app = getApp()
    this.setData({
      statusBarHeight,
      navHeight: statusBarHeight + 56,
      reduceMotion: !!(app && app.globalData && app.globalData.reduceMotion)
    })
    this._cancelRoll = null
    this._lastBalance = 0
  },

  onUnload() {
    if (this._cancelRoll) this._cancelRoll()
  },

  onHide() {
    if (this._cancelRoll) this._cancelRoll()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
    this.refresh()
    // 首次进入由初次挂载自带的入场动画负责，不必重播
    if (this._entered) this.replayEnter()
    else this._entered = true
  },

  // 从其他页面切回本页时重播一次入场动画。
  // 换掉内容块的 wx:key，整块重建 —— 新节点带着 CSS 动画出生，自然从头播。
  // 比"摘掉动画类再挂回去"稳：不会有一帧内容已可见又突然消失的闪动。
  replayEnter() {
    if (this.data.reduceMotion) return
    this._runId = (this._runId || 0) + 1
    this.setData({ runs: [this._runId] })
  },

  // 顶部栏过渡：只在跨过阈值时切一次，滚动过程中不反复 setData
  onPageScroll(e) {
    const scrolled = e.scrollTop > 10
    if (scrolled === this.data.navScrolled) return
    this.setData({ navScrolled: scrolled })
  },

  onPullDownRefresh() {
    this.refresh()
    wx.stopPullDownRefresh()
  },

  refresh() {
    const s = store.summaryOfMonth(store.monthStr())
    const records = store.list()

    // 组装渲染数据；错峰延迟跨分组连续递增
    let flatIndex = 0
    const groups = store.groupByDate(records).map(g => {
      const items = g.items.map(r => {
        const cat = store.categoryOf(r.categoryId)
        const delay = anim.staggerDelay(flatIndex, STAGGER_STEP, STAGGER_CAP)
        flatIndex++
        return {
          id: r.id,
          type: r.type,
          emoji: cat.emoji,
          catName: cat.name,
          note: r.note || '',
          amountText: store.fmtAmount(r.amount),
          delay
        }
      })
      return {
        date: g.date,
        dateLabel: store.fmtDate(g.date),
        dayIncome: g.dayIncome,
        dayExpense: g.dayExpense,
        dayIncomeText: store.fmtAmount(g.dayIncome),
        dayExpenseText: store.fmtAmount(g.dayExpense),
        items
      }
    })

    this.setData({
      summary: {
        income: store.fmtAmount(s.income),
        expense: store.fmtAmount(s.expense),
        balance: store.fmtAmount(s.balance)
      },
      groups,
      totalCount: records.length
    })

    this.rollBalance(s.balance)
  },

  // 结余数字滚动（一次性短动画，带取消句柄）
  rollBalance(target) {
    if (this._cancelRoll) this._cancelRoll()
    const from = this._lastBalance
    const to = Number(target) || 0
    this._lastBalance = to

    this._cancelRoll = anim.countUp({
      from,
      to,
      duration: 520,
      onUpdate: (v) => {
        this.setData({ displayBalance: store.fmtAmount(v) })
      },
      onComplete: () => {
        this.setData({ displayBalance: store.fmtAmount(to) })
      }
    })
  },

  goDetail(e) {
    wx.navigateTo({ url: `/pages/detail/detail?id=${e.currentTarget.dataset.id}` })
  },

  goAdd() {
    wx.switchTab({ url: '/pages/add/add' })
  },

  onShareAppMessage() {
    return { title: '我的账本 · 清爽记账', path: '/pages/index/index' }
  }
})
