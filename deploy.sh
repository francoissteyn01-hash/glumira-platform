#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Starting deployment process..."

# Navigate to the project root directory
cd /home/ubuntu/glumira-platform

# Pull the latest changes from the main branch
echo "Pulling latest changes from GitHub..."
git pull origin main

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the project
echo "Building the project..."
npm run build

# Add all changes to git (including build artifacts)
echo "Adding changes to Git..."
git add .

# Commit changes if there are any
if ! git diff-index --quiet HEAD;
then
  echo "Committing changes..."
  git commit -m "Automated deployment: update build artifacts"
else
  echo "No changes to commit."
fi

# Push changes to GitHub (this will trigger Netlify and Railway deploys)
echo "Pushing changes to GitHub..."
git push origin main

echo "Deployment process completed. Netlify and Railway builds should be triggered."
