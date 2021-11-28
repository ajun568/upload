const getFileName = (path) => {
  return path.slice(path.lastIndexOf('/') + 1)
}

module.exports = {
  getFileName,
}
