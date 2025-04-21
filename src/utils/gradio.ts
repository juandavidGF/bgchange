/**
 * Normalizes Gradio client URLs/identifiers to consistent format
 * @param inputClient - Client identifier (URL or path)
 * @returns Normalized client identifier
 */
export function fixClient(inputClient: string): string {
  // First check if it looks like a URL
  if (inputClient.includes('://') || inputClient.startsWith('http')) {
    try {
      const url = new URL(inputClient);
      if (url.hostname === "huggingface.co") {
        const parts = url.pathname.split('/').filter(Boolean);
        // Handle both direct model paths and spaces paths
        if (parts[0] === "spaces" && parts.length > 1) {
          return parts.slice(1).join('/');
        } else if (parts.length >= 2) {
          return parts.join('/');
        }
      }
    } catch (e) {
      console.debug('Input is not a valid URL, proceeding as plain client name');
    }
  }
  
  // Clean up non-URL inputs
  return inputClient.startsWith('/') ? inputClient.slice(1) : inputClient;
}

/**
 * Constructs the base URL for a Gradio space
 * @param client - Client identifier (from fixClient)
 * @returns Full base URL for the space
 */
export function getGradioBaseUrl(client: string): string {
  const fixedClient = fixClient(client);
  return `https://${fixedClient.replace(/\//g, '-')}.hf.space`;
}
