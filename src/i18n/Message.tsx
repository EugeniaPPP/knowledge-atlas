import { Fragment, type ReactNode } from 'react';

/** Keep translator-controlled word order while preserving semantic emphasis. */
export default function Message({ text, values }: { text: string; values: Record<string, ReactNode> }) {
  return text.split(/(\{\w+\})/g).map((part, index) => <Fragment key={index}>{part.startsWith('{') ? values[part.slice(1, -1)] ?? part : part}</Fragment>);
}
