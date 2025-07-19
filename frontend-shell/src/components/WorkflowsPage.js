import React from 'react';
import { useAuth } from '../App';

const WorkflowsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin' || user?.role === 'admin';

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Workflows</h1>
      <div className="bg-white rounded-lg shadow p-6">
        {isAdmin ? (
          <>
            <p className="text-gray-600 mb-4">Manage automation workflows and integrations.</p>
            <div className="mt-4">
              <a 
                href="http://localhost:5678" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded inline-block"
              >
                Open N8N Workflow Editor
              </a>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-600">Only administrators can access workflow management.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowsPage;
