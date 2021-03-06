//index.js
//获取应用实例
const app = getApp()
var direction = null
const stdA = app.stdA
var note = wx.createInnerAudioContext()
const MAX_LEVEL = 30
const MAX_LIFE = 3
var ready = false
var retry = true
var originX = 0
var originY = 0
var moveDirection = 1
var setMoveDirection = true
var window = null
var lastRenderTime = new Date().getTime()
var selectDown = false
var pageReady = false
var stdATimer = null
var noteTimer = null
Page({
  data: {
    score: 0,
    level: 1,
    lifes: MAX_LIFE,
    ratio: 100,
    noteOnePlaying: 1,
    noteTwoPlaying: 2,
    firstTimePlay: app.globalData.firstTimePlay,
    guideOpacity: 2,
    selectX: 0,
    selectY: 0,
    allowAllTransitions: false,
    answerMatch: {right: 0,wrong: 0,none: 1},
    pageOpacity: 0,
    selectMove: 1,
    guidePage: []
  },
  clearFirstTimePlay(){
    this.setData({
      firstTimePlay: false
    })
    app.globalData.firstTimePlay = this.data.firstTimePlay
    wx.setStorageSync('firstTimePlay', this.data.firstTimePlay)
    this.start()
    wx.setNavigationBarColor({frontColor: '#ffffff',backgroundColor: '#2eb88d'})
  },
  iKnow(){
    if(!this.data.guidePage[2]){
      if(!this.data.guidePage[1]){
        this.setData({
          guidePage: [false, true, false]
        })
      }
      else {
        this.setData({
          guidePage: [false, false, true],
        })
      }
    }
    else {
      this.setData({
        guidePage: [false, false, false],
        guideOpacity: 0,
        pageOpacity: 1
      })
      setTimeout(this.clearFirstTimePlay, 250)
    }
  },
  stopPlay() {
    if (this.data.noteOnePlaying) stdA.stop()
    if (this.data.noteTwoPlaying) note.stop()
    clearTimeout(stdATimer)
    clearTimeout(noteTimer)
    this.setData({
      noteOnePlaying: 2,
      noteTwoPlaying: 2,
    })
  },
  selectHigh() {
    selectDown = true
    this.stopPlay()
    retry = true
    this.judge(1)
  },
  selectLow() {
    selectDown = true
    this.stopPlay()
    retry = true
    this.judge(-1)
  },
  selectRetry() {
    selectDown = true
    retry = false
    this.stopPlay()
    this.playNotes(true)
    selectDown = false
  },
  triggerPageOpacity() {
    this.setData({
      pageOpacity: 1 - this.data.pageOpacity
    })
  },
  onLoad: function () {
    this.setData({
      score: 0,
      level: 1,
      lifes: MAX_LIFE,
      ratio: 100,
      firstTimePlay: app.globalData.firstTimePlay,
    })
    retry = true
    pageReady = false
    if (!app.globalData.firstTimePlay) {
      this.start()
    }
    else this.showGuide()
  },
  onUnload: function () {
    this.stopPlay()
    retry = true
    this.triggerPageOpacity()
  },
  onShow: function () {
    if (!app.globalData.firstTimePlay) {
      setTimeout(this.triggerPageOpacity, 250)
    }else{
      this.showGuide()
    }
    if(pageReady && retry !== null){
      retry = null
      this.stopPlay()
      this.playNotes(true)
    } else if(pageReady && retry === null){
      this.setData({
        noteOnePlaying: 2,
        noteTwoPlaying: 2,
      })
    }
  },
  onHide: function () {
    if (this.data.noteOnePlaying) stdA.stop()
    if (this.data.noteTwoPlaying) note.stop()
    clearTimeout(stdATimer)
    clearTimeout(noteTimer)
    this.setData({
      noteOnePlaying: 0,
      noteTwoPlaying: 0,
      pageOpacity: 0
    })
  },
  showGuide(){
    wx.setNavigationBarColor({ frontColor: '#ffffff', backgroundColor: '#259372' })
    var guidePage = [true, false, false]
    this.setData({
      guidePage: guidePage,
      pageOpacity: 0.5
    })
  },
  start() {
    this.setData({
      noteOnePlaying: 0,
      noteTwoPlaying: 0,
      selectX: 0,
      selectY: 0,
      allowAllTransitions: false,
      selectMove: 0
    })
    wx.getSystemInfo({
      success: res => {
        window = { height: res.windowHeight, width: res.windowWidth }
      }
    })
    stdA.onPlay(() => { this.setData({ noteOnePlaying: 1 }) })
    stdA.onEnded(() => { this.setData({ noteOnePlaying: 2, selectMove: 1 }) })
    /*note.obeyMuteSwitch = false
    note.onPlay(() => {
      this.setData({ ready: true, noteTwoPlaying: 1 })
      ready = true
    })
    note.onEnded(() => { this.setData({ noteTwoPlaying: 2 }) })*/
    setTimeout(this.playNotes, 500)
  },
  getOrigin: function(e) {
    originX = e.touches[0].clientX
    originY = e.touches[0].clientY
    this.setData({ allowAllTransitions: false })
  },
  selectAnswer: function (e) {
    if (ready) {
      var renderInterval = new Date().getTime() - lastRenderTime
      if (renderInterval > 10) {
        var dX = e.touches[0].clientX - originX
        var dY = e.touches[0].clientY - originY
        var selectX = (dX > window.width / -4) ? dX : (window.width / -4 )
        selectX = (selectX > 0) ? 0 : selectX
        var selectY = (Math.abs(dY) < window.height * 0.16) ? dY : (window.height * 0.16 * Math.abs(dY) / dY)
        if (setMoveDirection) {
          if (Math.abs(dX) > Math.abs(dY)) moveDirection = 0
          else moveDirection = 1
          setMoveDirection = false
        }
        if (!retry) moveDirection = 1
        if (!moveDirection) selectY = 0
        else selectX = 0
        this.setData({ selectX: selectX, selectY: selectY })
        lastRenderTime = lastRenderTime + renderInterval
      }
    }
  },
  clearMove(){
    this.setData({
      selectX: 0,
      selectY: 0,
      originX: 0,
      originY: 0,
    })
    if (selectDown){
      this.setData({
        noteOnePlaying: 0,
        noteTwoPlaying: 0
      })
    }
  },
  clearDirection: function (e) {
    var selectX = this.data.selectX
    var selectY = this.data.selectY
    if (selectY < 20 - window.height * 0.16) {
      this.selectHigh()
    } else if (selectY > window.height * 0.16 - 20) {
      this.selectLow()
    } else if (selectX < 20 - window.width / 4) {
      this.selectRetry()
    }
    this.setData({ allowAllTransitions: true })
    setMoveDirection = true
    if (this.data.answerMatch.none) {
      this.clearMove()
    }
    else if(this.data.answerMatch.right) {
      setTimeout(this.clearMove, 200)
    }
    else{
      setTimeout(this.clearMove, 400)
    }
  },
  judge: function (answer) {
    var score = this.data.score
    var level = this.data.level
    var lifes = this.data.lifes
    var answerMatch = { right: 0,wrong: 0,none: 0}
    if (direction == answer) {
      answerMatch.right = 1
      score += 2 * level  //Math.max(10, Math.ceil(level / 5) * 10)
      level = level == MAX_LEVEL ? 'Master' : level + 1
    }
    else {
      answerMatch.wrong = 1
      score = Math.max(0, score - level)  //Math.max(0, score - Math.max(5, Math.ceil(level / 5) * 5))
      level = lifes > 1 ? Math.max(0, level - 1) : level
      lifes = lifes - 1
    }
    this.setData({
      answerMatch: answerMatch,
      score: score,
      level: level,
      lifes: lifes,
      ratio: this.ratioChart[level == 'Master' ? MAX_LEVEL : level],
    })
    if (lifes <= 0 || level == 'Master') {
      if (level == 'Master')
      {
        if (lifes >= 2) score += 45
        if (lifes >= 3) score += 49
      }
      app.globalData.scoreboard = {
        status: lifes <= 0 ? 'GO' : 'GC',
        level: level,
        score: score,
        ratio: this.data.ratio
      }
      setTimeout(function () {
        wx.redirectTo({
          url: '../end/end',
        })
      }, 500 + answerMatch.right * 100 + answerMatch.wrong * 200)
    }
    else{
      setTimeout(this.playNotes, 500 + answerMatch.right * 100 + answerMatch.wrong * 200)
    }
  },
  playNotes: function (isRetry = false) {
    var answerMatch = { right: 0,wrong: 0,none: 1 }
    ready = false
    selectDown = false
    this.setData({
      noteOnePlaying: 0,
      noteTwoPlaying: 0,
      selectMove: 0,
      answerMatch: answerMatch
    })
    if (!isRetry) direction = Math.round(Math.random()) * 2 - 1
    console.log(this.data.level, this.data.score, direction, isRetry)
    //note.src = app.globalData.audioPosition + '/lv' + this.data.level + (direction == -1 ? '_l' : '_h') + '.mp3'
    note = direction == -1 ? app.globalData.notes[this.data.level].l : app.globalData.notes[this.data.level].h
    note.obeyMuteSwitch = false
    note.onPlay(() => {
      this.setData({ ready: true, noteTwoPlaying: 1 })
      ready = true
    })
    note.onEnded(() => { this.setData({ noteTwoPlaying: 2 }) })
    stdATimer = setTimeout(function () {
      console.log('Playing ' + stdA.src)
      stdA.play()
      pageReady = true
      noteTimer = setTimeout(function () {
        console.log('Playing ' + note.src)
        note.play()
      }, 1618)
    }, 618)  
  },
  ratioChart: [
    200.00,
    100.00,
    50.00,
    33.33,
    25.00,
    20.00,
    16.67,
    12.50,
    10.00,
    8.33,
    7.14,
    6.25,
    5.26,
    4.55,
    4.00,
    3.57,
    3.23,
    2.86,
    2.56,
    2.33,
    2.13,
    1.96,
    1.79,
    1.64,
    1.52,
    1.41,
    1.32,
    1.22,
    1.14,
    1.06,
    1.00
  ]
})