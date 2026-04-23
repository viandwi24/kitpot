#!/bin/bash
# Patches @initia/interwovenkit-react to polyfill useEffectEvent (not in React 19 stable)
# Patches ALL instances in .bun cache

PATCHED=0
find /Users/solpochi/Projects/self/kitpot/node_modules/.bun -name "index.js" -path "*interwovenkit-react*dist*" 2>/dev/null | while read FILE; do
  if grep -q "useEffectEvent as jn" "$FILE"; then
    sed -i '' 's/useEffectEvent as jn,//g' "$FILE"
    LINENUM=$(grep -n 'from "react";' "$FILE" | head -1 | cut -d: -f1)
    if [ -n "$LINENUM" ]; then
      sed -i '' "${LINENUM}a\\
const jn = (fn) => { const ref = Se(fn); ref.current = fn; return je(function(...args) { return ref.current.apply(this, args); }, []); };" "$FILE"
    fi
    echo "Patch applied to $FILE"
    PATCHED=$((PATCHED+1))
  else
    echo "Already patched: $FILE"
  fi
done
