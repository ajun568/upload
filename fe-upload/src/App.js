import 'normalize.css'
import Upload from './Upload'

const App = () => {
  return (
    <div
      className="App"
      style={{marginTop: 20, marginLeft: 20}}
    >
      <div className="box">
        <h3>普通上传</h3>
        <Upload
          action="http://localhost:3000/api/upload"
        />
      </div>
      <div className="box">
        <h3>分片上传</h3>
        <Upload
          action="http://localhost:3000/api/shard-upload"
          breakPointAction="http://localhost:3000/api/hash-list"
          shard
        />
      </div>
    </div>
  );
}

export default App
