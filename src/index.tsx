import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { UtilsProvider } from './cmix/contexts/utils-context'
import { ProxxyProvider } from './cmix/contexts/proxxy-context'
import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <UtilsProvider>
      <ProxxyProvider>
          <App />
      </ProxxyProvider>
    </UtilsProvider>
  </React.StrictMode>,
)
