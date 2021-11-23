const Message = (props) => {
  const { type, info } = props
  return <section className={`message ${type}`}>{info}</section>
}

export default Message
