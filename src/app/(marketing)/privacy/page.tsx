import ReactMarkdown from 'react-markdown';
import fs from 'fs';
import path from 'path';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import Link from 'next/link';

// Function to read the markdown file content
async function getPrivacyPolicyContent() {
  const filePath = path.join(process.cwd(), 'PRDs', 'privacy-policy.md');
  try {
    const content = await fs.promises.readFile(filePath, 'utf8');
    return content;
  } catch (error) {
    console.error('Error reading privacy policy:', error);
    return `# Privacy Policy Not Found

We encountered an error loading the privacy policy. Please try again later or contact support.`;
  }
}

// The Privacy Page component
export default async function PrivacyPage() {
  const markdownContent = await getPrivacyPolicyContent();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/"
              className="inline-block px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-900"
        >
          &larr; Home
        </Link>
      </div>

      <div className="prose dark:prose-invert lg:prose-xl max-w-4xl mx-auto">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
          {markdownContent}
        </ReactMarkdown>
      </div>
    </div>
  );
} 