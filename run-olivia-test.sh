#!/bin/bash
# Run Olivia Comparison Test

echo "🔬 Running Olivia Prompt Comparison Test..."
echo ""

# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

# Run the test with ts-node
npx ts-node test-olivia-comparison.ts
