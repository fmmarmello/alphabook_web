// D:\\dev\\alphabook_project\\alphabook_web\\src\\lib\\specifications.ts
let specifications: Record<string, unknown> | null = null;

export function getSpecifications() {
  if (specifications) {
    return specifications;
  }

  // For client-side usage, we'll fetch from API
  return null;
}

export async function fetchSpecifications() {
  try {
    const response = await fetch('/api/specifications');
    if (!response.ok) {
      throw new Error('Failed to fetch specifications');
    }
    specifications = await response.json();
    return specifications;
  } catch (error) {
    console.error('Error fetching specifications:', error);
    return null;
  }
}
