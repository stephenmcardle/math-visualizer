import type { MDXComponents } from "mdx/types";

// Typography for visualization explanations. Kept here instead of adding a
// typography plugin, since explanations only use a handful of elements.
const components: MDXComponents = {
  h2: (props) => (
    <h2 className="mt-10 mb-3 text-xl font-semibold tracking-tight first:mt-0" {...props} />
  ),
  h3: (props) => <h3 className="mt-8 mb-2 text-lg font-semibold tracking-tight" {...props} />,
  p: (props) => <p className="my-4 leading-7" {...props} />,
  ul: (props) => <ul className="my-4 list-disc space-y-2 pl-6" {...props} />,
  ol: (props) => <ol className="my-4 list-decimal space-y-2 pl-6" {...props} />,
  li: (props) => <li className="leading-7" {...props} />,
  a: (props) => (
    <a className="font-medium underline underline-offset-4 hover:text-primary" {...props} />
  ),
  code: (props) => <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm" {...props} />,
  pre: (props) => (
    <pre className="my-4 overflow-x-auto rounded-lg bg-muted p-4 font-mono text-sm" {...props} />
  ),
  blockquote: (props) => (
    <blockquote className="my-4 border-l-2 pl-4 text-muted-foreground italic" {...props} />
  ),
};

export function useMDXComponents(): MDXComponents {
  return components;
}
