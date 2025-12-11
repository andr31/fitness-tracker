'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, Trash2, User } from 'lucide-react';

interface Player {
  id: number;
  name: string;
  totalPushups: number;
}

interface PlayerCardProps {
  player: Player;
  onAddPushups: (amount: number) => void;
  onRemovePushups: (amount: number) => void;
  onDelete: () => void;
}

export default function PlayerCard({
  player,
  onAddPushups,
  onRemovePushups,
  onDelete,
}: PlayerCardProps) {
  const [inputValue, setInputValue] = useState('');

  const handleQuickAdd = (amount: number) => {
    onAddPushups(amount);
  };

  const handleCustomAdd = () => {
    const amount = parseInt(inputValue);
    if (!isNaN(amount) && amount > 0) {
      onAddPushups(amount);
      setInputValue('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 shadow-lg border border-gray-700 hover:border-gray-600 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{player.name}</h3>
            <motion.p
              key={player.totalPushups}
              initial={{ scale: 1.3, color: '#FFD700' }}
              animate={{ scale: 1, color: '#FFFFFF' }}
              transition={{ duration: 0.4 }}
              className="text-2xl font-bold"
            >
              {player.totalPushups}
            </motion.p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onDelete}
          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
        >
          <Trash2 className="w-5 h-5 text-red-400 hover:text-red-300" />
        </motion.button>
      </div>

      <div className="space-y-4">
        {/* Quick buttons */}
        <div className="grid grid-cols-4 gap-2">
          {[1, 5, 10, 25].map((amount) => (
            <motion.button
              key={`add-${amount}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleQuickAdd(amount)}
              className="bg-green-500/20 hover:bg-green-500/40 text-green-300 font-bold py-2 rounded transition-colors border border-green-500/30"
            >
              +{amount}
            </motion.button>
          ))}
        </div>

        {/* Custom input */}
        <div className="flex gap-2">
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCustomAdd();
              }
            }}
            placeholder="Custom amount"
            className="flex-1 bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-blue-400 outline-none transition-colors"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCustomAdd}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-4 py-2 rounded transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add
          </motion.button>
        </div>

        {/* Remove button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onRemovePushups(1)}
          className="w-full bg-red-500/20 hover:bg-red-500/40 text-red-300 font-bold py-2 rounded transition-colors border border-red-500/30 flex items-center justify-center gap-2"
        >
          <Minus className="w-4 h-4" />
          Remove 1
        </motion.button>
      </div>
    </motion.div>
  );
}
