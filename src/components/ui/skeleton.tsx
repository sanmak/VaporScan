/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { cn } from '@/lib/utils/index';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />;
}

export { Skeleton };
