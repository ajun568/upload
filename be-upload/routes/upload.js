const router = require('koa-router')()
const fs = require('fs')
const path = require('path')

router.prefix('/api')

// 普通上传
router.post('/upload', async (ctx, next) => {
  let file = ctx.request.files?.f1
  let result = []

  if (!file) {
    ctx.body = {
      err_no: -1,
      msg: '上传失败'
    }
    return
  }

  if (!Array.isArray(file)) file = [file]

  file.forEach(item => {
    let path = item.path.replace(/\\/g, '/')
    let fname = item.name
    let nextPath = ''

    if (item.size > 0 && path) {
      let extArr = fname.split('.')
      let ext = extArr[extArr.length - 1]
      nextPath = path + '.' + ext
      fs.renameSync(path, nextPath)
      result.push(`http://localhost:3000/file/${nextPath.slice(nextPath.lastIndexOf('/') + 1)}`)
    }
  })

  ctx.body = {
    err_no: 0,
    fileUrl: result
  }
})

router.post('/shard', async (ctx, next) => {
  const body = ctx.request.body
  let file = ctx.request.files?.f1
  let result = []
  let fileToken = body.token
  let fileIndex = body.index

  if (body.type === 'merge') {
    let filrname = body.filename
    let chunkCount = body.chunkCount
    let folder = path.resolve(process.cwd(), 'public/uploads') + '/'
    let writeStream = fs.createWriteStream(`${folder}${filrname}`)
    let cindex = 0

    const mergeFile = () => {
      let fname = `${folder}${cindex}-${fileToken}`
      let readStream = fs.createReadStream(fname)
      readStream.pipe(writeStream, { end: false })
      readStream.on('end', () => {
        fs.unlink(fname, err => {
          if (err) throw err
        })
        if (cindex + 1 < chunkCount) {
          cindex += 1
          mergeFile()
        }
      })
    }
    mergeFile()
    ctx.body = {
      err_no: 0,
      message: '分片上传成功',
      data: [`http://localhost:3000/file/${filrname}` ]
    }
    return
  }

  if (!file) {
    ctx.body = {
      msg: '上传失败'
    }
    return
  }

  if (!Array.isArray(file)) {
    file = [file]
  }

  file.forEach(item => {
    let path = item.path.replace(/\\/g, '/')
    let nextPath = `${path.slice(0, path.lastIndexOf('/') + 1)}${fileIndex}-${fileToken}`

    if (item.size > 0 && path) {
      fs.renameSync(path, nextPath)
      result.push(`http://localhost:3000/file/${nextPath.slice(nextPath.lastIndexOf('/') + 1)}`)
    }
  })

  ctx.body = {
    err_no: 0,
    message: `已成功上传第${fileIndex}片内容`,
    data: result
  }
})

router.get('/breakPointHashList', async (ctx, next) => {
  let hash = ctx.query.hash
  let folder = path.resolve(process.cwd(), 'public/uploads')
  let result = []

  const finder = (path, isChild) => {
    let files = fs.readdirSync(path)
    files.forEach(item => {
      let fPath = `${path}/${item}`
      let stats = fs.statSync(fPath)
      if (stats.isDirectory() && item === hash) finder(fPath, item)
      if (stats.isFile() && isChild === hash) result.push(item)
    })
  }
  finder(folder)

  ctx.body = {
    err_no: 0,
    data: result
  }
})

router.post('/breakPoint', async (ctx, next) => {
  const body = ctx.request.body
  let file = ctx.request.files?.f1
  let result = []
  let fileToken = body.token
  let fileIndex = body.index

  let folder = path.resolve(process.cwd(), `public/uploads/${fileToken}`)
  !fs.existsSync(folder) ? fs.mkdirSync(folder) : null

  if (body.type === 'merge') {
    let filrname = body.filename
    let chunkCount = body.chunkCount
    let mergeFolder = path.resolve(process.cwd(), 'public/uploads') + '/'
    let writeStream = fs.createWriteStream(`${mergeFolder}${filrname}`)
    let cindex = 0

    const mergeFile = () => {
      let fname = `${mergeFolder}/${fileToken}/${cindex}-${fileToken}` // 要判断到底哪个文件夹
      let readStream = fs.createReadStream(fname)
      readStream.pipe(writeStream, { end: false })
      readStream.on('end', () => {
        fs.unlink(fname, err => {
          if (err) throw err
        })
        if (cindex + 1 < chunkCount) {
          cindex += 1
          mergeFile()
        }
      })
    }
    mergeFile()
    ctx.body = {
      err_no: 0,
      message: '分片上传成功',
      data: [`http://localhost:3000/file/${filrname}`]
    }
    return
  }

  if (!file) {
    ctx.body = {
      msg: '上传失败'
    }
    return
  }

  if (!Array.isArray(file)) {
    file = [file]
  }

  file.forEach(item => {
    let path = item.path.replace(/\\/g, '/')
    let nextPath = `${path.slice(0, path.lastIndexOf('/') + 1)}/${fileToken}/${fileIndex}-${fileToken}`

    if (item.size > 0 && path) {
      fs.renameSync(path, nextPath)
      result.push(`http://localhost:3000/file/${nextPath.slice(nextPath.lastIndexOf('/') + 1)}`)
    }
  })

  ctx.body = {
    err_no: 0,
    message: `已成功上传第${fileIndex}片内容`,
    data: result
  }
})

module.exports = router
