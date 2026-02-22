"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

const INITIAL_CONTENT = `<h2>Standup -- Feb 22</h2>
<p><strong>Attendees:</strong> @alex @sarah @priya @emma</p>
<h3>Updates</h3>
<ul>
  <li>Auth service migration 80% complete</li>
  <li>Dashboard redesign in review</li>
  <li>CI pipeline optimization shipped</li>
</ul>
<h3>Blockers</h3>
<ul>
  <li>Waiting on API v3 spec from backend team</li>
</ul>
<h3>Action Items</h3>
<ul>
  <li>[ ] Alex: Complete auth migration by Friday</li>
  <li>[ ] Sarah: Review dashboard PR</li>
  <li>[ ] Priya: Set up staging environment</li>
</ul>`;

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, isActive, title, children }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex items-center justify-center w-6 h-6 text-xs font-mono rounded-sm ${
        isActive
          ? "text-foreground bg-surface-elevated"
          : "text-foreground-muted hover:text-foreground hover:bg-surface-elevated"
      }`}
    >
      {children}
    </button>
  );
}

export function MeetingEditor() {
  const editor = useEditor({
    extensions: [StarterKit],
    content: INITIAL_CONTENT,
    editorProps: {
      attributes: {
        class: "outline-none min-h-[200px] p-3 text-sm font-body text-foreground",
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="flex flex-col border border-border-subtle rounded-sm bg-surface">
      {/* Section header */}
      <div className="px-3 py-1.5 border-b border-border-subtle">
        <span className="text-[10px] font-mono uppercase tracking-wider text-foreground-subtle">
          Meeting Notes
        </span>
      </div>

      {/* Toolbar - 28px height, border separator */}
      <div className="flex items-center h-7 px-2 gap-0.5 border-b border-border-subtle bg-background">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          title="Bold"
        >
          <span className="font-bold">B</span>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          title="Italic"
        >
          <span className="italic">I</span>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          title="Strikethrough"
        >
          <span className="line-through">S</span>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive("code")}
          title="Code"
        >
          <span>&lt;/&gt;</span>
        </ToolbarButton>

        {/* Separator */}
        <div className="w-px h-4 bg-border-subtle mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
        >
          H2
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          title="Bullet List"
        >
          &#8226;=
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          title="Ordered List"
        >
          1.
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          title="Blockquote"
        >
          &#8220;
        </ToolbarButton>
      </div>

      {/* Editor area */}
      <div className="editor-content">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
