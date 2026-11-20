// 自定义底部导航
// 参照 iOS 系统「电话」App 的底栏：胶囊主导航 + 激活项高亮滑块 + 独立圆形动作按钮
// 结构：胶囊内只放主导航项，主操作（记一笔）拆成独立的圆形按钮，与胶囊分离
Component({
  data: {
    selected: 0,
    reduceMotion: false,
    // 胶囊内的主导航（selected 0 / 1）
    tabs: [
      { pagePath: '/pages/index/index', text: '明细', icon: 'list' },
      { pagePath: '/pages/stats/stats', text: '统计', icon: 'chart' }
    ],
    // 独立圆形按钮（selected 2）
    action: { pagePath: '/pages/add/add', text: '记一笔' }
  },

  attached() {
    const app = getApp()
    this.setData({
      reduceMotion: !!(app && app.globalData && app.globalData.reduceMotion)
    })
  },

  methods: {
    switchTab(e) {
      const { path, index } = e.currentTarget.dataset
      if (Number(index) === this.data.selected) return
      wx.switchTab({ url: path })
    }
  }
})
