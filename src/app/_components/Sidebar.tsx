"use client";

import React, { useState } from "react";
import { Plus, MessageSquare, ChevronRight, ChevronLeft } from "lucide-react";

interface ConversationHistory {
  id: string;
  ticker: string;
  timestamp: Date;
  preview: string;
  messages: any[];
}

interface SidebarProps {
  conversations: ConversationHistory[];
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  currentConversationId: string | null;
}

export default function Sidebar({
  conversations,
  onNewChat,
  onSelectConversation,
  currentConversationId,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className={`${isCollapsed ? "w-16" : "w-80"
        } bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-300 ease-in-out`}
    >
      {/* Header - DARK */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold text-white">Conversations</h2>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* New Chat Button - DARK */}
      <div className="p-4">
        <button
          onClick={onNewChat}
          className={`w-full ${isCollapsed ? "px-2 py-2" : "px-4 py-3"
            } bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center justify-center gap-2 text-white font-medium`}
        >
          <Plus className="w-5 h-5" />
          {!isCollapsed && <span>New Analysis</span>}
        </button>
      </div>

      {/* Chat History - DARK */}
      <div className="flex-1 overflow-y-auto">
        {!isCollapsed ? (
          <div className="px-2 space-y-1">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={`w-full p-3 rounded-lg text-left transition-colors group ${currentConversationId === conversation.id
                    ? "bg-gray-800 border border-gray-700"
                    : "hover:bg-gray-800"
                  }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-green-400 text-sm">
                    ${conversation.ticker}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTimeAgo(conversation.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-300 line-clamp-2 group-hover:text-white transition-colors">
                  {conversation.preview}
                </p>
                <ChevronRight className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity float-right -mt-5" />
              </button>
            ))}

            {conversations.length === 0 && (
              <div className="px-4 py-8 text-center">
                <MessageSquare className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No analyses yet</p>
                <p className="text-xs text-gray-600 mt-1">
                  Start by analyzing your first stock
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            {conversations.slice(0, 5).map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${currentConversationId === conversation.id
                    ? "bg-gray-800 text-green-400"
                    : "hover:bg-gray-800 text-gray-400"
                  }`}
                title={`${conversation.ticker} - ${conversation.preview}`}
              >
                <span className="text-sm font-semibold">
                  {conversation.ticker.substring(0, 2)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}