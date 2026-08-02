export type SourceDocument = Readonly<{
	absolutePath: string;
	relativePath: string;
	byteLength: number;
	modifiedAt: string;
	contentSha256: string;
}>;

export type CorpusOptions = Readonly<{
	root: string;
	excludedDirectoryNames: ReadonlySet<string>;
}>;
