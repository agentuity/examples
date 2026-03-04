import { useEffect, useState, useCallback } from 'react';
import { codeToHtml } from 'shiki';

interface CodeBlockProps {
	code: string;
	language: 'typescript' | 'python';
}

// Renders syntax-highlighted code using Shiki.
// Falls back to plain monospace text while Shiki loads asynchronously.
export function CodeBlock({ code, language }: CodeBlockProps) {
	const [html, setHtml] = useState('');
	const [copied, setCopied] = useState(false);

	// Highlight on mount and when code/language changes
	useEffect(() => {
		codeToHtml(code, {
			lang: language,
			theme: 'vitesse-dark',
		}).then(setHtml);
	}, [code, language]);

	const handleCopy = useCallback(() => {
		navigator.clipboard.writeText(code);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [code]);

	return (
		<div className="relative group">
			{/* Copy button appears on hover */}
			<button
				type="button"
				onClick={handleCopy}
				className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-xs px-2 py-1 rounded bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 cursor-pointer"
			>
				{copied ? 'Copied!' : 'Copy'}
			</button>
			{html ? (
				// Shiki outputs a full <pre><code> block; override its background to be transparent
				<div
					className="[&_pre]:!bg-transparent [&_pre]:p-4 [&_pre]:m-0 [&_pre]:text-sm [&_pre]:overflow-x-auto [&_code]:!bg-transparent"
					dangerouslySetInnerHTML={{ __html: html }}
				/>
			) : (
				// Plain text fallback while Shiki initializes
				<pre className="p-4 text-sm overflow-x-auto">
					<code className="text-gray-300">{code}</code>
				</pre>
			)}
		</div>
	);
}
