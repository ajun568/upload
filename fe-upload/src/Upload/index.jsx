import axios from 'axios'
import { useState, useEffect, useRef } from 'react'
import './_upload.css'
import message from './../Message'
import SparkMD5 from 'spark-md5'

let source = axios.CancelToken.source()
const chunkSize = 2 * 1024 * 1024

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
    shard, // 大文件 分片上传 & 断点续传 (不支持批量上传)
    breakPointAction, // 断点续传 ~ 获取已上传 hash-list
  } = props

  const [fileValue, setFileValue] = useState('') // 清空input值, 上传同名文件
  const [isDrag, setIsDrag] = useState(false) // 是否为拖拽状态
  const fileRef = useRef(null)
  const progressRef = useRef(null)
  const progressFontRef = useRef(null)
  const dragRef = useRef(null)

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

  // 拖拽上传
  useEffect(() => {
    dragRef?.current && dragRef.current.addEventListener('dragover', handleDragOver)
    dragRef?.current && dragRef.current.addEventListener('drop', handleDrop)
    dragRef?.current && dragRef.current.addEventListener('dragenter', handleDragEnter)
    dragRef?.current && dragRef.current.addEventListener('dragleave', handleDragLeave)

    return () => {
      dragRef?.current && dragRef.current.removeEventListener('dragover', handleDragOver)
      dragRef?.current && dragRef.current.removeEventListener('drop', handleDrop)
      dragRef?.current && dragRef.current.removeEventListener('dragenter', handleDragEnter)
      dragRef?.current && dragRef.current.removeEventListener('dragleave', handleDragLeave)
    }
  }, [])

  // 拖拽相关事件
  const handleDragOver = e => {
    stopEvent(e)
  }
  const handleDrop = e => {
    stopEvent(e)
    onDrop && onDrop()
    const files = [...e.dataTransfer.files]
    shard ? shardUpload(files, 'drag') : upload(files, 'drag')
    setIsDrag(false)
  }
  const handleDragEnter = e => {
    stopEvent(e)
    setIsDrag(true)
  }
  const handleDragLeave = e => {
    stopEvent(e)
    setIsDrag(false)
  }

  // 禁用默认行为、阻止事件冒泡
  const stopEvent = e => {
    e.preventDefault()
    e.stopPropagation()
  }

  // 打开 upload 弹窗
  const openFile = () => {
    if (fileRef?.current) fileRef.current.click()
  }

  // 上传逻辑 (普通上传)
  const upload = async (e, type) => {
    setFileValue('')
    let files = []
    if (type === 'drag') {
      files = e
    } else {
      files = [...e.target.files]
    }

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
      formData.append('name', name)
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
      cancelToken: source.token,
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

  // 上传逻辑 (分片上传)
  const shardUpload = async (e, type) => {
    setFileValue('')

    let files
    if (type === 'drag') {
      files = e[0]
    } else {
      files = e.target.files[0]
    }

    const buffer = await fileParse(files)
    const spark = new SparkMD5.ArrayBuffer()
    spark.append(buffer)
    let hash = spark.end()

    let chunks = []
    let chunkCount = 0
    let sendChunkCount = 0

    progressRef.current.style.width = '0'
    progressRef.current.classList.remove('green')
    progressFontRef.current.innerHTML = '0%'
    let progress = 0

    if (beforeUpload) {
      let beforeUploadData = beforeUpload()
      if (beforeUploadData === false) return
    }

    const hashList = await axios.get(breakPointAction, {
      params: { hash }
    })
    if (hashList.data.err_no !== 0) {
      console.error('获取已上传列表失败')
      return
    }

    if (files.size > chunkSize) {
      let start = 0
      let end = 0

      while (true) {
        end += chunkSize
        const blob = files.slice(start, end)
        start += chunkSize

        if (!blob.size) break
        chunks.push(blob)
      }
    } else {
      chunks.push(files)
    }

    chunkCount = chunks.length
    const progressArr = new Array(chunkCount).fill(0)

    chunks.forEach(async (chunk, index) => {
      const formData = new FormData()
      formData.append('token', hash)
      formData.append('f1', chunk)
      formData.append('index', index)

      let config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: e => {
          const { loaded, total } = e
          if (e.lengthComputable) {
            progressArr[index] = loaded / (total * chunkCount)
            progress = progressArr.reduce((pre, cur) => pre + cur)
            let progressNum = (progress * 100).toFixed(0)
            if (progressNum > 100) progressNum = 100
            progressRef.current.style.width = `${120 * progress}px`
            progressFontRef.current.innerHTML = `${progressNum}%`
            if (progressNum > 90) {
              progressRef.current.classList.add('green')
            }
          }
        },
        cancelToken: source.token,
      }

      if (hashList.data.data.find(item => +item.split('-')[0] === index)) {
        progressArr[index] = 1 / chunkCount
        return
      }

      const data = await axios.post(action, formData, config)
      if (data.data.err_no !== 0) {
        console.error('分片上传失败')
        return
      }

      sendChunkCount += 1
      if (sendChunkCount === chunkCount) {
        const mergeFormData = new FormData()
        mergeFormData.append('type', 'merge')
        mergeFormData.append('token', hash)
        mergeFormData.append('chunkCount', chunkCount)
        mergeFormData.append('filename', files.name)

        const data = await axios.post(action, mergeFormData, config)
        if (data.data.err_no !== 0) {
          message.error('分片上传失败')
          return
        }
        message.success('分片上传成功')
      }
    })
  }

  const fileParse = (files) => {
    return new Promise((resolve, reject) => {
      let fileRead = new FileReader()
      fileRead.readAsArrayBuffer(files)
      fileRead.onload = e => {
        resolve(e.target.result)
      }
    })
  }

  // 取消上传
  const cancelUpload = () => {
    source.cancel()
    source = axios.CancelToken.source() 
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
        onChange={shard ? shardUpload : upload}
        multiple={shard ? null : multiple}
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
        {
          type === 'drag' && (
            <div
              ref={dragRef}
              className={`${isDrag ? 'dragging' : ''} drop-area`}
              onClick={openFile}
            >
              这里是拖拽区域
            </div>
          )
        }
        <div className="process-wrapper">
          <div className="process-container">
            <div ref={progressRef} className="progress"></div>
          </div>
          <div ref={progressFontRef} className="font"></div>
        </div>
        <div className="cancel" onClick={cancelUpload}>取消</div>
      </div>
    </section>
  )
}

Upload.defaultProps = {
  type: 'primary',
  disabled: false,
}

export default Upload
