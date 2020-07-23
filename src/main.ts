/**
WARNING: MESSY CODE BELOW.

TO-DO (June 2020):
- refactor according to informal-uml.png
- improve word difficulty scoring system

**/

import {
  Contact,
  Message,
  ScanStatus,
  Wechaty,
  Friendship,
  log,
  FileBox
}               from 'wechaty'

type WordInfo = {
  word:string,
  meaning:string,
  pinyin:string
}

import { generate } from 'qrcode-terminal'

import * as cheerio from 'cheerio'

import request from "request"

require('dotenv').config()

import wordMetadata from "../word-data1.json";


var path = require('path');
const {exec, spawn} = require('child_process');
const _ = require("underscore");
const fs = require('fs');
const process = require('process');


const makePromiseSpawn = (params2Cmd) => {
  return (params,stdoutCB=(a)=>{},stderrCB=(a)=>{},errCloseCB=(err)=>{}): Promise<string> => {
  const cmds = params2Cmd(params).split(" ")
    return new Promise((resolve, reject) => {
      const [head, ...tail] = cmds;
      console.log(`starting: ${cmds}`)
      let childProcess = spawn(head, tail, { stdio: 'pipe' })
      childProcess.stderr.pipe(process.stderr)
      var dataToPassOn = ""
      childProcess.stdout.on("data", data =>{
        if(head == "python3" || head == "python"){
          dataToPassOn += data.toString()
        }
        console.log("stdout: " + data)
        stdoutCB(data.toString())
      })
      childProcess.stderr.on("data", data =>{
        console.log('stderr: ' + data)
        stderrCB(data.toString())
      })
      childProcess.on('exit', code => {
        console.log('exited on ', code)
        if(_.isEmpty(dataToPassOn)){
          resolve(code)
        }else{
          resolve(dataToPassOn)
        }
      })
      childProcess.on("error", err =>{
        console.log('error: ' +err)
        errCloseCB(err)
        reject(err)
      })
    })
  }
}

const mkDir =  makePromiseSpawn((path)=>`mkdir -p ${path}`)

const sum =(a)=> _.reduce(a, function(a, b){ return a + b}, 0);

const fenci = makePromiseSpawn((fileName) => `python3 src/fenci.py ${fileName}`)

const cedict = async (word:string): Promise<WordInfo> => {
  const jsonString = await makePromiseSpawn((word)=> `python3 src/CC-CE-DICT.py ${word}`)(word)
  console.log(jsonString)
  return JSON.parse(jsonString)

}

const makeAnki = makePromiseSpawn((fileName) => `python3 src/make-anki.py ${fileName}`)

const getWordDifficulty = (word)=>{
  var scores = _.map(word,(char)=>{
    console.log(char,wordMetadata.data[0][0])
    var r = _.find(wordMetadata.data,(a)=>a[0]==char)
    if(_.isUndefined(r)){
      console.log("not found: "+char)
      return -10
    }
    return -(r[2] * 420  ) + r[1] //420 :)
  })

  return sum(scores)
}

// const getWordInfo = (word)=>{
//   return new Promise((resolve,reject)=>{
//     try{
//   request('http://dict.cn/'+encodeURIComponent(word), function (error, response, body) {
//     if (error) {
//         reject({error})
// 				return;
// 			}
// 			if (response && response.statusCode) {
// 				if (response.statusCode == 200) {
//           console.log(body)
// 					const $ = cheerio.load(body);
//          const defintion =
// 					resolve(defintion);
// 				} else {
//           reject({error:response.statusCode})
//         }
//   }else{
//     reject({error:"no response"})
//   }
//   })
// }catch(error){
//   reject({error})
// }
// })
// }


const getTop10Words = (words)=>{
  return _.filter(_.uniq(_.map(_.first(words,10),a=>a.word)),a=>a.length>1)
}

//messy ah


function onScan (qrcode: string, status: ScanStatus) {
  if (status === ScanStatus.Waiting || status === ScanStatus.Timeout) {
    generate(qrcode, { small: true })  // show qrcode on console

    const qrcodeImageUrl = [
      'https://api.qrserver.com/v1/create-qr-code/?data=',
      encodeURIComponent(qrcode),
    ].join('')

    log.info('StarterBot', 'onScan: %s(%s) - %s', ScanStatus[status], status, qrcodeImageUrl)
  } else {
    log.info('StarterBot', 'onScan: %s(%s)', ScanStatus[status], status)
  }
}

async function onLogin (user: Contact) {
  log.info('StarterBot', '%s login', user)
  const miao = await cedict("喵")
  console.log("wordInfo",miao['pinyin'])

}

function onLogout (user: Contact) {
  log.info('StarterBot', '%s logout', user)
}

async function onMessage (msg: Message) {
const t = msg.type()
if (t == bot.Message.Type.Url) {
  const link = await msg.toUrlLink()
  log.info('MeowStarterBot', link)
  const uri = link.url()
  await msg.say('ohh 收到了～')
  await msg.say('分析文章中哦～')
  request(
      { uri },
      async function(error, response, body) {

          console.log(body);
          const $ = cheerio.load(body)
          const t = $("#js_content").text()
          console.log(t)
          fs.writeFileSync('userDataFiles/test.txt',t)
          await fenci('userDataFiles/test')
          const words = JSON.parse(fs.readFileSync('userDataFiles/test.json', 'utf8'));

          const chineseWords = _.filter(words,(a)=>a.flag !== '0')
          console.log(chineseWords)
          const sorted = _.sortBy(chineseWords, (a)=>getWordDifficulty(a.word))
          const top10 = getTop10Words(sorted)
          console.log(top10)
          await msg.say("找到困难的词啦～")
          await msg.say(_.foldr(top10,(r,v,i)=>(i+1)+". "+v+"\n"+r,""))
          await msg.say("以下是词的意思与拼音～")
          try{
          const wordInfos = await Promise.all(_.map(top10, (w)=>{
          return cedict(w)
        }))
          console.log(wordInfos)
          await Promise.all(_.map(wordInfos,async (a)=>{
            return msg.say(
              a.word+" "+a.pinyin+"\n"+
              (a.meaning || "unknown")
          )
        }))
        await mkdir('userDataFiles')
          fs.writeFileSync('userDataFiles/test-cards.json', JSON.stringify(wordInfos))
          await msg.say("要生成Anki记忆卡片请输入「anki」～ ")
        }catch(error){
          console.log(error)
        }
      }
  );
}else if(t == bot.Message.Type.Text ){
  console.log("is text")
  const text = msg.text()
  console.log(text)
  if(text == "anki"){
    await msg.say("生成Anki记忆卡片中哦～")
    await makeAnki("files/test")
    const fileBox = FileBox.fromFile('userDataFiles/test.apkg')
    await msg.say(fileBox)
  }
}else{
console.log("message type ",t)
}
}

async function onNewFriendship(friendship: Friendship) {
  try {
    switch (friendship.type()) {
    case Friendship.Type.Receive:
      await friendship.accept()
      break
    case Friendship.Type.Confirm:
      break
    }
    const contact = friendship.contact()
    const name = contact.name()
    await contact.say("您好呀，"+name+"！我是您的吖奇说神奇小助理!我的存在就是为了帮您自制Anki卡片学中文哦～ 这个是一个demo～ 把微信公众号文章发给我，我会帮您找文中的难词～ 加以释义，生成Anki卡片哦～")
  } catch (e) {
    console.error(e)
  }
}

const bot = new Wechaty({
  name: 'ding-dong-bot',
  puppet: 'wechaty-puppet-padplus',
  // puppet: 'wechaty-puppet-puppeteer'

})

bot.on('scan',    onScan)
bot.on('login',   onLogin)
bot.on('logout',  onLogout)
bot.on('message', onMessage)
bot.on('friendship', onNewFriendship)

bot.start()
  .then(() => log.info('StarterBot', 'Starter Bot Started.'))
  .catch(e => log.error('StarterBot', e))
