const store = require('../../utils/store.js')
const anim = require('../../utils/anim.js')

// 分类入场错峰：逐项 30ms，封顶 240ms
const STAGGER_STEP = 30
const STAGGER_CAP = 240

Page({
  data: {
    statusBarHeight: 20,
    navHeight: 88,
    reduceMotion: false,
    navScrolled: false,
    // 内容块的 wx:key，每次进入页面换一个值以重播入场动画
    runs: [0],
    type: 'expense',
    amount: '',
    note: '',
    categoryId: '',
    categories: [],
    date: '',
    dateLabel: '今天',
    maxDate: '',
    canSave: false,
    autoFocus: true
  },

  onLoad() {
    const sys = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const statusBarHeight = sys.statusBarHeight || 20
    const app = getApp()
    const today = store.todayStr()
    this.setData({
      statusBarHeight,
      navHeight: statusBarHeight + 56,
      reduceMotion: !!(app && app.globalData && app.globalData.reduceMotion),
      date: today,
      dateLabel: '今天',
      maxDate: today,
      categories: this.buildCategories('expense')
    })
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
    const today = store.todayStr()
    this.setData({
      amount: '',
      note: '',
      categoryId: '',
      type: 'expense',
      date: today,
      dateLabel: '今天',
      categories: this.buildCategories('expense'),
      canSave: false,
      autoFocus: true
    })
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

  // 按类型过滤并附加错峰延迟
  buildCategories(type) {
    const list = store.CATEGORIES.filter(c => c.type === type)
    return anim.withStagger(list, STAGGER_STEP, STAGGER_CAP)
  },

  switchType(e) {
    const type = e.currentTarget.dataset.type
    if (type === this.data.type) return
    this.setData({
      type,
      categoryId: '',
      categories: this.buildCategories(type)
    }, this.checkCanSave)
  },

  onAmountInput(e) {
    let v = e.detail.value
    v = v.replace(/[^\d.]/g, '')
    const parts = v.split('.')
    if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('')
    if (parts[1] && parts[1].length > 2) {
      v = parts[0] + '.' + parts[1].slice(0, 2)
    }
    this.setData({ amount: v }, this.checkCanSave)
  },

  onNoteInput(e) {
    this.setData({ note: e.detail.value })
  },

  pickCategory(e) {
    this.setData({ categoryId: e.currentTarget.dataset.id }, this.checkCanSave)
  },

  onDateChange(e) {
    const date = e.detail.value
    this.setData({ date, dateLabel: store.fmtDate(date) })
  },

  checkCanSave() {
    const amt = parseFloat(this.data.amount)
    this.setData({ canSave: amt > 0 && !!this.data.categoryId })
  },

  save() {
    if (!this.data.canSave) {
      wx.showToast({ title: '请填写金额并选分类', icon: 'none' })
      return
    }
    const amt = Math.round(parseFloat(this.data.amount) * 100) / 100
    store.add({
      type: this.data.type,
      amount: amt,
      categoryId: this.data.categoryId,
      note: this.data.note.trim(),
      date: this.data.date
    })

    wx.showToast({ title: '已记录', icon: 'success' })
    setTimeout(() => {
      wx.switchTab({ url: '/pages/index/index' })
    }, 600)
  }
})
