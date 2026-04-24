<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Command Center • Mark's Room</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <style>
    .poster { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
    .poster.running { 
      box-shadow: 0 0 40px #22c55e, 0 0 80px #22c55e; 
      filter: brightness(1.15);
    }
    .poster.stopped { 
      box-shadow: 0 0 25px #ef4444; 
      filter: brightness(0.85);
    }
    .sword-swipe {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 120px;
      height: 4px;
      background: linear-gradient(90deg, transparent, #fff, transparent);
      transform: translate(-50%, -50%) rotate(-35deg);
      animation: sword-slash 0.6s ease-out forwards;
      pointer-events: none;
      z-index: 50;
    }
    @keyframes sword-slash {
      0% { transform: translate(-50%, -50%) rotate(-35deg) scale(0.2); opacity: 0; }
      30% { opacity: 1; }
      100% { transform: translate(-50%, -50%) rotate(-35deg) scale(1.4); opacity: 0; }
    }
  </style>
</head>
<body class="bg-[#e8e0d0] text-gray-800 font-sans">
  <div class="max-w-[1400px] mx-auto p-6">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center gap-x-4">
        <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        <span class="font-bold text-3xl tracking-tight">Mark's Command Center</span>
      </div>
      <button onclick="logout()" class="px-5 py-2 text-red-600 hover:bg-red-100 rounded-xl text-sm">Logout</button>
    </div>

    <div class="grid grid-cols-12 gap-6">
      
      <!-- Spider-Man Poster = SD Forge -->
      <div class="col-span-5">
        <div id="poster-sd-forge" 
             class="poster relative bg-white rounded-3xl overflow-hidden shadow-2xl border-[14px] border-[#222] cursor-pointer"
             onclick="toggleContainer('sd-forge')">
          <img src="https://picsum.photos/id/1015/600/700" class="w-full h-[540px] object-cover" alt="Spider-Man">
          <div class="absolute bottom-0 left-0 right-0 bg-black/90 p-5 text-white">
            <div class="flex justify-between items-end">
              <div>
                <div class="font-bold text-2xl">SD Forge</div>
                <div id="status-sd-forge" class="text-emerald-400 text-sm font-medium">● Running</div>
              </div>
              <button onclick="event.stopImmediatePropagation(); fetchLogs('sd-forge')" 
                      class="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-2xl text-sm flex items-center gap-x-2 transition">
                <i class="fa-solid fa-volume-up text-xl"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- TV = Log Terminal -->
      <div class="col-span-7">
        <div class="bg-[#111] rounded-3xl p-5 shadow-2xl border-[16px] border-[#222]">
          <div class="flex items-center justify-between mb-4 px-3">
            <div class="flex items-center gap-x-3">
              <div class="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse"></div>
              <span class="text-red-500 font-mono text-xs tracking-[4px]">LIVE TERMINAL • GCP VM</span>
            </div>
            <div onclick="clearAllLogs()" class="text-xs text-gray-400 hover:text-red-400 cursor-pointer">CLEAR ALL</div>
          </div>
          
          <div id="log-output" 
               class="bg-black rounded-2xl p-6 h-[460px] overflow-y-auto font-mono text-[13px] text-green-400 leading-relaxed whitespace-pre-wrap">
            Welcome back, Mark.<br>
            Click a poster to toggle • Click speaker to fetch logs
          </div>
        </div>
      </div>

      <!-- One Piece Poster = Filebrowser -->
      <div class="col-span-5">
        <div id="poster-filebrowser" 
             class="poster relative bg-white rounded-3xl overflow-hidden shadow-2xl border-[14px] border-[#222] cursor-pointer"
             onclick="toggleContainer('filebrowser')">
          <img src="https://picsum.photos/id/1018/600/700" class="w-full h-[540px] object-cover" alt="One Piece">
          <div class="absolute bottom-0 left-0 right-0 bg-black/90 p-5 text-white">
            <div class="flex justify-between items-end">
              <div>
                <div class="font-bold text-2xl">Filebrowser</div>
                <div id="status-filebrowser" class="text-emerald-400 text-sm font-medium">● Running</div>
              </div>
              <button onclick="event.stopImmediatePropagation(); fetchLogs('filebrowser')" 
                      class="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-2xl text-sm flex items-center gap-x-2 transition">
                <i class="fa-solid fa-volume-up text-xl"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Bookshelf + PC Stats -->
      <div class="col-span-12 mt-2">
        <div class="bg-[#d4c9b0] rounded-3xl p-6 shadow-inner flex gap-8 items-end">
          
          <!-- Interactive Figurines -->
          <div class="flex-1">
            <div class="text-xs font-bold tracking-[2px] text-[#5c4f3a] mb-4">BOOKSHELF • ACTIONS</div>
            <div class="flex gap-8 items-end">
              <!-- Zoro -->
              <div onclick="clearLogsWithSword('sd-forge')" 
                   class="cursor-pointer group flex flex-col items-center relative">
                <div class="w-20 h-20 bg-[#3a2f1f] rounded-2xl flex items-center justify-center text-6xl group-active:scale-90 transition shadow-inner">⚔️</div>
                <div class="text-xs mt-2 font-medium text-[#5c4f3a]">ZORO • CLEAR LOGS</div>
              </div>
              
              <!-- Luffy -->
              <div onclick="clearLogsWithSword('filebrowser')" 
                   class="cursor-pointer group flex flex-col items-center relative">
                <div class="w-20 h-20 bg-[#3a2f1f] rounded-2xl flex items-center justify-center text-6xl group-active:scale-90 transition shadow-inner">🪝</div>
                <div class="text-xs mt-2 font-medium text-[#5c4f3a]">LUFFY • CLEAR LOGS</div>
              </div>
            </div>
          </div>

          <!-- PC Stats -->
          <div class="flex-1 bg-[#1a1a1a] rounded-2xl p-6 text-white">
            <div class="flex justify-between mb-5">
              <div class="font-bold">GCP VM LIVE STATS</div>
              <div class="text-xs text-emerald-400">● REAL-TIME</div>
            </div>
            <div class="grid grid-cols-4 gap-6 text-center">
              <div><div id="cpu-val" class="font-mono text-4xl font-bold">—</div><div class="text-xs text-gray-400">CPU</div></div>
              <div><div id="gpu-val" class="font-mono text-4xl font-bold">—</div><div class="text-xs text-gray-400">GPU</div></div>
              <div><div id="ram-val" class="font-mono text-4xl font-bold">—</div><div class="text-xs text-gray-400">RAM</div></div>
              <div><div id="storage-val" class="font-mono text-4xl font-bold">—</div><div class="text-xs text-gray-400">STORAGE</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script src="app.js"></script>
</body>
</html>
