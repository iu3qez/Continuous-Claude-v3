"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Heading2,
  Undo,
  Redo,
  Code,
} from "lucide-react";

/* ---- Toolbar button ---- */

function ToolbarButton({
  onClick,
  isActive,
  children,
  label,
}: {
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`p-1.5 rounded-md transition-colors duration-150 ${
        isActive
          ? "bg-accent/20 text-accent"
          : "text-foreground-subtle hover:text-foreground hover:bg-surface-elevated"
      }`}
    >
      {children}
    </button>
  );
}

/* ---- Separator ---- */

function Separator() {
  return <div className="w-px h-5 bg-border-subtle mx-1" />;
}

/* ---- Editor ---- */

export default function EditorDemo() {
  const editor = useEditor({
    extensions: [StarterKit],
    content: `<h2>Sprint 14 Retrospective</h2>
<p>The team shipped <strong>3 major features</strong> this sprint, including the new dashboard layout and API rate limiting.</p>
<h3>What went well</h3>
<ul>
  <li>Cross-team collaboration on the auth refactor was smooth</li>
  <li>Zero production incidents during the release window</li>
  <li>New CI pipeline reduced build times by <strong>40%</strong></li>
</ul>
<h3>Action items</h3>
<ol>
  <li>Schedule architecture review for the caching layer</li>
  <li>Update runbook for the new deployment process</li>
  <li>Set up monitoring alerts for the rate limiter</li>
</ol>
<blockquote>The best sprint we've had in Q4. Let's keep the momentum going into the next cycle.</blockquote>`,
    editorProps: {
      attributes: {
        class: "prose prose-invert prose-sm max-w-none focus:outline-none",
      },
    },
  });

  if (!editor) {
    return (
      <div className="h-full flex items-center justify-center text-foreground-subtle text-sm">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col rounded-xl border border-border-subtle bg-surface overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-border-subtle bg-background/50">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive("heading", { level: 2 })}
          label="Heading"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>

        <Separator />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          label="Bold"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          label="Italic"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          label="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive("code")}
          label="Inline code"
        >
          <Code className="w-4 h-4" />
        </ToolbarButton>

        <Separator />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          label="Bullet list"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          label="Numbered list"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          label="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </ToolbarButton>

        <Separator />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          label="Undo"
        >
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          label="Redo"
        >
          <Redo className="w-4 h-4" />
        </ToolbarButton>

        {/* Word count */}
        <div className="ml-auto text-[10px] font-mono text-foreground-subtle">
          {editor.storage.characterCount?.words?.() ?? "—"} words
        </div>
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-y-auto editor-content">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
