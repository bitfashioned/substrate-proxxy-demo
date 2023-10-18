import ApiProvider from './substrate/components/ApiProvider';
import Proxxy from './pages/Proxxy';
import './App.css'

function App() {
  return (
    <ApiProvider>
      <Proxxy/>
    </ApiProvider>
  );
}

export default App;