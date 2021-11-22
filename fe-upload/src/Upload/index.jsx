import axios from 'axios'
import { useState, useEffect, useRef } from 'react'
import './_upload.css'
import message from './../Message'

const Upload = (props) => {
  const {
    type, // 上传样式 primary: 按钮形式, drag: 拖拽区域
    accept, // 接收上传的文件类型
    action, // 上传的地址
    beforeUpload, // 文件上传前
    data, // 上传所需的额外参数
    disabled, // 是否禁用
    multiple, // 是否支持多文件上传
    name, // 发送到后台的文件参数名
    onDrop, // 当文件被拖入上传区域时执行的回调功能
  } = props

  const fileRef = useRef(null)

  // 禁用页面默认拖拽事件
  useEffect(() => {
    window.addEventListener('dragover', stopEvent)
    window.addEventListener('drop', stopEvent)
    window.addEventListener('dragenter', stopEvent)
    window.addEventListener('dragleave', stopEvent)

    return () => {
      window.removeEventListener('dragover', stopEvent)
      window.removeEventListener('drop', stopEvent)
      window.removeEventListener('dragenter', stopEvent)
      window.removeEventListener('dragleave', stopEvent)
    }
  }, [])

  // 禁用默认行为、阻止事件冒泡
  const stopEvent = e => {
    e.preventDefault()
    e.stopPropagation()
  }

  // 打开 upload 弹窗
  const openFile = () => {
    message.info('我是info的测试信息')
    // if (fileRef?.current) fileRef.current.click()
  }

  // 上传逻辑
  const upload = async (e) => {
    const files = e.target.files

    const formData = new FormData()
    files.forEach(item => {
      formData.append('f1', item)
    })

    let config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
    }


    const data = await axios.post(action, formData, config)
  }

  return (
    <section>
      <input
        ref={fileRef}
        style={{display: 'none'}}
        type="file"
        name="file"
        accept={accept}
        onChange={upload}
        multiple
      />
      {
        type === 'primary' && (
          <button
            className={`btn ${disabled ? 'btn-disabled' : ''}`}
            onClick={openFile}
          >
            上传
          </button>
        )
      }
    </section>
  )
}

Upload.defaultProps = {
  type: 'primary',
  disabled: false,
}

export default Upload
