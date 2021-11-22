import 'normalize.css'
import Upload from './Upload'
import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import SparkMD5 from 'spark-md5'

const CancelToken = axios.CancelToken
const source = CancelToken.source()

const App = () => {
  const [imageValue, setImageValue] = useState('')
  const [isDrag, setIsDrag] = useState(false)
  const fileRef = useRef(null)
  const progressRef = useRef(null)
  const dropRef = useRef(null)

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

  useEffect(() => {
    dropRef?.current && dropRef.current.addEventListener('dragover', handleDragOver)
    dropRef?.current && dropRef.current.addEventListener('drop', handleDrop)
    dropRef?.current && dropRef.current.addEventListener('dragenter', handleDragEnter)
    dropRef?.current && dropRef.current.addEventListener('dragleave', handleDragLeave)

    return () => {
      dropRef?.current && dropRef.current.removeEventListener('dragover', handleDragOver)
      dropRef?.current && dropRef.current.removeEventListener('drop', handleDrop)
      dropRef?.current && dropRef.current.removeEventListener('dragenter', handleDragEnter)
      dropRef?.current && dropRef.current.removeEventListener('dragleave', handleDragLeave)
    }
  }, [])

  const stopEvent = e => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragOver = e => {
    stopEvent(e)
  }

  const handleDrop = e => {
    stopEvent(e)
    const files = [...e.dataTransfer.files]
    choiceFormDataImage(files)
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

  const renderForm = () => {
    return  <form
      method="post"
      action="http://localhost:3000/api/uploads/multiple"
      enctype="multipart/form-data"
    >
      <b>选择文件: </b>
      <input type="file" name="f1" multiple />
      <b>标题: </b>
      <input type="text" name="title" style={{marginRight: 40}} />
      <button type="submit" id="btn">上 传</button>
    </form>
  }

  const renderFormData = () => {
    return <input
      ref={fileRef}
      type="file"
      name="file"
      value={imageValue}
      // accept=".jpg,.jpeg,.gif,.png,.svg,.webp"
      onChange={breakPointUpload}
      multiple
    />
  }

  // fetch 不支持监听上传进度
  const choiceFormDataImageFetch = (e) => {
    const files = e.target.files

    if (!files.length) return
    if (files[0].type.indexOf('image/') === -1) return

    const fd = new FormData()
    for (let i = 0; i < files.length; i++) {
      fd.append('f1', files[i])
    }

    fetch('http://localhost:3000/api/uploads/multiple', {
      method: 'POST',
      body: fd,
    })
      .then(res => res.json())
      .then(res => {
        if (res.fileUrl.length) {
          alert('上传成功')
        }
      })
      .catch(err => console.error('Error: ', err))
  }

  const choiceFormDataImage = async (e) => {
    const files = e.target ? e.target.files : e
    progressRef.current.style.width = '0'
    progressRef.current.classList.remove('green')
    progressRef.current.innerHTML = '0%'

    if (!files.length) return
    if (files[0].type.indexOf('image/') === -1) return

    const fd = new FormData()
    for (let i = 0; i < files.length; i++) {
      fd.append('f1', files[i])
    }

    let config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: e => {
        const { loaded, total } = e
        if (e.lengthComputable) {
          let progress = loaded / total
          let progressNum = (progress * 100).toFixed(2)
          progressRef.current.style.width = `${600 * progress}px`
          progressRef.current.innerHTML = `${progressNum}%`
          if (progressNum > 90) {
            progressRef.current.classList.add('green')
          }
        }
      },
      cancelToken: source.token
    }

    const data = await axios.post('http://localhost:3000/api/uploads/multiple', fd, config)
    if (data.data.fileUrl.length) {
      console.log('上传成功')
    }
  }

  const cancel = () => {
    source.cancel()
  }

  const submitUpload = async (e) => {
    const chunkSize = 2 * 1024 * 1024
    const file = e.target.files[0]
    let chunks = []
    let token = new Date().getTime()
    let chunkCount = 0
    let sendChunkCount = 0

    if (file.size > chunkSize) {
      let start = 0
      let end = 0

      while (true) {
        end += chunkSize
        const blob = file.slice(start, end)
        start += chunkSize

        if (!blob.size) break
        chunks.push(blob)
      }
    } else {
      chunks.push(file)
    }

    chunkCount = chunks.length
    chunks.forEach(async (chunk, index) => {
      const fd = new FormData()
      fd.append('token', token)
      fd.append('f1', chunk)
      fd.append('index', index)

      let config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
      }

      const data = await axios.post('http://localhost:3000/api/uploads/shard', fd, config)
      if (data.data.err_no !== 0) {
        console.error('分片上传失败')
        return
      }

      sendChunkCount += 1
      if (sendChunkCount === chunkCount) {
        const subFd = new FormData()
        subFd.append('type', 'merge')
        subFd.append('token', token)
        subFd.append('chunkCount', chunkCount)
        subFd.append('filename', file.name)

        const data = await axios.post('http://localhost:3000/api/uploads/shard', subFd, config)
        if (data.data.err_no !== 0) {
          console.error('分片上传失败')
          return
        }
      }
    })
  }

  const breakPointUpload = async (e) => {
    const chunkSize = 2 * 1024 * 1024
    const file = e.target.files[0]
    const fileParse = () => {
      return new Promise((resolve, reject) => {
        let fileRead = new FileReader()
        fileRead.readAsArrayBuffer(file)
        fileRead.onload = e => {
          resolve(e.target.result)
        }
      })
    }
    const buffer = await fileParse()
    const spark = new SparkMD5.ArrayBuffer()
    spark.append(buffer)
    let hash = spark.end()

    const list = await axios.get('http://localhost:3000/api/uploads/breakPointHashList', {params: { hash }})

    let chunks = []
    let chunkCount = 0
    let sendChunkCount = 0

    if (file.size > chunkSize) {
      let start = 0
      let end = 0

      while (true) {
        end += chunkSize
        const blob = file.slice(start, end)
        start += chunkSize

        if (!blob.size) break
        chunks.push(blob)
      }
    } else {
      chunks.push(file)
    }

    chunkCount = chunks.length
    chunks.forEach(async (chunk, index) => {
      const fd = new FormData()
      fd.append('token', hash)
      fd.append('f1', chunk)
      fd.append('index', index)

      let config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
      }

      if (list.data.data.find(item => +item.split('-')[0] === index)) return

      const data = await axios.post('http://localhost:3000/api/uploads/breakPoint', fd, config)
      if (data.data.err_no !== 0) {
        console.error('分片上传失败')
        return
      }

      sendChunkCount += 1
      if (sendChunkCount === chunkCount) {
        const subFd = new FormData()
        subFd.append('type', 'merge')
        subFd.append('token', hash)
        subFd.append('chunkCount', chunkCount)
        subFd.append('filename', file.name)

        const data = await axios.post('http://localhost:3000/api/uploads/breakPoint', subFd, config)
        if (data.data.err_no !== 0) {
          console.error('分片上传失败')
          return
        }
      }
    })
  }

  return (
    <div className="App" style={{marginTop: 20}}>
      {/* { renderFormData() }
      <div ref={progressRef} className="progress"></div>
      <button onClick={cancel}>取 消</button>
      <div className={`${isDrag ? 'dragging' : ''} drop-area`} ref={dropRef}>这里是拖拽区域</div> */}

      <Upload />
    </div>
  );
}

export default App
