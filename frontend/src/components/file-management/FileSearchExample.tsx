'use client';

import React, { useState } from 'react';
import { FileSearch } from './FileSearch';
import { FileList } from './FileList';
import { Card } from '@/components/ui/Card';
import { FileItem } from '@/types/file.types';

// Example file data
const exampleFiles: FileItem[] = [
  {
    id: '1',
    name: 'project-proposal.pdf',
    size: 2.5 * 1024 * 1024, // 2.5MB
    type: 'application/pdf',
    uploadDate: new Date('2024-01-15T10:30:00Z'),
  },
  {
    id: '2',
    name: 'vacation-photos.zip',
    size: 45 * 1024 * 1024, // 45MB
    type: 'application/zip',
    uploadDate: new Date('2024-01-10T14:20:00Z'),
  },
  {
    id: '3',
    name: 'presentation.pptx',
    size: 8.2 * 1024 * 1024, // 8.2MB
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    uploadDate: new Date('2024-01-08T09:15:00Z'),
  },
  {
    id: '4',
    name: 'profile-picture.jpg',
    size: 1.2 * 1024 * 1024, // 1.2MB
    type: 'image/jpeg',
    uploadDate: new Date('2024-01-05T16:45:00Z'),
    thumbnail: 'https://via.placeholder.com/150x150/4F46E5/FFFFFF?text=Profile',
  },
  {
    id: '5',
    name: 'meeting-recording.mp4',
    size: 125 * 1024 * 1024, // 125MB
    type: 'video/mp4',
    uploadDate: new Date('2024-01-03T11:30:00Z'),
  },
  {
    id: '6',
    name: 'budget-spreadsheet.xlsx',
    size: 3.8 * 1024 * 1024, // 3.8MB
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    uploadDate: new Date('2024-01-01T13:20:00Z'),
  },
  {
    id: '7',
    name: 'logo-design.png',
    size: 850 * 1024, // 850KB
    type: 'image/png',
    uploadDate: new Date('2023-12-28T10:10:00Z'),
    thumbnail: 'https://via.placeholder.com/150x150/10B981/FFFFFF?text=Logo',
  },
  {
    id: '8',
    name: 'contract-template.docx',
    size: 1.5 * 1024 * 1024, // 1.5MB
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    uploadDate: new Date('2023-12-25T15:30:00Z'),
  },
];

export const FileSearchExample: React.FC = () => {
  const [searchResults, setSearchResults] = useState<FileItem[]>(exampleFiles);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleSearchResults = (results: FileItem[]) => {
    setSearchResults(results);
  };

  const handleDownload = async (file: FileItem) => {
    // Simulate download
    console.log('Downloading file:', file.name);
    alert(`Downloading ${file.name}...`);
  };

  const handleDelete = async (file: FileItem) => {
    // Simulate delete
    console.log('Deleting file:', file.id);
    alert(`Deleted ${file.name}`);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          File Search Example
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Demonstration of the FileSearch component with real-time filtering, advanced filters, and result highlighting
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          {/* Search Component */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Search Files
            </h2>
            <FileSearch
              files={exampleFiles}
              onSearchResults={handleSearchResults}
              placeholder="Search by filename, type, or extension..."
              showFilters={true}
              className="mb-4"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Search Results ({searchResults.length} files)
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                List
              </button>
            </div>
          </div>

          {/* File List */}
          <FileList
            files={searchResults}
            onDownload={handleDownload}
            onDelete={handleDelete}
            providerId="example-provider"
            viewMode={viewMode}
            emptyMessage="No files match your search criteria"
          />
        </div>
      </Card>

      {/* Feature Highlights */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Features Demonstrated
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Real-time Search</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Search by filename, file type, or extension with instant results
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Advanced Filters</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Filter by file type, size range, upload date, and sort options
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Result Highlighting</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Search terms are highlighted in file names and types
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Match Scoring</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Results are ranked by relevance with exact matches first
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Search Statistics</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Shows number of results and current search query
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Clear Functions</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Easy-to-use clear search and reset filters functionality
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FileSearchExample;