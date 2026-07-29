import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

const SearchBar = ({ placeholder = 'Search...', onSearch, onClear }) => {
  const [value, setValue] = useState('');

  const handleChange = (e) => {
    setValue(e.target.value);
    onSearch?.(e.target.value);
  };

  const handleClear = () => {
    setValue('');
    onClear?.();
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 bg-white">
      <MagnifyingGlassIcon className="w-5 h-5 text-slate-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className="flex-1 bg-transparent outline-none text-slate-900 placeholder-slate-500"
      />
      {value && (
        <button
          onClick={handleClear}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default SearchBar;
