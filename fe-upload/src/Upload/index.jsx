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
    finishUpload, // 文件上传后, 返回接口数据
  } = props

  const [fileValue, setFileValue] = useState('') // 清空input值, 上传同名文件
  const fileRef = useRef(null)
  const progressRef = useRef(null)
  const progressFontRef = useRef(null)

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
    if (fileRef?.current) fileRef.current.click()
  }

  // 上传逻辑
  const upload = async (e) => {
    setFileValue('')
    let files = [...e.target.files]
    progressRef.current.style.width = '0'
    progressRef.current.classList.remove('green')
    progressFontRef.current.innerHTML = '0%'

    if (beforeUpload) {
      let beforeUploadData = beforeUpload()
      if (beforeUploadData === false) return
    }

    const formData = new FormData()
    files.forEach(item => {
      formData.append('f1', item)
    })

    let config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: e => {
        const { loaded, total } = e
        if (e.lengthComputable) {
          let progress = loaded / total
          let progressNum = (progress * 100).toFixed(0)
          progressRef.current.style.width = `${120 * progress}px`
          progressFontRef.current.innerHTML = `${progressNum}%`
          if (progressNum > 90) {
            progressRef.current.classList.add('green')
          }
        }
      },
    }

    const data = await axios.post(action, formData, config)

    if (finishUpload) {
      finishUpload(data)
      return
    }

    // 按 be-upload 接口格式处理数据
    if (data.data.err_no !== 0) {
      message.error('上传失败')
      return
    }
    message.success('上传成功')
  }

  return (
    <section>
      <input
        ref={fileRef}
        value={fileValue}
        style={{display: 'none'}}
        type="file"
        name="file"
        accept={accept}
        onChange={upload}
        multiple={multiple}
      />
      <div className="btn-container">
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
        <div className="process-wrapper">
          <div className="process-container">
            <div ref={progressRef} className="progress"></div>
          </div>
          <div ref={progressFontRef} className="font"></div>
        </div>
      </div>
    </section>
  )
}

Upload.defaultProps = {
  type: 'primary',
  disabled: false,
}

export default Upload
