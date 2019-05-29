// 云函数入口文件
const cloud = require('wx-server-sdk');
const request = require('request');
// 邮箱模块
const nodemailer = require('nodemailer');

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  // 获取access_token
  return new Promise((resolve, reject) => {
    request({
      url: 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wxc587cb198f015ff1&secret=b0e20d546913fbe3d9159f7650b74af7',
      method: "GET"
    }, (error, response, body) => {
      // 发送消息模板
      let temp = {
        "touser": event.openId,
        "weapp_template_msg": {
          "template_id": "xF7m0KmcjvQID1FEBdkZBhQFOglqiRFWt1PXgE16U88",
          "form_id": event.formId,
          "data": {
            "keyword1": {
              "value": event.name
            },
            "keyword2": {
              "value": event.tel
            },
            "keyword3": {
              "value": event.price
            },
            "keyword4": {
              "value": event.time
            },
            "keyword5": {
              "value": event.isService
            }
          }
        },
      }
      
      var transporter = nodemailer.createTransport({
        host: 'smtp.163.com',
        port: 465, // SMTP 端口
        secure:true,
        auth: {
          user: 'shixiaolongfw@163.com',
          pass: 'shixiaolong22'
        }
      });
      var mailOptions = {
        from: '"实在货运" shixiaolongfw@163.com', // 发件地址
        to: '878763721@qq.com', // 收件列表
        subject: '新订单详情', // 标题
        //text和html两者只支持一种
        text: '订单：', // 标题
        html: `
          <div><b>姓名：</b><span>${event.name}</span></div>
          <div><b>手机号：</b><span>${event.tel}</span></div>
          <div><b>费用：</b><span>${event.price}</span></div>
          <div><b>服务时间：</b><span>${event.time}</span></div>
          <div><b>备注：</b><span>${event.isService}</span></div>
        `
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          resolve('失败');
        } else {
          request({
            url: 'https://api.weixin.qq.com/cgi-bin/message/wxopen/template/uniform_send?access_token=' + JSON.parse(body).access_token,
            method: "POST",
            json: true,
            headers: {
              "content-type": "application/json",
            },
            body: temp
          }, (error, response, body) => {
            if (error) {
              resolve('失败');
            } else {
              resolve('成功');
            }
          });
        }
      });
      
    });
  })
}