#!/bin/bash
# Patches @initia/interwovenkit-react to polyfill useEffectEvent (not in React 19 stable)
FILE=$(find /Users/solpochi/Projects/self/kitpot/node_modules/.bun -name "index.js" -path "*interwovenkit-react*" 2>/dev/null | head -1)
if [ -z "$FILE" ]; then
  echo "interwovenkit-react not found in .bun cache, skipping patch"
  exit 0
fi
if grep -q "useEffectEvent as jn" "$FILE"; then
  sed -i '' 's/useEffectEvent as jn, //g' "$FILE"
  # Insert polyfill after the react import line
  LINENUM=$(grep -n 'from "react";' "$FILE" | head -1 | cut -d: -f1)
  sed -i '' "${LINENUM}a\\
const jn = (fn) => { const ref = Ke(fn); ref.current = fn; return Se(function(...args) { return ref.current.apply(this, args); }, []); };" "$FILE"
  echo "Patch applied to $FILE"
else
  echo "Already patched or not found, skipping"
fi
