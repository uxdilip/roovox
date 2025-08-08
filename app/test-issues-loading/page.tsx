"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

export default function TestIssuesLoading() {
  const [categories, setCategories] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Testing categories collection...');
      const res = await databases.listDocuments(
        DATABASE_ID,
        'categories',
        []
      );
      console.log('✅ Categories found:', res.documents);
      setCategories(res.documents);
    } catch (err) {
      console.error('❌ Error fetching categories:', err);
      setError('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const testIssues = async (categoryId: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Testing issues for category:', categoryId);
      const res = await databases.listDocuments(
        DATABASE_ID,
        'issues',
        [Query.equal('category_id', categoryId)]
      );
      console.log('✅ Issues found:', res.documents);
      setIssues(res.documents);
    } catch (err) {
      console.error('❌ Error fetching issues:', err);
      setError('Failed to fetch issues');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Issues Loading Test</h1>
        <p className="text-gray-600">
          Debug the issues loading problem in the booking flow
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={testCategories} disabled={loading}>
            {loading ? 'Testing...' : 'Test Categories Collection'}
          </Button>
          
          {categories.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Categories Found:</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category.$id} className="flex items-center justify-between p-2 border rounded">
                    <span>{category.name}</span>
                    <Button 
                      size="sm" 
                      onClick={() => testIssues(category.$id)}
                      disabled={loading}
                    >
                      Test Issues
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Issues Found</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {issues.map((issue) => (
                <div key={issue.$id} className="p-2 border rounded">
                  <div className="font-medium">{issue.name}</div>
                  <div className="text-sm text-gray-600">{issue.description}</div>
                  <div className="text-xs text-gray-500">ID: {issue.$id}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="p-4">
            <div className="text-red-600">{error}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 