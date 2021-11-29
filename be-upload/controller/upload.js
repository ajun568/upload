const fs = require('fs')
const path = require('path')
const { getFileName } = require('./../utils')
const BASE_CONF = require('./../conf/base')

let baseUrl = `${BASE_CONF.host}:${BASE_CONF.port}`

// 普通上传
const commonUpload = (file) => {
  let result = []
  if (!Array.isArray(file)) file = [file] // 单文件处理

  file.forEach(item => {
    let path = item.path.replace(/\\/g, '/')
    let fname = item.name
    let nextPath = ''

    if (item.size > 0 && path) {
      let extArr = fname.split('.')
      let ext = extArr[extArr.length - 1]
      nextPath = path + '.' + ext
      fs.renameSync(path, nextPath) // 重命名, 追加扩展名, 可直接在「koaBody」中配置
      result.push(`${baseUrl}/file/${getFileName(nextPath)}`)
    }
  })

  return result
}

// 获取已上传分片信息
const getHashList = (hash) => {
  let folder = path.resolve(process.cwd(), 'public/uploads') // 「process.cwd()」是获取根目录
  let result = []

  const finder = (path, isChild) => {
    let files = fs.readdirSync(path) // 读取目录内容
    files.forEach(item => {
      let fPath = `${path}/${item}` // 拼接子目录
      let stats = fs.statSync(fPath) // 获取文件或目录的详细信息
      if (stats.isDirectory() && item === hash) finder(fPath, item) // 若为文件夹, 继续拆分
      if (stats.isFile() && isChild === hash) result.push(item) // 若为文件, 则获取其名称
    })
  }
  finder(folder)

  return result
}

// 分片上传
const shardUpload = (file, body) => {
  let result = []
  let fileToken = body.token //「md5」加密后的hash, 用来标识文件
  let fileIndex = body.index // 分片索引, 用来按顺序聚合文件

  let folder = path.resolve(process.cwd(), `public/uploads/${fileToken}`) // 分片目录
  if (!fs.existsSync(folder)) fs.mkdirSync(folder) // 没有目录则创建

  if (body.type === 'merge') { // 合并分片
    let extArr = body.filename.split('.')
    let ext = extArr[extArr.length - 1]
    let chunkCount = body.chunkCount
    let mergeFolder = path.resolve(process.cwd(), 'public/uploads') // 文件生成路径
    let writeStream = fs.createWriteStream(`${mergeFolder}/upload_${fileToken}.${ext}`) // 写文件
    let cindex = 0

    const mergeFile = () => {
      let fname = `${mergeFolder}/${fileToken}/${cindex}-${fileToken}` // 读取文件夹路径
      let readStream = fs.createReadStream(fname) // 读文件
      readStream.pipe(writeStream, { end: false }) //「pipe」连接流文件
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

    return {
      message: '分片上传成功',
      fileUrl: `${baseUrl}/file/upload_${fileToken}.${ext}`
    }
  }

  if (!file) return false
  if (!Array.isArray(file)) file = [file]

  file.forEach(item => {
    let path = item.path.replace(/\\/g, '/')
    let nextPath = `${getFileName(path, 0)}/${fileToken}/${fileIndex}-${fileToken}`

    if (item.size > 0 && path) {
      fs.renameSync(path, nextPath)
      result.push(`${baseUrl}/file/${getFileName(nextPath)}`)
    }
  })

  return {
    message: `已成功上传第${fileIndex}片内容`,
    data: result
  }
}

module.exports = {
  commonUpload,
  getHashList,
  shardUpload,
}