import React, { useState, useEffect } from 'react'
import Message from './Message'

const timeout = 3000
const maxCount = 10

const MessageContainer = (props) => {
  const { messageInfo } = props
  const [messageList, setMessageList] = useState([])

  useEffect(() => {
    setMessageList(list => [...list, messageInfo])

    setTimeout(() => remove(messageInfo), timeout)
  }, [messageInfo])

  const remove = (info) => {
    setMessageList(list => list.filter(item => item.uuid !== info.uuid))
  }

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
