const getFileName = (path, start) => {
  if (start !== undefined) {
    return path.slice(start, path.lastIndexOf('/') + 1)
  }
  return path.slice(path.lastIndexOf('/') + 1)
}

module.exports = {
  getFileName,
}
