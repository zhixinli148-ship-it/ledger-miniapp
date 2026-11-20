// app.js
const store = require('./utils/store.js')
const anim = require('./utils/anim.js')

App({
  globalData: {
    // 减弱动态效果开关，页面可读取
    reduceMotion: false
  },

  onLaunch() {
    // 初始化本地账本数据
    store.init()

    // 初始化动效降级偏好
    const reduce = anim.initReduceMotion()
    this.globalData.reduceMotion = reduce
  }
})
