#!/bin/bash

# Project Cleanup Script
# This script removes temporary files, logs, and development artifacts

echo "🧹 Starting project cleanup..."

# Remove log files
echo "📋 Removing log files..."
find . -name "*.log" -not -path "./node_modules/*" -delete
rm -f build.log npm-debug.log* yarn-debug.log* yarn-error.log*

# Remove temporary files
echo "🗂️  Removing temporary files..."
find . -name "*.tmp" -o -name "*.temp" -o -name "*.cache" -not -path "./node_modules/*" -delete
find . -name ".DS_Store" -not -path "./node_modules/*" -delete
find . -name "*~" -o -name "*.backup" -o -name "*.bak" -not -path "./node_modules/*" -delete

# Remove TypeScript build info
echo "📦 Removing TypeScript build cache..."
rm -f tsconfig.tsbuildinfo

# Remove test files (be careful with this)
echo "🧪 Removing test files..."
rm -f test-*.js check-admin-users.js

# Remove empty markdown files
echo "📝 Removing empty documentation files..."
find . -name "*.md" -empty -not -path "./node_modules/*" -delete

# Remove Next.js cache (optional - uncomment if needed)
# echo "⚡ Removing Next.js cache..."
# rm -rf .next

echo "✅ Cleanup completed!"
echo "📊 Current directory size:"
du -sh . --exclude=node_modules 2>/dev/null || du -sh .
