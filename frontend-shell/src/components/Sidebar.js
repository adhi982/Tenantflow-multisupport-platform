import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Sidebar = ({ isOpen, onClose, screens, currentPath }) => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  const isActivePath = (path) => {
    return currentPath === path;
  };

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose}></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={onClose}
              >
                <span className="sr-only">Close sidebar</span>
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <SidebarContent 
              screens={screens} 
              currentPath={currentPath} 
              onNavigation={handleNavigation}
              isActivePath={isActivePath}
            />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white border-r border-gray-200">
            <SidebarContent 
              screens={screens} 
              currentPath={currentPath} 
              onNavigation={handleNavigation}
              isActivePath={isActivePath}
            />
          </div>
        </div>
      </div>
    </>
  );
};

const SidebarContent = ({ screens, currentPath, onNavigation, isActivePath }) => {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center flex-shrink-0 px-4">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="ml-3">
            <h1 className="text-xl font-semibold text-gray-900">FlowBit</h1>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-5 flex-grow flex flex-col">
        <nav className="flex-1 px-2 space-y-1">
          {/* Dashboard Link */}
          <button
            onClick={() => onNavigation('/')}
            className={`${
              isActivePath('/') 
                ? 'bg-primary-100 border-primary-500 text-primary-700' 
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            } group w-full flex items-center pl-2 pr-2 py-2 border-l-4 text-sm font-medium`}
          >
            <svg className={`${
              isActivePath('/') ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
            } mr-3 flex-shrink-0 h-6 w-6`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v0a2 2 0 01-2 2H10a2 2 0 01-2-2v0z" />
            </svg>
            Dashboard
          </button>

          {/* Tickets Link */}
          <button
            onClick={() => onNavigation('/tickets')}
            className={`${
              isActivePath('/tickets') 
                ? 'bg-primary-100 border-primary-500 text-primary-700' 
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            } group w-full flex items-center pl-2 pr-2 py-2 border-l-4 text-sm font-medium`}
          >
            <svg className={`${
              isActivePath('/tickets') ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
            } mr-3 flex-shrink-0 h-6 w-6`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            Support Tickets
          </button>

          {/* Workflows Link */}
          <button
            onClick={() => onNavigation('/workflows')}
            className={`${
              isActivePath('/workflows') 
                ? 'bg-primary-100 border-primary-500 text-primary-700' 
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            } group w-full flex items-center pl-2 pr-2 py-2 border-l-4 text-sm font-medium`}
          >
            <svg className={`${
              isActivePath('/workflows') ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
            } mr-3 flex-shrink-0 h-6 w-6`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Workflows
          </button>

          {/* Users Link */}
          <button
            onClick={() => onNavigation('/users')}
            className={`${
              isActivePath('/users') 
                ? 'bg-primary-100 border-primary-500 text-primary-700' 
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            } group w-full flex items-center pl-2 pr-2 py-2 border-l-4 text-sm font-medium`}
          >
            <svg className={`${
              isActivePath('/users') ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
            } mr-3 flex-shrink-0 h-6 w-6`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Users
          </button>

          {/* Dynamic Screen Links */}
          {screens.length > 0 && (
            <div className="mt-6">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Screens
              </h3>
              <div className="mt-2 space-y-1">
                {screens.map((screen) => (
                  <button
                    key={screen.id}
                    onClick={() => onNavigation(`/${screen.slug}`)}
                    className={`${
                      isActivePath(`/${screen.slug}`) 
                        ? 'bg-primary-100 border-primary-500 text-primary-700' 
                        : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group w-full flex items-center pl-2 pr-2 py-2 border-l-4 text-sm font-medium`}
                  >
                    <svg className={`${
                      isActivePath(`/${screen.slug}`) ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                    } mr-3 flex-shrink-0 h-6 w-6`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {screen.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
