import React, { useState, useEffect } from 'react'
import Message from './Message'

const timeout = 3000 // 超时时间
const maxCount = 10 // 最大队列数量

const MessageContainer = (props) => {
  const { messageInfo } = props
  const [messageList, setMessageList] = useState([])

  // 添加消息 超时后移除
  useEffect(() => {
    setMessageList(list => [...list, messageInfo])

    setTimeout(() => remove(messageInfo), timeout)
  }, [messageInfo])

  // 移除消息
  const remove = (info) => {
    setMessageList(list => list.filter(item => item.uuid !== info.uuid))
  }

  // 超出最大数量 出列
  useEffect(() => {
    if (messageList.length > maxCount) {
      const [firstMessage] = messageList
      remove(firstMessage)
    }
  }, [messageList])

  return (
    <section className="message-container">
    {
      messageList.map(
        (item, index) => 
          <Message
            key={index}
            type={item.type}
            info={item.info}
          />
      )
    }
    </section>
  )
}

export default MessageContainer
