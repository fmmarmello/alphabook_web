import fs from 'fs/promises';
import path from 'path';
import { cache } from 'react';

export interface Specifications {
  [key: string]: string[];
}

// Path to the JSON file
const specFilePath = path.join(process.cwd(), 'src', 'lib', 'especificacoes.json');

/**
 * A cached, server-side function to read specifications from the JSON file.
 * The `cache` function from React ensures this function is only executed once per request,
 * preventing multiple file reads during a single render cycle.
 * @returns A promise that resolves to the specifications object or null if not found.
 */
export const getSpecifications = cache(async (): Promise<Specifications | null> => {
  try {
    const fileContent = await fs.readFile(specFilePath, 'utf-8');
    const specifications: Specifications = JSON.parse(fileContent);
    return specifications;
  } catch (error) {
    console.error('Error reading specifications file on server:', error);
    // In a production environment, you might want to have a hardcoded fallback
    return null;
  }
});

/**
 * A client-side hook for fetching specifications.
 * This is kept for components that are exclusively client-side and cannot use
 * the server-side `getSpecifications` function via props.
 * @returns A promise that resolves to the specifications object or null on error.
 */
export async function fetchSpecifications(): Promise<Specifications | null> {
  try {
    const response = await fetch('/api/specifications');
    if (!response.ok) {
      throw new Error(`Failed to fetch specifications: ${response.statusText}`);
    }
    const data = await response.json();
    // The API returns data nested under a `data` property
    return data.data as Specifications;
  } catch (error) {
    console.error('Error fetching specifications on client:', error);
    return null;
  }
}