import React from 'react';
import { User } from '../types/drawing';
import { Users } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

interface UserListProps {
  users: User[];
  currentUserId: string;
}

export const UserList: React.FC<UserListProps> = ({ users, currentUserId }) => {
  const { isDarkMode } = useThemeStore();

  return (
    <div className="fixed top-24 right-4 z-10 hidden lg:block">
      <div className={`backdrop-blur-sm border rounded-xl p-4 shadow-xl max-w-xs ${
        isDarkMode 
          ? 'bg-gray-900/95 border-gray-700' 
          : 'bg-white/95 border-gray-200'
      }`}>
        <div className="flex items-center space-x-2 mb-3">
          <Users size={18} className="text-green-500" />
          <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Active Users ({users.length})
          </h3>
        </div>
        
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {users.map(user => (
            <div key={user.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-opacity-50 transition-colors">
              <div 
                className="w-3 h-3 rounded-full shadow-sm"
                style={{ backgroundColor: user.color }}
              />
              <span className={`text-sm ${
                user.id === currentUserId 
                  ? 'text-blue-500 font-semibold' 
                  : isDarkMode 
                    ? 'text-gray-300' 
                    : 'text-gray-700'
              }`}>
                {user.name} {user.id === currentUserId && '(You)'}
              </span>
            </div>
          ))}
        </div>

        {users.length === 0 && (
          <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            No other users online
          </p>
        )}
      </div>
    </div>
  );
};