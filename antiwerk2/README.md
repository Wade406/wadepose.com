AntiWerk 2 — What Changed From Version 1
The most significant upgrade between versions is the maze construction system. Version 1 used a flag-based approach — each cell in a 10x10 grid carried boolean values (top, bottom, left, right) that triggered line drawing on cell edges. It worked, but describing walls cell-by-cell doesn't scale and the collision system had to infer physical boundaries from those flags at runtime.
Version 2 replaced that entirely. I drew the maze in Adobe Illustrator, exported the SVG code, talked Claude into creating the path coordinates which were parsed and verified against a numbered reference grid before being converted into explicit 5px-wide rectangles via an addWall() pipeline. Both Grok and Claude vehemently assured me this system was much more robust in dealing with a shifting collision environment. 

Other changes from v1 to v2:
Gravity change interval is now randomized rather than fixed at 15 seconds
Monster system expanded from one hunter to an array — a second monster type (wanderer) spawns dynamically on mouse click with distinct movement behavior
Hunter certainty and stillness logic refined
All tunable speed and timing constants consolidated at the top of the file for easy adjustment
Full sectioned architecture replacing the flat layout of v1
Learned AABB rectangle collision as a robust alternative to edge-flag inference