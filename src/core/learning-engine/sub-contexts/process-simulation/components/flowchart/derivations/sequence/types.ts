export interface RawBranchOption {
  id?: string;
  policy?: string;
  label?: string;
  command?: string;
  title?: string;
  resultEvents?: Array<{ title?: string }>;
}

export interface RawStep {
  type?: string;
  branches?: RawBranchOption[];
}
