cat > src/App.js << 'EOF'
import React from 'react';
import BTWValidator from './components/BTWValidator';

function App() {
  return (
    <div className="App">
      <BTWValidator />
    </div>
  );
}

export default App;
EOF