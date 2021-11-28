import 'normalize.css'
import Upload from './Upload'

const App = () => {
  return (
    <div
      className="App"
      style={{marginTop: 20, marginLeft: 20}}
    >
      <Upload
        action="http://localhost:3000/api/upload"
        multiple
      />
    </div>
  );
}

export default App
