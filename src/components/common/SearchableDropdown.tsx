// Searchable Dropdown Component

import React, { useState, useRef, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { colors, transitions } from '../../styles';

export interface SearchableDropdownProps<T> {
  options: T[];
  value: T | null;
  onChange: (value: T | null) => void;
  getOptionLabel: (option: T) => string;
  getOptionValue: (option: T) => string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  error?: string | null;
  required?: boolean;
}

export function SearchableDropdown<T>({
  options,
  value,
  onChange,
  getOptionLabel,
  getOptionValue,
  label,
  placeholder = '선택하세요',
  disabled = false,
  loading = false,
  error = null,
  required = false,
}: SearchableDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 검색 필터링
  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    const query = searchQuery.toLowerCase();
    return options.filter((option) =>
      getOptionLabel(option).toLowerCase().includes(query)
    );
  }, [options, searchQuery, getOptionLabel]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // 드롭다운 오픈 시 검색 input에 포커스
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // 키보드 네비게이션
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled || loading) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        }
        break;

      case 'Enter':
        e.preventDefault();
        if (isOpen && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        } else if (!isOpen) {
          setIsOpen(true);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        break;
    }
  };

  const handleSelect = (option: T) => {
    onChange(option);
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(0);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearchQuery('');
  };

  const toggleDropdown = () => {
    if (!disabled && !loading) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchQuery('');
        setHighlightedIndex(0);
      }
    }
  };

  return (
    <Container ref={containerRef}>
      {label && (
        <Label>
          {label}
          {required && <Required>*</Required>}
        </Label>
      )}

      <DropdownButton
        type="button"
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        $isOpen={isOpen}
        $hasError={!!error}
        $disabled={disabled}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <ValueText $hasValue={!!value}>
          {loading ? '로딩 중...' : value ? getOptionLabel(value) : placeholder}
        </ValueText>
        <Icons>
          {value && !disabled && !loading && (
            <ClearButton onClick={handleClear} aria-label="Clear selection">
              ×
            </ClearButton>
          )}
          <Arrow $isOpen={isOpen}>{loading ? '⏳' : '▼'}</Arrow>
        </Icons>
      </DropdownButton>

      {isOpen && !disabled && !loading && (
        <DropdownMenu role="listbox">
          <SearchInput
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setHighlightedIndex(0);
            }}
            placeholder="검색..."
            onKeyDown={handleKeyDown}
          />

          <OptionsList>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => {
                const optionValue = getOptionValue(option);
                const isSelected = !!(value && getOptionValue(value) === optionValue);
                const isHighlighted = index === highlightedIndex;

                return (
                  <OptionItem
                    key={optionValue}
                    role="option"
                    aria-selected={isSelected}
                    $isSelected={isSelected}
                    $isHighlighted={isHighlighted}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    {getOptionLabel(option)}
                    {isSelected && <CheckMark>✓</CheckMark>}
                  </OptionItem>
                );
              })
            ) : (
              <EmptyState>검색 결과가 없습니다</EmptyState>
            )}
          </OptionsList>
        </DropdownMenu>
      )}

      {error && <ErrorMessage>{error}</ErrorMessage>}
    </Container>
  );
}

// Styled Components
const Container = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${colors.text.primary};
`;

const Required = styled.span`
  color: ${colors.status.error};
  margin-left: 0.25rem;
`;

const DropdownButton = styled.button<{ $isOpen: boolean; $hasError: boolean; $disabled: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${(props) =>
    props.$hasError ? colors.status.error :
    props.$isOpen ? colors.primary.main :
    colors.border.primary};
  border-radius: 6px;
  background-color: ${(props) => props.$disabled ? colors.surface.hover : 'white'};
  font-size: 0.875rem;
  cursor: ${(props) => (props.$disabled ? 'not-allowed' : 'pointer')};
  transition: ${transitions.fast};
  text-align: left;

  &:focus {
    outline: none;
    border-color: ${colors.primary.main};
    box-shadow: 0 0 0 3px ${colors.primary.subtle};
  }

  &:hover:not(:disabled) {
    border-color: ${colors.primary.main};
  }
`;

const ValueText = styled.span<{ $hasValue: boolean }>`
  flex: 1;
  color: ${(props) => (props.$hasValue ? colors.text.primary : colors.text.tertiary)};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Icons = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-left: 0.5rem;
`;

const ClearButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border: none;
  background: none;
  color: ${colors.text.secondary};
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  border-radius: 50%;
  transition: ${transitions.fast};

  &:hover {
    background-color: ${colors.surface.hover};
    color: ${colors.text.primary};
  }
`;

const Arrow = styled.span<{ $isOpen: boolean }>`
  display: inline-block;
  color: ${colors.text.secondary};
  font-size: 0.75rem;
  transform: ${(props) => (props.$isOpen ? 'rotate(180deg)' : 'rotate(0)')};
  transition: transform 0.2s ease;
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.25rem;
  background-color: white;
  border: 1px solid ${colors.border.secondary};
  border-radius: 6px;
  box-shadow: ${colors.shadow.md};
  z-index: 1000;
  max-height: 20rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-bottom: 1px solid ${colors.border.secondary};
  font-size: 0.875rem;
  outline: none;

  &:focus {
    border-bottom-color: ${colors.primary.main};
  }

  &::placeholder {
    color: ${colors.text.tertiary};
  }
`;

const OptionsList = styled.div`
  overflow-y: auto;
  max-height: 16rem;
`;

const OptionItem = styled.div<{ $isSelected: boolean; $isHighlighted: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: ${colors.text.primary};
  background-color: ${(props) =>
    props.$isSelected ? colors.primary.subtle :
    props.$isHighlighted ? colors.surface.hover :
    'transparent'};
  transition: ${transitions.fast};

  &:hover {
    background-color: ${(props) =>
      props.$isSelected ? colors.primary.subtle : colors.surface.hover};
  }
`;

const CheckMark = styled.span`
  color: ${colors.primary.main};
  font-weight: bold;
  margin-left: 0.5rem;
`;

const EmptyState = styled.div`
  padding: 2rem 1rem;
  text-align: center;
  font-size: 0.875rem;
  color: ${colors.text.secondary};
`;

const ErrorMessage = styled.span`
  font-size: 0.8125rem;
  color: ${colors.status.error};
`;
