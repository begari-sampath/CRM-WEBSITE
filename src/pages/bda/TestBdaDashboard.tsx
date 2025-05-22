import React from 'react';

const TestBdaDashboard: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-green-600">Test BDA Dashboard</h1>
      <p className="mt-2">If you can see this, routing is working!</p>
      <div className="mt-4 p-4 bg-blue-100 rounded">
        <h2 className="font-semibold">Debug Info:</h2>
        <pre className="mt-2 text-sm bg-white p-2 rounded overflow-auto">
          {JSON.stringify({
            path: window.location.pathname,
            time: new Date().toISOString()
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default TestBdaDashboard;
