export interface EvidenceFile {
  id: string;
  fileName?: string | null;
  fileKey: string;
}

export interface ResolvedEvidence {
  id: string;
  fileName: string;
  viewUrl: string | null;
}

export async function resolveEvidenceUrls(
  files: EvidenceFile[],
  resolver: (
    file: EvidenceFile,
  ) => Promise<{ data?: { viewUrl?: string } } | null>,
): Promise<ResolvedEvidence[]> {
  return Promise.all(
    files.map(async (item) => {
      const response = await resolver(item).catch(() => null);
      return {
        id: item.id,
        fileName: item.fileName ?? item.fileKey,
        viewUrl: response?.data?.viewUrl ?? null,
      };
    }),
  );
}
