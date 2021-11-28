const Koa = require('koa')
const app = new Koa()
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const koaStatic = require('koa-static')
const koaBody = require('koa-body')
const path = require('path')
const mime = require('mime-types')
const fs = require('fs')
const cors = require('koa2-cors')

const upload = require('./routes/upload')

// error handler
onerror(app)

// middlewares
app.use(bodyparser({
  enableTypes:['json', 'form', 'text']
}))
app.use(json())
app.use(cors())

app.use(koaBody({
  formidable: {
    uploadDir: path.resolve(__dirname, 'public/uploads'), // 文件上传目录
    keepExtensions: true, // 保持文件后缀
    // maxFieldsSize: number 文件上传大小
    // onFileBegin: (name, file) => void 文件上传前
  },
  multipart: true, // 支持文件上传
  // encoding: string 压缩方式
}))
app.use(koaStatic(__dirname + 'public'))

app.use(async (ctx, next) => {
  const url = ctx.url
  const fileUrl = url.split('/file/')
  const readFileName = fileUrl[1]

  if (readFileName) {
    let filePath = path.join(__dirname, `public/uploads/${readFileName}`)
    let file = null
    try {
      file = fs.readFileSync(filePath)
    } catch(err) {
      console.log(err)
    }

    let mimeType = mime.lookup(filePath)
    ctx.set('content-type', mimeType)
    ctx.body = file
  }

  next()
})

app.use(upload.routes(), upload.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
})

module.exports = app
