/* eslint-disable no-undef */

const CACHE_VERSION = 'v1';
const CACHE_NAME = 'vaporscan-' + CACHE_VERSION;

// Assets to cache immediately (optional - failures won't break installation)
const PRECACHE_URLS = ['/offline.html'];

// Crawl state management
var crawlState = {
  isRunning: false,
  isPaused: false,
  config: null,
  queue: [],
  visited: new Set(),
  crawled: new Set(), // Track URLs that have been fully crawled (not just visited)
  results: new Map(),
  sitemapUrls: new Set(),
  robotsData: null,
  skippedCount: 0, // Track pages skipped due to deduplication
  stats: {
    crawledPages: 0,
    totalPages: 0,
    errorCount: 0,
    avgResponseTime: 0,
  },
};

// Install event - precache assets
self.addEventListener('install', function (event) {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(function (cache) {
        console.log('Service Worker: Caching app shell');
        // Use addAll with error handling - don't fail install if some assets are missing
        return Promise.allSettled(
          PRECACHE_URLS.map(function (url) {
            return cache.add(url).catch(function (err) {
              console.warn('Service Worker: Failed to cache:', url, err);
            });
          })
        );
      })
      .then(function () {
        console.log('Service Worker: Install complete, skipping waiting...');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', function (event) {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches
      .keys()
      .then(function (cacheNames) {
        return Promise.all(
          cacheNames.map(function (cacheName) {
            if (cacheName !== CACHE_NAME && cacheName.startsWith('vaporscan-')) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(function () {
        // Claim all clients so the SW takes control immediately
        console.log('Service Worker: Claiming clients...');
        return self.clients.claim();
      })
      .then(function () {
        console.log('Service Worker: Now controlling all clients');
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', function (event) {
  var request = event.request;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions and internal requests
  if (request.url.startsWith('chrome-extension://')) {
    return;
  }

  // For crawl requests, use network-first strategy
  if (request.url.includes('/api/crawl')) {
    event.respondWith(
      fetch(request)
        .then(function (response) {
          if (response.status === 200) {
            caches.open(CACHE_NAME).then(function (c) {
              c.put(request, response.clone());
            });
          }
          return response;
        })
        .catch(function () {
          return caches.match(request);
        })
    );
    return;
  }

  // For other requests, use cache-first strategy
  event.respondWith(
    caches.match(request).then(function (response) {
      if (response) {
        fetch(request).then(function (freshResponse) {
          if (freshResponse.status === 200) {
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(request, freshResponse.clone());
            });
          }
        });
        return response;
      }

      return fetch(request)
        .then(function (response) {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          var responseToCache = response.clone();

          caches.open(CACHE_NAME).then(function (c) {
            c.put(request, responseToCache);
          });

          return response;
        })
        .catch(function () {
          if (request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
          return null;
        });
    })
  );
});

// Handle Background Sync for crawl operations
if (typeof self.registration !== 'undefined') {
  self.addEventListener('sync', function (event) {
    if (event.tag === 'sync-crawl') {
      event.waitUntil(resumeCrawl());
    }
  });
}

// Message handler for crawl operations
self.addEventListener('message', function (event) {
  var data = event.data || {};
  var type = data.type;
  var payload = data.payload;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'START_CRAWL':
      handleStartCrawl(payload, event.source);
      break;

    case 'PAUSE_CRAWL':
      handlePauseCrawl(event.source);
      break;

    case 'RESUME_CRAWL':
      handleResumeCrawl(event.source);
      break;

    case 'CANCEL_CRAWL':
      handleCancelCrawl(event.source);
      break;

    case 'GET_STATUS':
      sendStatus(event.source);
      break;
  }
});

// Normalize URL for deduplication (remove trailing slash, fragments, normalize case)
function normalizeUrlForDedup(url) {
  try {
    var parsed = new URL(url);
    parsed.hash = '';
    // Remove trailing slash for consistency
    var normalized = parsed.toString().replace(/\/$/, '');
    return normalized.toLowerCase();
  } catch (e) {
    return url.toLowerCase();
  }
}

// Check if URL has already been crawled
function isAlreadyCrawled(url) {
  var normalized = normalizeUrlForDedup(url);
  return crawlState.crawled.has(normalized);
}

// Mark URL as crawled
function markAsCrawled(url) {
  var normalized = normalizeUrlForDedup(url);
  crawlState.crawled.add(normalized);
}

// Start crawling process
function handleStartCrawl(config, client) {
  if (crawlState.isRunning) {
    sendMessage(client, 'CRAWL_ERROR', { error: 'Crawl already in progress' });
    return;
  }

  // Build initial queue - start with base URL if provided
  var initialQueue = [];
  if (config.url) {
    initialQueue.push(config.url);
  }

  // Add manual pages to queue if provided
  var manualPages = config.manualPages || [];
  manualPages.forEach(function (pageUrl) {
    if (pageUrl && initialQueue.indexOf(pageUrl) === -1) {
      initialQueue.push(pageUrl);
    }
  });

  // Initialize crawl state
  crawlState = {
    isRunning: true,
    isPaused: false,
    config: config,
    queue: initialQueue,
    visited: new Set(),
    crawled: new Set(), // Track fully crawled URLs for deduplication
    results: new Map(),
    sitemapUrls: new Set(),
    robotsData: null,
    skippedCount: 0,
    stats: {
      crawledPages: 0,
      totalPages: initialQueue.length,
      errorCount: 0,
      avgResponseTime: 0,
    },
  };

  sendMessage(client, 'CRAWL_STARTED', { config: config });

  // If we have a base URL and respect robots.txt, discover from sitemap
  if (config.url && config.respectRobotsTxt !== false) {
    discoverFromSitemap(config.url)
      .then(function (discovery) {
        crawlState.sitemapUrls = discovery.sitemapUrls;
        crawlState.robotsData = discovery.robotsData;

        // Add sitemap URLs to queue (avoiding duplicates)
        discovery.sitemapUrls.forEach(function (url) {
          var normalized = normalizeUrlForDedup(url);
          if (!crawlState.visited.has(normalized) && crawlState.queue.indexOf(url) === -1) {
            crawlState.queue.push(url);
          }
        });

        crawlState.stats.totalPages = crawlState.queue.length;
        sendProgress(client);

        // Start crawling
        return processCrawlQueue(client);
      })
      .catch(function (error) {
        sendMessage(client, 'CRAWL_ERROR', { error: error.message });
        crawlState.isRunning = false;
      });
  } else {
    // No base URL or not respecting robots - just process manual pages
    processCrawlQueue(client).catch(function (error) {
      sendMessage(client, 'CRAWL_ERROR', { error: error.message });
      crawlState.isRunning = false;
    });
  }
}

// Process the crawl queue with concurrency control
function processCrawlQueue(client) {
  return new Promise(function (resolve) {
    var concurrency = crawlState.config.concurrency || 5;

    // If crawl-delay is specified, force concurrency to 1 and respect delay
    var crawlDelayMs = 0;
    if (crawlState.robotsData && crawlState.robotsData.crawlDelay) {
      concurrency = 1;
      crawlDelayMs = crawlState.robotsData.crawlDelay * 1000;
    }

    var activeRequests = new Set();
    var lastRequestTime = 0;

    function processNext() {
      // Check if done
      if (!crawlState.isRunning) {
        resolve();
        return;
      }

      if (crawlState.isPaused) {
        setTimeout(processNext, 100);
        return;
      }

      // Check max pages limit
      if (
        crawlState.config.maxPages &&
        crawlState.stats.crawledPages >= crawlState.config.maxPages
      ) {
        finishCrawl();
        resolve();
        return;
      }

      // Check crawl delay
      var now = Date.now();
      if (crawlDelayMs > 0 && activeRequests.size > 0) {
        // If we have strict serial crawling, we shouldn't be here with active requests,
        // but just in case, wait until current request finishes
        setTimeout(processNext, 100);
        return;
      }

      if (crawlDelayMs > 0 && now - lastRequestTime < crawlDelayMs) {
        var waitTime = crawlDelayMs - (now - lastRequestTime);
        setTimeout(processNext, waitTime);
        return;
      }

      // Fill up to concurrency limit
      while (
        activeRequests.size < concurrency &&
        crawlState.queue.length > 0 &&
        (!crawlState.config.maxPages ||
          crawlState.stats.crawledPages + activeRequests.size <
          crawlState.config.maxPages)
      ) {
        var url = crawlState.queue.shift();
        var normalizedUrl = normalizeUrlForDedup(url);

        // Skip if URL is empty, already visited, or already crawled
        if (!url || crawlState.visited.has(normalizedUrl) || isAlreadyCrawled(url)) {
          if (url && isAlreadyCrawled(url)) {
            crawlState.skippedCount += 1;
          }
          continue;
        }

        // Mark as visited (prevents adding to queue again)
        crawlState.visited.add(normalizedUrl);
        lastRequestTime = Date.now();

        (function (currentUrl) {
          var requestPromise = crawlPage(currentUrl, client).finally(function () {
            activeRequests.delete(requestPromise);
            processNext();
          });
          activeRequests.add(requestPromise);
        })(url);

        // If we have a crawl delay, stop filling queue after one request
        if (crawlDelayMs > 0) {
          break;
        }
      }

      // Check if done
      if (activeRequests.size === 0 && crawlState.queue.length === 0) {
        finishCrawl();
        resolve();
      }
    }

    function finishCrawl() {
      if (crawlState.isRunning) {
        crawlState.isRunning = false;
        sendMessage(client, 'CRAWL_COMPLETED', {
          stats: crawlState.stats,
          skippedCount: crawlState.skippedCount,
          results: Object.fromEntries(crawlState.results),
          sitemapUrls: Array.from(crawlState.sitemapUrls),
          robotsData: crawlState.robotsData,
        });
      }
    }

    processNext();
  });
}

// Crawl a single page
function crawlPage(url, client) {
  var startTime = performance.now();

  var controller = new AbortController();
  var timeoutId = setTimeout(function () {
    controller.abort();
  }, crawlState.config.timeout || 10000);

  // Use no-cors mode to allow fetching cross-origin resources
  // Note: This returns an opaque response, so we can't read the body
  // For same-origin requests, we use cors mode
  var isSameOrigin = false;
  try {
    var configUrl = new URL(crawlState.config.url);
    var targetUrl = new URL(url);
    isSameOrigin = configUrl.origin === targetUrl.origin;
  } catch (e) {
    // URL parsing failed, assume cross-origin
  }

  return fetch(url, {
    signal: controller.signal,
    mode: 'cors',
    credentials: 'omit',
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  })
    .then(function (response) {
      clearTimeout(timeoutId);
      return response.text().then(function (html) {
        var crawlTime = performance.now() - startTime;

        var pageData = parsePageContent(url, html, response.status, crawlTime);

        return compressData(html).then(function (compressedBlob) {
          if (compressedBlob) {
            pageData.content = compressedBlob;
          }
          crawlState.results.set(url, pageData);

          // Mark this URL as fully crawled to prevent re-crawling
          markAsCrawled(url);

          crawlState.stats.crawledPages += 1;
          crawlState.stats.avgResponseTime =
            (crawlState.stats.avgResponseTime *
              (crawlState.stats.crawledPages - 1) +
              crawlTime) /
            crawlState.stats.crawledPages;

          if (response.status >= 400) {
            crawlState.stats.errorCount += 1;
          }

          // Add internal links to queue (with deduplication)
          pageData.internalLinks.forEach(function (link) {
            var normalizedLink = normalizeUrlForDedup(link);
            // Check both visited set and crawled set for deduplication
            if (!crawlState.visited.has(normalizedLink) && !isAlreadyCrawled(link) && shouldCrawl(link)) {
              crawlState.queue.push(link);
              crawlState.stats.totalPages += 1;
            }
          });

          sendProgress(client);
          sendMessage(client, 'CRAWL_LOG', {
            type: response.status >= 400 ? 'error' : 'success',
            url: url,
            status: response.status,
            time: crawlTime.toFixed(0),
          });
        });
      });
    })
    .catch(function (error) {
      clearTimeout(timeoutId);
      var crawlTime = performance.now() - startTime;

      // Determine error message based on error type
      var errorMessage = error.message;
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout';
      } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        // This is typically a CORS error
        errorMessage = 'CORS blocked - website does not allow cross-origin requests';
      } else if (error.message.includes('NetworkError') || error.message.includes('network')) {
        errorMessage = 'Network error - check your internet connection';
      }

      var pageData = {
        url: url,
        status: 0,
        isEmpty: true,
        crawlTime: crawlTime,
        internalLinks: [],
        externalLinks: [],
        inSitemap: crawlState.sitemapUrls.has(url),
        errorMessage: errorMessage,
      };

      crawlState.results.set(url, pageData);
      // Mark as crawled even on error to prevent retry loops
      markAsCrawled(url);
      crawlState.stats.crawledPages += 1;
      crawlState.stats.errorCount += 1;

      sendProgress(client);
      sendMessage(client, 'CRAWL_LOG', {
        type: 'error',
        url: url,
        status: 0,
        error: errorMessage,
      });
    });
}

// Parse page content and extract links
function parsePageContent(url, html, status, crawlTime) {
  var result = {
    url: url,
    status: status,
    title: undefined,
    description: undefined,
    contentLength: html.length,
    isEmpty: false,
    crawlTime: crawlTime,
    internalLinks: [],
    externalLinks: [],
    inSitemap: crawlState.sitemapUrls.has(url),
  };

  try {
    var titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    result.title = titleMatch ? titleMatch[1].trim() : undefined;

    var descMatch = html.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i
    );
    result.description = descMatch ? descMatch[1].trim() : undefined;

    var bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    var bodyText = bodyMatch ? bodyMatch[1].replace(/<[^>]*>/g, '').trim() : '';
    result.isEmpty = bodyText.length < 100;

    var linkRegex = /<a[^>]*href=["']([^"'#][^"']*)["'][^>]*>/gi;
    var match;
    var baseUrl = new URL(url);

    while ((match = linkRegex.exec(html)) !== null) {
      var href = match[1];

      if (
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('javascript:')
      ) {
        continue;
      }

      try {
        var absoluteUrl = new URL(href, url).toString();
        var parsedUrl = new URL(absoluteUrl);

        parsedUrl.hash = '';
        var normalizedUrl = parsedUrl.toString().replace(/\/$/, '');

        if (parsedUrl.hostname === baseUrl.hostname) {
          if (result.internalLinks.indexOf(normalizedUrl) === -1) {
            result.internalLinks.push(normalizedUrl);
          }
        } else {
          if (result.externalLinks.indexOf(normalizedUrl) === -1) {
            result.externalLinks.push(normalizedUrl);
          }
        }
      } catch (e) {
        // Skip invalid URLs
      }
    }
  } catch (error) {
    console.error('Error parsing page content:', error);
  }

  return result;
}

// Check if URL should be crawled
function shouldCrawl(url) {
  try {
    var parsedUrl = new URL(url);
    var baseUrl = new URL(crawlState.config.url);

    if (parsedUrl.hostname !== baseUrl.hostname) {
      return false;
    }

    if (crawlState.config.maxDepth) {
      var baseDepth = baseUrl.pathname.split('/').filter(Boolean).length;
      var urlDepth = parsedUrl.pathname.split('/').filter(Boolean).length;
      if (urlDepth - baseDepth > crawlState.config.maxDepth) {
        return false;
      }
    }

    if (
      crawlState.robotsData &&
      crawlState.config.respectRobotsTxt !== false
    ) {
      if (!isPathAllowed(parsedUrl.pathname)) {
        return false;
      }
    }

    return true;
  } catch (e) {
    return false;
  }
}

// Check if path is allowed by robots.txt
function isPathAllowed(path) {
  if (!crawlState.robotsData) return true;

  var allow = crawlState.robotsData.allow;
  var disallow = crawlState.robotsData.disallow;

  for (var i = 0; i < allow.length; i++) {
    if (matchesPattern(path, allow[i])) {
      return true;
    }
  }

  for (var j = 0; j < disallow.length; j++) {
    if (matchesPattern(path, disallow[j])) {
      return false;
    }
  }

  return true;
}

// Match path against robots pattern
function matchesPattern(path, pattern) {
  if (pattern.indexOf('*') !== -1) {
    var regexPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*');
    return new RegExp('^' + regexPattern).test(path);
  }

  if (pattern.endsWith('$')) {
    return path === pattern.slice(0, -1);
  }

  return path.startsWith(pattern);
}

// Discover URLs from sitemap
function discoverFromSitemap(baseUrl) {
  var result = {
    sitemapUrls: new Set(),
    robotsData: null,
  };

  var robotsUrl = new URL('/robots.txt', baseUrl);
  return fetch(robotsUrl.toString(), {
    headers: { 'User-Agent': 'VaporScan/1.0' },
  })
    .then(function (robotsResponse) {
      if (robotsResponse.ok) {
        return robotsResponse.text().then(function (robotsText) {
          result.robotsData = parseRobotsTxt(robotsText);

          var sitemapMatches = robotsText.match(/^sitemap:\s*(.+)$/gim);
          if (sitemapMatches) {
            var promises = sitemapMatches.map(function (match) {
              var sitemapUrl = match.replace(/^sitemap:\s*/i, '').trim();
              return fetchSitemapUrls(sitemapUrl, result.sitemapUrls);
            });
            return Promise.all(promises);
          }
        });
      }
    })
    .then(function () {
      if (result.sitemapUrls.size === 0) {
        var commonLocations = ['/sitemap.xml', '/sitemap_index.xml'];
        return commonLocations.reduce(function (promise, location) {
          return promise.then(function () {
            if (result.sitemapUrls.size > 0) return;
            var url = new URL(location, baseUrl);
            return fetchSitemapUrls(url.toString(), result.sitemapUrls);
          });
        }, Promise.resolve());
      }
    })
    .then(function () {
      return result;
    })
    .catch(function (error) {
      console.error('Error discovering sitemap:', error);
      return result;
    });
}

// Fetch URLs from sitemap
function fetchSitemapUrls(sitemapUrl, urlSet, depth) {
  depth = depth || 0;
  if (depth > 3) return Promise.resolve();

  return fetch(sitemapUrl, {
    headers: { 'User-Agent': 'VaporScan/1.0' },
  })
    .then(function (response) {
      if (!response.ok) return;

      return response.text().then(function (text) {
        var sitemapMatches = text.match(/<loc>([^<]+)<\/loc>/g);
        if (sitemapMatches) {
          var promises = sitemapMatches.map(function (match) {
            var url = match.replace(/<\/?loc>/g, '').trim();

            if (url.endsWith('.xml') || url.indexOf('sitemap') !== -1) {
              return fetchSitemapUrls(url, urlSet, depth + 1);
            } else {
              urlSet.add(url);
              return Promise.resolve();
            }
          });
          return Promise.all(promises);
        }
      });
    })
    .catch(function (error) {
      console.error('Error fetching sitemap:', sitemapUrl, error);
    });
}

// Parse robots.txt
function parseRobotsTxt(content) {
  var result = { disallow: [], allow: [], userAgent: '*', sitemaps: [] };
  var lines = content.split('\n');
  var isRelevant = false;
  var currentUserAgent = '*';

  for (var i = 0; i < lines.length; i++) {
    var trimmed = lines[i].trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    var colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    var directive = trimmed.slice(0, colonIndex).toLowerCase().trim();
    var value = trimmed.slice(colonIndex + 1).trim();

    if (directive === 'sitemap') {
      try {
        new URL(value); // Validate URL
        result.sitemaps.push(value);
      } catch (e) {
        // invalid url
      }
    } else if (directive === 'host') {
      result.host = value;
    } else if (directive === 'user-agent') {
      currentUserAgent = value;
      isRelevant =
        value === '*' || value.toLowerCase().indexOf('vaporscan') !== -1;
    } else if (isRelevant || currentUserAgent === '*') {
      if (directive === 'disallow' && value) {
        result.disallow.push(value);
      } else if (directive === 'allow' && value) {
        result.allow.push(value);
      } else if (directive === 'crawl-delay') {
        var delay = parseFloat(value);
        if (!isNaN(delay)) {
          result.crawlDelay = delay;
        }
      }
    }
  }

  return result;
}

// Pause crawl
function handlePauseCrawl(client) {
  console.log('Service Worker: Pausing crawl...');
  if (crawlState.isRunning) {
    crawlState.isPaused = true;
    sendMessage(client, 'CRAWL_PAUSED', { stats: crawlState.stats });
    // Also broadcast to other clients if they exist
    broadcastMessage('CRAWL_PAUSED', { stats: crawlState.stats });
  } else {
    console.warn('Service Worker: Cannot pause - no crawl running');
  }
}

// Resume crawl
function handleResumeCrawl(client) {
  console.log('Service Worker: Resuming crawl...');
  if (crawlState.isRunning && crawlState.isPaused) {
    crawlState.isPaused = false;
    sendMessage(client, 'CRAWL_RESUMED', { stats: crawlState.stats });
    broadcastMessage('CRAWL_RESUMED', { stats: crawlState.stats });
  }
}

// Cancel crawl
function handleCancelCrawl(client) {
  console.log('Service Worker: Cancelling crawl...');
  crawlState.isRunning = false;
  crawlState.isPaused = false;
  sendMessage(client, 'CRAWL_CANCELLED', { stats: crawlState.stats });
  broadcastMessage('CRAWL_CANCELLED', { stats: crawlState.stats });
}

// Resume crawl from background sync
function resumeCrawl() {
  if (crawlState.isPaused && crawlState.queue.length > 0) {
    crawlState.isPaused = false;
    return self.clients.matchAll().then(function (clients) {
      if (clients.length > 0) {
        return processCrawlQueue(clients[0]);
      }
    });
  }
  return Promise.resolve();
}

// Send progress update
function sendProgress(client) {
  var progress =
    crawlState.stats.totalPages > 0
      ? (crawlState.stats.crawledPages / crawlState.stats.totalPages) * 100
      : 0;

  var estimatedTimeRemaining = calculateETA();

  sendMessage(client, 'CRAWL_PROGRESS', {
    crawledPages: crawlState.stats.crawledPages,
    totalPages: crawlState.stats.totalPages,
    errorCount: crawlState.stats.errorCount,
    avgResponseTime: crawlState.stats.avgResponseTime,
    progress: progress,
    estimatedTimeRemaining: estimatedTimeRemaining,
    currentPage: crawlState.queue[0],
    queueSize: crawlState.queue.length,
  });
}

// Calculate estimated time remaining
function calculateETA() {
  if (crawlState.stats.crawledPages === 0) return null;

  var remaining =
    crawlState.stats.totalPages - crawlState.stats.crawledPages;
  var avgTime = crawlState.stats.avgResponseTime;
  var concurrency = crawlState.config ? crawlState.config.concurrency : 5;

  return Math.round((remaining * avgTime) / (concurrency || 5));
}

// Send status
function sendStatus(client) {
  sendMessage(client, 'CRAWL_STATUS', {
    isRunning: crawlState.isRunning,
    isPaused: crawlState.isPaused,
    stats: crawlState.stats,
    queueSize: crawlState.queue.length,
  });
}

// Send message to a client
function sendMessage(client, type, payload) {
  if (client && typeof client.postMessage === 'function') {
    client.postMessage({ type: type, payload: payload });
  }
}

// Broadcast message to all clients
function broadcastMessage(type, payload) {
  return self.clients.matchAll().then(function (clients) {
    clients.forEach(function (client) {
      client.postMessage({ type: type, payload: payload });
    });
  });
}

// Compress data using CompressionStream
function compressData(text) {
  if (typeof CompressionStream === 'undefined') {
    // Fallback or skip compression if not supported
    return Promise.resolve(null);
  }
  try {
    var stream = new Blob([text]).stream();
    var compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
    var response = new Response(compressedStream);
    return response.blob();
  } catch (e) {
    console.warn('Compression failed:', e);
    return Promise.resolve(null);
  }
}
