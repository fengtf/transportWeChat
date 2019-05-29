var QQMapWX = require('../../libs/qqmap-wx-jssdk.js');
var qqmapsdk;
Page({
  data: {
    latitude: 39.90,
    longitude: 116.38,
    markers: [],
    tagText:'正在搜索...',
    receiveAddress:'请选择',
    receiveLatitude:0,
    receiveLongitude:0,
    modify:1,
    centerShow:true,
    price:0,
    time:'0分钟',
    infoShow:false,
    carryLabel:'不需要',
    name:'',
    tel:'',
    serviceTime:'请选择',
    endName:'',
    endTel:'',
    endServiceTime:'请选择',
    prompt:false,
    openId:''
  },
  onLoad:function(){
    // 实例化API核心类
    qqmapsdk = new QQMapWX({
      key: 'G4OBZ-ZRQKV-VMIP2-UD33C-2JR7E-53FUS'
    });
    // 获取本地坐标
    wx.getLocation({
      type:'wgs84',
      success:(res)=>{
        const latitude = res.latitude;
        const longitude = res.longitude;
        this.setData({
          latitude,
          longitude
        })
      }
    });
    // 获取用户openid
    wx.cloud.callFunction({
      name: 'login',
      success: res => {
        this.setData({
          openId:res.result.openid
        })
      },
      fail: err => {
        
      }
    })

  },
  onReady:function(){
    this.mapCtx = wx.createMapContext('myMap');
  },
  change:function(){
    if (this.data.modify){
      this.mapCtx.getCenterLocation({
        success: (res) => {
          // 获取坐标地址
          qqmapsdk.reverseGeocoder({
            location: {
              latitude: res.latitude,
              longitude: res.longitude
            },
            success: (res) => {
              this.setData({
                tagText: res.result.formatted_addresses.recommend
              })
            },
            fail: function (res) {
              // console.log(res);
            },
            complete: function (res) {
            }
          });
        }
      })
    }
  },
  // 先择发货地址
  sendAddress:function(){
    if (this.data.modify){ //没有选择收货地址
      wx.chooseLocation({
        success: (res) => {
          this.setData({
            tagText: res.address,
            latitude: res.latitude,
            longitude: res.longitude
          })
        }
      })

    }else{ //已经选择了收货地址
      wx.chooseLocation({
        success: (res) => {
          this.setData({
            tagText: res.address,
            latitude: res.latitude,
            longitude: res.longitude,
            markers: [
              {
                id: 1,
                latitude: res.latitude,
                longitude: res.longitude,
                iconPath: '../../image/start.png'
              },
              {
                id: 2,
                latitude: this.data.receiveLatitude,
                longitude: this.data.receiveLongitude,
                iconPath: '../../image/end.png'
              }
            ]
          })
        },
        complete:(res)=>{
          // 地图显示所有坐标
          this.mapCtx.includePoints({
            points: [
              {
                longitude: res.longitude,
                latitude: res.latitude
              },
              {
                longitude: this.data.receiveLongitude,
                latitude: this.data.receiveLatitude
              }
            ]
          })
          // 展示价格
          this.priceCalculation();
        }
      })
    }
    
  },
  // 选择收货地址
  receiveAddress:function(){
    wx.chooseLocation({
      success:(res)=>{
        this.setData({
          receiveAddress: res.address,
          receiveLatitude: res.latitude,
          receiveLongitude: res.longitude,
          modify:0,
          centerShow:false,
          markers: [
            {
              id: 1,
              latitude: this.data.latitude,
              longitude: this.data.longitude,
              iconPath: '../../image/start.png'
            },
            {
              id: 2,
              latitude: res.latitude,
              longitude: res.longitude,
              iconPath: '../../image/end.png'
            }
          ]
        })
        // 地图显示所有坐标
        this.mapCtx.includePoints({
          points:[
            {
              longitude: this.data.longitude,
              latitude: this.data.latitude
            },
            {
              longitude: res.longitude,
              latitude: res.latitude
            }
          ]
        })
        // 展示价格
        this.priceCalculation();
      }
    })
  },
  // 价格计算
  priceCalculation:function(){
    qqmapsdk.calculateDistance({
      mode:'driving',
      from:{
        latitude: this.data.latitude,
        longitude: this.data.longitude
      },
      to: [{
        latitude: this.data.receiveLatitude,
        longitude: this.data.receiveLongitude
      }],
      success:(res)=>{
        let distance = res.result.elements[0].distance;
        let s = res.result.elements[0].duration;
        let km = distance/1000;
        let price = 0;
        let time = this.formatDuring(s);
        // 根据公里算价格
        if(km > 5){
          price = 150 + (km - 5)*6
        }else{
          price = 150
        }
        this.setData({
          price: price.toFixed(0),
          time:time
        })
        if(!this.data.endName){
          this.showInfo();
        }
      },
      fail: function (res) {
        console.log(res);
      },
      complete: function (res) {
//         console.log(res);
      }
    });
  },
  // 将秒转化为时间
  formatDuring:(s)=>{
    var hours = parseInt((s % (60 * 60 * 24)) / (60 * 60));
    var minutes = parseInt((s % (60 * 60)) / ( 60));
    var seconds = (s % 60) / 1000;
    if (hours == 0){
      return minutes + "分钟 ";
    }else{
      return hours + "小时 " + minutes + "分钟 ";
    }
    
  },
  // 选择时间
  bindDateChange:function(val){
    this.setData({
      serviceTime: val.detail.value
    })
  },
  confirmClick:function(){
    if(this.data.name && this.data.tel && this.data.serviceTime != "请选择"){
      this.setData({
        endName: this.data.name,
        endTel: this.data.tel,
        endServiceTime: this.data.serviceTime,
        infoShow: false
      })
    }else{
      this.setData({
        prompt:true
      })
    }
  },
  // 关闭填写信息
  closeInfo:function(){
    this.setData({
      infoShow:false
    })
  },
  isCarry:function(a){
    this.setData({
      carryLabel:a.detail.value == true ? '需要':'不需要'
    })
  },
  // 打开信息页
  openInfo:function(){
    this.showInfo();
  },
  changeName:function(data){
    this.setData({
      name:data.detail.detail.value
    })
  },
  changeTel:function(data){
    this.setData({
      tel: data.detail.detail.value
    })
  },
  // 显示信息
  showInfo:function(){
    this.setData({
      infoShow:true,
      name:this.data.endName,
      tel:this.data.endTel,
      service:this.data.endServiceTime,
      prompt:false
    })
  },
  toInstructions:function(){
    wx.navigateTo({
      url: '../instructions/instructions'
    })
  },
  // 提交获取formid
  formSubmit:function(e){
    if (this.data.price == 0){
      wx.showToast({
        icon: 'none',
        title: '请选择收货位置',
      })
    }else{
      if (!this.data.endName) {
        this.showInfo();
      } else {
        wx.showLoading({
          title: '提交中..',
        })
        wx.cloud.callFunction({
          name: 'sendMessage',
          data: {
            formId: e.detail.formId,
            name: this.data.endName,
            tel: this.data.endTel,
            time: this.data.endServiceTime,
            isService: this.data.carryLabel == '需要' ? '需要搬运服务' : '不需要搬运服务',
            price: this.data.price + '元',
            openId: this.data.openId
          },
          success: res => {
            wx.hideLoading()
            if(res.result == '成功'){
              wx.showToast({
                title: '提交成功',
              })
            }else{
              wx.showToast({
                icon: 'none',
                title: '提交失败',
              })
            }
          },
          fail: err => {
            wx.showToast({
              icon: 'none',
              title: '提交失败',
            })
          }
        })
      }
    }
    
  },
  // 分享
  onShareAppMessage: function (res) {
    return {
      title: '实在货运',
      path: 'pages/index/index'
    }
  },
})
