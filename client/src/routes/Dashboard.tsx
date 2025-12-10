import { useState } from 'react';

export default function Dashboard() {
  const [selectedChannel, setSelectedChannel] = useState('new-channel');
  const [expandedSections, setExpandedSections] = useState({
    channels: true,
    directMessages: true,
    apps: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="flex h-screen bg-[#1A0A1D] text-white">
      {/* Leftmost Narrow Strip - Global Navigation */}
      <div className="w-[60px] bg-[#1A0A1D] flex flex-col items-center py-3 border-r border-[#2C0D30]">
        {/* Logo */}
        <div className="w-10 h-10 bg-[#8B5CF6] rounded-lg flex items-center justify-center mb-4 cursor-pointer hover:bg-[#7C3AED] transition-colors">
          <span className="text-white font-bold text-lg">R</span>
        </div>

        {/* Navigation Icons */}
        <div className="flex flex-col gap-2 flex-1">
          <button className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-[#2C0D30] transition-colors cursor-pointer" title="Home">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-[#2C0D30] transition-colors cursor-pointer" title="DMs">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-[#2C0D30] transition-colors cursor-pointer" title="Activity">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-[#2C0D30] transition-colors cursor-pointer" title="Files">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-[#2C0D30] transition-colors cursor-pointer" title="More">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>

        {/* Plus Button */}
        <button className="w-10 h-10 flex items-center justify-center rounded-md bg-[#2C0D30] hover:bg-[#3D1E40] transition-colors cursor-pointer mb-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* User Profile */}
        <div className="w-10 h-10 rounded-full bg-[#8B5CF6] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
          <span className="text-white font-medium text-sm">SK</span>
        </div>
      </div>

      {/* Main Sidebar Content */}
      <div className="w-[260px] bg-[#1D0C20] flex flex-col overflow-y-auto">
        {/* Workspace Header */}
        <div className="px-4 py-3 bg-[#2C0D30] border-b border-[#3D1E40]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80">
              <span className="text-white font-medium">Remindly</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </button>
              <button className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
          </div>
          {/* Upgrade to Pro */}
          <div className="flex items-center gap-2 px-3 py-2 bg-[#541E66] rounded-md cursor-pointer hover:bg-[#652E77] transition-colors">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-white text-sm font-medium">Upgrade to Pro</span>
            <svg className="w-4 h-4 text-white ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 px-2 py-3 overflow-y-auto">
          {/* Huddles & Directories */}
          <div className="mb-4">
            <button className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-[#2C0D30] transition-colors cursor-pointer text-left">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span className="text-gray-300 text-sm">Huddles</span>
            </button>
            <button className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-[#2C0D30] transition-colors cursor-pointer text-left">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="text-gray-300 text-sm">Directories</span>
            </button>
          </div>

          {/* Starred */}
          <div className="mb-4">
            <div className="flex items-center gap-2 px-2 py-1 mb-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Starred</span>
            </div>
            <div className="px-2 py-2 text-gray-500 text-xs">
              Drag and drop important stuff here
            </div>
          </div>

          {/* Channels */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection('channels')}
              className="w-full flex items-center justify-between px-2 py-1 rounded-md hover:bg-[#2C0D30] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedSections.channels ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Channels</span>
              </div>
            </button>
            {expandedSections.channels && (
              <div className="mt-1">
                {['all-productivity', 'new-channel', 'social'].map((channel) => (
                  <button
                    key={channel}
                    onClick={() => setSelectedChannel(channel)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors cursor-pointer text-left ${
                      selectedChannel === channel
                        ? 'bg-[#541E66] text-white'
                        : 'text-gray-300 hover:bg-[#2C0D30]'
                    }`}
                  >
                    <span className="text-gray-500">#</span>
                    <span className="text-sm">{channel.replace('-', ' ')}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Direct Messages */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection('directMessages')}
              className="w-full flex items-center justify-between px-2 py-1 rounded-md hover:bg-[#2C0D30] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedSections.directMessages ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Direct messages</span>
              </div>
            </button>
            {expandedSections.directMessages && (
              <div className="mt-1">
                <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#2C0D30] transition-colors cursor-pointer text-left">
                  <div className="w-6 h-6 rounded-full bg-[#8B5CF6] flex items-center justify-center">
                    <span className="text-white text-xs font-medium">SK</span>
                  </div>
                  <span className="text-gray-300 text-sm">Samarpan Koirala</span>
                  <span className="text-gray-500 text-xs ml-auto">you</span>
                </button>
              </div>
            )}
          </div>

          {/* Apps */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection('apps')}
              className="w-full flex items-center justify-between px-2 py-1 rounded-md hover:bg-[#2C0D30] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedSections.apps ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Apps</span>
              </div>
            </button>
            {expandedSections.apps && (
              <div className="mt-1">
                <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#2C0D30] transition-colors cursor-pointer text-left relative">
                  <div className="w-6 h-6 rounded-full bg-[#8B5CF6] flex items-center justify-center">
                    <span className="text-white text-xs">R</span>
                  </div>
                  <span className="text-gray-300 text-sm">Remindly Bot</span>
                  <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center ml-auto">
                    <span className="text-white text-xs">1</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section - Invite Teammates */}
        <div className="px-4 py-4 border-t border-[#3D1E40] bg-[#1D0C20]">
          <p className="text-gray-500 text-xs mb-3">Remindly works better when you use it together.</p>
          <button className="w-full flex items-center gap-2 px-3 py-2 bg-[#2C0D30] hover:bg-[#3D1E40] rounded-md transition-colors cursor-pointer">
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span className="text-gray-300 text-sm font-medium">Invite teammates</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-[#0F0514]">
        {/* Content will go here */}
      </div>
    </div>
  );
}
