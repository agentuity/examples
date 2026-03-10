import { useState, useCallback } from 'react';

interface CopyButtonProps {
	text: string;
}

// Hover-to-reveal copy button, positioned absolutely within a `relative group` parent.
// Shows "Copied!" feedback for 2 seconds after clicking.
export function CopyButton({ text }: CopyButtonProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = useCallback(() => {
		navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [text]);

	return (
		<button
			type="button"
			onClick={handleCopy}
			className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-xs px-2 py-1 rounded bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 cursor-pointer"
		>
			{copied ? 'Copied!' : 'Copy'}
		</button>
	);
}
