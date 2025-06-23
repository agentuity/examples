/* Shared types */

export interface StartupLink {
    title: string;
    url: string;
  }
  
  export interface StartupSummary {
    name: string;
    industry?: string; 
    summary: string | null;
    founders?: string | null;
    why_it_matters?: string | null;
    funding_source?: string | null;
    source: string;
  }
  