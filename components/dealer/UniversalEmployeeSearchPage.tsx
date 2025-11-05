import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { GlobalSearchResult } from '../../types';
import Input from '../common/Input';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { formatDate } from '../../utils/helpers';

const UniversalEmployeeSearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceTimeout = useRef<number | null>(null);

  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    if (query.trim() === '') {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setSearched(true);
    
    debounceTimeout.current = setTimeout(async () => {
      const searchResults = await api.universalSearch(query);
      setResults(searchResults);
      setLoading(false);
    }, 500);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [query]);

  const getStatusColor = (status: string) => {
      switch (status) {
          case 'active': return 'green';
          case 'terminated': return 'red';
          case 'inactive': return 'gray';
          default: return 'gray';
      }
  }

  return (
    <Card title="Universal Search">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
                <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                        <strong>Privacy Notice:</strong> Search results may include shared histories and termination reasons from other dealers in the network. By using this tool, you acknowledge this policy.
                    </p>
                </div>
            </div>
        </div>
      
        <Input
            placeholder="Start typing to search by Name, Phone, Aadhar, or Official ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full"
            autoFocus
        />

      {searched && (
        <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-semibold text-gray-600">
                    {loading ? 'Searching...' : `${results.length} results found for "${query}"`}
                </h4>
            </div>
            
            <div className="space-y-4">
                {results.map(result => (
                <div key={`${result.entityRefId}-${result.ownerDealerId}`} className="p-4 border rounded-md bg-gray-50">
                    <div className="flex justify-between items-start">
                    <div>
                        <p className="font-bold text-lg text-primary">{result.canonicalName}</p>
                        <p className="text-sm text-gray-500 capitalize">
                            {result.entityType} {result.customerType ? `(${result.customerType})` : ''} | 
                            <span className="font-semibold"> Working with: {result.ownerDealerName}</span>
                        </p>
                    </div>
                    <Badge color={getStatusColor(result.statusSummary)}>{result.statusSummary}</Badge>
                    </div>
                    {result.statusSummary === 'terminated' && result.terminationDate && result.terminationReason && (
                    <div className="mt-3 pt-3 border-t border-red-200">
                        <div className="p-3 bg-red-50 rounded-md">
                            <p><strong className="font-semibold text-red-800">Terminated on:</strong> <span className="text-red-700">{formatDate(result.terminationDate)}</span></p>
                            <p><strong className="font-semibold text-red-800">Reason:</strong> <span className="text-red-700">{result.terminationReason}</span></p>
                        </div>
                    </div>
                    )}
                    {result.statusSummary === 'inactive' && result.terminationDate && result.terminationReason && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="p-3 bg-gray-100 rounded-md">
                            <p><strong className="font-semibold text-gray-800">Terminated on:</strong> <span className="text-gray-700">{formatDate(result.terminationDate)}</span></p>
                            <p><strong className="font-semibold text-gray-800">Reason:</strong> <span className="text-gray-700">{result.terminationReason}</span></p>
                        </div>
                    </div>
                    )}
                </div>
                ))}
                {!loading && results.length === 0 && <p>No matching records found across the network.</p>}
            </div>
        </div>
      )}
    </Card>
  );
};

export default UniversalEmployeeSearchPage;