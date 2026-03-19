'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  X, 
  Filter, 
  SortAsc, 
  SortDesc,
  Calendar,
  HardDrive,
  FileType,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { FileItem } from '@/types/file.types';

export interface FileSearchProps {
  files: FileItem[];
  onSearchResults: (results: FileItem[]) => void;
  placeholder?: string;
  className?: string;
  showFilters?: boolean;
  autoFocus?: boolean;
}

export interface SearchFilters {
  fileType: string;
  sizeRange: 'all' | 'small' | 'medium' | 'large';
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
  sortBy: 'name' | 'size' | 'date' | 'type';
  sortOrder: 'asc' | 'desc';
}

export interface SearchResult extends FileItem {
  matchScore: number;
  highlightedName: string;
  highlightedType: string;
}

const DEFAULT_FILTERS: SearchFilters = {
  fileType: 'all',
  sizeRange: 'all',
  dateRange: 'all',
  sortBy: 'name',
  sortOrder: 'asc',
};

export const FileSearch: React.FC<FileSearchProps> = ({
  files,
  onSearchResults,
  placeholder = 'Search files by name or type...',
  className = '',
  showFilters = true,
  autoFocus = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Highlight text matches in a string
  const highlightMatches = useCallback((text: string, query: string): string => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>');
  }, []);

  // Calculate match score for a file
  const calculateMatchScore = useCallback((file: FileItem, query: string): number => {
    if (!query.trim()) return 1;
    
    const lowerQuery = query.toLowerCase();
    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();
    
    let score = 0;
    
    // Exact name match gets highest score
    if (fileName === lowerQuery) {
      score += 100;
    }
    // Name starts with query gets high score
    else if (fileName.startsWith(lowerQuery)) {
      score += 80;
    }
    // Name contains query gets medium score
    else if (fileName.includes(lowerQuery)) {
      score += 60;
    }
    
    // Type matches get additional score
    if (fileType.includes(lowerQuery)) {
      score += 40;
    }
    
    // File extension matches get additional score
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension && extension.includes(lowerQuery)) {
      score += 30;
    }
    
    return score;
  }, []);

  // Filter files by size range
  const filterBySize = useCallback((file: FileItem, sizeRange: string): boolean => {
    if (sizeRange === 'all') return true;
    
    const sizeInMB = file.size / (1024 * 1024);
    
    switch (sizeRange) {
      case 'small':
        return sizeInMB < 10;
      case 'medium':
        return sizeInMB >= 10 && sizeInMB < 100;
      case 'large':
        return sizeInMB >= 100;
      default:
        return true;
    }
  }, []);

  // Filter files by date range
  const filterByDate = useCallback((file: FileItem, dateRange: string): boolean => {
    if (dateRange === 'all') return true;
    
    const now = new Date();
    const fileDate = new Date(file.uploadDate);
    const diffTime = now.getTime() - fileDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    switch (dateRange) {
      case 'today':
        return diffDays <= 1;
      case 'week':
        return diffDays <= 7;
      case 'month':
        return diffDays <= 30;
      case 'year':
        return diffDays <= 365;
      default:
        return true;
    }
  }, []);

  // Filter files by type
  const filterByType = useCallback((file: FileItem, fileType: string): boolean => {
    if (fileType === 'all') return true;
    
    const type = file.type.toLowerCase();
    
    switch (fileType) {
      case 'image':
        return type.startsWith('image/');
      case 'video':
        return type.startsWith('video/');
      case 'audio':
        return type.startsWith('audio/');
      case 'document':
        return type.includes('pdf') || type.includes('document') || type.includes('text');
      case 'archive':
        return type.includes('zip') || type.includes('rar') || type.includes('archive');
      default:
        return true;
    }
  }, []);

  // Sort files
  const sortFiles = useCallback((files: SearchResult[], sortBy: string, sortOrder: string): SearchResult[] => {
    return [...files].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'date':
          comparison = new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        default:
          comparison = a.matchScore - b.matchScore;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, []);

  // Perform search and filtering
  const searchResults = useMemo((): SearchResult[] => {
    setIsSearching(true);
    
    let results: SearchResult[] = files
      .filter(file => filterByType(file, filters.fileType))
      .filter(file => filterBySize(file, filters.sizeRange))
      .filter(file => filterByDate(file, filters.dateRange))
      .map(file => {
        const matchScore = calculateMatchScore(file, searchQuery);
        return {
          ...file,
          matchScore,
          highlightedName: highlightMatches(file.name, searchQuery),
          highlightedType: highlightMatches(file.type, searchQuery),
        };
      })
      .filter(file => !searchQuery.trim() || file.matchScore > 0);

    // Sort results
    results = sortFiles(results, filters.sortBy, filters.sortOrder);
    
    // If there's a search query, sort by match score first
    if (searchQuery.trim()) {
      results = results.sort((a, b) => b.matchScore - a.matchScore);
    }
    
    setTimeout(() => setIsSearching(false), 100);
    
    return results;
  }, [files, searchQuery, filters, calculateMatchScore, highlightMatches, filterByType, filterBySize, filterByDate, sortFiles]);

  // Update search results when they change
  useEffect(() => {
    onSearchResults(searchResults);
  }, [searchResults, onSearchResults]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Update filter
  const updateFilter = useCallback(<K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Get file type options
  const fileTypeOptions = useMemo(() => {
    const types = new Set<string>();
    files.forEach(file => {
      const type = file.type.toLowerCase();
      if (type.startsWith('image/')) types.add('image');
      else if (type.startsWith('video/')) types.add('video');
      else if (type.startsWith('audio/')) types.add('audio');
      else if (type.includes('pdf') || type.includes('document') || type.includes('text')) types.add('document');
      else if (type.includes('zip') || type.includes('rar') || type.includes('archive')) types.add('archive');
    });
    return Array.from(types);
  }, [files]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Input
          type="text"
          label=""
          placeholder={placeholder}
          value={searchQuery}
          onChange={setSearchQuery}
          icon={<Search className="w-4 h-4" />}
          autoFocus={autoFocus}
          className="pr-20"
        />
        
        {/* Clear button */}
        <AnimatePresence>
          {searchQuery && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={clearSearch}
              className="absolute right-12 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </motion.button>
          )}
        </AnimatePresence>
        
        {/* Filter toggle */}
        {showFilters && (
          <Button
            variant={showAdvancedFilters ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <Filter className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showFilters && showAdvancedFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* File Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <FileType className="w-4 h-4 inline mr-1" />
                    File Type
                  </label>
                  <select
                    value={filters.fileType}
                    onChange={(e) => updateFilter('fileType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    {fileTypeOptions.map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Size Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <HardDrive className="w-4 h-4 inline mr-1" />
                    File Size
                  </label>
                  <select
                    value={filters.sizeRange}
                    onChange={(e) => updateFilter('sizeRange', e.target.value as SearchFilters['sizeRange'])}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Sizes</option>
                    <option value="small">Small (&lt; 10MB)</option>
                    <option value="medium">Medium (10-100MB)</option>
                    <option value="large">Large (&gt; 100MB)</option>
                  </select>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Upload Date
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => updateFilter('dateRange', e.target.value as SearchFilters['dateRange'])}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                  </select>
                </div>

                {/* Sort Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Sort By
                  </label>
                  <div className="flex space-x-1">
                    <select
                      value={filters.sortBy}
                      onChange={(e) => updateFilter('sortBy', e.target.value as SearchFilters['sortBy'])}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="name">Name</option>
                      <option value="size">Size</option>
                      <option value="date">Date</option>
                      <option value="type">Type</option>
                    </select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="h-10 w-10 p-0"
                    >
                      {filters.sortOrder === 'asc' ? (
                        <SortAsc className="w-4 h-4" />
                      ) : (
                        <SortDesc className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Clear Filters
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Stats */}
      <AnimatePresence>
        {(searchQuery || Object.values(filters).some(v => v !== DEFAULT_FILTERS[v as keyof SearchFilters])) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400"
          >
            <span>
              {isSearching ? (
                'Searching...'
              ) : (
                `Found ${searchResults.length} file${searchResults.length !== 1 ? 's' : ''}`
              )}
              {searchQuery && ` matching "${searchQuery}"`}
            </span>
            
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="text-xs"
              >
                Clear Search
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileSearch;