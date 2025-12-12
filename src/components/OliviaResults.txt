<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OliviaResults Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            'quantum-purple': '#a855f7',
            'quantum-cyan': '#22d3ee',
            'quantum-green': '#22c55e',
            'quantum-red': '#ef4444',
          }
        }
      }
    }
  </script>
  <style>
    body {
      background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
      min-height: 100vh;
    }
    .glass-card {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
    }
  </style>
</head>
<body class="p-8">
  <div class="max-w-2xl mx-auto">
    <!-- OliviaResults Component Preview -->
    <div class="glass-card border border-purple-500/30 rounded-2xl overflow-hidden">
      
      <!-- Header -->
      <div class="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 px-6 py-4 border-b border-white/10">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-purple-500/30 rounded-xl">
              <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-white">Olivia's Analysis</h3>
              <p class="text-xs text-gray-400">AI-Powered Property Comparison</p>
            </div>
          </div>
          <button class="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <svg class="w-5 h-5 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="p-6 space-y-6">
        
        <!-- Verbal Script - Olivia's Voice -->
        <div class="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
          <div class="flex items-start gap-3">
            <div class="p-2 bg-purple-500/20 rounded-lg flex-shrink-0">
              <svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>
            <div>
              <p class="text-sm text-gray-300 italic leading-relaxed">
                "Based on my analysis, I'd recommend 123 Ocean View Drive. It offers the best combination of value at $285 per square foot, a strong Smart Score of 87, and excellent proximity to the beach. While 456 Palm Street has a slightly lower price point, the Ocean View property's newer construction (2019) means lower maintenance costs ahead. The third property at 789 Sunset Blvd, though charming, shows signs of age that could require significant investment."
              </p>
              <p class="text-xs text-purple-400 mt-2">— Olivia, CLUES™ AI Advisor</p>
            </div>
          </div>
        </div>

        <!-- Top Recommendation Card -->
        <div class="bg-gradient-to-r from-green-500/20 to-cyan-500/20 border border-green-500/30 rounded-xl p-4">
          <div class="flex items-center gap-2 mb-2">
            <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
            </svg>
            <span class="text-sm font-medium text-green-400">Olivia's Top Pick</span>
          </div>
          <h4 class="text-lg font-semibold text-white mb-1">123 Ocean View Drive, St. Pete Beach</h4>
          <p class="text-sm text-gray-300">Best overall value with newest construction, highest Smart Score, and prime beachfront location.</p>
        </div>

        <!-- Rankings List -->
        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-400 uppercase tracking-wider">Full Rankings</h4>
          
          <!-- Rank 1 -->
          <div class="bg-white/5 border border-green-500/30 rounded-xl p-4">
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-3">
                <span class="bg-gradient-to-r from-yellow-500 to-amber-500 px-2 py-1 rounded-lg text-white text-xs font-bold flex items-center gap-1">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  #1 Pick
                </span>
                <div>
                  <h5 class="font-medium text-white text-sm">123 Ocean View Drive, St. Pete Beach</h5>
                </div>
              </div>
              <div class="text-right">
                <div class="text-lg font-bold text-cyan-400">87</div>
                <div class="text-xs text-gray-500">Olivia Score</div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4 mt-3">
              <div>
                <div class="flex items-center gap-1 text-xs text-green-400 mb-2">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/>
                  </svg>
                  <span>Pros</span>
                </div>
                <ul class="space-y-1">
                  <li class="text-xs text-gray-300 flex items-start gap-1"><span class="text-green-400">+</span> Best price per sqft at $285</li>
                  <li class="text-xs text-gray-300 flex items-start gap-1"><span class="text-green-400">+</span> Newest construction (2019)</li>
                  <li class="text-xs text-gray-300 flex items-start gap-1"><span class="text-green-400">+</span> Highest Smart Score (87)</li>
                </ul>
              </div>
              <div>
                <div class="flex items-center gap-1 text-xs text-red-400 mb-2">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"/>
                  </svg>
                  <span>Cons</span>
                </div>
                <ul class="space-y-1">
                  <li class="text-xs text-gray-300 flex items-start gap-1"><span class="text-red-400">−</span> Higher total price ($685,000)</li>
                  <li class="text-xs text-gray-300 flex items-start gap-1"><span class="text-red-400">−</span> HOA fees $450/month</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Rank 2 -->
          <div class="bg-white/5 border border-white/10 rounded-xl p-4">
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-3">
                <span class="bg-gradient-to-r from-gray-400 to-gray-500 px-2 py-1 rounded-lg text-white text-xs font-bold flex items-center gap-1">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 15l-8 5 3-9L2 6h9l3-6 3 6h9l-7 5 3 9z"/>
                  </svg>
                  #2
                </span>
                <div>
                  <h5 class="font-medium text-white text-sm">456 Palm Street, Clearwater</h5>
                </div>
              </div>
              <div class="text-right">
                <div class="text-lg font-bold text-cyan-400">79</div>
                <div class="text-xs text-gray-500">Olivia Score</div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4 mt-3">
              <div>
                <div class="flex items-center gap-1 text-xs text-green-400 mb-2">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/>
                  </svg>
                  <span>Pros</span>
                </div>
                <ul class="space-y-1">
                  <li class="text-xs text-gray-300 flex items-start gap-1"><span class="text-green-400">+</span> Lowest price ($525,000)</li>
                  <li class="text-xs text-gray-300 flex items-start gap-1"><span class="text-green-400">+</span> No HOA fees</li>
                  <li class="text-xs text-gray-300 flex items-start gap-1"><span class="text-green-400">+</span> Larger lot (0.35 acres)</li>
                </ul>
              </div>
              <div>
                <div class="flex items-center gap-1 text-xs text-red-400 mb-2">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"/>
                  </svg>
                  <span>Cons</span>
                </div>
                <ul class="space-y-1">
                  <li class="text-xs text-gray-300 flex items-start gap-1"><span class="text-red-400">−</span> Older construction (2005)</li>
                  <li class="text-xs text-gray-300 flex items-start gap-1"><span class="text-red-400">−</span> HVAC needs replacement</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Rank 3 -->
          <div class="bg-white/5 border border-white/10 rounded-xl p-4">
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-3">
                <span class="bg-gradient-to-r from-amber-700 to-amber-800 px-2 py-1 rounded-lg text-white text-xs font-bold flex items-center gap-1">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 15l-8 5 3-9L2 6h9l3-6 3 6h9l-7 5 3 9z"/>
                  </svg>
                  #3
                </span>
                <div>
                  <h5 class="font-medium text-white text-sm">789 Sunset Blvd, Tampa</h5>
                </div>
              </div>
              <div class="text-right">
                <div class="text-lg font-bold text-cyan-400">68</div>
                <div class="text-xs text-gray-500">Olivia Score</div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4 mt-3">
              <div>
                <div class="flex items-center gap-1 text-xs text-green-400 mb-2">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/>
                  </svg>
                  <span>Pros</span>
                </div>
                <ul class="space-y-1">
                  <li class="text-xs text-gray-300 flex items-start gap-1"><span class="text-green-400">+</span> Most square footage (2,800)</li>
                  <li class="text-xs text-gray-300 flex items-start gap-1"><span class="text-green-400">+</span> Updated kitchen</li>
                </ul>
              </div>
              <div>
                <div class="flex items-center gap-1 text-xs text-red-400 mb-2">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"/>
                  </svg>
                  <span>Cons</span>
                </div>
                <ul class="space-y-1">
                  <li class="text-xs text-gray-300 flex items-start gap-1"><span class="text-red-400">−</span> Oldest property (1998)</li>
                  <li class="text-xs text-gray-300 flex items-start gap-1"><span class="text-red-400">−</span> Roof needs attention</li>
                  <li class="text-xs text-gray-300 flex items-start gap-1"><span class="text-red-400">−</span> Flood zone concerns</li>
                </ul>
              </div>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="text-center pt-2 border-t border-white/10">
          <p class="text-xs text-gray-500">
            Analysis powered by CLUES™ AI • Results based on provided property data
          </p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>