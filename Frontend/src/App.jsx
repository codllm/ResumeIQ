import React from 'react';
import { RouterProvider } from 'react-router';
import { router } from './app.router.jsx';

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;