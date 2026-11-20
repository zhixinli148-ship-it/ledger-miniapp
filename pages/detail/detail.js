const store = require('../../utils/store.js')

Page({
  data: {
    statusBarHeight: 20,
    navHeight: 88,
    reduceMotion: false,
    navScrolled: false,
    record: null
  },

  onLoad(options) {
    const sys = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const statusBarHeight = sys.statusBarHeight || 20
    const app = getApp()
    this.setData({
      statusBarHeight,
      navHeight: statusBarHeight + 56,
      reduceMotion: !!(app && app.globalData && app.globalData.reduceMotion)
    })

    const r = store.get(options.id)
    if (!r) return

    const cat = store.categoryOf(r.categoryId)
    const d = new Date(r.createdAt || Date.now())
    const createdText =
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ` +
      `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

    this.setData({
      record: {
        id: r.id,
        type: r.type,
        typeLabel: r.type === 'income' ? '收入' : '支出',
        emoji: cat.emoji,
        catName: cat.name,
        amountText: store.fmtAmount(r.amount),
        note: r.note || '',
        date: r.date,
        createdText
      }
    })
  },

  // 顶部栏过渡：只在跨过阈值时切一次，滚动过程中不反复 setData
  onPageScroll(e) {
    const scrolled = e.scrollTop > 10
    if (scrolled === this.data.navScrolled) return
    this.setData({ navScrolled: scrolled })
  },

  goBack() {
    wx.navigateBack({
      fail() {
        wx.switchTab({ url: '/pages/index/index' })
      }
    })
  },

  remove() {
    // 破坏性操作先确认
    wx.showModal({
      title: '删除记录',
      content: '删除后无法恢复，确定吗？',
      confirmText: '删除',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          store.remove(this.data.record.id)
          wx.showToast({ title: '已删除', icon: 'success' })
          setTimeout(() => this.goBack(), 520)
        }
      }
    })
  }
})
