import { useState, useEffect } from 'react'

const MessageRender = (props) => {
  const { type, info } = props
  const [show, setShow] = useState(false)

  useEffect(() => {
    setShow(true)
    setTimeout(() => setShow(false), 3000)
  }, [])

  return show ? <section id="message" className={`message ${type}`}>{info}</section> : null
}

export default MessageRender
