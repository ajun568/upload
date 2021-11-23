import './_message.css'
import MessageContainer from './MessageContainer'
import ReactDOM from 'react-dom'

let seed = 0

let el = document.querySelector('#message-wrapper')
if (!el) {
  el = document.createElement('div')
  el.id = 'message-wrapper'
  document.body.append(el)
}

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
