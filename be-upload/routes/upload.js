const router = require('koa-router')()
const { commonUpload, getHashList, shardUpload } = require('./../controller/upload')
const { SuccessModel, ErrorModel } = require('./../model/baseModel')

router.prefix('/api')

// 普通上传
router.post('/upload', async (ctx, next) => {
  let file = ctx.request.files?.f1 // web端「input name」需定义为「f1」
  if (!file) {
    ctx.body = new ErrorModel('未选择上传文件')
    return
  }
  ctx.body = new SuccessModel(commonUpload(file))
})

// 获取已上传分片信息
router.get('/hash-list', async (ctx, next) => {
  ctx.body = new SuccessModel(getHashList(ctx.query.hash))
})

// 分片上传
router.post('/shard-upload', async (ctx, next) => {
  const body = ctx.request.body
  let file = ctx.request.files?.f1
  let data = shardUpload(file, body)
  ctx.body = data ? new SuccessModel(data)  : new ErrorModel('未选择上传文件') 
})

module.exports = router
