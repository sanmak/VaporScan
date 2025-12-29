#!/bin/bash

# MIT License
#
# Copyright (c) 2025 VaporScan Contributors
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

# Script to add MIT license headers to all source files

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# License header for TypeScript/JavaScript files
TS_HEADER="/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

"

echo -e "${GREEN}Adding MIT license headers to source files...${NC}"

# Count files processed
count=0

# Function to check if file already has license
has_license() {
    local file="$1"
    grep -q "Copyright (c) 2025 VaporScan" "$file" 2>/dev/null
}

# Function to add license to TypeScript/JavaScript files
add_ts_license() {
    local file="$1"

    if has_license "$file"; then
        echo -e "${YELLOW}Skipping $file (already has license)${NC}"
        return
    fi

    echo "$TS_HEADER" | cat - "$file" > "$file.tmp"
    mv "$file.tmp" "$file"
    echo -e "${GREEN}✓ Added license to $file${NC}"
    count=$((count + 1))
}

# Find and process TypeScript and JavaScript files
while IFS= read -r -d '' file; do
    add_ts_license "$file"
done < <(find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) ! -name "*.d.ts" -print0 2>/dev/null)

# Find and process test files
while IFS= read -r -d '' file; do
    add_ts_license "$file"
done < <(find tests -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" \) -print0 2>/dev/null)

echo -e "${GREEN}Done! Added license headers to $count files.${NC}"

exit 0
