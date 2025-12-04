// Globally disable browser popups used in the app
try {
  if (typeof window !== 'undefined') {
    window.alert = () => {};
    window.confirm = () => true;
    window.prompt = () => null;
  }
} catch (_) {
  // ignore
}

