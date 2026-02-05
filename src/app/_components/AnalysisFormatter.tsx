"use client";

import React from "react";

interface AnalysisFormatterProps {
    content: string;
}

export default function AnalysisFormatter({ content }: AnalysisFormatterProps) {
    const formatContent = (text: string) => {
        const lines = text.split('\n');
        const elements: React.JSX.Element[] = [];
        let currentSection: string[] = [];
        let inList = false;

        const flushSection = () => {
            if (currentSection.length > 0) {
                elements.push(
                    <p key={elements.length} className="mb-3 text-gray-300 leading-relaxed">
                        {currentSection.join(' ')}
                    </p>
                );
                currentSection = [];
            }
        };

        lines.forEach((line, index) => {
            const trimmedLine = line.trim();

            // Skip empty lines
            if (!trimmedLine) {
                flushSection();
                return;
            }

            // Main headers (### or ####)
            if (trimmedLine.startsWith('#### ')) {
                flushSection();
                const headerText = trimmedLine.replace('#### ', '');
                elements.push(
                    <h4 key={elements.length} className="text-lg font-bold text-white mt-5 mb-2">
                        {headerText}
                    </h4>
                );
                return;
            }

            if (trimmedLine.startsWith('### ')) {
                flushSection();
                const headerText = trimmedLine.replace('### ', '');
                elements.push(
                    <h3 key={elements.length} className="text-xl font-bold text-white mt-6 mb-3">
                        {headerText}
                    </h3>
                );
                return;
            }

            // Subheaders (**)
            if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
                flushSection();
                const headerText = trimmedLine.replace(/\*\*/g, '');

                // Check if this is a subsection with a colon
                if (headerText.includes(':')) {
                    const [title, ...rest] = headerText.split(':');
                    elements.push(
                        <div key={elements.length} className="mb-3">
                            <h4 className="text-base font-semibold text-white mb-1">
                                {title}:
                            </h4>
                            {rest.length > 0 && (
                                <p className="text-gray-300 leading-relaxed">{rest.join(':').trim()}</p>
                            )}
                        </div>
                    );
                } else {
                    elements.push(
                        <h4 key={elements.length} className="text-base font-semibold text-white mb-2 mt-4">
                            {headerText}
                        </h4>
                    );
                }
                return;
            }

            // List items (starting with -)
            if (trimmedLine.startsWith('- ')) {
                flushSection();
                if (!inList) {
                    inList = true;
                }
                const listText = trimmedLine.substring(2);

                // Check for bold text within list items
                const formattedText = listText.split('**').map((part, i) =>
                    i % 2 === 1 ? <strong key={i} className="font-semibold text-white">{part}</strong> : part
                );

                elements.push(
                    <div key={elements.length} className="flex gap-2 mb-2 text-gray-300">
                        <span className="text-green-500 font-bold">•</span>
                        <span className="flex-1">{formattedText}</span>
                    </div>
                );
                return;
            }

            // Regular text with inline bold
            if (trimmedLine.includes('**')) {
                flushSection();
                const parts = trimmedLine.split('**');
                const formattedParts = parts.map((part, i) =>
                    i % 2 === 1 ? <strong key={i} className="font-semibold text-white">{part}</strong> : part
                );
                elements.push(
                    <p key={elements.length} className="mb-3 text-gray-300 leading-relaxed">
                        {formattedParts}
                    </p>
                );
                return;
            }

            // Accumulate regular paragraph text
            currentSection.push(trimmedLine);
        });

        // Flush any remaining content
        flushSection();

        return elements;
    };

    return (
        <div className="prose prose-sm max-w-none prose-invert">
            {formatContent(content)}
        </div>
    );
}