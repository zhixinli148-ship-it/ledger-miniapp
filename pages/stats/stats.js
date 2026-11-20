const store = require('../../utils/store.js')
const anim = require('../../utils/anim.js')

// 排行入场错峰：逐项 45ms，封顶 360ms
const STAGGER_STEP = 45
const STAGGER_CAP = 360

Page({
  data: {
    statusBarHeight: 20,
    navHeight: 88,
    reduceMotion: false,
    navScrolled: false,
    // 内容块的 wx:key，每次进入页面换一个值以重播入场动画
    runs: [0],
    month: '',
    monthLabel: '',
    type: 'expense',
    totalText: '0',
    count: 0,
    dailyAvg: '0',
    groups: []
  },

  onLoad() {
    const sys = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const statusBarHeight = sys.statusBarHeight || 20
    const month = store.monthStr()
    const app = getApp()
    this.setData({
      statusBarHeight,
      navHeight: statusBarHeight + 56,
      reduceMotion: !!(app && app.globalData && app.globalData.reduceMotion),
      month,
      monthLabel: this.fmtMonth(month)
    })
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
    // 每次切到本页都重播：条形从 0 长出来 + 排行错峰入场。
    // 切月份 / 切收支类型走 refresh(false)，只更新数据不重播。
    this.refresh(true)
    // 首次进入由初次挂载自带的入场动画负责，不必重播
    if (this._entered) this.replayEnter()
    else this._entered = true
  },

  // 换掉内容块的 wx:key，整块重建 —— 新节点带着 CSS 动画出生，从头播一遍。
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

  fmtMonth(m) {
    const p = m.split('-')
    return `${p[0]}年${parseInt(p[1], 10)}月`
  },

  onMonthChange(e) {
    this.setData({ month: e.detail.value, monthLabel: this.fmtMonth(e.detail.value) },
      () => this.refresh(false))
  },

  switchType(e) {
    const type = e.currentTarget.dataset.type
    if (type === this.data.type) return
    this.setData({ type }, () => this.refresh(false))
  },

  // animate=true 时，条形从 scaleX(0) 过渡到目标值
  refresh(animate) {
    const { month, type } = this.data
    const monthRecords = store.list().filter(r => (r.date || '').slice(0, 7) === month)
    const typed = monthRecords.filter(r => r.type === type)
    const total = typed.reduce((s, r) => s + (Number(r.amount) || 0), 0)
    const rounded = Math.round(total * 100) / 100

    const play = animate && !anim.isReduceMotion()

    const base = store.groupByCategory(monthRecords, type).map((g, i) => ({
      categoryId: g.categoryId,
      name: g.name,
      emoji: g.emoji,
      percent: g.percent,
      valueText: store.fmtAmount(g.value),
      target: g.percent / 100,
      scale: play ? 0 : g.percent / 100,
      delay: anim.staggerDelay(i, STAGGER_STEP, STAGGER_CAP)
    }))

    const now = new Date()
    const isCurrent = month === store.monthStr()
    const days = isCurrent
      ? now.getDate()
      : new Date(parseInt(month.slice(0, 4), 10), parseInt(month.slice(5, 7), 10), 0).getDate()
    const dailyAvg = days > 0 ? Math.round((rounded / days) * 100) / 100 : 0

    this.setData({
      totalText: store.fmtAmount(rounded),
      count: typed.length,
      dailyAvg: store.fmtAmount(dailyAvg),
      groups: base
    }, () => {
      if (!play) return
      // 下一帧再写入目标值，让 transform 过渡生效
      setTimeout(() => {
        this.setData({ groups: base.map(g => ({ ...g, scale: g.target })) })
      }, 60)
    })
  },

  goAdd() {
    wx.switchTab({ url: '/pages/add/add' })
  }
})
