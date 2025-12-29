# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in VaporScan, please email instead of using the public issue tracker.

### What to Include

Please include the following information:

- **Description**: Clear description of the vulnerability
- **Impact**: What could be affected by this vulnerability
- **Steps to Reproduce**: Detailed steps to trigger the issue
- **Severity**: Your assessment of severity (critical, high, medium, low)
- **Suggested Fix**: If you have a suggested fix, please include it
- **Contact**: Your preferred contact method for follow-up

### Timeline

We aim to:

- Acknowledge receipt within 24 hours
- Provide initial assessment within 72 hours
- Work toward a fix and coordinate disclosure timeline
- Credit the reporter in the fix announcement (if desired)

## Security Features

### Client-Side Privacy

VaporScan is **100% client-side**. This means:

- ✅ No data is sent to external servers
- ✅ All crawling happens in your browser
- ✅ All analysis is performed locally
- ✅ IndexedDB storage is browser-local only
- ✅ No telemetry or tracking

### Security Headers

The application implements strict security headers:

```
X-Frame-Options: DENY                              # Prevent clickjacking
X-Content-Type-Options: nosniff                    # Prevent MIME sniffing
Referrer-Policy: strict-origin-when-cross-origin   # Control referrer info
Permissions-Policy: camera=(), microphone=(),      # Disable dangerous APIs
                    geolocation=()
```

### Content Security Policy (CSP)

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self';
  connect-src 'self';
  frame-ancestors 'none';
```

### Input Validation

- URL validation using browser's URL API
- Strict TypeScript types throughout
- Zod schema validation for forms
- Sanitization of user inputs

## OWASP Top 10 Compliance

### A01: Broken Access Control

**Status**: N/A - Client-side application with no authentication/authorization

### A02: Cryptographic Failures

**Mitigations**:

- HTTPS-only delivery
- Secure browser storage (IndexedDB)
- No sensitive data stored locally
- TLS for any external requests

### A03: Injection

**Mitigations**:

- Input validation using Zod
- No dynamic code execution
- Content Security Policy
- DOMParser for safe HTML parsing
- Strict URL validation

### A04: Insecure Design

**Mitigations**:

- Security-first architecture
- Minimal external dependencies
- Regular security audits
- Dependency scanning via Dependabot

### A05: Security Misconfiguration

**Mitigations**:

- Secure default headers
- CSP enforcement
- Strict CORS policies
- Regular configuration audits

### A06: Vulnerable Components

**Mitigations**:

- Dependabot automated updates
- npm audit regularly run
- SNYK vulnerability scanning
- Pinned dependency versions in package-lock.json

### A07: Authentication Failures

**Status**: N/A - No authentication required

### A08: Software and Data Integrity

**Mitigations**:

- Verified npm packages
- Commit signing encouraged
- Build integrity verification
- Reproducible builds

### A09: Logging Failures

**Mitigations**:

- Structured logging
- No sensitive data in logs
- Client-side logging only
- Console warnings in development

### A10: SSRF

**Mitigations**:

- No server-side requests
- URL validation and normalization
- Same-origin policy enforcement
- Service Worker security boundary

## Dependency Security

### Dependency Management

- Weekly Dependabot updates
- Automated security patches
- Manual review of major upgrades
- Pinned versions in package-lock.json

### Supply Chain Security

- Only publish from main branch
- Signed commits required
- CI/CD pipeline verification
- Build artifact signing

### Third-Party Libraries

We carefully vet all dependencies:

- Small, well-maintained libraries preferred
- Regular security audits
- License compatibility checked
- Community trust and reputation considered

## Code Security Practices

### Development

```typescript
// ✅ Good: Input validation
const validateAndProcessUrl = (url: string): Result => {
  if (!isValidUrl(url)) {
    throw new Error('Invalid URL');
  }
  // Process safely
};

// ❌ Avoid: No validation
const processUrl = (url: string) => {
  fetch(url); // Dangerous!
};
```

### Safe DOM Manipulation

```typescript
// ✅ Good: Safe parsing
const parser = new DOMParser();
const doc = parser.parseFromString(html, 'text/html');

// ❌ Avoid: Dangerous innerHTML
element.innerHTML = userInput; // XSS vulnerability!
```

### Type Safety

```typescript
// ✅ Good: Strong typing
const fetchPage = async (url: string): Promise<PageData> => {
  // Type-safe operations
};

// ❌ Avoid: Loose typing
const fetchPage = async (url: any): Promise<any> => {
  // Difficult to prevent misuse
};
```

## Testing for Security

### Unit Tests

- Input validation edge cases
- URL parsing with malicious inputs
- Safe HTML parsing

### Integration Tests

- Component interactions with user input
- State management security
- Storage access controls

### Security Tests

- CSP header verification
- CORS policy enforcement
- XSS prevention
- CSRF token validation

## Deployment Security

### Build Process

- Dependency verification
- Code integrity checks
- Security audit before build
- Artifact signing

### Hosting

- HTTPS required
- HTTP/2 minimum
- TLS 1.2+ only
- Secure headers enforced
- Regular security scanning

### Monitoring

- Error tracking (privacy-preserving)
- Performance monitoring
- Security header validation
- Uptime monitoring

## Best Practices for Users

### When Using VaporScan

1. **Use HTTPS**: Always access over secure connection
2. **Trust Local Processing**: All crawling happens in your browser
3. **Clear Cache**: Periodically clear IndexedDB if needed
   ```javascript
   // In browser console
   const dbs = await indexedDB.databases();
   dbs.forEach((db) => indexedDB.deleteDatabase(db.name));
   ```
4. **Update Browser**: Keep your browser updated
5. **Report Issues**: Use responsible disclosure

## Security Checklist

Before each release, we verify:

- [ ] All dependencies updated and audited
- [ ] Security headers configured
- [ ] CSP policy verified
- [ ] No hardcoded secrets
- [ ] Tests passing (including security tests)
- [ ] ESLint and type checking pass
- [ ] Code review completed
- [ ] Security documentation updated

## Security Contacts

- **Security Issues**: Email
- **General Support**: Email
- **Discussion**: GitHub Discussions

## References

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Web Security Academy](https://portswigger.net/web-security)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

## Acknowledgments

We appreciate the security research community and thank all who responsibly disclose vulnerabilities.

---

**Last Updated**: 2025-12-28
**Version**: 1.0.0
