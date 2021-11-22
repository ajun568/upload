import './_message.css'
import MessageRender from './render'
import ReactDOM from 'react-dom'

const renderMessage = (type, info) => {
  console.log(type, info)
  let el = document.querySelector('#message')
  if (!el) {
    // 这里出了问题, 处理错误了
    document.body.append(<MessageRender type={type} info={info} />)
  }

}

const message = {
  info: (info) => {
    return renderMessage('info', info)
  },
  success: (info) => {
    return renderMessage('success', info)
  },
  warning: (info) => {
    return renderMessage('warning', info)
  },
  error: (info) => {
    return renderMessage('error', info)
  },
}

export default message
