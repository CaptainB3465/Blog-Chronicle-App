// HTML Sanitizer based on strict allowlist of elements and attributes
const ALLOWED_TAGS = new Set([
    'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'strong', 'b', 'em', 'i', 'u', 's', 'strike',
    'blockquote', 'pre', 'code', 'ul', 'ol', 'li',
    'a', 'img', 'hr', 'br', 'table', 'thead', 'tbody',
    'tr', 'th', 'td', 'span', 'div'
]);

function sanitizeHtml(html) {
    if (!html || typeof html !== 'string') return '';

    // Strip dangerous tags and their contents
    let clean = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
        .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
        .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '');

    // Process every HTML tag
    clean = clean.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (match, tagName, attrs) => {
        const tag = tagName.toLowerCase();
        if (!ALLOWED_TAGS.has(tag)) return '';
        if (match.startsWith('</')) return `</${tag}>`;

        let sanitizedAttrs = '';
        const attrRegex = /([a-zA-Z0-9_-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
        let attrMatch;

        while ((attrMatch = attrRegex.exec(attrs)) !== null) {
            const attrName = attrMatch[1].toLowerCase();
            const attrValue = attrMatch[2] !== undefined ? attrMatch[2] : (attrMatch[3] !== undefined ? attrMatch[3] : (attrMatch[4] || ''));

            // Never allow on* event handlers
            if (attrName.startsWith('on')) continue;

            if (attrName === 'href' && tag === 'a') {
                const val = attrValue.trim().toLowerCase();
                // Block javascript:, data:, vbscript:
                if (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('mailto:') || val.startsWith('#') || val.startsWith('/')) {
                    sanitizedAttrs += ` href="${encodeURI(attrValue.trim())}" rel="noopener noreferrer"`;
                }
            } else if (attrName === 'src' && tag === 'img') {
                const val = attrValue.trim().toLowerCase();
                if (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/')) {
                    sanitizedAttrs += ` src="${encodeURI(attrValue.trim())}"`;
                }
            } else if (attrName === 'alt' || attrName === 'title') {
                const safeVal = attrValue.replace(/"/g, '&quot;');
                sanitizedAttrs += ` ${attrName}="${safeVal}"`;
            } else if (attrName === 'class') {
                const safeClass = attrValue.replace(/[^a-zA-Z0-9-_\s]/g, '').trim();
                if (safeClass) sanitizedAttrs += ` class="${safeClass}"`;
            }
        }

        const isSelfClosing = match.endsWith('/>') || tag === 'br' || tag === 'hr' || tag === 'img';
        return `<${tag}${sanitizedAttrs}${isSelfClosing ? ' /' : ''}>`;
    });

    return clean;
}

module.exports = { sanitizeHtml };
