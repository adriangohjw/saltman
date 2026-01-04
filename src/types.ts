export interface FileChange {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
}
