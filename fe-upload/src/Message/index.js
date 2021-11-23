import './_message.css'
import MessageContainer from './MessageContainer'
import ReactDOM from 'react-dom'

// 自增变量, 用于生成uuid, 区分不同消息
let seed = 0

// 向 body 中追加消息节点
let el = document.querySelector('#message-wrapper')
if (!el) {
  el = document.createElement('div')
  el.id = 'message-wrapper'
  document.body.append(el)
}

// 添加消息
const addMessage = (type, info) => {
  seed += 1
  let messageInfo = {
    type,
    info,
    uuid: `Message_${seed}`,
  }
  ReactDOM.render(<MessageContainer messageInfo={messageInfo} />, el)
}

const message = {
  info: (info) => {
    addMessage('info', info)
  },
  success: (info) => {
    addMessage('success', info)
  },
  warning: (info) => {
    addMessage('warning', info)
  },
  error: (info) => {
    addMessage('error', info)
  },
}

export default message
