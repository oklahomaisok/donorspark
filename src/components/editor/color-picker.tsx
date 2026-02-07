'use client';

import { useState, useEffect } from 'react';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  lightMode?: boolean;
}

export function ColorPicker({ label, value, onChange, lightMode = false }: ColorPickerProps) {
  const [inputValue, setInputValue] = useState(value);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value.toUpperCase();

    // Auto-add # if missing
    if (newValue && !newValue.startsWith('#')) {
      newValue = '#' + newValue;
    }

    setInputValue(newValue);

    // Validate hex color
    const isValidHex = /^#[0-9A-F]{6}$/i.test(newValue);
    setIsValid(isValidHex);

    if (isValidHex) {
      onChange(newValue);
    }
  };

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase();
    setInputValue(newValue);
    setIsValid(true);
    onChange(newValue);
  };

  if (lightMode) {
    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="color"
              value={value}
              onChange={handleColorPickerChange}
              className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 bg-transparent"
              style={{ padding: 0 }}
            />
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="#000000"
            maxLength={7}
            className={`flex-1 bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-900 font-mono
              ${isValid ? 'border-gray-200 focus:border-[#C15A36]' : 'border-red-500'}
              focus:outline-none focus:ring-2 focus:ring-[#C15A36]/20 transition-colors`}
          />
        </div>
        {!isValid && (
          <p className="text-xs text-red-500">Enter a valid HEX color (e.g., #FF5500)</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={handleColorPickerChange}
            className="w-10 h-10 rounded-lg cursor-pointer border border-neutral-700 bg-transparent"
            style={{ padding: 0 }}
          />
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="#000000"
          maxLength={7}
          className={`flex-1 bg-neutral-800 border rounded-lg px-3 py-2 text-sm text-white font-mono
            ${isValid ? 'border-neutral-700 focus:border-[#C15A36]' : 'border-red-500'}
            focus:outline-none transition-colors`}
        />
      </div>
      {!isValid && (
        <p className="text-xs text-red-400">Enter a valid HEX color (e.g., #FF5500)</p>
      )}
    </div>
  );
}
