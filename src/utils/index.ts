


export function createPageUrl(pageName: string) {
  if (!pageName) return '/';
  // Pass-through if already a path or includes query
  if (pageName.startsWith('/')) return pageName;
  if (pageName.includes('/') || pageName.includes('?')) return `/${pageName}`;
  // Map Index to root
  if (pageName.toLowerCase() === 'index') return '/';
  return '/' + pageName.toLowerCase().replace(/ /g, '-');
}
